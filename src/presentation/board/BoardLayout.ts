import type { Point } from '../animations/interfaces/Point';
import { CARD_H, CARD_W } from '../textures/Textures';

/** Геометрия поля 3×3 на экране: где центр клетки и какая клетка под пальцем. */
export class BoardLayout {
  private static readonly X0 = 46;
  private static readonly Y0 = 226;
  private static readonly GAP = 14;

  /** Центр карточки на клетке. */
  static cellPos(cell: number): Point {
    return {
      x: BoardLayout.X0 + (cell % 3) * (CARD_W + BoardLayout.GAP) + CARD_W / 2,
      y: BoardLayout.Y0 + Math.floor(cell / 3) * (CARD_H + BoardLayout.GAP) + CARD_H / 2,
    };
  }

  /** Клетка под точкой экрана; -1 — мимо поля. */
  static cellAt(px: number, py: number): number {
    const x = px - BoardLayout.X0;
    const y = py - BoardLayout.Y0;
    if (x < 0 || y < 0) return -1;
    const col = Math.floor(x / (CARD_W + BoardLayout.GAP));
    const row = Math.floor(y / (CARD_H + BoardLayout.GAP));
    if (col < 0 || col > 2 || row < 0 || row > 2) return -1;
    return row * 3 + col;
  }
}
