import { CellIndex } from '../../../shared';

/**
 * Геометрия поля 3×3. Клетки нумеруются построчно: 0 1 2 / 3 4 5 / 6 7 8.
 * Чистые функции без состояния — ими пользуются и движок, и правила, и сцена.
 */
export class Grid {
  static readonly SIZE = 9;

  /** «Нет клетки»: за целью край поля, способность без цели, удар не от врага. */
  static readonly NO_CELL: CellIndex = CellIndex.of(-1);

  /** Все клетки поля по порядку: 0 … 8. */
  static readonly CELLS: readonly CellIndex[] = Array.from({ length: 9 }, (_, i) =>
    CellIndex.of(i),
  );

  private static readonly NEIGHBORS: CellIndex[][] = Array.from({ length: 9 }, (_, i) => {
    const r = Math.floor(i / 3);
    const c = i % 3;
    const out: CellIndex[] = [];
    if (r > 0) out.push(CellIndex.of(i - 3));
    if (r < 2) out.push(CellIndex.of(i + 3));
    if (c > 0) out.push(CellIndex.of(i - 1));
    if (c < 2) out.push(CellIndex.of(i + 1));
    return out;
  });

  private static readonly DIAGONALS: CellIndex[][] = Array.from({ length: 9 }, (_, i) => {
    const r = Math.floor(i / 3);
    const c = i % 3;
    const out: CellIndex[] = [];
    for (const [dr, dc] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) out.push(CellIndex.of(nr * 3 + nc));
    }
    return out;
  });

  /** Соседи крестом: вверх, вниз, влево, вправо. */
  static neighbors(cell: CellIndex): CellIndex[] {
    return Grid.NEIGHBORS[cell];
  }

  static diagonals(cell: CellIndex): CellIndex[] {
    return Grid.DIAGONALS[cell];
  }

  static row(cell: CellIndex): number {
    return Math.floor(cell / 3);
  }

  static col(cell: CellIndex): number {
    return cell % 3;
  }

  /** Сколько шагов крестом между клетками. */
  static dist(a: CellIndex, b: CellIndex): number {
    return Math.abs(Grid.row(a) - Grid.row(b)) + Math.abs(Grid.col(a) - Grid.col(b));
  }

  static sameLine(a: CellIndex, b: CellIndex): boolean {
    return Grid.row(a) === Grid.row(b) || Grid.col(a) === Grid.col(b);
  }

  /** Клетка «за» `to`, если смотреть от `from`; `NO_CELL` — за ней край поля. */
  static behind(from: CellIndex, to: CellIndex): CellIndex {
    const r = Grid.row(to) + Math.sign(Grid.row(to) - Grid.row(from));
    const c = Grid.col(to) + Math.sign(Grid.col(to) - Grid.col(from));
    if (r < 0 || r > 2 || c < 0 || c > 2) return Grid.NO_CELL;
    return CellIndex.of(r * 3 + c);
  }
}
