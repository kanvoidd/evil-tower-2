import type { TalentTree } from '../../../talents/interfaces/TalentTree';
import { talent } from '../../../talents/talent';
import { bonus, synergy } from '../../../talents/talentEffects';

// Дерево талантов «Пиромант» (финального класса): три яруса, в каждом — цепочки путей
// урона, здоровья и защиты. Между ярусами — способности класса (`perks` в classes/pyromancer.ts).
// Названия — в словарях по id таланта (`talent.<id>.name`), здесь — русское для ориентира.

export const pyromancerTalents: TalentTree = [
  // ярус 1
  {
    attack: [
      // синергия: любая способность (в том числе цепная молния мага) поджигает цель
      talent('living_flame', synergy('abilityIgnite', [20, 40])), // «Живое пламя»
      talent('kindling', bonus('ignite', [8, 16, 25])), // «Поджог»
    ],
    vitality: [
      talent('heat_resistance', bonus('dotDr', [15, 30])), // «Жаростойкость»
      talent('smouldering_ember', bonus('lowHpDr', [10, 20, 30])), // «Тлеющий уголь»
    ],
    guard: [
      talent('searing_armour', bonus('def', [4, 9, 15])), // «Раскалённая броня»
    ],
  },
  // ярус 2
  {
    attack: [
      talent('ash', synergy('abilitySplash', [20, 40])), // «Пепел»
      talent('swelter', bonus('dmgPct', [8, 16])), // «Жар»
      talent('fire_fury', bonus('perkPower', [25, 50, 75])), // «Огненная ярость»
    ],
    vitality: [
      talent('smoke_and_flame', bonus('bossDr', [10, 20, 30])), // «Дым и пламя»
    ],
    guard: [
      talent('wall_of_flame', bonus('block', [4, 8, 12])), // «Огненная стена»
    ],
  },
  // ярус 3
  {
    attack: [
      talent('inferno', bonus('critMul', [40, 80])), // «Инферно»
    ],
    vitality: [
      talent('embers_within', bonus('hpPct', [10, 20])), // «Угли под кожей»
      talent('ashen_shroud', bonus('bigHitCut', [50])), // «Пепельный покров»
    ],
    guard: [
      talent('brazier', bonus('thorns', [15, 30])), // «Жаровня»
      talent('cloak_of_fire', bonus('roomGuard', [100])), // «Огненный покров»
    ],
  },
];
