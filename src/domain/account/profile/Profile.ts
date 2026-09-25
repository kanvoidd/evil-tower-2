import {
  CLASSES,
  type ClassId,
  type ConsumableId,
  CONSUMABLES,
  type EquipmentSave,
  type ItemDef,
  LINEAGE_ORDER,
  type LineageId,
} from '../../catalog';
import { type AutoUseSave, DEFAULT_AUTO_USE, type PlayerStats } from '../../combat';
import { REPAIR_PRICING, ShopRules, Wallet } from '../../economy';
import {
  applyBuy,
  type AutoSkillPlan,
  type AutoSkillSave,
  branchOf,
  costOf,
  DEFAULT_AUTO_SKILL,
  Hero,
  inferBranch,
  type LineageSave,
  newLineageSave,
  planAutoSkill,
  ProgressionBalance,
  type TreeNode,
  TREES,
} from '../../progression';
import {
  type AchievementDef,
  ACHIEVEMENTS,
  DAILY_REWARDS,
  type DailyReward,
  GIFT_COOLDOWN_MS,
  GIFT_REWARD,
  type ICalendar,
} from '../../rewards';
import { DayKey, Gold, type Lang, Signal, Souls } from '../../shared';
import type { HeroSave } from '../save/interfaces/HeroSave';
import type { SaveData } from '../save/interfaces/SaveData';
import type { ConsumablePurchase } from './interfaces/ConsumablePurchase';
import type { DailyStatus } from './interfaces/DailyStatus';
import type { ItemPurchase } from './interfaces/ItemPurchase';

/**
 * Профиль игрока — правила над документом сохранения: у каждого героя (линейки) свой кошелёк,
 * расходники, доспех, оружие и рекорд; общие на профиль — счётчики, достижения, обучение,
 * награда дня и «Дар башни», настройки автоматизации.
 *
 * Профиль не знает, где и как хранится документ: об изменениях он сообщает сигналом `changed`,
 * а сохраняет их инфраструктура. Время приходит снаружи (`now`), поэтому правила наград
 * проверяются без часов браузера.
 */
export class Profile {
  /** Изменилось что угодно — документ пора сохранить. */
  readonly changed = new Signal();
  /** Изменился кошелёк активного героя (или сменился сам герой). */
  readonly walletChanged = new Signal();
  /** Открыто достижение (id). */
  readonly achievementUnlocked = new Signal<[string]>();

  /** Герои открытых линеек — по экземпляру на линейку. */
  private readonly heroes = new Map<LineageId, Hero>();

  /**
   * `now` — время для таймера «Дара башни» и рекламы, `calendar` — день игрока для награды дня;
   * оба приходят снаружи, поэтому правила наград проверяются без часов и часового пояса.
   */
  constructor(
    private doc: SaveData,
    private readonly now: () => number,
    private readonly calendar: ICalendar,
  ) {}

  /** Документ сохранения нового игрока. */
  static freshData(lang: Lang, now: number): SaveData {
    return {
      v: 2,
      savedAt: 0,
      createdAt: now,
      lang,
      volume: 0.7,
      muted: false,
      activeClass: null,
      lineages: {},
      weapon: {},
      heroes: {},
      stats: {
        kills: 0,
        goldEarned: 0,
        soulsEarned: 0,
        roomsCleared: 0,
        deaths: 0,
        chestsOpened: 0,
        metamorphoses: 0,
        flawless: 0,
        itemsBroken: 0,
      },
      achievements: [],
      daily: { lastClaim: '', streak: 0 },
      gift: { readyAt: 0 },
      tutorial: { fight: false, hub: false, skill: false, shop: false, perk: false },
      ads: { lastInterstitial: 0, runsSinceAd: 0 },
      auto: { use: { ...DEFAULT_AUTO_USE }, skill: {} },
      reviewAsked: false,
    };
  }

  /** Новый герой начинает с нулями: ни золота, ни душ, ни расходников, ни доспеха. */
  static emptyHero(): HeroSave {
    return {
      gold: Gold.of(0),
      souls: Souls.of(0),
      consumables: { potion_heal: 0, potion_regen: 0, artifact: 0 },
      armor: null,
      best: 0,
    };
  }

  /** Документ сохранения, над которым работают правила. */
  get data(): SaveData {
    return this.doc;
  }

  /** Подменить документ целиком (загрузка сохранения, сброс прогресса). Это не изменение — сохранять нечего. */
  replace(doc: SaveData): void {
    this.doc = doc;
    this.heroes.clear();
    this.walletChanged.emit();
  }

  private touch(): void {
    this.changed.emit();
  }

  // ------------------------------------------------------------------ настройки

