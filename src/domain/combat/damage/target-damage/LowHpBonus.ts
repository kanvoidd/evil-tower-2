import type { EnemyDef } from '../../../catalog';
import type { Ratio } from '../../../shared';
import type { Card } from '../../card/Card';
import type { ITargetDamageModifier } from '../interfaces/ITargetDamageModifier';

/** По раненому врагу (здоровья не больше порога) урон выше. */
export class LowHpBonus implements ITargetDamageModifier {
  /** Порог здоровья врага — доля максимума. */
  static readonly HP_SHARE = 0.3;

  constructor(private readonly share: Ratio) {}

  bonus(enemy: Card, _def: EnemyDef | undefined): number {
    return enemy.hp <= enemy.maxHp * LowHpBonus.HP_SHARE ? this.share : 0;
  }
}
