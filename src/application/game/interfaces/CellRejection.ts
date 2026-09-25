/**
 * Почему касание клетки не стало ходом: `target` — заряженную способность сюда не навести,
 * `resource` — не хватает ресурса на выстрел, `range` — не достать, `melee` — маг не бьёт рукой.
 */
export type CellRejection = 'target' | 'resource' | 'range' | 'melee' | 'invalid';
