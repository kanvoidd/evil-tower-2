import { Ratio, Turns } from '../../../shared';
import { FULL_BAR } from '../../perks/fullBar';
import type { PerkDef } from '../../perks/interfaces/PerkDef';
import type { TalentDef } from '../../talents/interfaces/TalentDef';
import { HeroFactory } from '../hero-factory/HeroFactory';

/** Перки и таланты линейки «Лучник» — до переноса в определения (этапы A и D). */
export class ArcherFactory extends HeroFactory {
  createPerks(): PerkDef[] {
    return [
      this.perk('archer', 'start', {
        ability: 'pierce_shot',
        vfx: 'shot',
        basic: true,
        cost: 2,
        target: 'line',
      }),
      this.perk('archer', 'p2', {
        ability: 'diagonal',
        vfx: 'shot',
        passive: true,
      }),
      this.perk('archer', 'p3', {
        ability: 'ricochet',
        params: { falloff: [Ratio.of(1), Ratio.of(0.5), Ratio.of(0.25)] },
        vfx: 'shot',
        cost: 3,
        target: 'enemy',
      }),

      this.perk('hawkeye', 'start', {
        ability: 'falcon_hunt',
        params: { dmg: Ratio.of(1.2), stun: Turns.of(1) },
        vfx: 'arrows',
        cost: 3,
        target: 'enemy',
      }),
      this.perk('hawkeye', 'p2', {
        ability: 'falcon_courier',
        vfx: 'arrows',
        cost: 2,
        target: 'card',
      }),
      this.perk('hawkeye', 'p3', {
        ability: 'eagle_eye',
        vfx: 'arrows',
        passive: true,
      }),

      this.perk('arrowgod', 'start', {
        ability: 'double_shot',
        params: { dmg: Ratio.of(1) },
        vfx: 'shot',
        cost: 3,
        target: 'enemy',
      }),
      this.perk('arrowgod', 'p2', {
        ability: 'hunter_thrill',
        vfx: 'shot',
        passive: true,
      }),
      this.perk('arrowgod', 'p3', {
        ability: 'arrow_rain',
        params: { arrows: 5, dmg: Ratio.of(0.6) },
        vfx: 'arrows',
        cost: 4,
        target: 'self',
      }),
      this.perk('arrowgod', 'legend', {
        ability: 'starfall',
        params: { waves: 3, dmg: Ratio.of(0.6) },
        vfx: 'arrows',
        cost: FULL_BAR,
        target: 'self',
        once: true,
      }),

      this.perk('sniper', 'start', {
        ability: 'rail_shot',
        params: { stepLoss: Ratio.of(0.2) },
        vfx: 'shot',
        cost: 3,
        target: 'enemy',
      }),
      this.perk('sniper', 'p2', {
        ability: 'armor_piercing',
        params: { dmg: Ratio.of(1), hpShare: Ratio.of(0.25), cap: Ratio.of(0.6) },
        vfx: 'shot',
        cost: 3,
        target: 'enemy',
      }),
      this.perk('sniper', 'p3', {
        ability: 'hunters_mark',
        vfx: 'mark',
        passive: true,
      }),
      this.perk('sniper', 'legend', {
        ability: 'one_shot',
        params: { kills: 3, bossHpShare: Ratio.of(0.4), cap: Ratio.of(0.8) },
        vfx: 'beam',
        cost: FULL_BAR,
        target: 'enemy',
        once: true,
      }),
    ];
  }

  createTalents(): TalentDef[] {
    return [
      ...this.talentTree('archer', [
        {
          a: [
            this.talent('crit', [3, 6]),
            this.talent('basicSplit', [12, 24], [25, 40]),
            this.talent('crit', [4, 8, 12, 16, 20]),
          ],
          v: [this.talent('dodge', [4, 8, 12])],
          g: [this.talent('def', [3, 7, 12])],
        },
        {
          a: [this.talent('perkPower', [15, 30, 45])],
          v: [this.talent('stepHeal', [2, 4]), this.talent('hpPct', [12, 24, 36])],
          g: [this.talent('parry', [3, 6]), this.talent('parry', [4, 8, 12])],
        },
        {
          a: [this.talent('dmgPct', [12, 24]), this.talent('lowHpDmg', [30, 60])],
          v: [this.talent('cheatDeath', [1])],
          g: [this.talent('killDefStack', [2, 4]), this.talent('killDefTurn', [20, 40])],
        },
      ]),
      ...this.talentTree('hawkeye', [
        {
          a: [this.talent('fullHpDmg', [15, 30, 45])],
          v: [this.talent('hpPct', [8, 16]), this.talent('lowHpDr', [10, 20, 30])],
          g: [this.talent('def', [3, 6]), this.talent('armorBonus', [15, 30, 45])],
        },
        {
          a: [
            this.talent('dmgPct', [10, 20]),
            this.talent('abilityStun', [10, 20]),
            this.talent('perkPower', [20, 40, 60]),
          ],
          v: [this.talent('killHp', [1, 2, 3])],
          g: [this.talent('firstHitDown', [15, 30, 45])],
        },
        {
          a: [this.talent('pierce', [15]), this.talent('pierce', [50])],
          v: [this.talent('potionPct', [20, 40]), this.talent('bossDr', [15, 30])],
          g: [this.talent('roomGuard', [100])],
        },
      ]),
      ...this.talentTree('arrowgod', [
        {
          a: [this.talent('abilityRefund', [15, 30]), this.talent('doubleStrike', [10, 20, 30])],
          v: [this.talent('hpPct', [8, 16]), this.talent('hpPct', [16, 30, 45])],
          g: [this.talent('magicDr', [10, 20, 30])],
        },
        {
          a: [this.talent('perkPower', [25, 50, 75])],
          v: [this.talent('startShield', [8, 15, 22])],
          g: [
            this.talent('def', [3, 6]),
            this.talent('thorns', [10, 20]),
            this.talent('thorns', [15, 30, 45]),
          ],
        },
        {
          a: [
            this.talent('abilityCrit', [8, 16]),
            this.talent('abilitySplash', [20, 40]),
            this.talent('freePerk', [1]),
          ],
          v: [this.talent('potionPct', [30, 60])],
          g: [this.talent('perkDef', [25, 50])],
        },
      ]),
      ...this.talentTree('sniper', [
        {
          a: [
            this.talent('critMul', [15, 30]),
            this.talent('abilityCrit', [8, 16]),
            this.talent('critMul', [25, 50, 75]),
          ],
          v: [this.talent('bossHp', [5, 10, 15])],
          g: [this.talent('highHpDef', [10, 20, 30])],
        },
        {
          a: [this.talent('abilityVuln', [15, 30]), this.talent('perkPower', [25, 50, 75])],
          v: [this.talent('hpPct', [8, 16]), this.talent('bigHitCut', [25, 50])],
          g: [this.talent('weaken', [10, 20, 30])],
        },
        {
          a: [this.talent('roomCrit', [1])],
          v: [this.talent('revive', [25])],
          g: [
            this.talent('firstHitDown', [12, 24]),
            this.talent('def', [4, 8]),
            this.talent('block', [5, 10]),
          ],
        },
      ]),
    ];
  }
}
