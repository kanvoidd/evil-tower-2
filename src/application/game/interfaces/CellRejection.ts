/**
 * Почему касание клетки не стало ходом: `target` — заряженную способность сюда не навести,
 * `resource` — не хватает ресурса на выстрел, `range` — не достать, `melee` — рукой не достать.
 */
export type CellRejection = 'target' | 'resource' | 'range' | 'melee' | 'invalid';
