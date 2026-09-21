import Phaser from 'phaser';
import type {
  AutoSkillSave, AutoUseSave, ClassId, ConsumableId, EquipmentSave, Lang, LineageId, LineageSave, SaveData,
} from '../types';
import { CLASSES, LINEAGE_ORDER } from '../data/classes';
import { CONSUMABLES, ITEM_BY_ID, REPAIR_RATIO, type ItemDef } from '../data/items';
import { ROOMS, ROOM_BY_ID } from '../data/levels';
import { ACHIEVEMENTS } from '../data/achievements';
import { DAILY_REWARDS, GIFT_REWARD } from '../data/economy';
import { ADS, GAMEPLAY } from '../config';
import { YSDK } from '../sdk/YandexSDK';
import { applyBuy, costOf, newLineageSave, TREES, type TreeNode } from '../logic/skillTree';
import { buildPlayerStats, type PlayerStats } from '../logic/stats';
import { DEFAULT_AUTO_USE } from '../logic/autoUse';
import { branchOf, DEFAULT_AUTO_SKILL, inferBranch, planAutoSkill, type AutoSkillPlan } from '../logic/autoSkill';

const KEY = 'et2_save_v1';
const VERSION = 1;

const fresh = (): SaveData => ({
  v: VERSION,
  savedAt: 0,
  createdAt: Date.now(),
  lang: 'ru',
  volume: 0.7,
  muted: false,
  gold: 0,
  souls: 0,
  activeClass: null,
  lineages: {},
  weapon: {},
  armor: null,
  consumables: { potion_heal: 2, potion_regen: 1, artifact: 0 },
  cleared: [],
  stats: {
    kills: 0, goldEarned: 0, soulsEarned: 0, roomsCleared: 0, deaths: 0,
    chestsOpened: 0, metamorphoses: 0, flawless: 0, itemsBroken: 0,
  },
  achievements: [],
  daily: { lastClaim: '', streak: 0 },
  gift: { readyAt: 0 },
  tutorial: { fight: false, hub: false, skill: false, shop: false },
  ads: { lastInterstitial: 0, runsSinceAd: 0 },
  auto: { use: { ...DEFAULT_AUTO_USE }, skill: {} },
  reviewAsked: false,
});

const dayKey = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const dayDiff = (a: string, b: string): number => {
  const pa = new Date(a + 'T00:00:00').getTime();
  const pb = new Date(b + 'T00:00:00').getTime();
  return Math.round((pb - pa) / 86400000);
};

export type DailyReward = (typeof DAILY_REWARDS)[number];

class StoreImpl {
  data: SaveData = fresh();
  readonly events = new Phaser.Events.EventEmitter();
  private saveTimer: number | null = null;
  private cloudTimer: number | null = null;
  private dirtyCloud = false;

  // ------------------------------------------------------------------ загрузка/сохранение

