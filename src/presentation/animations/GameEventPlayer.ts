import type { IAnimationPlayer } from '../../application/game/interfaces/IAnimationPlayer';
import type { GameEvent } from '../../domain/combat';
import { EVENT_HANDLERS } from './event-handlers/eventHandlers';
import type { EventStage } from './event-handlers/interfaces/EventStage';

/** Обработчик события без привязки к типу — для разбора журнала по реестру. */
type AnyHandler = (ev: GameEvent, stage: EventStage, deal: boolean) => void | Promise<void>;

/**
 * Проигрыватель событий боя. Бой ничего не рисует сам: он отдаёт журнал событий, а проигрыватель
 * по порядку показывает каждое обработчиком из реестра (`EVENT_HANDLERS`, группы — бой, движение,
 * добыча, эффекты): анимацией, звуком, всплывающей подписью и обновлением панелей.
 *
 *   RoomBattle → GameEvent[] → GameEventPlayer → EVENT_HANDLERS → Animations / BoardView / HUD
 *
 * Состояние боя обработчики только читают — например, чтобы показать, что героя уже добивают.
 */
export class GameEventPlayer implements IAnimationPlayer {
  private alive = true;

  /** `stage` — бой (только чтение), поле, анимации, HUD, звук и часы сцены. */
  constructor(private readonly stage: EventStage) {}

  /** Сцена закрывается: недоигранные события больше не показываем. */
  stop(): void {
    this.alive = false;
  }

  /** Показать события по порядку. `deal` — первая раздача: карты выкладываются со звуком и паузой. */
  async play(events: readonly GameEvent[], o: { deal?: boolean } = {}): Promise<void> {
    for (const ev of events) {
      if (!this.alive) return;
      await (EVENT_HANDLERS[ev.type] as AnyHandler)(ev, this.stage, !!o.deal);
    }
    await this.stage.anims.motion.settled();
  }
}
