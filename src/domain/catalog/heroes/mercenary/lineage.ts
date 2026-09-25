import type { LineageDef } from '../interfaces/LineageDef';

/** Наёмник · осмотрительность. Пассивка линейки — +20% золота. */
export const mercenaryLineage: LineageDef = {
  id: 'mercenary',
  resource: 'vigilance',
  base: { damage: 3, crit: 10, health: 22, dodge: 5, defense: 0, parry: 0, luck: 0 },
  resMax: 7,
  resRegen: 2,
  goldBonus: 0.2,
  artifacts: false,
  attack: 'backstab',
  // «Откупиться»: жизнь стоит пятой части кошеля комнаты
  cheatDeathPrice: { drainsResource: false, goldShare: 0.2 },
};
