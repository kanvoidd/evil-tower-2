/** Что произойдёт при нажатии на клетку (для подсветки и подсказок). */
export type Action =
  | { kind: 'melee' }
  | { kind: 'move' }
  | { kind: 'ranged' }
  | { kind: 'perk' }
  | { kind: 'none'; reason: 'invalid' | 'resource' | 'range' | 'melee' };
