import { Ratio, Turns } from '../../../shared';
import type { ClassDef } from '../../classes/interfaces/ClassDef';
import { FULL_BAR } from '../../perks/fullBar';
import type { PerkDef } from '../../perks/interfaces/PerkDef';
import type { TalentDef } from '../../talents/interfaces/TalentDef';
import { HeroFactory } from '../hero-factory/HeroFactory';
import type { LineageDef } from '../interfaces/LineageDef';

/**
 * Маг · мана. Пассивка линейки — самый большой запас ресурса и подбор артефактов;
 * рукой маг не бьёт вовсе, только заклинаниями.
 */
export class MageFactory extends HeroFactory {
  readonly lineage = 'mage';

  createLineage(): LineageDef {
    return this.lineageDef({
      resource: 'mana',
      base: { damage: 5, crit: 5, health: 18, dodge: 0, defense: 0, parry: 0, luck: 1 },
      resMax: 14,
      resRegen: 1,
      goldBonus: 0,
      artifacts: true,
      attack: 'spell',
      // «Аварийный барьер» сжигает всю ману
      cheatDeathPrice: { drainsResource: true, goldShare: 0 },
    });
  }

  createClasses(): ClassDef[] {
    return [
      this.classDef('mage', 0, null),
      this.classDef('magister', 1, 'mage', { damage: 3, health: 5 }),
      this.classDef('necromancer', 2, 'magister', { damage: 4, health: 6, luck: 1 }),
      this.classDef('pyromancer', 2, 'magister', { damage: 6, crit: 5 }),
    ];
  }

  createPerks(): PerkDef[] {
    return [
      this.perk('mage', 'start', {
        ability: 'lightning',
        params: { dmg: Ratio.of(2.5) },
        vfx: 'bolt',
        cost: 3,
        target: 'adjacent',
      }),
      this.perk('mage', 'p2', {
        ability: 'magic_shot',
        params: { dmg: Ratio.of(1.5) },
        vfx: 'arcane',
        cost: 6,
        target: 'line',
        cooldown: 1,
      }),
      this.perk('mage', 'p3', {
        ability: 'chain_lightning',
        params: { falloff: [Ratio.of(1), Ratio.of(0.75), Ratio.of(0.5)] },
        vfx: 'chain',
        cost: 5,
        target: 'enemy',
        cooldown: 2,
      }),

      this.perk('magister', 'start', {
        ability: 'swap',
        vfx: 'swap',
        cost: 2,
        target: 'two',
        cooldown: 5,
      }),
      this.perk('magister', 'p2', {
        ability: 'deck_draw',
        vfx: 'arcane',
        cost: 3,
        target: 'any_card',
        cooldown: 4,
      }),
      this.perk('magister', 'p3', {
        ability: 'rewind',
        vfx: 'rewind',
        cost: 6,
        target: 'self',
        once: true,
      }),

      this.perk('necromancer', 'start', {
        ability: 'corpse_blast',
        params: { blast: Ratio.of(0.5) },
        vfx: 'corpse',
        cost: 3,
        target: 'enemy',
        cooldown: 1,
      }),
      this.perk('necromancer', 'p2', {
        ability: 'ghosts',
        params: { turns: Turns.of(3), dmg: Ratio.of(0.6), maxGhosts: 2 },
        vfx: 'ghost',
        cost: 3,
        target: 'enemy',
        cooldown: 4,
      }),
      this.perk('necromancer', 'p3', {
        ability: 'voodoo',
        params: { share: Ratio.of(0.5) },
        vfx: 'voodoo',
        cost: 5,
        target: 'enemy',
        cooldown: 2,
      }),
      this.perk('necromancer', 'legend', {
        ability: 'dead_harvest',
        params: {
          hpShare: Ratio.of(0.5),
          bossHpShare: Ratio.of(0.25),
          cap: Ratio.of(0.9),
          soulBonus: Ratio.of(1),
        },
        vfx: 'harvest',
        cost: FULL_BAR,
        target: 'self',
        once: true,
      }),

      this.perk('pyromancer', 'start', {
        ability: 'ignite',
        params: { burn: Ratio.of(0.3), turns: Turns.of(3) },
        vfx: 'ignite',
        cost: 2,
        target: 'enemy',
        cooldown: 1,
      }),
      this.perk('pyromancer', 'p2', {
        ability: 'fireball',
        params: {
          dmg: Ratio.of(1.2),
          splash: Ratio.of(0.7),
          burn: Ratio.of(0.25),
          turns: Turns.of(3),
        },
        vfx: 'fireball',
        cost: 0,
        target: 'enemy',
        cooldown: 3,
      }),
      this.perk('pyromancer', 'p3', {
        ability: 'detonate',
        params: { blastMul: Ratio.of(2), splashMul: Ratio.of(1) },
        vfx: 'detonate',
        cost: 5,
        target: 'self',
        cooldown: 4,
      }),
      this.perk('pyromancer', 'legend', {
        ability: 'inferno',
        params: { burn: Ratio.of(0.4), turns: Turns.of(5) },
        vfx: 'inferno',
        cost: FULL_BAR,
        target: 'self',
        once: true,
      }),
    ];
  }

