import type { TalentTree } from '../../../talents/interfaces/TalentTree';
import { talent } from '../../../talents/talent';
import { bonus, chanceAndPower, synergy } from '../../../talents/talentEffects';

// Дерево талантов «Ниндзя» (финального класса): три яруса, в каждом — цепочки путей
// урона, здоровья и защиты. Между ярусами — способности класса (`perks` в classes/ninja.ts).
// Названия — в словарях по id таланта (`talent.<id>.name`), здесь — русское для ориентира.

export const ninjaTalents: TalentTree = [
  // ярус 1
  {
    attack: [
      talent('stance', bonus('dmgPct', [6, 12])), // «Стойка»
      talent('hidden_throw', chanceAndPower('basicSplit', { chance: [12, 24], power: [25, 40] })), // «Скрытый бросок»
      talent('way_of_the_blade', bonus('dmgPct', [10, 20, 30, 40, 50])), // «Путь клинка»
    ],
    vitality: [
      talent('wind_shadow', bonus('dodge', [5, 10, 15])), // «Тень ветра»
    ],
    guard: [
      talent('crane_stance', bonus('parry', [5, 10, 15])), // «Стойка журавля»
    ],
  },
  // ярус 2
  {
    attack: [
      talent('wind_breath', synergy('perkCostDown', [1])), // «Дыхание ветра»
      talent('blade_shadow', bonus('perkPower', [25, 50, 75])), // «Тень клинка»
    ],
    vitality: [
      talent('lightness', synergy('stepHeal', [2, 4])), // «Лёгкость»
      talent('tempered_body', bonus('hpPct', [12, 24, 36])), // «Закалённое тело»
    ],
    guard: [
      talent('ki_barrier', bonus('resDef', [10, 20, 30])), // «Ки-барьер»
    ],
  },
  // ярус 3
  {
    attack: [
      talent('instant_execution', bonus('freePerk', [1])), // «Мгновенное исполнение»
    ],
    vitality: [
      talent('vanish', bonus('cheatDeath', [1])), // «Исчезновение»
    ],
    guard: [
      talent('deflection', bonus('thorns', [10, 20])), // «Отражение»
      talent('sway', bonus('dodge', [4, 8])), // «Уклон»
      talent('return_shuriken', bonus('thorns', [25, 50])), // «Ответный сюрикен»
    ],
  },
];
