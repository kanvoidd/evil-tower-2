import type {
  ConsumableId,
  EquipmentSave,
  LineageDef,
  LineageId,
  PerkDef,
  RoomDef,
  RoomModifier,
  RoomPlan,
} from '../../catalog';
import type { CellIndex } from '../../shared';
import type { Card } from '../card/Card';
import type { GameEvent } from '../events';
import type { PlayerStats } from '../player';
import type { Action } from './interfaces/Action';
import type { BattleCarryStats } from './interfaces/BattleCarryStats';
import type { BattleDeps } from './interfaces/BattleDeps';
import type { BattleInit } from './interfaces/BattleInit';
import type { BattleTotals } from './interfaces/BattleTotals';
import type { IBattleSession } from './interfaces/IBattleSession';
import type { PerkReadiness } from './interfaces/PerkReadiness';
import type { TurnResult } from './interfaces/TurnResult';
import { DamageCalc } from './parts/damage-calc/DamageCalc';
import { EnemyDeath } from './parts/enemy-death/EnemyDeath';
import { EnemyHits } from './parts/enemy-hits/EnemyHits';
import { EnemyTurn } from './parts/enemy-turn/EnemyTurn';
import { HeroUpkeep } from './parts/hero-upkeep/HeroUpkeep';
import type { RoomParts } from './parts/interfaces/RoomParts';
import { PerkActions } from './parts/perk-actions/PerkActions';
import { PlayerActions } from './parts/player-actions/PlayerActions';
import { Rewind } from './parts/rewind/Rewind';
import { RoomFlow } from './parts/room-flow/RoomFlow';
import { RoomLoot } from './parts/room-loot/RoomLoot';
import { StatusEffects } from './parts/status-effects/StatusEffects';
import { RoomState } from './room-state/RoomState';

/**
 * Бой в одной комнате — фасад для сцены, тестов и симулятора (`IBattleSession`). Правил здесь
 * нет: они в частях боя (`parts/`) над общим состоянием комнаты (`RoomState`) — урон, удары
 * и гибель врагов, статусы, действия героя, добыча, ответ врагов, способности, течение хода,
 * откат. Поле и колода — у движка (`IEngine`), карты создаёт фабрика — обоих даёт
 * `RoomBattleFactory`.
 */
export class RoomBattle implements IBattleSession {
  /** Только для проверок и отладки: состояние комнаты и части боя. */
  readonly state: RoomState;
  readonly parts: RoomParts;

  constructor(init: BattleInit, deps: BattleDeps) {
    const state = new RoomState(init, deps);
    const parts = {} as { -readonly [K in keyof RoomParts]: RoomParts[K] };
    parts.damage = new DamageCalc(state, parts);
    parts.upkeep = new HeroUpkeep(state, parts);
    parts.hits = new EnemyHits(state, parts);
    parts.deaths = new EnemyDeath(state, parts);
    parts.status = new StatusEffects(state, parts);
    parts.actions = new PlayerActions(state, parts);
    parts.loot = new RoomLoot(state, parts);
    parts.enemyTurn = new EnemyTurn(state, parts);
    parts.perks = new PerkActions(state, parts);
    parts.flow = new RoomFlow(state, parts);
    parts.rewind = new Rewind(state, parts);
    this.state = state;
    this.parts = parts;
  }

  // ------------------------------------------------------------------ состояние

  get room(): RoomDef {
    return this.state.room;
  }

  get plan(): RoomPlan {
    return this.state.plan;
  }

  get mod(): RoomModifier {
    return this.state.mod;
  }

  get lineageDef(): LineageDef {
    return this.state.lineageDef;
  }

  get lineage(): LineageId {
    return this.state.stats.lineage;
  }

  get stats(): PlayerStats {
    return this.state.stats;
  }

  set stats(v: PlayerStats) {
    this.state.stats = v;
  }

  get hp(): number {
    return this.state.hp;
  }

  set hp(v: number) {
    this.state.hp = v;
  }

  get shield(): number {
    return this.state.shield;
  }

  set shield(v: number) {
    this.state.shield = v;
  }

  get res(): number {
    return this.state.res;
  }

  set res(v: number) {
    this.state.res = v;
  }

  get boost(): number {
    return this.state.boost;
  }

