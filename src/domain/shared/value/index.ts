/**
 * Типы значений: в собранном коде это обычные числа, но перепутать проценты с долями, золото
 * с душами или клетку с числом ходов — ошибка компиляции. Число становится значением в месте,
 * где рождается (`Gold.of(price)`), дальше тип несёт единицу измерения.
 */
export { CellIndex } from './CellIndex';
export { DayKey } from './DayKey';
export { Gold } from './Gold';
export { Percent } from './Percent';
export { Ratio } from './Ratio';
export { Souls } from './Souls';
export { Turns } from './Turns';
