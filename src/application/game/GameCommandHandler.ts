import type { IBattleSession, TurnResult } from '../../domain/combat/room-battle';
import type { BattleCommand } from './interfaces/BattleCommand';

/**
 * Переводит намерение игрока в вызов боя. Правил игры обработчик не знает: удар это, шаг или
 * наведение способности, решают правила (`RoomBattle`), а обработчик лишь выбирает, какое действие позвать.
 *
 *   PlayerCommand → GameCommandHandler → IBattleSession → TurnResult → GameEvent[]
 */
export class GameCommandHandler {
  constructor(private readonly session: IBattleSession) {}

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
