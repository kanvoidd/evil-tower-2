import type { LineageDef } from '../interfaces/LineageDef';

/**
 * Маг · мана. Пассивка линейки — самый большой запас ресурса и подбор артефактов. Рукой маг бьёт,
 * как и все, а его сила — заклинания подкласса: элементалиста, арканиста или чернокнижника.
 */
export const mageLineage: LineageDef = {
  id: 'mage',
  resource: 'mana',
  base: { damage: 5, crit: 5, health: 18, dodge: 0, defense: 0, parry: 0, luck: 1 },
  resMax: 14,
  resRegen: 1,
  goldBonus: 0,
  artifacts: true,
  attack: 'hand',
  // «Аварийный барьер» сжигает всю ману
  cheatDeathPrice: { drainsResource: true, goldShare: 0 },
};
