import type { Gold } from '../../../shared';

/** Что правилам урона и защиты видно о герое в бою прямо сейчас. */
export interface HeroView {
  readonly hp: number;
  readonly maxHp: number;
  readonly res: number;
  readonly resMax: number;
  /** Убито врагов в этой комнате. */
  readonly killsRoom: number;
  /** Убийств подряд (ход без убийства обнуляет). */
  readonly killStreak: number;
  /** Кошель комнаты. */
  readonly gold: Gold;
  /** Действует «защита на ход после убийства». */
  readonly killDefenseActive: boolean;
  /** Ходов подряд герой простоял на месте («Затаившийся стрелок»). */
  readonly stillTurns: number;
  /** Защита героя с учётом надбавок. */
  defense(): number;
}
