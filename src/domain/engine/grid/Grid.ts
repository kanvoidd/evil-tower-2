/**
 * Геометрия поля 3×3. Клетки нумеруются построчно: 0 1 2 / 3 4 5 / 6 7 8.
 * Чистые функции без состояния — ими пользуются и движок, и правила, и сцена.
 */
export class Grid {
  static readonly SIZE = 9;

  private static readonly NEIGHBORS: number[][] = Array.from({ length: 9 }, (_, i) => {
    const r = Math.floor(i / 3);
    const c = i % 3;
    const out: number[] = [];
    if (r > 0) out.push(i - 3);
    if (r < 2) out.push(i + 3);
    if (c > 0) out.push(i - 1);
    if (c < 2) out.push(i + 1);
    return out;
  });

  private static readonly DIAGONALS: number[][] = Array.from({ length: 9 }, (_, i) => {
    const r = Math.floor(i / 3);
    const c = i % 3;
    const out: number[] = [];
    for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) out.push(nr * 3 + nc);
    }
    return out;
  });

  /** Соседи крестом: вверх, вниз, влево, вправо. */
  static neighbors(cell: number): number[] {
    return Grid.NEIGHBORS[cell];
  }

  static diagonals(cell: number): number[] {
    return Grid.DIAGONALS[cell];
  }

  static row(cell: number): number {
    return Math.floor(cell / 3);
  }

  static col(cell: number): number {
    return cell % 3;
  }

  /** Сколько шагов крестом между клетками. */
  static dist(a: number, b: number): number {
    return Math.abs(Grid.row(a) - Grid.row(b)) + Math.abs(Grid.col(a) - Grid.col(b));
  }

  static sameLine(a: number, b: number): boolean {
    return Grid.row(a) === Grid.row(b) || Grid.col(a) === Grid.col(b);
  }

  /** Клетка «за» `to`, если смотреть от `from`; -1 — за ней край поля. */
  static behind(from: number, to: number): number {
    const r = Grid.row(to) + Math.sign(Grid.row(to) - Grid.row(from));
    const c = Grid.col(to) + Math.sign(Grid.col(to) - Grid.col(from));
    if (r < 0 || r > 2 || c < 0 || c > 2) return -1;
    return r * 3 + c;
  }
}
