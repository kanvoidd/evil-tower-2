import type { LineageDef } from '../interfaces/LineageDef';

/** Воин · выносливость. Пассивка линейки — самый большой запас здоровья. */
export const warriorLineage: LineageDef = {
  id: 'warrior',
  resource: 'stamina',
  base: { damage: 3, crit: 5, health: 30, dodge: 0, defense: 1, parry: 0, luck: 0 },
  resMax: 10,
  resRegen: 1,
  goldBonus: 0,
  artifacts: false,
  attack: 'hand',
  cheatDeathPrice: { drainsResource: false, goldShare: 0 },
};
