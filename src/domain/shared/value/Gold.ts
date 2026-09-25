/** Золото: кошелёк героя, цены вещей, добыча комнаты. Не складывается с душами. */
export type Gold = number & { readonly __unit: 'gold' };

export const Gold = {
  of: (n: number): Gold => n as Gold,
};