  get lang(): Lang {
    return this.doc.lang;
  }

  setLang(l: Lang): void {
    this.doc.lang = l;
    this.touch();
  }

  /** Громкость 0…1. */
  get volume(): number {
    return this.doc.volume;
  }

  get muted(): boolean {
    return this.doc.muted;
  }

  setAudio(volume: number, muted: boolean): void {
    this.doc.volume = volume;
    this.doc.muted = muted;
    this.touch();
  }

  // ------------------------------------------------------------------ обучение и реклама

  get tutorial(): Readonly<SaveData['tutorial']> {
    return this.doc.tutorial;
  }

  /** Шаг обучения пройден. */
  markTutorial(step: keyof SaveData['tutorial']): void {
    this.doc.tutorial[step] = true;
    this.touch();
  }

  get lastInterstitial(): number {
    return this.doc.ads.lastInterstitial;
  }

  noteInterstitial(at: number): void {
    this.doc.ads.lastInterstitial = at;
    this.touch();
  }

  // ------------------------------------------------------------------ автоматизация

  get autoUse(): AutoUseSave {
    return this.doc.auto.use;
  }

  setAutoUse(patch: Partial<AutoUseSave>): void {
    this.doc.auto.use = { ...this.doc.auto.use, ...patch };
    this.touch();
  }

  autoSkillCfg(l: LineageId = this.activeLineage): AutoSkillSave {
    return { ...DEFAULT_AUTO_SKILL, ...this.doc.auto.skill[l] };
  }

  setAutoSkill(patch: Partial<AutoSkillSave>, l: LineageId = this.activeLineage): void {
    this.doc.auto.skill[l] = { ...this.autoSkillCfg(l), ...patch };
    this.touch();
  }

  /** Включает/выключает автопрокачку одной кнопкой. При включении ветка берётся по последнему улучшению игрока. */
  toggleAutoSkill(): AutoSkillSave {
    const lin = this.activeLineage;
    const on = !this.autoSkillCfg(lin).on;
    const patch: Partial<AutoSkillSave> = { on };
    if (on) Object.assign(patch, inferBranch(TREES[lin], this.activeLineageSave) ?? {});
    this.setAutoSkill(patch, lin);
    return this.autoSkillCfg(lin);
  }

  /**
   * Игрок сам купил узел: если автопрокачка включена, запоминаем его ветку (и тип выбора на развилке),
   * чтобы дальше по этой ветке шло автоматически.
   */
  noteManualBuy(n: TreeNode): void {
    const lin = this.activeLineage;
    if (!this.autoSkillCfg(lin).on) return;
    const patch = branchOf(n);
    if (Object.keys(patch).length) this.setAutoSkill(patch, lin);
  }

  /**
   * Автопрокачка: тратит души на ветку активной линейки — вниз по цепочке, на весь опыт душ. Вызывается при входе
   * в хаб и дерево, после комнаты, при включении и после каждой ручной покупки. Пока игрок не сделал первое
   * улучшение сам, не работает (обучение).
   */
  runAutoSkill(): AutoSkillPlan | null {
    const lin = this.activeLineage;
    const cfg = this.autoSkillCfg(lin);
    if (!cfg.on || !this.doc.tutorial.skill) return null;
    const tree = TREES[lin];
    const ls = this.activeLineageSave;
    const plan = planAutoSkill(tree, ls, this.souls, cfg);
    for (const n of plan.buys) {
      this.spendSouls(costOf(ls, n));
      applyBuy(tree, ls, n);
    }
    if (plan.buys.length) this.touch();
    return plan;
  }

  // ------------------------------------------------------------------ герои

  /**
   * Герой линейки: прогресс дерева и класс. Один экземпляр на открытую линейку — метаморфоза
   * меняет его класс, но не его самого. У закрытой линейки герой собирается на пустом прогрессе.
   */
  hero(lin: LineageId): Hero {
    const save = this.doc.lineages[lin];
    if (!save) return new Hero(lin, newLineageSave(TREES[lin]));
    let h = this.heroes.get(lin);
    if (!h || h.save !== save) {
      h = new Hero(lin, save, () => this.touch());
      this.heroes.set(lin, h);
    }
    return h;
  }

  /** Герой, которым сейчас играет игрок. */
  get activeHero(): Hero {
    return this.hero(this.activeLineage);
  }

  // ------------------------------------------------------------------ кошелёк

  /** Всё своё у активного героя (кошелёк, расходники, доспех, рекорд); у нового героя — с нулями. */
  get heroSave(): HeroSave {
    return this.heroSaveOf(this.activeLineage);
  }

  heroSaveOf(lin: LineageId): HeroSave {
    return (this.doc.heroes[lin] ??= Profile.emptyHero());
  }

