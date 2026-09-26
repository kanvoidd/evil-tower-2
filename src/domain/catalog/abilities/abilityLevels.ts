import type { AbilityDef } from './interfaces/AbilityDef';

/** Сколько уровней у перка этой способности. */
export const levelsOf = (a: AbilityDef): number => a.levels.length;

/** Способность на уровне перка `level` (1 — первый): числа этого уровня. */
export const abilityAtLevel = <A extends AbilityDef>(a: A, level: number): A => {
  const i = Math.max(1, Math.min(level, a.levels.length)) - 1;
  return i === 0 ? a : { ...a, params: a.levels[i] };
};

/** Способность с правкой чисел (таланты, которые меняют перк): поля правки заменяют прежние. */
export const withPatch = <A extends AbilityDef>(a: A, patch: Readonly<object>): A => ({
  ...a,
  params: { ...a.params, ...patch },
});