  async load(): Promise<void> {
    let local: SaveData | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) local = JSON.parse(raw) as SaveData;
    } catch {
      local = null;
    }
    const cloud = (await YSDK.loadCloud()) as SaveData | null;
    const pick = [local, cloud].filter((x): x is SaveData => !!x && typeof x === 'object' && x.v === VERSION);
    pick.sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
    const base = fresh();
    this.data = pick.length ? this.merge(base, pick[0]) : base;
    if (!pick.length) this.data.lang = YSDK.getLang();
    window.addEventListener('pagehide', () => this.flush());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.flush();
    });
  }

  private merge(base: SaveData, src: SaveData): SaveData {
    const out: SaveData = { ...base, ...src };
    out.stats = { ...base.stats, ...src.stats };
    out.consumables = { ...base.consumables, ...src.consumables };
    out.tutorial = { ...base.tutorial, ...src.tutorial };
    out.daily = { ...base.daily, ...src.daily };
    out.gift = { ...base.gift, ...src.gift };
    out.ads = { ...base.ads, ...src.ads };
    // Старые сохранения не знают про автоприменение и автопрокачку — подставляем значения по умолчанию.
    // Раньше у автоприменения был общий переключатель `on`: если он был выключен, все расходники остаются выключенными.
    const auto = (src as Partial<SaveData>).auto as { use?: Partial<AutoUseSave> & { on?: boolean }; skill?: SaveData['auto']['skill'] } | undefined;
    const use: AutoUseSave = { heal: !!auto?.use?.heal, regen: !!auto?.use?.regen, artifact: !!auto?.use?.artifact };
    if (auto?.use?.on === false) Object.assign(use, DEFAULT_AUTO_USE);
    out.auto = { use, skill: { ...auto?.skill } };
    return out;
  }

  /** Отложенное сохранение: локально почти сразу, в облако — не чаще раза в 6 секунд. */
  save(): void {
    if (this.saveTimer) return;
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      this.writeLocal();
    }, 250);
    this.dirtyCloud = true;
    if (!this.cloudTimer) {
      this.cloudTimer = window.setTimeout(() => {
        this.cloudTimer = null;
        if (this.dirtyCloud) this.flushCloud();
      }, 6000);
    }
  }

  private writeLocal(): void {
    this.data.savedAt = Date.now();
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* приватный режим — прогресс будет только в облаке */
    }
  }

  private flushCloud(): void {
    this.dirtyCloud = false;
    void YSDK.saveCloud(this.data);
  }

  flush(): void {
    if (this.saveTimer) {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.writeLocal();
    if (this.dirtyCloud) this.flushCloud();
  }

  reset(): void {
    this.data = fresh();
    this.data.lang = YSDK.getLang();
    this.flush();
    this.events.emit('change');
  }

  private changed(): void {
    this.events.emit('change');
    this.save();
  }

  // ------------------------------------------------------------------ настройки

  get lang(): Lang {
    return this.data.lang;
  }

  setLang(l: Lang): void {
    this.data.lang = l;
    this.changed();
  }

  setAudio(volume: number, muted: boolean): void {
    this.data.volume = volume;
    this.data.muted = muted;
    this.save();
  }

  // ------------------------------------------------------------------ автоматизация

  get autoUse(): AutoUseSave {
    return this.data.auto.use;
  }

  setAutoUse(patch: Partial<AutoUseSave>): void {
    this.data.auto.use = { ...this.data.auto.use, ...patch };
    this.changed();
  }

  autoSkillCfg(l: LineageId = this.activeLineage): AutoSkillSave {
    return { ...DEFAULT_AUTO_SKILL, ...this.data.auto.skill[l] };
  }

  setAutoSkill(patch: Partial<AutoSkillSave>, l: LineageId = this.activeLineage): void {
    this.data.auto.skill[l] = { ...this.autoSkillCfg(l), ...patch };
    this.changed();
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
    if (!cfg.on || !this.data.tutorial.skill) return null;
    const tree = TREES[lin];
    const ls = this.activeLineageSave;
    const plan = planAutoSkill(tree, ls, this.souls, cfg);
    for (const n of plan.buys) {
      this.spendSouls(costOf(n));
      applyBuy(tree, ls, n);
    }
    if (plan.buys.length) this.changed();
    return plan;
  }

  // ------------------------------------------------------------------ кошелёк

  get gold(): number {
    return this.data.gold;
  }

  get souls(): number {
    return this.data.souls;
  }

  addGold(n: number, track = true): void {
    this.data.gold += n;
    if (track && n > 0) this.data.stats.goldEarned += n;
    this.events.emit('wallet');
    this.checkAchievements();
    this.save();
  }

  addSouls(n: number, track = true): void {
    this.data.souls += n;
    if (track && n > 0) this.data.stats.soulsEarned += n;
    this.events.emit('wallet');
    this.checkAchievements();
    this.save();
  }

  spendGold(n: number): boolean {
    if (this.data.gold < n) return false;
    this.data.gold -= n;
    this.events.emit('wallet');
    this.save();
    return true;
  }

  spendSouls(n: number): boolean {
    if (this.data.souls < n) return false;
    this.data.souls -= n;
    this.events.emit('wallet');
    this.save();
    return true;
  }

  // ------------------------------------------------------------------ классы

  get isFirstRun(): boolean {
    return this.data.activeClass === null;
  }

  get activeClass(): ClassId {
    return this.data.activeClass ?? 'warrior';
  }

  get activeLineage(): LineageId {
    return CLASSES[this.activeClass].lineage;
  }

  lineageSave(l: LineageId): LineageSave | null {
    return this.data.lineages[l] ?? null;
  }

  get activeLineageSave(): LineageSave {
    return this.lineageSave(this.activeLineage) ?? this.unlockLineage(this.activeLineage);
  }

  isLineageUnlocked(l: LineageId): boolean {
    return !!this.data.lineages[l];
  }

  unlockLineage(l: LineageId): LineageSave {
    if (!this.data.lineages[l]) this.data.lineages[l] = newLineageSave(TREES[l]);
    this.changed();
    return this.data.lineages[l]!;
  }

  buyLineage(l: LineageId): boolean {
    if (this.isLineageUnlocked(l)) return true;
    if (!this.spendGold(GAMEPLAY.classUnlockCost)) return false;
    this.unlockLineage(l);
    return true;
  }

  setActiveClass(c: ClassId): void {
    this.data.activeClass = c;
    this.changed();
  }

  get lineageOrder(): LineageId[] {
    return LINEAGE_ORDER;
  }

  playerStats(): PlayerStats {
    const cls = this.activeClass;
    const lineage = CLASSES[cls].lineage;
    return buildPlayerStats({
      classId: cls,
      lineage: this.lineageSave(lineage) ?? newLineageSave(TREES[lineage]),
      weapon: this.data.weapon[lineage] ?? null,
      armor: this.data.armor,
    });
  }

  // ------------------------------------------------------------------ экипировка и расходники

  equipped(slot: 'weapon' | 'armor'): EquipmentSave | null {
    const e = slot === 'weapon' ? this.data.weapon[this.activeLineage] ?? null : this.data.armor;
    return e && e.durability > 0 ? e : null;
  }

  repairCost(item: ItemDef): number {
    const e = this.equipped(item.slot);
    if (!e || e.id !== item.id) return 0;
    const missing = 1 - e.durability / item.durability;
    return Math.ceil(item.price * REPAIR_RATIO * missing);
  }

  /** 'bought' | 'repaired' | 'gold' | 'weaker' | 'full' */
  buyItem(item: ItemDef): 'bought' | 'repaired' | 'gold' | 'weaker' | 'full' {
    const cur = this.equipped(item.slot);
    if (cur && cur.id === item.id) {
      if (cur.durability >= item.durability) return 'full';
      const cost = this.repairCost(item);
      if (!this.spendGold(cost)) return 'gold';
      cur.durability = item.durability;
      this.changed();
      return 'repaired';
    }
    if (cur && ITEM_BY_ID[cur.id].tier >= item.tier) return 'weaker';
    if (!this.spendGold(item.price)) return 'gold';
    const save: EquipmentSave = { id: item.id, durability: item.durability };
    if (item.slot === 'weapon') this.data.weapon[this.activeLineage] = save;
    else this.data.armor = save;
    this.changed();
    return 'bought';
  }

  buyConsumable(id: ConsumableId, count = 1): boolean {
    const def = CONSUMABLES[id];
    if (!def.sold || !this.spendGold(def.price * count)) return false;
    this.data.consumables[id] += count;
    this.changed();
    return true;
  }

  addConsumable(id: ConsumableId, n: number): void {
    this.data.consumables[id] += n;
    this.changed();
  }

  /** Записывает износ экипировки после комнаты. */
  commitRun(weapon: EquipmentSave | null, armor: EquipmentSave | null, consumables: Record<ConsumableId, number>): void {
    const lin = this.activeLineage;
    if (weapon) this.data.weapon[lin] = weapon.durability > 0 ? weapon : null;
    if (armor) this.data.armor = armor.durability > 0 ? armor : null;
    this.data.consumables = { ...consumables };
    this.changed();
  }

  // ------------------------------------------------------------------ комнаты

  isCleared(id: string): boolean {
    return this.data.cleared.includes(id);
  }

  get frontierRoom(): string {
    return ROOMS.find((r) => !this.isCleared(r.id))?.id ?? ROOMS[ROOMS.length - 1].id;
  }

  isRoomAvailable(id: string): boolean {
    return this.isCleared(id) || id === this.frontierRoom;
  }

  get allCleared(): boolean {
    return this.data.cleared.length >= ROOMS.length;
  }

  /** Возвращает true, если комната пройдена впервые. */
  markCleared(id: string): boolean {
    if (this.isCleared(id)) return false;
    this.data.cleared.push(id);
    return true;
  }

  bump(key: keyof SaveData['stats'], n = 1): void {
    this.data.stats[key] += n;
    this.checkAchievements();
    this.save();
  }

  get roomsPlayedTotal(): number {
    return this.data.stats.roomsCleared + this.data.stats.deaths;
  }

  // ------------------------------------------------------------------ достижения

  private checkAchievements(): void {
    for (const a of ACHIEVEMENTS) {
      if (this.data.achievements.includes(a.id)) continue;
      if (a.progress(this.data) >= a.target) {
        this.data.achievements.push(a.id);
        this.events.emit('achievement', a.id);
      }
    }
  }

  checkNow(): void {
    this.checkAchievements();
    this.save();
  }

  // ------------------------------------------------------------------ ежедневная награда и подарок

  dailyStatus(): { available: boolean; dayIndex: number; streak: number } {
    const today = dayKey();
    const { lastClaim, streak } = this.data.daily;
    if (lastClaim === today) return { available: false, dayIndex: streak % 7, streak };
    const gap = lastClaim ? dayDiff(lastClaim, today) : 99;
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
    if (r.heal) this.data.consumables.potion_heal += r.heal * multiplier;
    if (r.regen) this.data.consumables.potion_regen += r.regen * multiplier;
    this.data.daily = { lastClaim: dayKey(), streak: st.streak + 1 };
    this.changed();
    return r;
  }

  giftReady(): boolean {
    return Date.now() >= this.data.gift.readyAt;
  }

  giftRemainingMs(): number {
    return Math.max(0, this.data.gift.readyAt - Date.now());
  }

  claimGift(multiplier = 1): typeof GIFT_REWARD {
    this.addGold(GIFT_REWARD.gold * multiplier);
    this.addSouls(GIFT_REWARD.souls * multiplier);
    this.data.gift.readyAt = Date.now() + ADS.giftCooldownMs;
    this.changed();
    return { gold: GIFT_REWARD.gold * multiplier, souls: GIFT_REWARD.souls * multiplier };
  }

  // ------------------------------------------------------------------ полезное

  roomTitle(id: string): string {
    const r = ROOM_BY_ID[id];
    return `${r.floor}-${r.index}`;
  }
}

export const Store = new StoreImpl();
