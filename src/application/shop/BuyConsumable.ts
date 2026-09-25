import type { ConsumablePurchase, Profile } from '../../domain/account';
import type { ConsumableId } from '../../domain/catalog';

/** Купить расходник: лавка не продаёт сверх предела запаса и то, что добывается только в бою. */
export class BuyConsumable {
  constructor(private readonly profile: Profile) {}

  execute(id: ConsumableId): ConsumablePurchase {
    return this.profile.buyConsumable(id);
  }
}
