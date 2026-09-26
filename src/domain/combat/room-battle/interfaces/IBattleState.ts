import type {
  AbilityDef,
  ConsumableId,
  EquipmentSave,
  LineageDef,
  LineageId,
  RoomDef,
  RoomModifier,
} from '../../../catalog';
import type { CellIndex } from '../../../shared';
import type { Card } from '../../card/Card';
import type { PlayerStats } from '../../player';
import type { Action } from './Action';
import type { BattleCarryStats } from './BattleCarryStats';
import type { BattleTotals } from './BattleTotals';
import type { PerkReadiness } from './PerkReadiness';
import type { TrapView } from './TrapView';

/** Что сцена и подсказки могут узнать о бое. Только чтение: менять бой можно лишь действиями игрока. */
export interface IBattleState {
  readonly room: RoomDef;
  readonly mod: RoomModifier;
  readonly stats: PlayerStats;
  readonly lineage: LineageId;
  readonly lineageDef: LineageDef;
  readonly cards: ReadonlyArray<Card | null>;
  readonly playerCell: CellIndex;
  readonly hp: number;
  readonly shield: number;
  readonly res: number;
  readonly boost: number;
  readonly over: null | 'win' | 'lose';
  readonly revived: boolean;
  readonly weapon: EquipmentSave | null;
  readonly armor: EquipmentSave | null;
  readonly consumables: Readonly<Record<ConsumableId, number>>;
  readonly totals: Readonly<BattleTotals>;
  readonly armed: AbilityDef | null;
  /** «Взведённая ловушка» заряжена: выбранная для неё способность и задержка в ходах. */
  readonly trapSkill: AbilityDef | null;
  readonly trapDelay: number;
  /** Ловушки на поле. */
  readonly traps: readonly TrapView[];
  readonly enemiesLeft: number;
  readonly totalEnemies: number;
  readonly killsLeft: number;
  readonly exitOpen: boolean;

  actionFor(cell: CellIndex): Action;
  wouldKill(cell: CellIndex): boolean;
  perkReady(p: AbilityDef): PerkReadiness;
  perkTargetOk(p: AbilityDef, cell: CellIndex): boolean;
  perkCostOf(p: AbilityDef): number;
  cooldownOf(p: AbilityDef): number;
  /** Накопленный заряд способности («Заряд» магического выстрела). */
  chargeOf(p: AbilityDef): number;
  /** Можно ли выбрать способность `p` для «Взведённой ловушки» `trap`. */
  canArmWith(trap: AbilityDef, p: AbilityDef): boolean;
  strikeDamage(atk: number): number;
  healPotionAmount(): number;
  artifactDamage(): number;
  cornered(): boolean;
  carryOut(): BattleCarryStats;
}
