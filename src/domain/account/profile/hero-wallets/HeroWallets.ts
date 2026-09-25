import {
  type ConsumableId,
  CONSUMABLES,
  type EquipmentSave,
  type ItemDef,
  LINEAGE_ORDER,
  type LineageId,
} from '../../../catalog';
import { REPAIR_PRICING, ShopRules, Wallet } from '../../../economy';
import { Gold, Souls } from '../../../shared';
import type { HeroSave } from '../../save/interfaces/HeroSave';
import type { ConsumablePurchase } from '../interfaces/ConsumablePurchase';
import type { ItemPurchase } from '../interfaces/ItemPurchase';
import { ProfilePart } from '../profile-part/ProfilePart';

/**
 * Всё своё у каждого героя: кошелёк, снаряжение, расходники, рекорд. Покупки в лавке идут по
 * правилам экономики (`ShopRules`, `IRepairPricing`), кошелёк — `Wallet` над документом героя.
 */
export class HeroWallets extends ProfilePart {
  /** Новый герой начинает с нулями: ни золота, ни душ, ни расходников, ни доспеха. */
  static emptyHero(): HeroSave {
    return {
      gold: Gold.of(0),
      souls: Souls.of(0),
      consumables: { potion_heal: 0, potion_regen: 0, artifact: 0 },
      armor: null,
      best: 0,
    };
  }

  /** Всё своё у активного героя (кошелёк, расходники, доспех, рекорд); у нового героя — с нулями. */
  get heroSave(): HeroSave {
    return this.heroSaveOf(this.parts.heroes.activeLineage);
  }

  heroSaveOf(lin: LineageId): HeroSave {
    return (this.doc.heroes[lin] ??= HeroWallets.emptyHero());
  }

  /** Рекорд героя линейки — без заведения пустого кошелька, если героя ещё нет. */
  bestOf(lin: LineageId): number {
    return this.doc.heroes[lin]?.best ?? 0;
  }

  // ------------------------------------------------------------------ кошелёк

  /** Кошелёк активного героя. */
  private get wallet(): Wallet {
    return new Wallet(this.heroSave);
  }

  get gold(): Gold {
    return this.wallet.gold;
  }

  get souls(): Souls {
    return this.wallet.souls;
  }

  addGold(n: Gold, track = true): void {
    this.wallet.addGold(n);
    if (track && n > 0) this.doc.stats.goldEarned += n;
    this.earned();
  }

  addSouls(n: Souls, track = true): void {
    this.wallet.addSouls(n);
    if (track && n > 0) this.doc.stats.soulsEarned += n;
    this.earned();
  }

  spendGold(n: Gold): boolean {
    if (!this.wallet.spendGold(n)) return false;
    this.state.walletChanged.emit();
    this.state.touch();
    return true;
  }

  spendSouls(n: Souls): boolean {
    if (!this.wallet.spendSouls(n)) return false;
    this.state.walletChanged.emit();
    this.state.touch();
    return true;
  }

  /** Заработанное: полоска валют, достижения «заработать», сохранение. */
  private earned(): void {
    this.state.walletChanged.emit();
    this.parts.achievements.check();
    this.state.touch();
  }

  // ------------------------------------------------------------------ снаряжение и расходники

  equipped(slot: 'weapon' | 'armor'): EquipmentSave | null {
    const lin = this.parts.heroes.activeLineage;
    const e = slot === 'weapon' ? (this.doc.weapon[lin] ?? null) : this.heroSave.armor;
    return e && e.durability > 0 ? e : null;
  }

  repairCost(item: ItemDef): Gold {
    return REPAIR_PRICING.repairCost(item, this.equipped(item.slot));
  }

  buyItem(item: ItemDef): ItemPurchase {
    const cur = this.equipped(item.slot);
    const action = ShopRules.itemAction(item, cur);
    if (action === 'equipped') return 'full';
    if (action === 'weaker') return 'weaker';
    if (action === 'repair') return this.repair(item, cur!);
    if (!this.spendGold(item.price)) return 'gold';
    const save: EquipmentSave = { id: item.id, durability: item.durability };
    if (item.slot === 'weapon') this.doc.weapon[this.parts.heroes.activeLineage] = save;
    else this.heroSave.armor = save;
    this.state.touch();
    return 'bought';
  }

  /** Лавка не продаёт сверх предела; 'max' — уже полный запас. */
  buyConsumable(id: ConsumableId, count = 1): ConsumablePurchase {
    const def = CONSUMABLES[id];
    if (!def.sold) return 'gold';
    if (!ShopRules.canStock(def, this.heroSave.consumables[id], count)) return 'max';
    if (!this.spendGold(Gold.of(def.price * count))) return 'gold';
    this.heroSave.consumables[id] += count;
    this.state.touch();
    return 'bought';
  }

  /** Расходники героя такими, какими их оставил бой. */
  keepConsumables(consumables: Readonly<Record<ConsumableId, number>>): void {
    this.heroSave.consumables = { ...consumables };
    this.state.touch();
  }

  /** Записывает износ экипировки и расходники после комнаты. */
  commitBattle(
    weapon: EquipmentSave | null,
    armor: EquipmentSave | null,
    consumables: Readonly<Record<ConsumableId, number>>,
  ): void {
    const lin = this.parts.heroes.activeLineage;
    if (weapon) this.doc.weapon[lin] = weapon.durability > 0 ? weapon : null;
    if (armor) this.heroSave.armor = armor.durability > 0 ? armor : null;
    this.heroSave.consumables = { ...consumables };
    this.state.touch();
  }

  // ------------------------------------------------------------------ рекорды

  /** Рекорд активного героя: сколько комнат он прошёл за один забег. */
  get best(): number {
    return this.heroSave.best;
  }

  /** Записывает итог забега. true — если это новый рекорд. */
  recordRun(rooms: number): boolean {
    if (rooms <= this.heroSave.best) return false;
    this.heroSave.best = rooms;
    this.state.touch();
    return true;
  }

  /** Лучший забег среди всех героев — для таблицы рекордов. */
  get bestClimb(): number {
    return LINEAGE_ORDER.reduce((best, l) => Math.max(best, this.doc.heroes[l]?.best ?? 0), 0);
  }

  private repair(item: ItemDef, worn: EquipmentSave): ItemPurchase {
    if (!this.spendGold(this.repairCost(item))) return 'gold';
    worn.durability = item.durability;
    this.state.touch();
    return 'repaired';
  }
}
