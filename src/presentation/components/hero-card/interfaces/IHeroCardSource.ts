import type { PlayerStats } from '../../../../domain/progression/stats/stats';
import type { ClassId, EquipmentSave } from '../../../../domain/types';

/** Что показывает карточка героя: класс, характеристики и надетое снаряжение. */
export interface IHeroCardSource {
  readonly activeClass: ClassId;
  playerStats(): PlayerStats;
  equipped(slot: 'weapon' | 'armor'): EquipmentSave | null;
}
