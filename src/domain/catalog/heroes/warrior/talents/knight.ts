import type { TalentTree } from '../../../talents/interfaces/TalentTree';
import { talent } from '../../../talents/talent';
import { bonus, synergy } from '../../../talents/talentEffects';

// Дерево талантов «Рыцарь» (второй ступени): три яруса, в каждом — цепочки путей
// урона, здоровья и защиты. Между ярусами — способности класса (`perks` в classes/knight.ts).
// Названия — в словарях по id таланта (`talent.<id>.name`), здесь — русское для ориентира.

export const knightTalents: TalentTree = [
  // ярус 1
  {
    attack: [
      talent('iron_boss', synergy('abilityStun', [10, 20])), // «Окованный умбон»
      talent('shield_strike', bonus('defDmg', [25, 50, 75])), // «Удар щитом»
    ],
    vitality: [
      talent('oath', bonus('hpPct', [10, 20])), // «Обет»
      talent('fortitude', bonus('bossDr', [10, 20, 30])), // «Стойкость»
    ],
    guard: [
      talent('plate_armour', bonus('armorBonus', [15, 30, 45])), // «Латы»
    ],
  },
  // ярус 2
  {
    attack: [
      talent('knightly_duty', bonus('perkPower', [20, 40, 60])), // «Рыцарский долг»
    ],
    vitality: [
      talent('barrier', bonus('startShield', [8, 15, 22])), // «Барьер»
    ],
    guard: [
      talent('pauldrons', bonus('def', [3, 6])), // «Наплечники»
      talent('turned_lunge', bonus('thorns', [10, 20])), // «Отражённый выпад»
      talent('steel_spikes', bonus('thorns', [15, 30, 45])), // «Стальные шипы»
    ],
  },
  // ярус 3
  {
    attack: [
      talent('tourney_lessons', bonus('critMul', [20, 40])), // «Турнирный опыт»
      talent('onslaught', synergy('abilitySplash', [20, 40])), // «Натиск»
      talent('knight_lunge', bonus('critMul', [40, 80])), // «Рыцарский выпад»
    ],
    vitality: [
      talent('victor_glory', bonus('bossHp', [6, 12])), // «Слава победителя»
    ],
    guard: [
      talent('unyielding_wall', bonus('roomGuard', [100])), // «Несгибаемая стена»
    ],
  },
];
