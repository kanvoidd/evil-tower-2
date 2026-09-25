import type { TalentDef } from '../../talents/interfaces/TalentDef';
import { HeroFactory } from '../hero-factory/HeroFactory';

/** Таланты линейки «Наёмник» — до переноса в определения (этап D). */
export class MercenaryFactory extends HeroFactory {
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
