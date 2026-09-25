import type { EnemyDef } from '../../../../catalog';
import type { CellIndex, Rng } from '../../../../shared';
import type { AbilityContext } from '../../../abilities';
import type { Card } from '../../../card/Card';
import type { IEngine } from '../../../engine/interfaces/IEngine';
import type { GameEvent } from '../../../events';
import type { PlayerStats } from '../../../player';
import type { RoomState } from '../../room-state/RoomState';
import type { RoomParts } from '../interfaces/RoomParts';

/** Бой глазами способностей: состояние комнаты и нужные им правила частей боя. */
export class BattleAbilityContext implements AbilityContext {
  constructor(
    private readonly state: RoomState,
    private readonly parts: RoomParts,
  ) {}

  get cards(): Array<Card | null> {
    return this.state.cards;
  }

  get playerCell(): CellIndex {
    return this.state.playerCell;
  }

  get engine(): IEngine {
    return this.state.engine;
  }

  get enemies(): Readonly<Record<string, EnemyDef>> {
    return this.state.enemies;
  }

  get stats(): PlayerStats {
    return this.state.stats;
  }

  get rng(): Rng {
    return this.state.rng;
  }

  get swapFirst(): CellIndex | null {
    return this.state.swapFirst;
  }

  enemyCells(): CellIndex[] {
    return this.state.enemyCells();
  }

  behindCell(from: CellIndex, to: CellIndex): CellIndex {
    return this.parts.actions.behindCell(from, to);
  }

  nearestEnemy(from: CellIndex): CellIndex {
    return this.parts.actions.nearestEnemy(from);
  }

  emit(ev: GameEvent): void {
    this.state.emit(ev);
  }

  spellDamage(ratio: number): number {
    return this.parts.damage.spellDamage(ratio);
  }

  rollCrit(enemy: Card | null, ranged: boolean): boolean {
    return this.parts.damage.rollCrit(enemy, ranged);
  }

  rollCritMul(): number {
    return this.parts.damage.rollCritMul();
  }

  pp(value: number, cap?: number): number {
    return this.parts.damage.pp(value, cap);
  }

  strike(cell: CellIndex, raw: number, crit: boolean): boolean {
    return this.parts.hits.strike(cell, raw, crit);
  }

  damageEnemy(cell: CellIndex, dmg: number, crit: boolean, direct?: boolean): boolean {
    return this.parts.hits.damageEnemy(cell, dmg, crit, direct);
  }

  killEnemy(cell: CellIndex): void {
    this.parts.deaths.killEnemy(cell);
  }

  splashNeighbors(cell: CellIndex, dmg: number): void {
    this.parts.hits.splashNeighbors(cell, dmg);
  }

  stepInto(cell: CellIndex): void {
    this.parts.actions.stepInto(cell);
  }

  take(cell: CellIndex): void {
    this.parts.loot.take(cell);
  }

  applyStun(cell: CellIndex, turns?: number): void {
    this.parts.status.applyStun(cell, turns);
  }

  applyBurn(cell: CellIndex, dmg: number, turns: number): void {
    this.parts.status.applyBurn(cell, dmg, turns);
  }

  reapMarked(cell: CellIndex, bossHpShare: number): void {
    this.parts.status.reapMarked(cell, bossHpShare);
  }

  get warCry(): number {
    return this.state.warCry;
  }

  set warCry(v: number) {
    this.state.warCry = v;
  }

  get madness(): number {
    return this.state.madness;
  }

  set madness(v: number) {
    this.state.madness = v;
  }

  get reaping(): number {
    return this.state.reaping;
  }

  set reaping(v: number) {
    this.state.reaping = v;
  }

  get noCounter(): number {
    return this.state.noCounter;
  }

  set noCounter(v: number) {
    this.state.noCounter = v;
  }

  restoreSnapshot(): void {
    this.parts.rewind.restoreSnapshot();
  }
}
