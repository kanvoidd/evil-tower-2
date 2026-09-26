import type { BaseTree } from '../../../talents/interfaces/BaseTree';
import { talent } from '../../../talents/talent';
import { bonus, synergy } from '../../../talents/talentEffects';

// Дерево «Основа» мага: общие характеристики героя — шесть ярусов, в каждом цепочки путей
// урона, здоровья и защиты. Ярусы 1–3 стоят как таланты базового класса, 4–6 — как второй ступени.
// Названия — в словарях по id таланта (`talent.<id>.name`), здесь — русское для ориентира.

export const mageBaseTree: BaseTree = [
  // ярус 1
  {
    attack: [
      talent('spark', bonus('dmgPct', [2, 5, 8])), // «Искра»
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
    ],
    vitality: [
      talent('ether_flesh', bonus('hpPct', [14, 28])), // «Эфирная плоть»
      talent('emergency_ward', bonus('cheatDeath', [1])), // «Аварийный барьер»
    ],
    guard: [
      talent('mirror_shield', bonus('thorns', [25])), // «Зеркальный щит»
    ],
  },
  // ярус 4
  {
    attack: [
      talent('spell_echo', synergy('abilitySplash', [15, 30])), // «Эхо заклинания»
      talent('twin_cast', bonus('doubleStrike', [10, 20, 30])), // «Двойное заклинание»
    ],
    vitality: [
      talent('ethereal_skin', bonus('hpPct', [8, 16])), // «Эфирная кожа»
      talent('ethereal_body', bonus('hpPct', [16, 30, 45])), // «Эфирное тело»
    ],
    guard: [
      talent('antimagic', bonus('magicDr', [10, 20, 30])), // «Антимагия»
    ],
  },
  // ярус 5
  {
    attack: [
      talent('mana_thrift', synergy('perkCostDown', [1])), // «Экономия маны»
      talent('swift_cast', synergy('abilityRefund', [20, 40])), // «Быстрый каст»
      talent('higher_art', bonus('perkPower', [20, 40, 60])), // «Высшее искусство»
    ],
    vitality: [
      talent('foresight', bonus('firstHitDown', [15, 30, 45])), // «Предвидение»
    ],
    guard: [
      talent('counterspell', bonus('parry', [5, 10, 15])), // «Контрзаклинание»
    ],
  },
  // ярус 6
  {
    attack: [
      talent('silent_cast', bonus('freePerk', [1])), // «Безмолвный каст»
    ],
    vitality: [
      talent('philosopher_stone', bonus('potionPct', [30, 60])), // «Философский камень»
    ],
    guard: [
      talent('mind_shield', synergy('abilityShield', [6, 12])), // «Щит разума»
      talent('barrier_of_will', bonus('block', [4, 8])), // «Барьер воли»
      talent('absolute_ward', bonus('perkDef', [25, 50])), // «Абсолютная защита»
    ],
  },
];
