import type { ConsumablePurchase, Profile } from '../../domain/account/profile';
import type { ConsumableId } from '../../domain/types';

/** Купить расходник: лавка не продаёт сверх предела запаса и то, что добывается только в бою. */
export class BuyConsumable {
  constructor(private readonly profile: Profile) {}

  execute(id: ConsumableId): ConsumablePurchase {
    return this.profile.buyConsumable(id);
  }
}
