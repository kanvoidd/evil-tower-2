/** Доля от целого: 0,25 — это четверть. Множители урона, снижения, доли здоровья. */
export type Ratio = number & { readonly __unit: 'ratio' };

export const Ratio = {
  of: (n: number): Ratio => n as Ratio,
};
