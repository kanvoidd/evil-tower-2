import type { TalentDef } from '../../talents/interfaces/TalentDef';
import { HeroFactory } from '../hero-factory/HeroFactory';

/** Таланты линейки «Лучник» — до переноса в определения (этап D). */
export class ArcherFactory extends HeroFactory {
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
