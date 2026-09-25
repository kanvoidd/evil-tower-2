import type { TalentFx } from '../../../../catalog';

/** Сумма эффектов изученных талантов по виду эффекта. */
export type TalentBonus = Partial<Record<TalentFx, number>>;
