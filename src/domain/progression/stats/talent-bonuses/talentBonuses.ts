import { patchAt, powerAt, valueAt } from '../../../catalog';
import type { LearnedTalent } from '../../skill-tree/interfaces/LearnedTalent';
import type { TalentBonus } from './interfaces/TalentBonus';

/**
 * Что дают изученные таланты линейки — сумма значений по виду эффекта (у пары «шанс / сила» —
 * шансы). Таланты прежних классов тоже в счёт: они сохраняются при метаморфозе. Правки перков
 * здесь не считаются — они меняют числа способностей (`abilityPatches`).
 */
export const talentBonuses = (learned: readonly LearnedTalent[]): TalentBonus => {
  const out: TalentBonus = {};
  for (const { place, rank } of learned) {
    const { effect } = place.talent;
    if (effect.kind === 'modify') continue;
    out[effect.fx] = (out[effect.fx] ?? 0) + valueAt(effect, rank);
  }
  return out;
};

/**
 * Сила пар «шанс / сила» (у «Поддержки с воздуха» — доля урона второго удара). Берём максимум, а
 * не сумму: это одна и та же механика, и складывать её силу от двух классов линейки было бы неверно.
 */
export const talentPowers = (learned: readonly LearnedTalent[]): TalentBonus => {
  const out: TalentBonus = {};
  for (const { place, rank } of learned) {
    const { effect } = place.talent;
    const power = powerAt(effect, rank);
    if (power > 0 && effect.kind === 'chance')
      out[effect.fx] = Math.max(out[effect.fx] ?? 0, power);
  }
  return out;
};

/**
 * Правки перков из изученных талантов: id способности → числа, которые заменяют её числа у героя.
 * Правки нескольких талантов одной способности сливаются по порядку дерева.
 */
export const abilityPatches = (
  learned: readonly LearnedTalent[],
): ReadonlyMap<string, Readonly<object>> => {
  const out = new Map<string, Readonly<object>>();
  for (const { place, rank } of learned) {
    const patch = patchAt(place.talent.effect, rank);
    const { effect } = place.talent;
    if (!patch || effect.kind !== 'modify') continue;
    out.set(effect.ability.id, { ...out.get(effect.ability.id), ...patch });
  }
  return out;
};
