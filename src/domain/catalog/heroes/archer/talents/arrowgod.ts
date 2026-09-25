import type { TalentTree } from '../../../talents/interfaces/TalentTree';
import { talent } from '../../../talents/talent';
import { bonus, synergy } from '../../../talents/talentEffects';

// Дерево талантов «Бог стрел» (финального класса): три яруса, в каждом — цепочки путей
// урона, здоровья и защиты. Между ярусами — способности класса (`perks` в classes/arrowgod.ts).
// Названия — в словарях по id таланта (`talent.<id>.name`), здесь — русское для ориентира.

export const arrowgodTalents: TalentTree = [
  // ярус 1
  {
    attack: [
      talent('swift_string', synergy('abilityRefund', [15, 30])), // «Быстрая тетива»
      talent('arrow_hail', bonus('doubleStrike', [10, 20, 30])), // «Град стрел»
    ],
    vitality: [
      talent('heroic_flesh', bonus('hpPct', [8, 16])), // «Плоть героя»
      talent('divine_endurance', bonus('hpPct', [16, 30, 45])), // «Божественная стойкость»
    ],
    guard: [
      talent('heavenly_veil', bonus('magicDr', [10, 20, 30])), // «Небесный покров»
    ],
  },
  // ярус 2
  {
    attack: [
      talent('arrow_shower', bonus('perkPower', [25, 50, 75])), // «Дождь стрел»
    ],
    vitality: [
      talent('star_shield', bonus('startShield', [8, 15, 22])), // «Звёздный щит»
    ],
    guard: [
      talent('fletching', bonus('def', [3, 6])), // «Оперение»
      talent('return_volley', bonus('thorns', [10, 20])), // «Ответный залп»
      talent('arrows_of_retribution', bonus('thorns', [15, 30, 45])), // «Стрелы возмездия»
    ],
  },
  // ярус 3
  {
    attack: [
      talent('blessed_bow', synergy('abilityCrit', [8, 16])), // «Благословение лука»
      talent('volley', synergy('abilitySplash', [20, 40])), // «Залп»
      talent('divine_shot', bonus('freePerk', [1])), // «Божественный выстрел»
    ],
    vitality: [
      talent('gift_of_the_gods', bonus('potionPct', [30, 60])), // «Дар богов»
    ],
    guard: [
      talent('will_of_the_gods', bonus('perkDef', [25, 50])), // «Воля богов»
    ],
  },
];
