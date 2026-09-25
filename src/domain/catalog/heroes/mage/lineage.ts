import type { LineageDef } from '../interfaces/LineageDef';

/**
 * Маг · мана. Пассивка линейки — самый большой запас ресурса и подбор артефактов;
 * рукой маг не бьёт вовсе, только заклинаниями.
 */
export const mageLineage: LineageDef = {
  id: 'mage',
  resource: 'mana',
  base: { damage: 5, crit: 5, health: 18, dodge: 0, defense: 0, parry: 0, luck: 1 },
  resMax: 14,
  resRegen: 1,
  goldBonus: 0,
  artifacts: true,
  attack: 'spell',
  // «Аварийный барьер» сжигает всю ману
  cheatDeathPrice: { drainsResource: true, goldShare: 0 },
};
