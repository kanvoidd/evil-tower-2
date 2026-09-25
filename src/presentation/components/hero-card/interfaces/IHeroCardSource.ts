import type { ClassId, EquipmentSave } from '../../../../domain/catalog';
import type { PlayerStats } from '../../../../domain/combat';

/** Что показывает карточка героя: класс, характеристики и надетое снаряжение. */
export interface IHeroCardSource {
  readonly activeClass: ClassId;
  playerStats(): PlayerStats;
  equipped(slot: 'weapon' | 'armor'): EquipmentSave | null;
}
