import type { DamageCalc } from '../damage-calc/DamageCalc';
import type { EnemyDeath } from '../enemy-death/EnemyDeath';
import type { EnemyHits } from '../enemy-hits/EnemyHits';
import type { EnemyTurn } from '../enemy-turn/EnemyTurn';
import type { HeroUpkeep } from '../hero-upkeep/HeroUpkeep';
import type { PerkActions } from '../perk-actions/PerkActions';
import type { PlayerActions } from '../player-actions/PlayerActions';
import type { Rewind } from '../rewind/Rewind';
import type { RoomFlow } from '../room-flow/RoomFlow';
import type { RoomLoot } from '../room-loot/RoomLoot';
import type { StatusEffects } from '../status-effects/StatusEffects';

/** Части боя в комнате по именам. */
export interface RoomParts {
  readonly damage: DamageCalc;
  readonly upkeep: HeroUpkeep;
  readonly hits: EnemyHits;
  readonly deaths: EnemyDeath;
  readonly status: StatusEffects;
  readonly actions: PlayerActions;
  readonly loot: RoomLoot;
  readonly enemyTurn: EnemyTurn;
  readonly perks: PerkActions;
  readonly flow: RoomFlow;
  readonly rewind: Rewind;
}
