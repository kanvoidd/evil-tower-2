import type { RunCarry } from './RunCarry';

/** Куда уходит бой: в следующую комнату забега, в новый забег или в хаб. */
export interface IGameNavigator {
  nextRoom(carry: RunCarry): void;
  newRun(): void;
  toHub(): void;
}
