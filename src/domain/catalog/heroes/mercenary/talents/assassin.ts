import type { TalentTree } from '../../../talents/interfaces/TalentTree';
import { talent } from '../../../talents/talent';
import { bonus, synergy } from '../../../talents/talentEffects';

// Дерево талантов «Ассасин» (второй ступени): три яруса, в каждом — цепочки путей
// урона, здоровья и защиты. Между ярусами — способности класса (`perks` в classes/assassin.ts).
// Названия — в словарях по id таланта (`talent.<id>.name`), здесь — русское для ориентира.

export const assassinTalents: TalentTree = [
  // ярус 1
  {
    attack: [
      talent('vital_point', synergy('abilityCrit', [8, 16])), // «Уязвимая точка»
      talent('poisoned_steel', synergy('abilityPoison', [4, 8])), // «Отравленная сталь»
      talent('deadly_precision', bonus('critMul', [25, 50, 75])), // «Смертельная точность»
    ],
    vitality: [
      talent('cold_blood', bonus('bossDr', [10, 20, 30])), // «Хладная кровь»
    ],
    guard: [
      talent('stealth', bonus('firstHitDown', [15, 30, 45])), // «Скрытность»
    ],
  },
  // ярус 2
  {
    attack: [
      talent('deadly_blade', bonus('perkPower', [20, 40, 60])), // «Смертельный клинок»
    ],
    vitality: [
      talent('wiry_build', bonus('hpPct', [8, 16])), // «Жилистость»
      talent('blood_price', synergy('abilityLifesteal', [10, 20])), // «Кровавая расплата»
      talent('blood_contract', bonus('killHp', [1, 2, 3])), // «Кровавый контракт»
    ],
    guard: [
      talent('smoke_bomb', bonus('perkDef', [10, 20, 30])), // «Дымовая шашка»
    ],
  },
  // ярус 3
  {
    attack: [
      talent('agony', bonus('dmgPct', [12, 24])), // «Агония»
      talent('assassin_execution', bonus('execute', [20])), // «Казнь»
    ],
    vitality: [
      talent('shadow_cloak', bonus('startShield', [10, 20])), // «Плащ теней»
    ],
    guard: [
      talent('blade_dance', bonus('dodge', [4, 8])), // «Танец клинков»
      talent('nimble_escape', bonus('block', [5, 10])), // «Ловкий уход»
    ],
  },
];