  set boost(v: number) {
    this.state.boost = v;
  }

  get over(): null | 'win' | 'lose' {
    return this.state.over;
  }

  set over(v: null | 'win' | 'lose') {
    this.state.over = v;
  }

  get revived(): boolean {
    return this.state.revived;
  }

  set revived(v: boolean) {
    this.state.revived = v;
  }

  get selfRevived(): boolean {
    return this.state.selfRevived;
  }

  get weapon(): EquipmentSave | null {
    return this.state.weapon;
  }

  get armor(): EquipmentSave | null {
    return this.state.armor;
  }

  get consumables(): Record<ConsumableId, number> {
    return this.state.consumables;
  }

  set consumables(v: Record<ConsumableId, number>) {
    this.state.consumables = v;
  }

  get totals(): BattleTotals {
    return this.state.totals;
  }

  get armed(): PerkDef | null {
    return this.state.armed;
  }

  /** Поле боя — у движка; правила его только читают, а меняют командами движка. */
  get cards(): Array<Card | null> {
    return this.state.cards;
  }

  /** Колода — тоже у движка. */
  get pool(): Card[] {
    return this.state.pool;
  }

  get playerCell(): CellIndex {
    return this.state.playerCell;
  }

  /** Только для тестов и отладки: поставить героя на клетку без хода. */
  set playerCell(cell: CellIndex) {
    this.state.playerCell = cell;
  }

  /** Враги, которые прямо сейчас на поле. Колода бесконечна, поэтому «сколько осталось» — не про неё. */
  get enemiesLeft(): number {
    return this.cards.filter((c) => c?.kind === 'enemy').length;
  }

  /** Сколько врагов нужно уложить, чтобы открылся выход с этажа. */
  get totalEnemies(): number {
    return this.state.quota;
  }

  /** Сколько ещё нужно уложить. */
  get killsLeft(): number {
    return Math.max(0, this.state.quota - this.state.killsRoom) + (this.state.bossLeft ? 1 : 0);
  }

  /** Карта перехода уже подмешана в колоду. */
  get exitOpen(): boolean {
    return this.state.exitQueued;
  }

  // ------------------------------------------------------------------ действия игрока

  start(): GameEvent[] {
    return this.parts.flow.start();
  }

  tap(cell: CellIndex): TurnResult {
    return this.parts.flow.tap(cell);
  }

  usePerk(id: string): TurnResult {
    return this.parts.perks.usePerk(id);
  }

  cancelPerk(): GameEvent[] {
    return this.parts.perks.cancelPerk();
  }

  useItem(id: ConsumableId): TurnResult {
    return this.parts.loot.useItem(id);
  }

  revive(): GameEvent[] {
    return this.parts.flow.revive();
  }

  autoRevive(): GameEvent[] | null {
    return this.parts.flow.autoRevive();
  }

  // ------------------------------------------------------------------ вопросы к бою

  actionFor(cell: CellIndex): Action {
    return this.parts.actions.actionFor(cell);
  }

  wouldKill(cell: CellIndex): boolean {
    return this.parts.actions.wouldKill(cell);
  }

  perkReady(p: PerkDef): PerkReadiness {
    return this.parts.perks.perkReady(p);
  }

  perkTargetOk(p: PerkDef, cell: CellIndex): boolean {
    return this.parts.perks.perkTargetOk(p, cell);
  }

  perkCostOf(p: PerkDef): number {
    return this.parts.perks.perkCostOf(p);
  }

  cooldownOf(p: PerkDef): number {
    return this.parts.perks.cooldownOf(p);
  }

  currentDamage(): number {
    return this.parts.damage.currentDamage();
  }

  strikeDamage(atk: number): number {
    return this.parts.damage.strikeDamage(atk);
  }

  healPotionAmount(): number {
    return this.parts.loot.healPotionAmount();
  }

  artifactDamage(): number {
    return this.parts.loot.artifactDamage();
  }

  cornered(): boolean {
    return this.parts.flow.cornered();
  }

  resourceMax(): number {
    return this.state.stats.resMax;
  }

  /** Что уходит в следующую комнату забега. */
  carryOut(): BattleCarryStats {
    const s = this.state;
    return { hp: s.hp, res: s.res, revived: s.revived, selfRevived: s.selfRevived };
  }
}
