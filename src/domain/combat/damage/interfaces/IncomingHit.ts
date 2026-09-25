import type { EnemyDef } from '../../../catalog';
import type { Card } from '../../card/Card';
import type { HeroView } from './HeroView';

/** Удар по герою: кто бьёт (нет врага — оценка удара на будущее) и по кому. */
export interface IncomingHit {
  readonly enemy: Card | null;
  readonly def: EnemyDef | null;
  readonly hero: HeroView;
}
