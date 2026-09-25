import type { TalentTree } from '../../../talents/interfaces/TalentTree';
import { talent } from '../../../talents/talent';
import { bonus, synergy } from '../../../talents/talentEffects';

// Дерево талантов «Воин» (базового класса): три яруса, в каждом — цепочки путей
// урона, здоровья и защиты. Между ярусами — способности класса (`perks` в classes/warrior.ts).
// Названия — в словарях по id таланта (`talent.<id>.name`), здесь — русское для ориентира.

export const warriorTalents: TalentTree = [
  // ярус 1
  {
    attack: [
      talent('warm_up', bonus('dmgPct', [4, 8])), // «Разминка»
      talent('wide_swing', bonus('critMul', [15, 30])), // «Широкий замах»
      talent('heavy_hand', bonus('dmgPct', [10, 20, 30, 40, 50])), // «Тяжёлая рука»
    ],
    vitality: [
      talent('hardening', bonus('hpPct', [15, 28, 40])), // «Закалка»
    ],
    guard: [
      talent('thick_hide', bonus('def', [3, 7, 12])), // «Толстая шкура»
    ],
  },
  // ярус 2
  {
    attack: [
      talent('crushing_blow', bonus('perkPower', [15, 30, 45])), // «Сокрушение»
    ],
    vitality: [
      talent('second_wind', synergy('stepHeal', [2, 4])), // «Второе дыхание»
      talent('stubbornness', bonus('lowHpDr', [10, 20, 30])), // «Упорство»
    ],
    guard: [
      talent('bracers', bonus('def', [2, 4])), // «Наручи»
      talent('deflect', bonus('parry', [5, 10, 15])), // «Отбить удар»
    ],
  },
  // ярус 3
  {
    attack: [
      talent('cleave', bonus('pierce', [50])), // «Раскол»
    ],
    vitality: [
      talent('unbreakable', bonus('cheatDeath', [1])), // «Несокрушимый»
    ],
    guard: [
      talent('drill', bonus('parry', [3, 6])), // «Выучка»
      talent('tight_guard', bonus('block', [4, 8])), // «Глухая стойка»
      talent('riposte', bonus('counterBuff', [60])), // «Контрудар»
    ],
  },
];
