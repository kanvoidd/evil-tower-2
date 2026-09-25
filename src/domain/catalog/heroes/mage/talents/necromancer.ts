import type { TalentTree } from '../../../talents/interfaces/TalentTree';
import { talent } from '../../../talents/talent';
import { bonus, synergy } from '../../../talents/talentEffects';

// Дерево талантов «Некромант» (финального класса): три яруса, в каждом — цепочки путей
// урона, здоровья и защиты. Между ярусами — способности класса (`perks` в classes/necromancer.ts).
// Названия — в словарях по id таланта (`talent.<id>.name`), здесь — русское для ориентира.

export const necromancerTalents: TalentTree = [
  // ярус 1
  {
    attack: [
      talent('decay', synergy('abilityPoison', [4, 8])), // «Тлен»
      talent('flesh_burst', synergy('killBlast', [15, 30])), // «Взрыв плоти»
      talent('soul_harvest', bonus('killDmg', [2, 4, 6])), // «Жатва душ»
    ],
    vitality: [
      talent('bone_armour', bonus('startShield', [10, 20, 30])), // «Костяной доспех»
    ],
    guard: [
      talent('curse_of_weakness', bonus('weaken', [10, 20, 30])), // «Проклятие слабости»
    ],
  },
  // ярус 2
  {
    attack: [
      talent('necrosis', bonus('perkPower', [25, 50, 75])), // «Некрозис»
    ],
    vitality: [
      talent('dark_flesh', bonus('hpPct', [8, 16])), // «Тёмная плоть»
      talent('life_theft', synergy('abilityLifesteal', [10, 20])), // «Кража жизни»
      talent('soul_collector', bonus('killHp', [1, 2, 3])), // «Собиратель душ»
    ],
    guard: [
      talent('numbness', bonus('dotDr', [20, 40, 60])), // «Нечувствительность»
    ],
  },
  // ярус 3
  {
    attack: [
      talent('seal_of_death', synergy('abilityVuln', [15, 30])), // «Печать смерти»
      talent('necromancer_execution', bonus('execute', [20])), // «Казнь»
    ],
    vitality: [
      talent('return', bonus('revive', [30])), // «Возвращение»
    ],
    guard: [
      talent('shroud', bonus('magicDr', [8, 16])), // «Саван»
      talent('cursed_armour', bonus('killDefTurn', [20, 40])), // «Проклятая броня»
    ],
  },
];
