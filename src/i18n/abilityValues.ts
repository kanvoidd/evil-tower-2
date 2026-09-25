import {
  type AbilityDef,
  CLASSES,
  LINEAGES,
  PARAM_UNITS,
  type ParamKey,
  PERK_BY_ABILITY,
} from '../domain/catalog';

/** Доля — процентами: 0,6 → 60. */
const percent = (x: number): number => Math.round(x * 100);
/** Доля — множителем: 1,5 → «1.5». */
const times = (x: number): string => String(Math.round(x * 100) / 100);

/**
 * Числа для описания способности — только отсюда, «голых» чисел в текстах нет: её `params`
 * (доли — процентами, `{имя_x}` — множителем; у списков — `{имя1}`, `{имя2}` …), цена в
 * ресурсе, перезарядка, цена золотом и восстановление ресурса линейки класса, который её выдаёт.
 */
export const abilityValues = (p: AbilityDef): Record<string, string | number> => {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(p.params as Record<string, number | number[]>)) {
    const ratio = PARAM_UNITS[key as ParamKey] === 'ratio';
    const show = (x: number): number => (ratio ? percent(x) : x);
    if (Array.isArray(value)) value.forEach((x, i) => (out[`${key}${i + 1}`] = show(x)));
    else {
      out[key] = show(value);
      if (ratio) out[`${key}_x`] = times(value);
    }
  }
  if (p.cost !== undefined) out.cost = p.cost;
  if (p.cooldown !== undefined) out.cooldown = p.cooldown;
  if (p.goldCost) {
    out.goldShare = percent(p.goldCost.share);
    out.goldMin = p.goldCost.min;
  }
  const owner = PERK_BY_ABILITY[p.id];
  if (owner) out.regen = LINEAGES[CLASSES[owner.classId].lineage].resRegen;
  return out;
};
