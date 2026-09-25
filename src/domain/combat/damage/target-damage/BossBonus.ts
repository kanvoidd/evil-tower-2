import type { EnemyDef } from '../../../catalog';
import type { Ratio } from '../../../shared';
import type { Card } from '../../card/Card';
import type { ITargetDamageModifier } from '../interfaces/ITargetDamageModifier';

/** По боссу урон выше. */
export class BossBonus implements ITargetDamageModifier {
  constructor(private readonly share: Ratio) {}

  bonus(_enemy: Card, def: EnemyDef | undefined): number {
    return def?.boss ? this.share : 0;
  }
}
