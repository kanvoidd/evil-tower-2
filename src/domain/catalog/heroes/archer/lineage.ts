import type { LineageDef } from '../interfaces/LineageDef';

/** Лучник · концентрация. Пассивка линейки — самый высокий шанс крита. */
export const archerLineage: LineageDef = {
  id: 'archer',
  resource: 'concentration',
  base: { damage: 3, crit: 18, health: 22, dodge: 4, defense: 0, parry: 0, luck: 0 },
  resMax: 7,
  resRegen: 2,
  goldBonus: 0,
  artifacts: false,
  attack: 'shot',
  cheatDeathPrice: { drainsResource: false, goldShare: 0 },
};
