import type { LineageId, ResourceKind, Stats } from '../../../types';

export interface LineageDef {
  id: LineageId;
  resource: ResourceKind;
  /** Базовые характеристики до прокачки. */
  base: Stats;
  resMax: number;
  resRegen: number;
  /**
   * Пассивное умение линейки (в дополнение к «выдающейся» характеристике):
   * наёмник берёт больше золота, маг подбирает артефакты.
   */
  goldBonus: number;
  artifacts: boolean;
  /**
   * Может ли герой бить рукой по нажатию на соседнего врага.
   * У линейки мага — нет: он вообще не бьёт обычным ударом, только заклинаниями по кнопке.
   */
  melee: boolean;
}
