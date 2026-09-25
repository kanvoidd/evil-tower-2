import { Gold, Ratio, Turns } from '../../../shared';
import type { ClassDef } from '../../classes/interfaces/ClassDef';
import { FULL_BAR } from '../../perks/fullBar';
import type { PerkDef } from '../../perks/interfaces/PerkDef';
import type { TalentDef } from '../../talents/interfaces/TalentDef';
import { HeroFactory } from '../hero-factory/HeroFactory';
import type { LineageDef } from '../interfaces/LineageDef';

/** Наёмник · осмотрительность. Пассивка линейки — +20% золота. */
export class MercenaryFactory extends HeroFactory {
  readonly lineage = 'mercenary';

  createLineage(): LineageDef {
    return this.lineageDef({
      resource: 'vigilance',
      base: { damage: 3, crit: 10, health: 22, dodge: 5, defense: 0, parry: 0, luck: 0 },
      resMax: 7,
      resRegen: 2,
      goldBonus: 0.2,
      artifacts: false,
      attack: 'backstab',
      // «Откупиться»: жизнь стоит пятой части кошеля комнаты
      cheatDeathPrice: { drainsResource: false, goldShare: 0.2 },
    });
  }

  createClasses(): ClassDef[] {
    return [
      this.classDef('mercenary', 0, null),
      this.classDef('assassin', 1, 'mercenary', { crit: 8, dodge: 5, health: 3 }),
      this.classDef('darkassassin', 2, 'assassin', { damage: 4, crit: 10 }),
      this.classDef('ninja', 2, 'assassin', { dodge: 12, damage: 3 }),
    ];
  }

  createPerks(): PerkDef[] {
    return [
      this.perk('mercenary', 'start', {
        ability: 'backstab',
        vfx: 'smoke',
        basic: true,
        cost: 4,
        target: 'enemy',
      }),
      this.perk('mercenary', 'p2', {
        ability: 'bribe',
        vfx: 'smoke',
        goldCost: { share: Ratio.of(0.25), min: Gold.of(5) },
        target: 'enemy',
      }),
      this.perk('mercenary', 'p3', {
        ability: 'cold_blood',
        params: { resource: 3 },
        vfx: 'smoke',
        passive: true,
      }),

      this.perk('assassin', 'start', {
        ability: 'shadow_dance',
        params: { extraStrikes: 2 },
        vfx: 'smoke',
        passive: true,
      }),
      this.perk('assassin', 'p2', {
        ability: 'sentence',
        params: { vuln: Ratio.of(0.5), cap: Ratio.of(1.5) },
        vfx: 'mark',
        cost: 2,
        target: 'enemy',
      }),
      this.perk('assassin', 'p3', {
        ability: 'lethal_dose',
        params: { poison: Ratio.of(0.1), bossPoison: Ratio.of(0.05), turns: Turns.of(3) },
        vfx: 'dark',
        passive: true,
      }),

      this.perk('darkassassin', 'start', {
        ability: 'death_mark',
        params: { turns: Turns.of(3), bossHpShare: Ratio.of(0.3) },
        vfx: 'mark',
        cost: 3,
        target: 'enemy',
      }),
      this.perk('darkassassin', 'p2', {
        ability: 'chain_mark',
        params: { turns: Turns.of(3) },
        vfx: 'mark',
        passive: true,
      }),
      this.perk('darkassassin', 'p3', {
        ability: 'shadow_reap',
        params: { bossHpShare: Ratio.of(0.3) },
        vfx: 'dark',
        cost: 5,
        target: 'self',
      }),
      this.perk('darkassassin', 'legend', {
        ability: 'reaper',
        params: { turns: Turns.of(3) },
        vfx: 'dark',
        cost: FULL_BAR,
        target: 'self',
        once: true,
      }),

      this.perk('ninja', 'start', {
        ability: 'shuriken_fan',
        params: { targets: 4, dmg: Ratio.of(0.6) },
        vfx: 'blades',
        cost: 3,
        target: 'self',
      }),
      this.perk('ninja', 'p2', {
        ability: 'substitution',
        vfx: 'smoke',
        passive: true,
      }),
      this.perk('ninja', 'p3', {
        ability: 'smoke_screen',
        params: { turns: Turns.of(2) },
        vfx: 'smoke',
        cost: 4,
        target: 'self',
      }),
      this.perk('ninja', 'legend', {
        ability: 'wind_shadow',
        params: { dmg: Ratio.of(0.8) },
        vfx: 'blades',
        cost: FULL_BAR,
        target: 'self',
        once: true,
      }),
    ];
  }