  /** Рекорд героя линейки — без заведения пустого кошелька, если героя ещё нет. */
  bestOf(lin: LineageId): number {
    return this.doc.heroes[lin]?.best ?? 0;
  }

  /** Кошелёк активного героя. */
  private get wallet(): Wallet {
    return new Wallet(this.heroSave);
  }

  get gold(): Gold {
    return this.wallet.gold;
  }

  get souls(): Souls {
    return this.wallet.souls;
  }

  addGold(n: Gold, track = true): void {
    this.wallet.addGold(n);
    if (track && n > 0) this.doc.stats.goldEarned += n;
    this.walletChanged.emit();
    this.checkAchievements();
    this.touch();
  }

  addSouls(n: Souls, track = true): void {
    this.wallet.addSouls(n);
    if (track && n > 0) this.doc.stats.soulsEarned += n;
    this.walletChanged.emit();
    this.checkAchievements();
    this.touch();
  }

  spendGold(n: Gold): boolean {
    if (!this.wallet.spendGold(n)) return false;
    this.walletChanged.emit();
    this.touch();
    return true;
  }

  spendSouls(n: Souls): boolean {
    if (!this.wallet.spendSouls(n)) return false;
    this.walletChanged.emit();
    this.touch();
    return true;
  }

  // ------------------------------------------------------------------ классы

  get isFirstRun(): boolean {
    return this.doc.activeClass === null;
  }

  /**
   * Класс, за который играет активный герой. Выводится из прогресса дерева (метаморфоза заменяет
   * класс), а сохранённый `activeClass` лишь выбирает, какой герой — какая линейка — сейчас в игре.
   */
  get activeClass(): ClassId {
    return this.activeHero.classId;
  }

  get activeLineage(): LineageId {
    return CLASSES[this.doc.activeClass ?? 'warrior'].lineage;
  }

  lineageSave(l: LineageId): LineageSave | null {
    return this.doc.lineages[l] ?? null;
  }

  get activeLineageSave(): LineageSave {
    return this.lineageSave(this.activeLineage) ?? this.unlockLineage(this.activeLineage);
  }

  isLineageUnlocked(l: LineageId): boolean {
    return !!this.doc.lineages[l];
  }

  unlockLineage(l: LineageId): LineageSave {
    if (!this.doc.lineages[l]) this.doc.lineages[l] = newLineageSave(TREES[l]);
    this.touch();
    return this.doc.lineages[l]!;
  }

  buyLineage(l: LineageId): boolean {
    if (this.isLineageUnlocked(l)) return true;
    if (!this.spendGold(ProgressionBalance.heroUnlockCost)) return false;
    this.unlockLineage(l);
    return true;
  }

  setActiveClass(c: ClassId): void {
    this.doc.activeClass = c;
    // у каждого героя свой кошелёк — полоска валют должна показать новый
    this.walletChanged.emit();
    this.touch();
  }

  /** Характеристики активного героя для боя: класс, таланты и снаряжение (сломанное не в счёт). */
  playerStats(): PlayerStats {
    return this.activeHero.combatStats(
      this.doc.weapon[this.activeLineage] ?? null,
      this.heroSave.armor,
    );
  }

  // ------------------------------------------------------------------ экипировка и расходники

  equipped(slot: 'weapon' | 'armor'): EquipmentSave | null {
    const e =
      slot === 'weapon' ? (this.doc.weapon[this.activeLineage] ?? null) : this.heroSave.armor;
    return e && e.durability > 0 ? e : null;
  }

  repairCost(item: ItemDef): Gold {
    return REPAIR_PRICING.repairCost(item, this.equipped(item.slot));
  }

  buyItem(item: ItemDef): ItemPurchase {
    const cur = this.equipped(item.slot);
    const action = ShopRules.itemAction(item, cur);
    if (action === 'equipped') return 'full';
    if (action === 'weaker') return 'weaker';
    if (action === 'repair') return this.repair(item, cur!);
    if (!this.spendGold(item.price)) return 'gold';
    const save: EquipmentSave = { id: item.id, durability: item.durability };
    if (item.slot === 'weapon') this.doc.weapon[this.activeLineage] = save;
    else this.heroSave.armor = save;
    this.touch();
    return 'bought';
  }

  private repair(item: ItemDef, worn: EquipmentSave): ItemPurchase {
    if (!this.spendGold(this.repairCost(item))) return 'gold';
    worn.durability = item.durability;
    this.touch();
    return 'repaired';
  }

