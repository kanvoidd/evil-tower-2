import type { EnemyDef } from '../../../catalog';
import type { Card } from '../../card/Card';

/** Надбавка к урону по конкретному врагу: доля к множителю, 0 — не действует. */
export interface ITargetDamageModifier {
  bonus(enemy: Card, def: EnemyDef | undefined): number;
}