  createTalents(): TalentDef[] {
    return [
      ...this.talentTree('mercenary', [
        {
          a: [this.talent('abilityVuln', [10, 20]), this.talent('dmgPct', [10, 20, 30])],
          v: [this.talent('hpPct', [16, 30, 45])],
          g: [this.talent('def', [2, 5]), this.talent('def', [3, 7, 12])],
        },
        {
          a: [
            this.talent('abilityStun', [10, 20]),
            this.talent('abilityRefund', [20, 40]),
            this.talent('perkPower', [15, 30, 45]),
          ],
          v: [this.talent('potionPct', [20, 40, 60])],
          g: [this.talent('killDefStack', [2, 4, 6])],
        },
        {
          a: [this.talent('crit', [10, 20])],
          v: [this.talent('hpPct', [10, 20]), this.talent('cheatDeath', [1])],
          g: [this.talent('armorBonus', [15, 30]), this.talent('armorBonus', [25, 50])],
        },
      ]),
      ...this.talentTree('assassin', [
        {
          a: [
            this.talent('abilityCrit', [8, 16]),
            this.talent('abilityPoison', [4, 8]),
            this.talent('critMul', [25, 50, 75]),
          ],
          v: [this.talent('bossDr', [10, 20, 30])],
          g: [this.talent('firstHitDown', [15, 30, 45])],
        },
        {
          a: [this.talent('perkPower', [20, 40, 60])],
          v: [
            this.talent('hpPct', [8, 16]),
            this.talent('abilityLifesteal', [10, 20]),
            this.talent('killHp', [1, 2, 3]),
          ],
          g: [this.talent('perkDef', [10, 20, 30])],
        },
        {
          a: [this.talent('dmgPct', [12, 24]), this.talent('execute', [20])],
          v: [this.talent('startShield', [10, 20])],
          g: [this.talent('dodge', [4, 8]), this.talent('block', [5, 10])],
        },
      ]),
      ...this.talentTree('darkassassin', [
        {
          a: [this.talent('fullHpDmg', [15, 30, 45])],
          v: [this.talent('hpPct', [8, 16]), this.talent('lowHpDr', [10, 20, 30])],
          g: [this.talent('magicDr', [6, 12]), this.talent('magicDr', [10, 20, 30])],
        },
        {
          a: [this.talent('abilityVuln', [15, 30]), this.talent('perkPower', [25, 50, 75])],
          v: [this.talent('bigHitCut', [25, 50])],
          g: [this.talent('abilityPoison', [5, 10]), this.talent('weaken', [10, 20, 30])],
        },
        {
          a: [
            this.talent('dmgPct', [12, 24]),
            this.talent('abilityLifesteal', [10, 20]),
            this.talent('doubleStrike', [12, 25]),
          ],
          v: [this.talent('revive', [30])],
          g: [this.talent('roomGuard', [100])],
        },
      ]),
      ...this.talentTree('ninja', [
        {
          a: [
            this.talent('dmgPct', [6, 12]),
            this.talent('basicSplit', [12, 24], [25, 40]),
            this.talent('dmgPct', [10, 20, 30, 40, 50]),
          ],
          v: [this.talent('dodge', [5, 10, 15])],
          g: [this.talent('parry', [5, 10, 15])],
        },
        {
          a: [this.talent('perkCostDown', [1]), this.talent('perkPower', [25, 50, 75])],
          v: [this.talent('stepHeal', [2, 4]), this.talent('hpPct', [12, 24, 36])],
          g: [this.talent('resDef', [10, 20, 30])],
        },
        {
          a: [this.talent('freePerk', [1])],
          v: [this.talent('cheatDeath', [1])],
          g: [
            this.talent('thorns', [10, 20]),
            this.talent('dodge', [4, 8]),
            this.talent('thorns', [25, 50]),
          ],
        },
      ]),
    ];
  }
}
