import type { GameControllerDeps } from '../../interfaces/GameControllerDeps';
import type { FlowState } from '../flow-state/FlowState';
import type { FlowParts } from '../interfaces/FlowParts';

/**
 * Часть потока боя. Все части работают над одним состоянием потока, говорят с игроком через
 * порты контроллера (`GameControllerDeps`) и зовут друг друга по имени (`this.parts.room.finish`).
 */
export abstract class FlowPart {
  constructor(
    protected readonly d: GameControllerDeps,
    protected readonly state: FlowState,
    protected readonly parts: FlowParts,
  ) {}
}
