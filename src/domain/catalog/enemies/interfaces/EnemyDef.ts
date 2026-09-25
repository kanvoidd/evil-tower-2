import type { EnemyRole } from './EnemyRole';
import type { EnemyTag } from './EnemyTag';
import type { EnemyTraits } from './EnemyTraits';

export interface EnemyDef extends EnemyTraits {
  id: string;
  floor: number;
  role: EnemyRole;
  tag: EnemyTag;
  hp: number;
  atk: number;
  gold: number;
  souls: number;
  boss: boolean;
  icon: string;
  name: { ru: string; en: string };
}
