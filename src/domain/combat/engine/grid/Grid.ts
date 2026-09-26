import { CellIndex } from '../../../shared';

/**
 * Геометрия поля 3×3. Клетки нумеруются построчно: 0 1 2 / 3 4 5 / 6 7 8.
 * Чистые функции без состояния — ими пользуются и движок, и правила, и сцена.
 */
export class Grid {
  /** Сторона поля в клетках. */
  static readonly SIDE = 3;
  static readonly SIZE = Grid.SIDE * Grid.SIDE;
  /** Центр поля — с него герой начинает комнату. */
  static readonly CENTER: CellIndex = CellIndex.of((Grid.SIZE - 1) / 2);

  /** «Нет клетки»: за целью край поля, способность без цели, удар не от врага. */
  static readonly NO_CELL: CellIndex = CellIndex.of(-1);

  /** Все клетки поля по порядку: 0 … 8. */
  static readonly CELLS: readonly CellIndex[] = Array.from({ length: Grid.SIZE }, (_, i) =>
    CellIndex.of(i),
  );

  private static readonly NEIGHBORS: CellIndex[][] = Grid.CELLS.map((i) => {
    const r = Grid.row(i);
    const c = Grid.col(i);
    const out: CellIndex[] = [];
    if (r > 0) out.push(CellIndex.of(i - Grid.SIDE));
    if (r < Grid.SIDE - 1) out.push(CellIndex.of(i + Grid.SIDE));
    if (c > 0) out.push(CellIndex.of(i - 1));
    if (c < Grid.SIDE - 1) out.push(CellIndex.of(i + 1));
    return out;
  });

  private static readonly DIAGONALS: CellIndex[][] = Grid.CELLS.map((i) => {
    const r = Grid.row(i);
    const c = Grid.col(i);
    const out: CellIndex[] = [];
    for (const [dr, dc] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]) {
      const nr = r + dr;
      const nc = c + dc;
      if (Grid.inside(nr, nc)) out.push(Grid.at(nr, nc));
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
    return Math.floor(cell / Grid.SIDE);
  }

  static col(cell: CellIndex): number {
    return cell % Grid.SIDE;
  }

  /** Клетка на пересечении строки и столбца. */
  static at(row: number, col: number): CellIndex {
    return CellIndex.of(row * Grid.SIDE + col);
  }

  /** Строка и столбец внутри поля. */
  static inside(row: number, col: number): boolean {
    return row >= 0 && row < Grid.SIDE && col >= 0 && col < Grid.SIDE;
  }

  /** Сколько шагов крестом между клетками. */
  static dist(a: CellIndex, b: CellIndex): number {
    return Math.abs(Grid.row(a) - Grid.row(b)) + Math.abs(Grid.col(a) - Grid.col(b));
  }

  static sameLine(a: CellIndex, b: CellIndex): boolean {
    return Grid.row(a) === Grid.row(b) || Grid.col(a) === Grid.col(b);
  }

  /**
   * Луч от `from` в сторону `toward` (та же строка или столбец): клетки по порядку до края поля,
   * без самой `from`. Не на одной линии — пусто.
   */
  static ray(from: CellIndex, toward: CellIndex): CellIndex[] {
    if (from === toward || !Grid.sameLine(from, toward)) return [];
    const dr = Math.sign(Grid.row(toward) - Grid.row(from));
    const dc = Math.sign(Grid.col(toward) - Grid.col(from));
    const out: CellIndex[] = [];
    for (let r = Grid.row(from) + dr, c = Grid.col(from) + dc; Grid.inside(r, c); r += dr, c += dc)
      out.push(Grid.at(r, c));
    return out;
  }

  /** Клетка «за» `to`, если смотреть от `from`; `NO_CELL` — за ней край поля. */
  static behind(from: CellIndex, to: CellIndex): CellIndex {
    const r = Grid.row(to) + Math.sign(Grid.row(to) - Grid.row(from));
    const c = Grid.col(to) + Math.sign(Grid.col(to) - Grid.col(from));
    return Grid.inside(r, c) ? Grid.at(r, c) : Grid.NO_CELL;
  }
}
