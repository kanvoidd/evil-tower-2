import type { EnemyTag } from './interfaces/EnemyTag';

/** Нежить и демоны: по ним бьют «Святая кара», «Луч правосудия» и «Гнев небес». */
export const isHolyTarget = (tag: EnemyTag): boolean => tag === 'undead' || tag === 'demon';
