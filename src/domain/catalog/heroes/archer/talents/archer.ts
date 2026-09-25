import type { TalentTree } from '../../../talents/interfaces/TalentTree';
import { talent } from '../../../talents/talent';
import { bonus, chanceAndPower, synergy } from '../../../talents/talentEffects';

// Дерево талантов «Лучник» (базового класса): три яруса, в каждом — цепочки путей
// урона, здоровья и защиты. Между ярусами — способности класса (`perks` в classes/archer.ts).
// Названия — в словарях по id таланта (`talent.<id>.name`), здесь — русское для ориентира.

export const archerTalents: TalentTree = [
  // ярус 1
  {
    attack: [
      talent('steady_hand', bonus('crit', [3, 6])), // «Твёрдая рука»
      talent('split_tip', chanceAndPower('basicSplit', { chance: [12, 24], power: [25, 40] })), // «Двойной наконечник»
      talent('marksmanship', bonus('crit', [4, 8, 12, 16, 20])), // «Меткость»
    ],
    vitality: [
      talent('light_feet', bonus('dodge', [4, 8, 12])), // «Лёгкие ноги»
    ],
    guard: [
      talent('leather_armour', bonus('def', [3, 7, 12])), // «Кожаная броня»
    ],
  },
  // ярус 2
  {
    attack: [
      talent('precise_shot', bonus('perkPower', [15, 30, 45])), // «Точный выстрел»
    ],
    vitality: [
      talent('travel_light', synergy('stepHeal', [2, 4])), // «Бег налегке»
      talent('toughening', bonus('hpPct', [12, 24, 36])), // «Закалка»
    ],
    guard: [
      talent('archer_bracers', bonus('parry', [3, 6])), // «Наручи лучника»
      talent('arrow_parry', bonus('parry', [4, 8, 12])), // «Отбить стрелой»
    ],
  },
  // ярус 3
  {
    attack: [
      talent('draw_weight', bonus('dmgPct', [12, 24])), // «Натяжение тетивы»
      talent('finish_off', bonus('lowHpDmg', [30, 60])), // «Добить»
    ],
    vitality: [
      talent('slip_away', bonus('cheatDeath', [1])), // «Ускользнуть»
    ],
    guard: [
      talent('trophies', bonus('killDefStack', [2, 4])), // «Трофеи»
      talent('hunting_trophy', bonus('killDefTurn', [20, 40])), // «Охотничий трофей»
    ],
  },
];
