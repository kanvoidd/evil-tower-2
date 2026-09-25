import type { Card } from '../../card/Card';
import type { GameEvent } from '../../events';
import type { EngineSnapshot } from './EngineSnapshot';

/**
 * Низкоуровневые команды боя. Движок знает только поле 3×3, колоду и журнал событий:
 * он ставит и снимает карты, двигает героя и доливает освободившиеся клетки. Что такое
 * урон, перки или враги, он не знает — это решают правила (`Run`), и отдают ему команды.
 *
 * Команды, которые меняют поле на виду у игрока, сами пишут своё событие в журнал
 * (`spawn`, `remove`, `swap`, `move`), остальные события пишут правила через `emit`.
 */
export interface IEngine {
  /** Клетки поля; `null` — пусто. Клетка героя всегда пуста. */
  readonly board: Array<Card | null>;
  /** Колода: первой тянется карта с начала. */
  readonly deck: Card[];
  playerCell: number;

  // ---- поле
  /** Положить карту на клетку (событие `spawn`). */
  put(cell: number, card: Card): void;
  /** Снять карту без события — её уход правила объявят сами (например, `kill`). */
  clear(cell: number): Card | null;
  /** Убрать карту с поля (событие `remove`). */
  discard(cell: number): void;
  /** Поменять содержимое двух клеток (событие `swap`). */
  swap(a: number, b: number): void;
  /** Шаг героя на клетку (событие `move`); клетка, откуда он ушёл, освобождается. */
  moveHero(to: number): void;

  // ---- колода
  /** Вытянуть верхнюю карту колоды. */
  draw(): Card | undefined;
  /** Отметить клетку освободившейся: в конце хода на неё придёт новая карта. */
  vacate(cell: number): void;
  /** Забыть освободившиеся клетки (начало хода). */
  resetVacated(): void;
  /** Разложить колоду на освободившиеся клетки. */
  refill(): void;

  // ---- журнал событий
  emit(ev: GameEvent): void;
  /** Текущая длина журнала — чтобы потом вставить событие перед уже записанными. */
  mark(): number;
  since(mark: number): GameEvent[];
  insert(mark: number, ev: GameEvent): void;
  /** Забрать накопленные события и очистить журнал. */
  flush(): GameEvent[];

  // ---- снимок
  capture(): EngineSnapshot;
  restore(s: EngineSnapshot): void;
}
