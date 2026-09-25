import type { PlayerCommand } from './PlayerCommand';

/** Команды, которые разыгрывает сам бой. Уход из забега — решение потока игры, а не хода в комнате. */
export type BattleCommand = Exclude<PlayerCommand, { type: 'escape' }>;
