import type { TalentTree } from '../../../talents/interfaces/TalentTree';
import { talent } from '../../../talents/talent';
import { bonus, synergy } from '../../../talents/talentEffects';

// Дерево талантов «Паладин» (финального класса): три яруса, в каждом — цепочки путей
// урона, здоровья и защиты. Между ярусами — способности класса (`perks` в classes/paladin.ts).
// Названия — в словарях по id таланта (`talent.<id>.name`), здесь — русское для ориентира.

export const paladinTalents: TalentTree = [
  // ярус 1
  {
    attack: [
      talent('sacred_wrath', bonus('bossDmg', [15, 30, 45])), // «Священный гнев»
    ],
    vitality: [
      talent('light_of_life', bonus('hpPct', [12, 24, 36])), // «Свет жизни»
    ],
    guard: [
      talent('prayer', bonus('magicDr', [6, 12])), // «Молитва»
      talent('shield_of_faith', synergy('abilityShield', [6, 12])), // «Щит веры»
      talent('holy_guard', bonus('magicDr', [10, 20, 30])), // «Святая защита»
    ],
  },
  // ярус 2
  {
    attack: [
      talent('hand_of_judgement', synergy('abilityStun', [12, 24])), // «Длань суда»
      talent('punishing_light', bonus('perkPower', [25, 50, 75])), // «Карающий свет»
    ],
    vitality: [
      talent('grace', bonus('potionPct', [20, 40])), // «Благодать»
      talent('halo', bonus('firstHitDown', [15, 30, 45])), // «Ореол»
    ],
    guard: [
      talent('vow_of_meekness', bonus('weaken', [10, 20, 30])), // «Обет кротости»
    ],
  },
  // ярус 3
  {
    attack: [
      talent('retribution', bonus('critMul', [20, 40])), // «Возмездие»
      talent('light_of_truth', synergy('abilitySplash', [25, 50])), // «Свет истины»
      talent('judgement', bonus('everyThird', [100])), // «Суд»
    ],
    vitality: [
      talent('consecration', bonus('healShield', [25])), // «Освящение»
    ],
    guard: [
      talent('bulwark', bonus('highHpDef', [15, 30])), // «Оплот»
    ],
  },
];
