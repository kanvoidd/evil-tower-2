import type { TalentTree } from '../../../talents/interfaces/TalentTree';
import { talent } from '../../../talents/talent';
import { bonus, synergy } from '../../../talents/talentEffects';

// Дерево талантов «Берсерк» (финального класса): три яруса, в каждом — цепочки путей
// урона, здоровья и защиты. Между ярусами — способности класса (`perks` в classes/berserk.ts).
// Названия — в словарях по id таланта (`talent.<id>.name`), здесь — русское для ориентира.

export const berserkTalents: TalentTree = [
  // ярус 1
  {
    attack: [
      talent('fury', bonus('rageDmg', [15, 30, 45])), // «Ярость»
    ],
    vitality: [
      talent('thick_bones', bonus('hpPct', [8, 16])), // «Толстые кости»
      talent('beast_sense', bonus('dodge', [3, 6])), // «Звериный нюх»
      talent('madness', bonus('block', [4, 8, 12])), // «Безумие»
    ],
    guard: [
      talent('scars', bonus('scarDef', [3, 6, 9])), // «Шрамы»
    ],
  },
  // ярус 2
  {
    attack: [
      talent('blood_for_blood', synergy('abilityLifesteal', [10, 20])), // «Кровь за кровь»
      talent('frenzy', bonus('perkPower', [25, 50, 75])), // «Неистовство»
    ],
    vitality: [
      talent('battle_experience', bonus('killHp', [1, 2, 3])), // «Боевой опыт»
    ],
    guard: [
      talent('tanned_hide', bonus('dotDr', [15, 30])), // «Дублёная кожа»
      talent('thick_skinned', bonus('dotDr', [30, 60])), // «Толстокожий»
    ],
  },
  // ярус 3
  {
    attack: [
      talent('double_strike', bonus('doubleStrike', [12, 25])), // «Двойной удар»
    ],
    vitality: [
      talent('hardiness', bonus('hpPct', [10, 20])), // «Живучесть»
      talent('pain_threshold', bonus('bigHitCut', [50])), // «Предел боли»
    ],
    guard: [
      talent('blood_rage', synergy('abilityShield', [8, 16])), // «Ярость крови»
      talent('blood_veil', bonus('perkDef', [15, 30])), // «Кровавая пелена»
    ],
  },
];
