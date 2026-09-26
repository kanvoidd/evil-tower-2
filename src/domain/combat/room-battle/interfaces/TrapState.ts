import type { AbilityDef } from '../../../catalog';
import type { CellIndex } from '../../../shared';

/**
 * Ловушка на клетке поля. «Капкан» (`armed: false`) срабатывает, когда на клетку попадает враг;
 * «Взведённая ловушка» (`armed: true`) — через `turns` ходов, чем бы ни была занята клетка.
 */
export interface TrapState {
  readonly cell: CellIndex;
  /** Чем сработает: сам «Капкан» или способность, выбранная для «Взведённой ловушки». */
  readonly ability: AbilityDef;
  readonly armed: boolean;
  /** Сколько ходов до срабатывания «Взведённой ловушки». */
  turns: number;
  /** Поставлена в этом ходу — отсчёт начнётся со следующего. */
  fresh: boolean;
}
