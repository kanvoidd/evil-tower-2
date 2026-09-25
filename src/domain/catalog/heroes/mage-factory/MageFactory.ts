import type { TalentDef } from '../../talents/interfaces/TalentDef';
import { HeroFactory } from '../hero-factory/HeroFactory';

/** Таланты линейки «Маг» — до переноса в определения (этап D). */
export class MageFactory extends HeroFactory {
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