  createTalents(): TalentDef[] {
    return [
      ...this.talentTree('mage', [
        {
          a: [
            this.talent('dmgPct', [2, 5, 8]),
            // шанс второго разряда и его сила идут парой; бьёт ту же цель, а не соседа
            this.talent('boltEcho', [8, 12, 16], [12, 14, 16]),
            this.talent('lightningPower', [5, 10, 15, 20, 25]),
          ],
          v: [this.talent('resMaxPct', [15, 25, 35])],
          g: [this.talent('manaShield', [10, 20, 30])],
        },
        {
          a: [
            this.talent('artifactMul', [25, 50, 75]),
            this.talent('shotPower', [10, 20, 30, 40, 50]),
          ],
          v: [this.talent('stepHeal', [2, 4]), this.talent('dodge', [4, 8, 12])],
          g: [this.talent('def', [2, 4, 6]), this.talent('resDef', [10, 20, 30])],
        },
        {
          a: [this.talent('crit', [3, 9, 12]), this.talent('chainPower', [10, 15, 20, 25, 30])],
          v: [this.talent('hpPct', [14, 28]), this.talent('cheatDeath', [1])],
          g: [this.talent('thorns', [25])],
        },
      ]),
      ...this.talentTree('magister', [
        {
          a: [this.talent('abilitySplash', [15, 30]), this.talent('doubleStrike', [10, 20, 30])],
          v: [this.talent('hpPct', [8, 16]), this.talent('hpPct', [16, 30, 45])],
          g: [this.talent('magicDr', [10, 20, 30])],
        },
        {
          a: [
            this.talent('perkCostDown', [1]),
            this.talent('abilityRefund', [20, 40]),
            this.talent('perkPower', [20, 40, 60]),
          ],
          v: [this.talent('firstHitDown', [15, 30, 45])],
          g: [this.talent('parry', [5, 10, 15])],
        },
        {
          a: [this.talent('freePerk', [1])],
          v: [this.talent('potionPct', [30, 60])],
          g: [
            this.talent('abilityShield', [6, 12]),
            this.talent('block', [4, 8]),
            this.talent('perkDef', [25, 50]),
          ],
        },
      ]),
      ...this.talentTree('necromancer', [
        {
          a: [
            this.talent('abilityPoison', [4, 8]),
            this.talent('killBlast', [15, 30]),
            this.talent('killDmg', [2, 4, 6]),
          ],
          v: [this.talent('startShield', [10, 20, 30])],
          g: [this.talent('weaken', [10, 20, 30])],
        },
        {
          a: [this.talent('perkPower', [25, 50, 75])],
          v: [
            this.talent('hpPct', [8, 16]),
            this.talent('abilityLifesteal', [10, 20]),
            this.talent('killHp', [1, 2, 3]),
          ],
          g: [this.talent('dotDr', [20, 40, 60])],
        },
        {
          a: [this.talent('abilityVuln', [15, 30]), this.talent('execute', [20])],
          v: [this.talent('revive', [30])],
          g: [this.talent('magicDr', [8, 16]), this.talent('killDefTurn', [20, 40])],
        },
      ]),
      ...this.talentTree('pyromancer', [
        {
          a: [
            // Синергия: любая способность (в том числе цепная молния мага) начинает поджигать цель.
            this.talent('abilityIgnite', [20, 40]),
            this.talent('ignite', [8, 16, 25]),
          ],
          v: [this.talent('dotDr', [15, 30]), this.talent('lowHpDr', [10, 20, 30])],
          g: [this.talent('def', [4, 9, 15])],
        },
        {
          a: [
            this.talent('abilitySplash', [20, 40]),
            this.talent('dmgPct', [8, 16]),
            this.talent('perkPower', [25, 50, 75]),
          ],
          v: [this.talent('bossDr', [10, 20, 30])],
          g: [this.talent('block', [4, 8, 12])],
        },
        {
          a: [this.talent('critMul', [40, 80])],
          v: [this.talent('hpPct', [10, 20]), this.talent('bigHitCut', [50])],
          g: [this.talent('thorns', [15, 30]), this.talent('roomGuard', [100])],
        },
      ]),
    ];
  }
}
