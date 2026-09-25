import type { IBattleState } from './IBattleState';
import type { IPlayerActions } from './IPlayerActions';

/** Бой глазами сцены: что видно и что можно сделать. */
export interface IBattleSession extends IBattleState, IPlayerActions {}
