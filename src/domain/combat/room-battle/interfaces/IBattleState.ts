import type { LineageDef } from '../../../catalog/heroes';
import type { RoomDef, RoomModifier } from '../../../catalog/levels';
import type { PerkDef } from '../../../catalog/perks';
import type { ConsumableId, EquipmentSave, LineageId } from '../../../types';
import type { Card } from '../../card/Card';
import type { PlayerStats } from '../../player';
import type { Action } from './Action';
import type { BattleCarryStats } from './BattleCarryStats';
import type { BattleTotals } from './BattleTotals';
import type { PerkReadiness } from './PerkReadiness';

/** Что сцена и подсказки могут узнать о бое. Только чтение: менять бой можно лишь действиями игрока. */
export interface IBattleState {
  readonly room: RoomDef;
  readonly mod: RoomModifier;
  readonly stats: PlayerStats;
  readonly lineage: LineageId;
  readonly lineageDef: LineageDef;
  readonly cards: ReadonlyArray<Card | null>;
  readonly playerCell: number;
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
  readonly armed: PerkDef | null;
  readonly enemiesLeft: number;
  readonly totalEnemies: number;
  readonly killsLeft: number;
  readonly exitOpen: boolean;

  actionFor(cell: number): Action;
  wouldKill(cell: number): boolean;
  perkReady(p: PerkDef): PerkReadiness;
  perkTargetOk(p: PerkDef, cell: number): boolean;
  perkCostOf(p: PerkDef): number;
  cooldownOf(p: PerkDef): number;
  strikeDamage(atk: number): number;
  healPotionAmount(): number;
  artifactDamage(): number;
  cornered(): boolean;
  carryOut(): BattleCarryStats;
}
