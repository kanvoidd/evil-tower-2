/** Число ходов: длительность статусов и эффектов, перезарядка. */
export type Turns = number & { readonly __unit: 'turns' };

export const Turns = {
  of: (n: number): Turns => n as Turns,
};
