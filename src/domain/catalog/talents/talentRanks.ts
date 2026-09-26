import type { TalentEffect } from './interfaces/TalentEffect';

/** Список значений эффекта по рангам: у пары «шанс / сила» — шансы, у правки перка — пусто. */
const values = (e: TalentEffect): readonly number[] =>
  e.kind === 'chance' ? e.chance : e.kind === 'modify' ? [] : e.perRank;

/** Сколько рангов у таланта. */
export const maxRank = (e: TalentEffect): number =>
  e.kind === 'chance' ? e.chance.length : e.perRank.length;

/** Значение эффекта на купленном ранге (0 — талант не изучен или правит перк); у пары — шанс. */
export const valueAt = (e: TalentEffect, rank: number): number => {
  const list = values(e);
  return rank <= 0 || !list.length ? 0 : list[Math.min(rank, list.length) - 1];
};

/** Сила пары «шанс / сила» на купленном ранге; у остальных эффектов — 0. */
export const powerAt = (e: TalentEffect, rank: number): number =>
  rank <= 0 || e.kind !== 'chance' ? 0 : e.power[Math.min(rank, e.power.length) - 1];

/** Правка перка на купленном ранге (`undefined` — талант не изучен или не правит перк). */
export const patchAt = (e: TalentEffect, rank: number): Readonly<object> | undefined =>
  rank <= 0 || e.kind !== 'modify' ? undefined : e.perRank[Math.min(rank, e.perRank.length) - 1];
