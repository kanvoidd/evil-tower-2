import type { TalentTree } from '../../../talents/interfaces/TalentTree';
import { talent } from '../../../talents/talent';
import { bonus, synergy } from '../../../talents/talentEffects';

// Дерево талантов «Снайпер» (финального класса): три яруса, в каждом — цепочки путей
// урона, здоровья и защиты. Между ярусами — способности класса (`perks` в classes/sniper.ts).
// Названия — в словарях по id таланта (`talent.<id>.name`), здесь — русское для ориентира.

export const sniperTalents: TalentTree = [
  // ярус 1
  {
    attack: [
      talent('shooter_breath', bonus('critMul', [15, 30])), // «Дыхание стрелка»
      talent('soft_spot', synergy('abilityCrit', [8, 16])), // «Слабая точка»
      talent('scope', bonus('critMul', [25, 50, 75])), // «Прицел»
    ],
    vitality: [
      talent('boss_head', bonus('bossHp', [5, 10, 15])), // «Голова босса»
    ],
    guard: [
      talent('composure', bonus('highHpDef', [10, 20, 30])), // «Хладнокровие»
    ],
  },
  // ярус 2
  {
    attack: [
      talent('calculation', synergy('abilityVuln', [15, 30])), // «Расчёт»
      talent('headshot', bonus('perkPower', [25, 50, 75])), // «Выстрел в голову»
    ],
    vitality: [
      talent('firm_nerves', bonus('hpPct', [8, 16])), // «Крепкие нервы»
      talent('steel_nerves', bonus('bigHitCut', [25, 50])), // «Стальные нервы»
    ],
    guard: [
      talent('kneecapper', bonus('weaken', [10, 20, 30])), // «Выстрел в колено»
    ],
  },
  // ярус 3
  {
    attack: [
      talent('the_shot', bonus('roomCrit', [1])), // «Тот самый выстрел»
    ],
    vitality: [
      talent('last_chance', bonus('revive', [25])), // «Последний шанс»
    ],
    guard: [
      talent('camouflage', bonus('firstHitDown', [12, 24])), // «Маскировка»
      talent('foxhole', bonus('def', [4, 8])), // «Окоп»
      talent('cover_position', bonus('block', [5, 10])), // «Укрытие»
    ],
  },
];
