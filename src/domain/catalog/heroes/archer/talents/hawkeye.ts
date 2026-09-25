import type { TalentTree } from '../../../talents/interfaces/TalentTree';
import { talent } from '../../../talents/talent';
import { bonus, synergy } from '../../../talents/talentEffects';

// Дерево талантов «Соколиный глаз» (второй ступени): три яруса, в каждом — цепочки путей
// урона, здоровья и защиты. Между ярусами — способности класса (`perks` в classes/hawkeye.ts).
// Названия — в словарях по id таланта (`talent.<id>.name`), здесь — русское для ориентира.

export const hawkeyeTalents: TalentTree = [
  // ярус 1
  {
    attack: [
      talent('keen_eye', bonus('fullHpDmg', [15, 30, 45])), // «Зоркий глаз»
    ],
    vitality: [
      talent('even_breath', bonus('hpPct', [8, 16])), // «Ровное дыхание»
      talent('instinct', bonus('lowHpDr', [10, 20, 30])), // «Инстинкт»
    ],
    guard: [
      talent('hide_curing', bonus('def', [3, 6])), // «Выделка кож»
      talent('tanner_craft', bonus('armorBonus', [15, 30, 45])), // «Кожевенное мастерство»
    ],
  },
  // ярус 2
  {
    attack: [
      talent('shot_power', bonus('dmgPct', [10, 20])), // «Сила выстрела»
      talent('falconer', synergy('abilityStun', [10, 20])), // «Сокольничий»
      talent('measured_shot', bonus('perkPower', [20, 40, 60])), // «Выверенный выстрел»
    ],
    vitality: [
      talent('quarry', bonus('killHp', [1, 2, 3])), // «Добыча»
    ],
    guard: [
      talent('cover', bonus('firstHitDown', [15, 30, 45])), // «Прикрытие»
    ],
  },
  // ярус 3
  {
    attack: [
      talent('armour_piercers', bonus('pierce', [15])), // «Бронебойные наконечники»
      talent('penetration', bonus('pierce', [50])), // «Пробивание»
    ],
    vitality: [
      talent('hunter_breath', bonus('potionPct', [20, 40])), // «Дыхание охотника»
      talent('caution', bonus('bossDr', [15, 30])), // «Осторожность»
    ],
    guard: [
      talent('guardian_falcon', bonus('roomGuard', [100])), // «Сокол-хранитель»
    ],
  },
];
