/** Самопроверка: Экономика: лавка, починка, кошелёк. */
import { CONSUMABLES } from '../../src/domain/catalog/consumables';
import { ITEMS } from '../../src/domain/catalog/items';
import { PriceShareRepair, ShopRules, Wallet } from '../../src/domain/economy';
import { Gold, Ratio, Souls } from '../../src/domain/shared';
import { ok } from './harness';

// ---------------------------------------------------------------- экономика: лавка, починка, кошелёк
{
  const swords = ShopRules.stock('weapon', 'warrior');
  ok(
    swords.length > 1 && swords.every((i) => i.slot === 'weapon' && i.lineage === 'warrior'),
    'лавка продаёт оружие только линейки героя',
  );
  ok(
    ShopRules.stock('armor', 'mage').every((i) => i.slot === 'armor') &&
      ShopRules.stock('armor', 'mage').length === ITEMS.filter((i) => i.slot === 'armor').length,
    'броня в лавке — любая',
  );
  const [t1, t2] = [...swords].sort((a, b) => a.tier - b.tier);
  const worn = (item: typeof t1, durability = item.durability) => ({ id: item.id, durability });
  ok(ShopRules.itemAction(t1, null) === 'buy', 'без надетой вещи — купить');
  ok(ShopRules.itemAction(t1, worn(t1)) === 'equipped', 'целая надетая — «надето»');
  ok(ShopRules.itemAction(t1, worn(t1, 1)) === 'repair', 'изношенная надетая — починить');
  ok(ShopRules.itemAction(t1, worn(t2)) === 'weaker', 'вещь не лучше надетой лавке не нужна');
  ok(ShopRules.itemAction(t2, worn(t1)) === 'buy', 'следующую ступень можно купить');
  ok(
    ShopRules.nextTiers('warrior', worn(t1), null).some((i) => i.id === t2.id) &&
      ShopRules.nextTiers('warrior', worn(t1), null).every((i) =>
        i.slot === 'weapon' ? i.tier === t2.tier : i.tier === 1,
      ),
    'следующие ступени — после надетых оружия и брони',
  );
  const heal = CONSUMABLES.potion_heal;
  const cap = heal.max ?? 0;
  ok(
    ShopRules.canStock(heal, cap - 1, 1) && !ShopRules.canStock(heal, cap - 1, 2),
    'запас расходника не выше предела',
  );
  ok(
    ShopRules.stockFull(heal, cap) && !ShopRules.stockFull(heal, cap - 1),
    'полный запас — больше не продают',
  );

  const repair = new PriceShareRepair(Ratio.of(0.5));
  const item = { ...t1, price: Gold.of(100), durability: 10 };
  ok(repair.repairCost(item, null) === 0, 'чинить не надетую вещь нечего');
  ok(repair.repairCost(item, worn(item)) === 0, 'целая вещь чинится бесплатно');
  ok(repair.repairCost(item, worn(item, 0)) === 50, 'полная починка — доля цены');
  ok(repair.repairCost(item, worn(item, 5)) === 25, 'частичная — по износу');
  ok(
    repair.repairCost({ ...item, price: Gold.of(3) }, worn(item, 5)) === 1,
    'копейки починки округляются вверх',
  );

  const purse = { gold: Gold.of(10), souls: Souls.of(3) };
  const w = new Wallet(purse);
  w.addGold(Gold.of(5));
  w.addSouls(Souls.of(2));
  ok(purse.gold === 15 && purse.souls === 5, 'кошелёк кладёт деньги в документ героя');
  ok(!w.spendGold(Gold.of(16)) && purse.gold === 15, 'больше, чем есть, не тратится');
  ok(w.spendGold(Gold.of(15)) && purse.gold === 0, 'можно потратить всё до монеты');
  ok(!w.spendSouls(Souls.of(6)) && w.spendSouls(Souls.of(5)) && w.souls === 0, 'души — так же');
}
