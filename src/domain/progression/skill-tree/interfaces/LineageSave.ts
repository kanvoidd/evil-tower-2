export interface LineageSave {
  /**
   * Сколько рангов куплено у каждого узла дерева. У таланта — 0..maxRanks, у перка и класса — 0 или 1.
   * Ключ — строковый id узла (`warrior/a1`, `warrior/p2`, `cls/knight`).
   */
  ranks: Record<string, number>;
  /** Последний купленный узел — сюда переводит камеру при открытии дерева. */
  last: string;
}
