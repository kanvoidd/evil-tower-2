import type { BaseTree } from '../../../talents/interfaces/BaseTree';
import { talent } from '../../../talents/talent';
import { bonus, synergy } from '../../../talents/talentEffects';

// Дерево «Основа» охотника: общие характеристики героя — шесть ярусов, в каждом цепочки путей
// урона, здоровья и защиты. Ярусы 1–3 стоят как таланты базового класса, 4–6 — как второй ступени.
// Названия — в словарях по id таланта (`talent.<id>.name`), здесь — русское для ориентира.

export const archerBaseTree: BaseTree = [
  // ярус 1
  {
    attack: [
      talent('steady_hand', bonus('crit', [3, 6])), // «Твёрдая рука»
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
  // ярус 4
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
  // ярус 5
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
  // ярус 6
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
