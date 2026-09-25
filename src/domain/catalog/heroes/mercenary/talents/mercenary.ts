import type { TalentTree } from '../../../talents/interfaces/TalentTree';
import { talent } from '../../../talents/talent';
import { bonus, synergy } from '../../../talents/talentEffects';

// Дерево талантов «Наёмник» (базового класса): три яруса, в каждом — цепочки путей
// урона, здоровья и защиты. Между ярусами — способности класса (`perks` в classes/mercenary.ts).
// Названия — в словарях по id таланта (`talent.<id>.name`), здесь — русское для ориентира.

export const mercenaryTalents: TalentTree = [
  // ярус 1
  {
    attack: [
      talent('spotting', synergy('abilityVuln', [10, 20])), // «Наводка»
      talent('sellsword_grip', bonus('dmgPct', [10, 20, 30])), // «Хватка наёмника»
    ],
    vitality: [
      talent('sellsword_grit', bonus('hpPct', [16, 30, 45])), // «Закалка наёмника»
    ],
    guard: [
      talent('padding', bonus('def', [2, 5])), // «Подкладка»
      talent('chainmail', bonus('def', [3, 7, 12])), // «Кольчуга»
    ],
  },
  // ярус 2
  {
    attack: [
      talent('dirty_trick', synergy('abilityStun', [10, 20])), // «Грязный приём»
      talent('practised_strike', synergy('abilityRefund', [20, 40])), // «Отработанный удар»
      talent('backstabber', bonus('perkPower', [15, 30, 45])), // «Удар в спину»
    ],
    vitality: [
      talent('rainy_day_fund', bonus('potionPct', [20, 40, 60])), // «Запас на чёрный день»
    ],
    guard: [
      talent('trophy_armour', bonus('killDefStack', [2, 4, 6])), // «Трофейный доспех»
    ],
  },
  // ярус 3
  {
    attack: [
      talent('sleeve_knife', bonus('crit', [10, 20])), // «Нож в рукаве»
    ],
    vitality: [
      talent('insurance', bonus('hpPct', [10, 20])), // «Страховка»
      talent('buy_your_life', bonus('cheatDeath', [1])), // «Откупиться»
    ],
    guard: [
      talent('haggling', bonus('armorBonus', [15, 30])), // «Торг за броню»
      talent('bought_armour', bonus('armorBonus', [25, 50])), // «Купленная броня»
    ],
  },
];
