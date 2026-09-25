import type { TalentEffect } from './interfaces/TalentEffect';

/** Список значений эффекта по рангам: у пары «шанс / сила» — шансы. */
const values = (e: TalentEffect): readonly number[] => (e.kind === 'chance' ? e.chance : e.perRank);

/** Сколько рангов у таланта. */
export const maxRank = (e: TalentEffect): number => values(e).length;

/** Значение эффекта на купленном ранге (0 — талант не изучен); у пары — шанс. */
export const valueAt = (e: TalentEffect, rank: number): number =>
  rank <= 0 ? 0 : values(e)[Math.min(rank, values(e).length) - 1];

/** Сила пары «шанс / сила» на купленном ранге; у остальных эффектов — 0. */
export const powerAt = (e: TalentEffect, rank: number): number =>
  rank <= 0 || e.kind !== 'chance' ? 0 : e.power[Math.min(rank, e.power.length) - 1];
