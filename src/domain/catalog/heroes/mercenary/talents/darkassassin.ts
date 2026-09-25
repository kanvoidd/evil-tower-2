import type { TalentTree } from '../../../talents/interfaces/TalentTree';
import { talent } from '../../../talents/talent';
import { bonus, synergy } from '../../../talents/talentEffects';

// Дерево талантов «Тёмный ассасин» (финального класса): три яруса, в каждом — цепочки путей
// урона, здоровья и защиты. Между ярусами — способности класса (`perks` в classes/darkassassin.ts).
// Названия — в словарях по id таланта (`talent.<id>.name`), здесь — русское для ориентира.

export const darkassassinTalents: TalentTree = [
  // ярус 1
  {
    attack: [
      talent('night_blade', bonus('fullHpDmg', [15, 30, 45])), // «Ночной клинок»
    ],
    vitality: [
      talent('dark_in_the_veins', bonus('hpPct', [8, 16])), // «Тьма в жилах»
      talent('shadow_pact', bonus('lowHpDr', [10, 20, 30])), // «Пакт теней»
    ],
    guard: [
      talent('shadowskin', bonus('magicDr', [6, 12])), // «Тень на коже»
      talent('cursed_cloak', bonus('magicDr', [10, 20, 30])), // «Проклятый плащ»
    ],
  },
  // ярус 2
  {
    attack: [
      talent('hunter_brand', synergy('abilityVuln', [15, 30])), // «Клеймо охотника»
      talent('shadow_lord', bonus('perkPower', [25, 50, 75])), // «Владыка теней»
    ],
    vitality: [
      talent('dark_shroud', bonus('bigHitCut', [25, 50])), // «Тёмный покров»
    ],
    guard: [
      talent('blade_venom', synergy('abilityPoison', [5, 10])), // «Яд на клинках»
      talent('poisoned_blades', bonus('weaken', [10, 20, 30])), // «Отравленные клинки»
    ],
  },
  // ярус 3
  {
    attack: [
      talent('second_edge', bonus('dmgPct', [12, 24])), // «Второе лезвие»
      talent('bloodthirst', synergy('abilityLifesteal', [10, 20])), // «Жажда крови»
      talent('twin_blade', bonus('doubleStrike', [12, 25])), // «Двойной клинок»
    ],
    vitality: [
      talent('dark_rebirth', bonus('revive', [30])), // «Тёмное возрождение»
    ],
    guard: [
      talent('veil_of_night', bonus('roomGuard', [100])), // «Покров ночи»
    ],
  },
];
