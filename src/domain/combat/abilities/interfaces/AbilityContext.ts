import type { EnemyDef } from '../../../catalog';
import type { CellIndex, Rng } from '../../../shared';
import type { Card } from '../../card/Card';
import type { IEngine } from '../../engine/interfaces/IEngine';
import type { GameEvent } from '../../events';
import type { PlayerStats } from '../../player';

/**
 * Что способность может делать в бою: читать поле и героя, считать урон, бить, накладывать
 * статусы, двигать карты колодой и включать длящиеся эффекты героя. Реализует бой в комнате.
 */
export interface AbilityContext {
  // ---- поле и герой
  readonly cards: Array<Card | null>;
  readonly playerCell: CellIndex;
  readonly engine: IEngine;
  readonly enemies: Readonly<Record<string, EnemyDef>>;
  /** Характеристики героя на этот бой (способность может на время поднять добычу душ). */
  readonly stats: PlayerStats;
  readonly rng: Rng;
  /** Первая из двух карт «Перестановки». */
  readonly swapFirst: CellIndex | null;
  enemyCells(): CellIndex[];
  /** Клетка за целью по линии от героя; `Grid.NO_CELL` — край поля. */
  behindCell(from: CellIndex, to: CellIndex): CellIndex;
  /** Ближайший враг; `Grid.NO_CELL` — врагов нет. */
  nearestEnemy(from: CellIndex): CellIndex;
  emit(ev: GameEvent): void;

  // ---- урон
  /** Урон способности — доля урона героя с учётом силы способностей. */
  spellDamage(ratio: number): number;
  rollCrit(enemy: Card | null, ranged: boolean): boolean;
  rollCritMul(): number;
  /** Число, усиленное силой способностей, не выше `cap`. */
  pp(value: number, cap?: number): number;
  /** Удар по врагу (уворот, броня, синергии); `true` — враг погиб. */
  strike(cell: CellIndex, raw: number, crit: boolean): boolean;
  /** Уже посчитанный урон по врагу; `true` — враг погиб. */
  damageEnemy(cell: CellIndex, dmg: number, crit: boolean, direct?: boolean): boolean;
  killEnemy(cell: CellIndex): void;
  splashNeighbors(cell: CellIndex, dmg: number): void;
  /** Герой шагает на освободившуюся клетку. */
  stepInto(cell: CellIndex): void;
  /** Забрать карту с клетки (золото, сундук, зелье). */
  take(cell: CellIndex): void;

  // ---- статусы
  applyStun(cell: CellIndex, turns?: number): void;
  applyBurn(cell: CellIndex, dmg: number, turns: number): void;
  /** Клеймо сработало: не-босс гибнет, босс теряет долю здоровья. */
  reapMarked(cell: CellIndex, bossHpShare: number): void;

  // ---- длящиеся эффекты героя
  /** Накопленное ослабление атаки врагов («Боевой клич»). */
  warCry: number;
  /** Ходов «Безумия берсерка». */
  madness: number;
  /** Ходов «Жнеца». */
  reaping: number;
  /** Ходов без ответа врагов («Дымовая завеса»). */
  noCounter: number;
  /** «Откат времени»: вернуть снимок начала хода. */
  restoreSnapshot(): void;
}
