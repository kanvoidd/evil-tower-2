import type { RunCarry } from '../../../domain/expedition';

/** Куда уходит бой: в следующую комнату забега, в новый забег или в хаб. */
export interface IGameNavigator {
  nextRoom(carry: RunCarry): void;
  newRun(): void;
  toHub(): void;
}
