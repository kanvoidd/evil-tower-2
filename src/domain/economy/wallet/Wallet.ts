import { Gold, Souls } from '../../shared';
import type { Purse } from './interfaces/Purse';

/** Кошелёк героя: золото и души. Потратить можно не больше, чем есть. */
export class Wallet {
  constructor(private readonly purse: Purse) {}

  get gold(): Gold {
    return this.purse.gold;
  }

  get souls(): Souls {
    return this.purse.souls;
  }

  addGold(n: Gold): void {
    this.purse.gold = Gold.of(this.purse.gold + n);
  }

  addSouls(n: Souls): void {
    this.purse.souls = Souls.of(this.purse.souls + n);
  }

  /** Списывает золото, если его хватает; иначе ничего не меняет. */
  spendGold(n: Gold): boolean {
    if (this.purse.gold < n) return false;
    this.purse.gold = Gold.of(this.purse.gold - n);
    return true;
  }

  /** Списывает души, если их хватает; иначе ничего не меняет. */
  spendSouls(n: Souls): boolean {
    if (this.purse.souls < n) return false;
    this.purse.souls = Souls.of(this.purse.souls - n);
    return true;
  }
}
