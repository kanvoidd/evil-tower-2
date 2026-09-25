import type { EnemyDef } from '../../../catalog';
import type { Ratio } from '../../../shared';
import type { Card } from '../../card/Card';
import type { ITargetDamageModifier } from '../interfaces/ITargetDamageModifier';

/** По врагу с полным здоровьем урон выше. */
export class FullHpBonus implements ITargetDamageModifier {
  constructor(private readonly share: Ratio) {}

  bonus(enemy: Card, _def: EnemyDef | undefined): number {
    return enemy.hp >= enemy.maxHp ? this.share : 0;
  }
}
