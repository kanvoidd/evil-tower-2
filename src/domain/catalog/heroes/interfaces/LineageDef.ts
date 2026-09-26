import type { AttackStyleId } from './AttackStyleId';
import type { CheatDeathPrice } from './CheatDeathPrice';
import type { LineageId } from './LineageId';
import type { ResourceKind } from './ResourceKind';
import type { Stats } from './Stats';

export interface LineageDef {
  id: LineageId;
  resource: ResourceKind;
  /** Базовые характеристики до прокачки. */
  base: Stats;
  resMax: number;
  resRegen: number;
  /**
   * Пассивное умение линейки (в дополнение к «выдающейся» характеристике):
   * наёмник берёт больше золота, маг подбирает артефакты (сейчас выключены).
   */
  goldBonus: number;
  artifacts: boolean;
  /**
   * Стиль боя: бьёт ли герой рукой и чем достаёт дальнего врага. У линейки мага рукой не бьёт
   * никто — только заклинаниями по кнопке. Каталог называет стиль по id, а как он работает,
   * решает бой (`ATTACK_STRATEGIES` в `combat/attack`).
   */
  attack: AttackStyleId;
  /** Чем платит линейка, когда талант спасает героя от смерти. */
  cheatDeathPrice: CheatDeathPrice;
}