  /** Лавка не продаёт сверх предела; 'max' — уже полный запас. */
  buyConsumable(id: ConsumableId, count = 1): ConsumablePurchase {
    const def = CONSUMABLES[id];
    if (!def.sold) return 'gold';
    if (!ShopRules.canStock(def, this.heroSave.consumables[id], count)) return 'max';
    if (!this.spendGold(Gold.of(def.price * count))) return 'gold';
    this.heroSave.consumables[id] += count;
    this.touch();
    return 'bought';
  }

  /** Расходники героя такими, какими их оставил бой. */
  keepConsumables(consumables: Readonly<Record<ConsumableId, number>>): void {
    this.heroSave.consumables = { ...consumables };
    this.touch();
  }

  /** Записывает износ экипировки и расходники после комнаты. */
  commitBattle(
    weapon: EquipmentSave | null,
    armor: EquipmentSave | null,
    consumables: Readonly<Record<ConsumableId, number>>,
  ): void {
    const lin = this.activeLineage;
    if (weapon) this.doc.weapon[lin] = weapon.durability > 0 ? weapon : null;
    if (armor) this.heroSave.armor = armor.durability > 0 ? armor : null;
    this.heroSave.consumables = { ...consumables };
    this.touch();
  }

  // ------------------------------------------------------------------ рекорды и счётчики

  /** Рекорд активного героя: сколько комнат он прошёл за один забег. */
  get best(): number {
    return this.heroSave.best;
  }

  /** Записывает итог забега. true — если это новый рекорд. */
  recordRun(rooms: number): boolean {
    if (rooms <= this.heroSave.best) return false;
    this.heroSave.best = rooms;
    this.touch();
    return true;
  }

  /** Лучший забег среди всех героев — для таблицы рекордов. */
  get bestClimb(): number {
    return LINEAGE_ORDER.reduce((best, l) => Math.max(best, this.doc.heroes[l]?.best ?? 0), 0);
  }

  get stats(): Readonly<SaveData['stats']> {
    return this.doc.stats;
  }

  bump(key: keyof SaveData['stats'], n = 1): void {
    this.doc.stats[key] += n;
    this.checkAchievements();
    this.touch();
  }

  get roomsPlayedTotal(): number {
    return this.doc.stats.roomsCleared + this.doc.stats.deaths;
  }

  // ------------------------------------------------------------------ достижения

  get achievements(): readonly string[] {
    return this.doc.achievements;
  }

  /** Прогресс достижения по сохранению — не больше его цели. */
  achievementProgress(a: AchievementDef): number {
    return Math.min(a.target, a.progress(this.doc));
  }

  private checkAchievements(): void {
    for (const a of ACHIEVEMENTS) {
      if (this.doc.achievements.includes(a.id)) continue;
      if (a.progress(this.doc) >= a.target) {
        this.doc.achievements.push(a.id);
        this.achievementUnlocked.emit(a.id);
      }
    }
  }

  checkNow(): void {
    this.checkAchievements();
    this.touch();
  }

  // ------------------------------------------------------------------ ежедневная награда и подарок

  dailyStatus(): DailyStatus {
    const today = this.calendar.today();
    const { lastClaim, streak } = this.doc.daily;
    const week = DAILY_REWARDS.length;
    if (lastClaim === today) return { available: false, dayIndex: streak % week, streak };
    const cont = !!lastClaim && DayKey.daysBetween(lastClaim, today) === 1;
    const eff = cont ? streak : 0;
    return { available: true, dayIndex: eff % week, streak: eff };
  }

  claimDaily(multiplier = 1): DailyReward | null {
    const st = this.dailyStatus();
    if (!st.available) return null;
    const r = DAILY_REWARDS[st.dayIndex];
    if (r.gold) this.addGold(Gold.of(r.gold * multiplier));
    if (r.souls) this.addSouls(Souls.of(r.souls * multiplier));
    if (r.heal) this.heroSave.consumables.potion_heal += r.heal * multiplier;
    if (r.regen) this.heroSave.consumables.potion_regen += r.regen * multiplier;
    this.doc.daily = { lastClaim: this.calendar.today(), streak: st.streak + 1 };
    this.touch();
    return r;
  }

  giftReady(): boolean {
    return this.now() >= this.doc.gift.readyAt;
  }

  giftRemainingMs(): number {
    return Math.max(0, this.doc.gift.readyAt - this.now());
  }

  claimGift(multiplier = 1): typeof GIFT_REWARD {
    const gift = {
      gold: Gold.of(GIFT_REWARD.gold * multiplier),
      souls: Souls.of(GIFT_REWARD.souls * multiplier),
    };
    this.addGold(gift.gold);
    this.addSouls(gift.souls);
    this.doc.gift.readyAt = this.now() + GIFT_COOLDOWN_MS;
    this.touch();
    return gift;
  }
}
