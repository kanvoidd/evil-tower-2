/** Опыт душ: валюта прокачки дерева талантов. Не складывается с золотом. */
export type Souls = number & { readonly __unit: 'souls' };

export const Souls = {
  of: (n: number): Souls => n as Souls,
};
