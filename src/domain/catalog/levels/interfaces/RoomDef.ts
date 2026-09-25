import type { Gold, Souls } from '../../../shared';
/**
 * Комната задаётся не списком врагов, а «рецептом»: пул врагов этажа и разброс количества.
 * Настоящий состав набирается заново при каждом заходе (`rollRoom`), поэтому одна и та же
 * комната каждый раз играется по-новому — это и есть рогаликовая часть.
 */
export interface RoomDef {
  /** "этаж-номер", например "2-3". */
  id: string;
  floor: number;
  index: number;
  boss: boolean;
  /** Из кого набирается состав. */
  pool: string[];
  /** Сколько обычных врагов (без босса). */
  count: [number, number];
  gold: [number, number];
  chests: [number, number];
  heal: [number, number];
  regen: [number, number];
  /** Множитель денежных наград на этой комнате. */
  goldScale: number;
  /** Премия за прохождение комнаты — платится в каждом забеге. */
  clearGold: Gold;
  clearSouls: Souls;
}
