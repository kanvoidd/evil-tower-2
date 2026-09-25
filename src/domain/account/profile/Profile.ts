import { CLASSES } from '../../catalog/classes';
import { CONSUMABLES } from '../../catalog/consumables';
import { LINEAGE_ORDER } from '../../catalog/heroes';
import { ITEM_BY_ID, type ItemDef } from '../../catalog/items';
import type { PlayerStats } from '../../combat';
import { DEFAULT_AUTO_USE } from '../../combat/auto-use/autoUse';
import { REPAIR_RATIO } from '../../economy/repair/repairRatio';
import { GAMEPLAY } from '../../gameplay';
import {
  type AutoSkillPlan,
  branchOf,
  DEFAULT_AUTO_SKILL,
  inferBranch,
  planAutoSkill,
} from '../../progression/auto-skill/autoSkill';
import { Hero } from '../../progression/hero/Hero';
import {
  applyBuy,
  costOf,
  newLineageSave,
  type TreeNode,
  TREES,
} from '../../progression/skill-tree/skillTree';
import { type AchievementDef, ACHIEVEMENTS } from '../../rewards/achievements';
import { DAILY_REWARDS, type DailyReward } from '../../rewards/daily';
import { GIFT_COOLDOWN_MS, GIFT_REWARD } from '../../rewards/tower-gift';
import { Signal } from '../../shared/signal/Signal';
import type {
  AutoSkillSave,
  AutoUseSave,
  ClassId,
  ConsumableId,
  EquipmentSave,
  HeroSave,
  Lang,
  LineageId,
  LineageSave,
  SaveData,
} from '../../types';
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

  constructor(
    private doc: SaveData,
    private readonly now: () => number,
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
      gold: 0,
      souls: 0,
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

  get gold(): number {
    return this.heroSave.gold;
  }

  get souls(): number {
    return this.heroSave.souls;
  }

  addGold(n: number, track = true): void {
    this.heroSave.gold += n;
    if (track && n > 0) this.doc.stats.goldEarned += n;
    this.walletChanged.emit();
    this.checkAchievements();
    this.touch();
  }

  addSouls(n: number, track = true): void {
    this.heroSave.souls += n;
    if (track && n > 0) this.doc.stats.soulsEarned += n;
    this.walletChanged.emit();
    this.checkAchievements();
    this.touch();
  }

  spendGold(n: number): boolean {
    if (this.heroSave.gold < n) return false;
    this.heroSave.gold -= n;
    this.walletChanged.emit();
    this.touch();
    return true;
  }

  spendSouls(n: number): boolean {
    if (this.heroSave.souls < n) return false;
    this.heroSave.souls -= n;
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
    if (!this.spendGold(GAMEPLAY.classUnlockCost)) return false;
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

  repairCost(item: ItemDef): number {
    const e = this.equipped(item.slot);
    if (!e || e.id !== item.id) return 0;
    const missing = 1 - e.durability / item.durability;
    return Math.ceil(item.price * REPAIR_RATIO * missing);
  }

  buyItem(item: ItemDef): ItemPurchase {
    const cur = this.equipped(item.slot);
    if (cur && cur.id === item.id) {
      if (cur.durability >= item.durability) return 'full';
      const cost = this.repairCost(item);
      if (!this.spendGold(cost)) return 'gold';
      cur.durability = item.durability;
      this.touch();
      return 'repaired';
    }
    if (cur && ITEM_BY_ID[cur.id].tier >= item.tier) return 'weaker';
    if (!this.spendGold(item.price)) return 'gold';
    const save: EquipmentSave = { id: item.id, durability: item.durability };
    if (item.slot === 'weapon') this.doc.weapon[this.activeLineage] = save;
    else this.heroSave.armor = save;
    this.touch();
    return 'bought';
  }

  /** Лавка не продаёт сверх предела; 'max' — уже полный запас. */
  buyConsumable(id: ConsumableId, count = 1): ConsumablePurchase {
    const def = CONSUMABLES[id];
    if (!def.sold) return 'gold';
    if (def.max !== undefined && this.heroSave.consumables[id] + count > def.max) return 'max';
    if (!this.spendGold(def.price * count)) return 'gold';
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
    const today = Profile.dayKey(new Date(this.now()));
    const { lastClaim, streak } = this.doc.daily;
    if (lastClaim === today) return { available: false, dayIndex: streak % 7, streak };
    const gap = lastClaim ? Profile.dayDiff(lastClaim, today) : 99;
    const cont = gap === 1;
    const eff = cont ? streak : 0;
    return { available: true, dayIndex: eff % 7, streak: eff };
  }

  claimDaily(multiplier = 1): DailyReward | null {
    const st = this.dailyStatus();
    if (!st.available) return null;
    const r = DAILY_REWARDS[st.dayIndex];
    if (r.gold) this.addGold(r.gold * multiplier);
    if (r.souls) this.addSouls(r.souls * multiplier);
    if (r.heal) this.heroSave.consumables.potion_heal += r.heal * multiplier;
    if (r.regen) this.heroSave.consumables.potion_regen += r.regen * multiplier;
    this.doc.daily = { lastClaim: Profile.dayKey(new Date(this.now())), streak: st.streak + 1 };
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
    this.addGold(GIFT_REWARD.gold * multiplier);
    this.addSouls(GIFT_REWARD.souls * multiplier);
    this.doc.gift.readyAt = this.now() + GIFT_COOLDOWN_MS;
    this.touch();
    return { gold: GIFT_REWARD.gold * multiplier, souls: GIFT_REWARD.souls * multiplier };
  }

  /** Календарный день по местному времени: награда дня меняется в полночь игрока. */
  private static dayKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private static dayDiff(a: string, b: string): number {
    const pa = new Date(a + 'T00:00:00').getTime();
    const pb = new Date(b + 'T00:00:00').getTime();
    return Math.round((pb - pa) / 86400000);
  }
}
