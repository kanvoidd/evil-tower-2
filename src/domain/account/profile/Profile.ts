import type { ClassId, ConsumableId, EquipmentSave, ItemDef, LineageId } from '../../catalog';
import type { AutoUseSave, PlayerStats } from '../../combat';
import type { Hero, LineageSave } from '../../progression';
import type { AchievementDef, DailyReward, GiftReward, ICalendar } from '../../rewards';
import type { Gold, Lang, Signal, Souls } from '../../shared';
import { emptyHeroSave } from '../save/fresh-save/emptyHeroSave';
import { freshSave } from '../save/fresh-save/freshSave';
import type { HeroSave } from '../save/interfaces/HeroSave';
import type { SaveData } from '../save/interfaces/SaveData';
import { AccountState } from './account-state/AccountState';
import { AchievementTracker } from './achievement-tracker/AchievementTracker';
import { AutomationSettings } from './automation-settings/AutomationSettings';
import { DailyRewards } from './daily-rewards/DailyRewards';
import { HeroRoster } from './hero-roster/HeroRoster';
import { HeroWallets } from './hero-wallets/HeroWallets';
import type { ConsumablePurchase } from './interfaces/ConsumablePurchase';
import type { DailyStatus } from './interfaces/DailyStatus';
import type { ItemPurchase } from './interfaces/ItemPurchase';
import type { ProfileParts } from './interfaces/ProfileParts';
import { PlayerSettings } from './player-settings/PlayerSettings';
import { TowerGift } from './tower-gift/TowerGift';

/**
 * Профиль игрока — корень агрегата «аккаунт»: правила над документом сохранения. Фасад над
 * частями: настройки и отметки игрока (`PlayerSettings`), автоматизация (`AutomationSettings`),
 * герои и их прогресс (`HeroRoster`), всё своё у каждого героя — кошелёк, снаряжение, расходники,
 * рекорд (`HeroWallets`), счётчики и достижения (`AchievementTracker`), награда дня
 * (`DailyRewards`) и «Дар башни» (`TowerGift`). Общее у частей — `AccountState`.
 *
 * Профиль не знает, где и как хранится документ: об изменениях он сообщает сигналом `changed`,
 * а сохраняет их инфраструктура. Время и день игрока приходят снаружи (`now`, `calendar`),
 * поэтому правила наград проверяются без часов браузера и часового пояса.
 */
export class Profile {
  private readonly state: AccountState;
  private readonly parts: ProfileParts;

  constructor(doc: SaveData, now: () => number, calendar: ICalendar) {
    const state = new AccountState(doc, now, calendar);
    const parts = {} as { -readonly [K in keyof ProfileParts]: ProfileParts[K] };
    parts.settings = new PlayerSettings(state, parts);
    parts.automation = new AutomationSettings(state, parts);
    parts.heroes = new HeroRoster(state, parts);
    parts.wallets = new HeroWallets(state, parts);
    parts.achievements = new AchievementTracker(state, parts);
    parts.daily = new DailyRewards(state, parts);
    parts.gift = new TowerGift(state, parts);
    this.state = state;
    this.parts = parts;
  }

  /** Документ сохранения нового игрока. */
  static freshData(lang: Lang, now: number): SaveData {
    return freshSave(lang, now);
  }

  /** Новый герой начинает с нулями: ни золота, ни душ, ни расходников, ни доспеха. */
  static emptyHero(): HeroSave {
    return emptyHeroSave();
  }

  // ------------------------------------------------------------------ документ и сигналы

  /** Изменилось что угодно — документ пора сохранить. */
  get changed(): Signal {
    return this.state.changed;
  }

  /** Изменился кошелёк активного героя (или сменился сам герой). */
  get walletChanged(): Signal {
    return this.state.walletChanged;
  }

  /** Открыто достижение (id). */
  get achievementUnlocked(): Signal<[string]> {
    return this.state.achievementUnlocked;
  }

  /** Документ сохранения, над которым работают правила. */
  get data(): SaveData {
    return this.state.doc;
  }

  /** Подменить документ целиком (загрузка сохранения, сброс прогресса). Это не изменение — сохранять нечего. */
  replace(doc: SaveData): void {
    this.state.doc = doc;
    this.parts.heroes.forget();
    this.state.walletChanged.emit();
  }

  // ------------------------------------------------------------------ настройки и отметки

  get lang(): Lang {
    return this.parts.settings.lang;
  }

  setLang(l: Lang): void {
    this.parts.settings.setLang(l);
  }

  /** Громкость 0…1. */
  get volume(): number {
    return this.parts.settings.volume;
  }

  get muted(): boolean {
    return this.parts.settings.muted;
  }

  setAudio(volume: number, muted: boolean): void {
    this.parts.settings.setAudio(volume, muted);
  }

  get tutorial(): Readonly<SaveData['tutorial']> {
    return this.parts.settings.tutorial;
  }

  /** Шаг обучения пройден. */
  markTutorial(step: keyof SaveData['tutorial']): void {
    this.parts.settings.markTutorial(step);
  }

  get lastInterstitial(): number {
    return this.parts.settings.lastInterstitial;
  }

  noteInterstitial(at: number): void {
    this.parts.settings.noteInterstitial(at);
  }

  // ------------------------------------------------------------------ автоматизация

  get autoUse(): AutoUseSave {
    return this.parts.automation.autoUse;
  }

  setAutoUse(patch: Partial<AutoUseSave>): void {
    this.parts.automation.setAutoUse(patch);
  }

  // ------------------------------------------------------------------ герои

