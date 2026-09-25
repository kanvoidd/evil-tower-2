import type { IBattleSession } from '../../../../domain/combat';

/** Состояние потока боя в комнате — общее для его частей. */
export class FlowState {
  /** Идёт ход или пауза перед автоприменением — новые команды ждут. */
  busy = false;
  /** Сцена открыта: после её закрытия недоигранное не продолжается. */
  alive = true;
  /** Комната закончена (победа, гибель, уход) — ходов больше нет. */
  finished = false;
  /** Забег уже подведён — итог и рекорд пишутся один раз. */
  ended = false;

  constructor(private readonly battle: IBattleSession) {}

  /** Можно принять команду игрока. */
  get idle(): boolean {
    return !this.busy && !this.finished && !this.battle.over;
  }
}
