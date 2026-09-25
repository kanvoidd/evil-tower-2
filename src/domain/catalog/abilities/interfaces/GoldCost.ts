import type { Gold, Ratio } from '../../../shared';

/** Цена способности золотом из кошеля комнаты: доля добычи, но не меньше `min`. */
export interface GoldCost {
  share: Ratio;
  min: Gold;
}