  /** Герой линейки: прогресс дерева и класс — один экземпляр на открытую линейку. */
  hero(lin: LineageId): Hero {
    return this.parts.heroes.hero(lin);
  }

  /** Герой, которым сейчас играет игрок. */
  get activeHero(): Hero {
    return this.parts.heroes.activeHero;
  }

  get isFirstRun(): boolean {
    return this.parts.heroes.isFirstRun;
  }

  /** Класс активного героя — выводится из прогресса дерева. */
  get activeClass(): ClassId {
    return this.parts.heroes.activeClass;
  }

  get activeLineage(): LineageId {
    return this.parts.heroes.activeLineage;
  }

  lineageSave(l: LineageId): LineageSave | null {
    return this.parts.heroes.lineageSave(l);
  }

  get activeLineageSave(): LineageSave {
    return this.parts.heroes.activeLineageSave;
  }

  isLineageUnlocked(l: LineageId): boolean {
    return this.parts.heroes.isLineageUnlocked(l);
  }

  unlockLineage(l: LineageId): LineageSave {
    return this.parts.heroes.unlockLineage(l);
  }

  buyLineage(l: LineageId): boolean {
    return this.parts.heroes.buyLineage(l);
  }

  setActiveClass(c: ClassId): void {
    this.parts.heroes.setActiveClass(c);
  }

  /** Характеристики активного героя для боя: класс, таланты и снаряжение (сломанное не в счёт). */
  playerStats(): PlayerStats {
    return this.parts.heroes.playerStats();
  }

  // ------------------------------------------------------------------ кошелёк, снаряжение, рекорд

  /** Всё своё у активного героя (кошелёк, расходники, доспех, рекорд); у нового героя — с нулями. */
  get heroSave(): HeroSave {
    return this.parts.wallets.heroSave;
  }

  heroSaveOf(lin: LineageId): HeroSave {
    return this.parts.wallets.heroSaveOf(lin);
  }

  /** Рекорд героя линейки — без заведения пустого кошелька, если героя ещё нет. */
  bestOf(lin: LineageId): number {
    return this.parts.wallets.bestOf(lin);
  }

  get gold(): Gold {
    return this.parts.wallets.gold;
  }

  get souls(): Souls {
    return this.parts.wallets.souls;
  }

  addGold(n: Gold, track = true): void {
    this.parts.wallets.addGold(n, track);
  }

  addSouls(n: Souls, track = true): void {
    this.parts.wallets.addSouls(n, track);
  }

  spendGold(n: Gold): boolean {
    return this.parts.wallets.spendGold(n);
  }

  spendSouls(n: Souls): boolean {
    return this.parts.wallets.spendSouls(n);
  }

  equipped(slot: 'weapon' | 'armor'): EquipmentSave | null {
    return this.parts.wallets.equipped(slot);
  }

  repairCost(item: ItemDef): Gold {
    return this.parts.wallets.repairCost(item);
  }

  buyItem(item: ItemDef): ItemPurchase {
    return this.parts.wallets.buyItem(item);
  }

  /** Лавка не продаёт сверх предела; 'max' — уже полный запас. */
  buyConsumable(id: ConsumableId, count = 1): ConsumablePurchase {
    return this.parts.wallets.buyConsumable(id, count);
  }

  /** Расходники героя такими, какими их оставил бой. */
  keepConsumables(consumables: Readonly<Record<ConsumableId, number>>): void {
    this.parts.wallets.keepConsumables(consumables);
  }

  /** Записывает износ экипировки и расходники после комнаты. */
  commitBattle(
    weapon: EquipmentSave | null,
    armor: EquipmentSave | null,
    consumables: Readonly<Record<ConsumableId, number>>,
  ): void {
    this.parts.wallets.commitBattle(weapon, armor, consumables);
  }

  /** Рекорд активного героя: сколько комнат он прошёл за один забег. */
  get best(): number {
    return this.parts.wallets.best;
  }

  /** Записывает итог забега. true — если это новый рекорд. */
  recordRun(rooms: number): boolean {
    return this.parts.wallets.recordRun(rooms);
  }

  /** Лучший забег среди всех героев — для таблицы рекордов. */
  get bestClimb(): number {
    return this.parts.wallets.bestClimb;
  }

  // ------------------------------------------------------------------ счётчики и достижения

  get stats(): Readonly<SaveData['stats']> {
    return this.parts.achievements.stats;
  }

  bump(key: keyof SaveData['stats'], n = 1): void {
    this.parts.achievements.bump(key, n);
  }

  get roomsPlayedTotal(): number {
    return this.parts.achievements.roomsPlayedTotal;
  }

  get achievements(): readonly string[] {
    return this.parts.achievements.achievements;
  }

  /** Прогресс достижения по сохранению — не больше его цели. */
  achievementProgress(a: AchievementDef): number {
    return this.parts.achievements.progress(a);
  }

  /** Открыть достигнутые достижения и сохранить. */
  checkNow(): void {
    this.parts.achievements.check();
    this.state.touch();
  }

  // ------------------------------------------------------------------ награда дня и «Дар башни»

  dailyStatus(): DailyStatus {
    return this.parts.daily.status();
  }

  claimDaily(multiplier = 1): DailyReward | null {
    return this.parts.daily.claim(multiplier);
  }

  giftReady(): boolean {
    return this.parts.gift.ready();
  }

  giftRemainingMs(): number {
    return this.parts.gift.remainingMs();
  }

  /** Сколько даст «Дар башни» активному герою сейчас: растёт с его рекордом. */
  get nextGift(): GiftReward {
    return this.parts.gift.next();
  }

  claimGift(multiplier = 1): GiftReward {
    return this.parts.gift.claim(multiplier);
  }
}
