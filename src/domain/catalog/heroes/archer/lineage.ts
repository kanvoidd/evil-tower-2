import type { LineageDef } from '../interfaces/LineageDef';

/**
 * Охотник · концентрация. Пассивка линейки — самый высокий шанс крита. Рукой охотник бьёт,
 * как и все; дальний выстрел, звери и ловушки — у подклассов.
 */
export const archerLineage: LineageDef = {
  id: 'archer',
  resource: 'concentration',
  base: { damage: 3, crit: 18, health: 22, dodge: 4, defense: 0, parry: 0, luck: 0 },
  resMax: 7,
  resRegen: 2,
  goldBonus: 0,
  artifacts: false,
  attack: 'hand',
  cheatDeathPrice: { drainsResource: false, goldShare: 0 },
};
