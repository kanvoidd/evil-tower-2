import type { IAttackStrategy } from '../../../logic/hero/attack/interfaces/IAttackStrategy';
import type { LineageId, ResourceKind, Stats } from '../../../types';
import type { CheatDeathPrice } from './CheatDeathPrice';

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
   * Стиль боя: бьёт ли герой рукой и чем достаёт дальнего врага. У линейки мага рукой не бьёт
   * никто — только заклинаниями по кнопке.
   */
  attack: IAttackStrategy;
  /** Чем платит линейка, когда талант спасает героя от смерти. */
  cheatDeathPrice: CheatDeathPrice;
}
