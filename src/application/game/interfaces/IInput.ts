import type { PlayerCommand } from './PlayerCommand';

/** Источник команд игрока: касания, клавиши. Как именно они получены — дело реализации. */
export interface IInput {
  onCommand(handler: (cmd: PlayerCommand) => void): void;
}
