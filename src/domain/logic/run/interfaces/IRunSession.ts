import type { IPlayerActions } from './IPlayerActions';
import type { IRunState } from './IRunState';

/** Бой глазами сцены: что видно и что можно сделать. */
export interface IRunSession extends IRunState, IPlayerActions {}
