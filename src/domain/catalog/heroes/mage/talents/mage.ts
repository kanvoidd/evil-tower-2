import type { TalentTree } from '../../../talents/interfaces/TalentTree';
import { talent } from '../../../talents/talent';
import { bonus, chanceAndPower, synergy } from '../../../talents/talentEffects';

// Дерево талантов «Маг» (базового класса): три яруса, в каждом — цепочки путей
// урона, здоровья и защиты. Между ярусами — способности класса (`perks` в classes/mage.ts).
// Названия — в словарях по id таланта (`talent.<id>.name`), здесь — русское для ориентира.

export const mageTalents: TalentTree = [
  // ярус 1
  {
    attack: [
      talent('spark', bonus('dmgPct', [2, 5, 8])), // «Искра»
      // второй разряд бьёт ту же цель, а не соседа
      talent(
        'forked_bolt',
        chanceAndPower('boltEcho', { chance: [8, 12, 16], power: [12, 14, 16] }),
      ), // «Раздвоение молнии»
      talent('bolt_power', bonus('lightningPower', [5, 10, 15, 20, 25])), // «Сила молнии»
    ],
    vitality: [
      talent('mana_reserve', bonus('resMaxPct', [15, 25, 35])), // «Запас маны»
    ],
    guard: [
      talent('mana_shield', bonus('manaShield', [10, 20, 30])), // «Мана-щит»
    ],
  },
  // ярус 2
  {
    attack: [
      talent('artifact_master', bonus('artifactMul', [25, 50, 75])), // «Мастер артефактов»
      talent('arcane_shot_power', bonus('shotPower', [10, 20, 30, 40, 50])), // «Сила магического выстрела»
    ],
    vitality: [
      talent('ether_step', synergy('stepHeal', [2, 4])), // «Шаг сквозь эфир»
      talent('blink', bonus('dodge', [4, 8, 12])), // «Мерцание»
    ],
    guard: [
      talent('runic_sigils', bonus('def', [2, 4, 6])), // «Рунные знаки»
      talent('runic_armour', bonus('resDef', [10, 20, 30])), // «Рунная броня»
    ],
  },
  // ярус 3
  {
    attack: [
      talent('arcane_resonance', bonus('crit', [3, 9, 12])), // «Арканный резонанс»
      talent('chain_power', bonus('chainPower', [10, 15, 20, 25, 30])), // «Сила цепной молнии»
    ],
    vitality: [
      talent('ether_flesh', bonus('hpPct', [14, 28])), // «Эфирная плоть»
      talent('emergency_ward', bonus('cheatDeath', [1])), // «Аварийный барьер»
    ],
    guard: [
      talent('mirror_shield', bonus('thorns', [25])), // «Зеркальный щит»
    ],
  },
];
