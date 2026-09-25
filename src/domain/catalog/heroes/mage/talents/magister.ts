import type { TalentTree } from '../../../talents/interfaces/TalentTree';
import { talent } from '../../../talents/talent';
import { bonus, synergy } from '../../../talents/talentEffects';

// Дерево талантов «Магистр» (второй ступени): три яруса, в каждом — цепочки путей
// урона, здоровья и защиты. Между ярусами — способности класса (`perks` в classes/magister.ts).
// Названия — в словарях по id таланта (`talent.<id>.name`), здесь — русское для ориентира.

export const magisterTalents: TalentTree = [
  // ярус 1
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
  // ярус 2
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
  // ярус 3
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
