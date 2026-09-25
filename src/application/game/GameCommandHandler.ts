import type { IRunSession, TurnResult } from '../../domain/logic/run';
import type { BattleCommand } from './interfaces/BattleCommand';

/**
 * Переводит намерение игрока в вызов боя. Правил игры обработчик не знает: удар это, шаг или
 * наведение способности, решают правила (`Run`), а обработчик лишь выбирает, какое действие позвать.
 *
 *   PlayerCommand → GameCommandHandler → IRunSession → TurnResult → GameEvent[]
 */
export class GameCommandHandler {
  constructor(private readonly session: IRunSession) {}

  execute(cmd: BattleCommand): TurnResult {
    switch (cmd.type) {
      case 'select-cell':
        return this.session.tap(cmd.cell);
      case 'use-perk':
        return this.session.usePerk(cmd.perkId);
      case 'use-item':
        return this.session.useItem(cmd.itemId);
    }
  }
}
