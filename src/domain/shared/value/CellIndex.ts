/** Клетка поля 3×3, построчно: 0 1 2 / 3 4 5 / 6 7 8. */
export type CellIndex = number & { readonly __unit: 'cell' };

export const CellIndex = {
  of: (n: number): CellIndex => n as CellIndex,
};
