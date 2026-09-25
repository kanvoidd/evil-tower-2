import type { TalentDef } from '../../talents/interfaces/TalentDef';
import { HeroFactory } from '../hero-factory/HeroFactory';

/** Таланты линейки «Воин» — до переноса в определения (этап D). */
export class WarriorFactory extends HeroFactory {
  createTalents(): TalentDef[] {
    return [
      ...this.talentTree('warrior', [
        {
          a: [
            this.talent('dmgPct', [4, 8]),
            this.talent('critMul', [15, 30]),
            this.talent('dmgPct', [10, 20, 30, 40, 50]),
          ],
          v: [this.talent('hpPct', [15, 28, 40])],
          g: [this.talent('def', [3, 7, 12])],
        },
        {
          a: [this.talent('perkPower', [15, 30, 45])],
          v: [this.talent('stepHeal', [2, 4]), this.talent('lowHpDr', [10, 20, 30])],
          g: [this.talent('def', [2, 4]), this.talent('parry', [5, 10, 15])],
        },
        {
          a: [this.talent('pierce', [50])],
          v: [this.talent('cheatDeath', [1])],
          g: [
            this.talent('parry', [3, 6]),
            this.talent('block', [4, 8]),
            this.talent('counterBuff', [60]),
          ],
        },
      ]),
      ...this.talentTree('knight', [
        {
          a: [this.talent('abilityStun', [10, 20]), this.talent('defDmg', [25, 50, 75])],
          v: [this.talent('hpPct', [10, 20]), this.talent('bossDr', [10, 20, 30])],
          g: [this.talent('armorBonus', [15, 30, 45])],
        },
        {
          a: [this.talent('perkPower', [20, 40, 60])],
          v: [this.talent('startShield', [8, 15, 22])],
          g: [
            this.talent('def', [3, 6]),
            this.talent('thorns', [10, 20]),
            this.talent('thorns', [15, 30, 45]),
          ],
        },
        {
          a: [
            this.talent('critMul', [20, 40]),
            this.talent('abilitySplash', [20, 40]),
            this.talent('critMul', [40, 80]),
          ],
          v: [this.talent('bossHp', [6, 12])],
          g: [this.talent('roomGuard', [100])],
        },
      ]),
      ...this.talentTree('berserk', [
        {
          a: [this.talent('rageDmg', [15, 30, 45])],
          v: [
            this.talent('hpPct', [8, 16]),
            this.talent('dodge', [3, 6]),
            this.talent('block', [4, 8, 12]),
          ],
          g: [this.talent('scarDef', [3, 6, 9])],
        },
        {
          a: [this.talent('abilityLifesteal', [10, 20]), this.talent('perkPower', [25, 50, 75])],
          v: [this.talent('killHp', [1, 2, 3])],
          g: [this.talent('dotDr', [15, 30]), this.talent('dotDr', [30, 60])],
        },
        {
          a: [this.talent('doubleStrike', [12, 25])],
          v: [this.talent('hpPct', [10, 20]), this.talent('bigHitCut', [50])],
          g: [this.talent('abilityShield', [8, 16]), this.talent('perkDef', [15, 30])],
        },
      ]),
      ...this.talentTree('paladin', [
        {
          a: [this.talent('bossDmg', [15, 30, 45])],
          v: [this.talent('hpPct', [12, 24, 36])],
          g: [
            this.talent('magicDr', [6, 12]),
            this.talent('abilityShield', [6, 12]),
            this.talent('magicDr', [10, 20, 30]),
          ],
        },
        {
          a: [this.talent('abilityStun', [12, 24]), this.talent('perkPower', [25, 50, 75])],
          v: [this.talent('potionPct', [20, 40]), this.talent('firstHitDown', [15, 30, 45])],
          g: [this.talent('weaken', [10, 20, 30])],
        },
        {
          a: [
            this.talent('critMul', [20, 40]),
            this.talent('abilitySplash', [25, 50]),
            this.talent('everyThird', [100]),
          ],
          v: [this.talent('healShield', [25])],
          g: [this.talent('highHpDef', [15, 30])],
        },
      ]),
    ];
  }
}
