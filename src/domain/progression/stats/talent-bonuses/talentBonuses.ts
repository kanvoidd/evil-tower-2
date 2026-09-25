import { powerAt, valueAt } from '../../../catalog';
import type { LearnedTalent } from '../../skill-tree/interfaces/LearnedTalent';
import type { TalentBonus } from './interfaces/TalentBonus';

/**
 * Что дают изученные таланты линейки — сумма значений по виду эффекта (у пары «шанс / сила» —
 * шансы). Таланты прежних классов тоже в счёт: они сохраняются при метаморфозе.
 */
export const talentBonuses = (learned: readonly LearnedTalent[]): TalentBonus => {
  const out: TalentBonus = {};
  for (const { place, rank } of learned) {
    const { effect } = place.talent;
    out[effect.fx] = (out[effect.fx] ?? 0) + valueAt(effect, rank);
  }
  return out;
};

/**
 * Сила пар «шанс / сила» (у «Раздвоения молнии» — доля урона второго разряда). Берём максимум, а
 * не сумму: это одна и та же механика, и складывать её силу от двух классов линейки было бы неверно.
 */
export const talentPowers = (learned: readonly LearnedTalent[]): TalentBonus => {
  const out: TalentBonus = {};
  for (const { place, rank } of learned) {
    const { effect } = place.talent;
    const power = powerAt(effect, rank);
    if (power > 0) out[effect.fx] = Math.max(out[effect.fx] ?? 0, power);
  }
  return out;
};
