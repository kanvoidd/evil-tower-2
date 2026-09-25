/** Самопроверка: Правила боя: надбавки урона и защиты, крит, ресурс, автоприменение расходников. */
import { CLASSES } from '../../src/domain/catalog/classes';
import { type EnemyDef } from '../../src/domain/catalog/enemies';
import { ROOMS } from '../../src/domain/catalog/levels';
import { PERK_BY_ID } from '../../src/domain/catalog/perks';
import { CombatBalance } from '../../src/domain/combat';
import {
  needsHeal,
  needsRegen,
  pickAutoUse,
  worthArtifact,
} from '../../src/domain/combat/auto-use/autoUse';
import { Card } from '../../src/domain/combat/card';
import {
  AbilityCrit,
  ChanceCrit,
  CritPolicy,
  type CritRoll,
  EveryNthCrit,
  HuntersMarkCrit,
  RoomOpeningCrit,
} from '../../src/domain/combat/crit';
import {
  ArmorToDamage,
  BigHitReduction,
  BossBonus,
  BossReduction,
  CarnageBonus,
  FirstHitReduction,
  FullHpBonus,
  GoldBonus,
  type HeroView,
  HighHpDefense,
  type IHeroDamageModifier,
  type IncomingHit,
  KillBonus,
  KillStackDefense,
  KillTurnDefense,
  LowHpBonus,
  LowHpReduction,
  MagicReduction,
  RageBonus,
  ResourceDefense,
  ScarDefense,
  WoundedEnemyReduction,
} from '../../src/domain/combat/damage';
import { type RoomBattle, RoomBattleFactory } from '../../src/domain/combat/room-battle';
import { newLineageSave, TREES } from '../../src/domain/progression/skill-tree';
import { buildPlayerStats } from '../../src/domain/progression/stats/stats';
import { CellIndex, Gold, Percent, Ratio, type Rng } from '../../src/domain/shared';
import { makeRng } from '../../src/domain/shared/rng/rng';
import { cons, ok } from './harness';

// ---------------------------------------------------------------- надбавки урона, защиты и снижения удара
// каждое правило отдельно, на маленьких числах: что прибавляет и когда молчит
{
  const hero = (o: Partial<HeroView> = {}): HeroView => ({
    hp: 100,
    maxHp: 100,
    res: 10,
    resMax: 10,
    killsRoom: 0,
    killStreak: 0,
    gold: Gold.of(0),
    killDefenseActive: false,
    defense: () => 0,
    ...o,
  });
  const mul = (m: IHeroDamageModifier, h: HeroView): number => {
    const acc = { base: 10, mul: 1 };
    m.apply(acc, h);
    return Math.round(acc.base * acc.mul * 100) / 100;
  };
  const r = Ratio.of;
  ok(mul(new RageBonus(r(0.3)), hero({ hp: 50 })) === 13, 'RageBonus: при половине здоровья +30%');
  ok(mul(new RageBonus(r(0.3)), hero({ hp: 51 })) === 10, 'RageBonus: выше половины молчит');
  ok(mul(new KillBonus(r(0.1)), hero({ killsRoom: 2 })) === 12, 'KillBonus: +10% за убийство');
  ok(mul(new KillBonus(r(0.1)), hero({ killsRoom: 9 })) === 13, 'KillBonus: не больше +30%');
  ok(
    mul(new GoldBonus(r(0.05)), hero({ gold: Gold.of(250) })) === 11,
    'GoldBonus: +5% за 100 золота',
  );
  ok(mul(new GoldBonus(r(0.05)), hero({ gold: Gold.of(1e4) })) === 13, 'GoldBonus: не больше +30%');
  ok(
    mul(new CarnageBonus(r(0.2), r(0.8)), hero({ killStreak: 3 })) === 16,
    'CarnageBonus: серия копится',
  );
  ok(
    mul(new CarnageBonus(r(0.2), r(0.8)), hero({ killStreak: 9 })) === 18,
    'CarnageBonus: до предела',
  );
  ok(
    mul(new ArmorToDamage(r(0.5)), hero({ defense: () => 7 })) === 14,
    'ArmorToDamage: половина защиты в базу',
  );

  const foe = (o: Partial<Card> = {}): Card =>
    ({ hp: 100, maxHp: 100, swings: 0, hits: 0, ...o }) as Card;
  const boss = { boss: true, magic: true } as EnemyDef;
  ok(new FullHpBonus(r(0.25)).bonus(foe(), undefined) === 0.25, 'FullHpBonus: по целому врагу');
  ok(
    new FullHpBonus(r(0.25)).bonus(foe({ hp: 99 }), undefined) === 0,
    'FullHpBonus: по раненому молчит',
  );
  ok(
    new LowHpBonus(r(0.5)).bonus(foe({ hp: 30 }), undefined) === 0.5,
    'LowHpBonus: 30% здоровья и ниже',
  );
  ok(
    new LowHpBonus(r(0.5)).bonus(foe({ hp: 31 }), undefined) === 0,
    'LowHpBonus: выше порога молчит',
  );
  ok(
    new BossBonus(r(0.4)).bonus(foe(), boss) === 0.4 &&
      new BossBonus(r(0.4)).bonus(foe(), undefined) === 0,
    'BossBonus: только по боссу',
  );

  ok(
    new HighHpDefense(r(0.2)).apply(10, hero({ hp: 80 })) === 12,
    'HighHpDefense: больше 70% здоровья',
  );
  ok(
    new HighHpDefense(r(0.2)).apply(10, hero({ hp: 70 })) === 10,
    'HighHpDefense: на пороге молчит',
  );
  ok(
    new ResourceDefense(r(0.3)).apply(10, hero({ res: 6 })) === 13,
    'ResourceDefense: шкала больше половины',
  );
  ok(
    new ResourceDefense(r(0.3)).apply(10, hero({ res: 5 })) === 10,
    'ResourceDefense: половина — молчит',
  );
  ok(
    new ScarDefense(r(0.1)).apply(10, hero({ hp: 55 })) === 12,
    'ScarDefense: +10% за каждые 20% потерь',
  );
  ok(
    new KillStackDefense(r(0.05)).apply(10, hero({ killsRoom: 3 })) === 12,
    'KillStackDefense: копится с округлением',
  );
  ok(
    new KillStackDefense(r(0.05)).apply(10, hero({ killsRoom: 10 })) === 12,
    'KillStackDefense: не больше +20%',
  );
  ok(
    new KillTurnDefense(r(0.5)).apply(10, hero({ killDefenseActive: true })) === 15,
    'KillTurnDefense: ход после убийства',
  );
  ok(new KillTurnDefense(r(0.5)).apply(10, hero()) === 10, 'KillTurnDefense: без убийства молчит');

  const hit = (o: Partial<IncomingHit> = {}): IncomingHit => ({
    enemy: null,
    def: null,
    hero: hero(),
    ...o,
  });
  ok(
    new FirstHitReduction(r(0.5)).apply(10, hit({ enemy: foe() })) === 5,
    'FirstHitReduction: первый удар врага',
  );
  ok(
    new FirstHitReduction(r(0.5)).apply(10, hit({ enemy: foe({ swings: 1 }) })) === 10,
    'FirstHitReduction: второй — полный',
  );
  ok(
    new WoundedEnemyReduction(r(0.2)).apply(10, hit({ enemy: foe({ hits: 1 }) })) === 8,
    'WoundedEnemyReduction: раненый враг слабее',
  );
  ok(
    new MagicReduction(r(0.3)).apply(10, hit({ def: boss })) === 7,
    'MagicReduction: удар мага слабее',
  );
  ok(
    new BossReduction(r(0.1)).apply(10, hit({ def: boss })) === 9,
    'BossReduction: удар босса слабее',
  );
  ok(
    new LowHpReduction(r(0.5)).apply(10, hit({ hero: hero({ hp: 40 }) })) === 5,
    'LowHpReduction: 40% здоровья и ниже',
  );
  ok(
    new LowHpReduction(r(0.5)).apply(10, hit({ hero: hero({ hp: 41 }) })) === 10,
    'LowHpReduction: выше порога молчит',
  );
  ok(
    new BigHitReduction(r(0.5)).apply(50, hit()) === 25,
    'BigHitReduction: удар больше 40% здоровья',
  );
  ok(new BigHitReduction(r(0.5)).apply(40, hit()) === 40, 'BigHitReduction: 40% — полный');
}

// ---------------------------------------------------------------- правила крита
// первое сработавшее правило решает; бросок генератора — только когда до правила дошла очередь
{
  const chances: number[] = [];
  const fakeRng = (answers: boolean[]): Rng => ({
    next: () => 0,
    int: (min) => min,
    chance: (p) => {
      chances.push(p);
      return answers.shift() ?? false;
    },
    pick: (arr) => arr[0],
    shuffle: (arr) => arr,
  });
  const foe = (hits: number): Card => ({ hits }) as Card;
  const roll = (o: Partial<CritRoll> = {}): CritRoll => ({
    enemy: null,
    ranged: false,
    inAbility: false,
    rng: fakeRng([]),
    ...o,
  });
  const opening = new RoomOpeningCrit();
  ok(
    opening.decide(roll()) === true && opening.decide(roll()) === undefined,
    'RoomOpeningCrit: крит только у первого удара комнаты',
  );
  const mark = new HuntersMarkCrit();
  ok(
    mark.decide(roll({ ranged: true, enemy: foe(0) })) === true &&
      mark.decide(roll({ ranged: true, enemy: foe(1) })) === undefined &&
      mark.decide(roll({ ranged: false, enemy: foe(0) })) === undefined,
    'HuntersMarkCrit: только выстрел по нетронутому врагу',
  );
  const third = new EveryNthCrit(EveryNthCrit.THIRD);
  const seq = [1, 2, 3, 4, 5, 6].map(() => third.decide(roll()) === true);
  ok(seq.join() === 'false,false,true,false,false,true', 'EveryNthCrit: каждый третий удар');
  chances.length = 0;
  const ability = new AbilityCrit(Percent.of(25));
  ok(
    ability.decide(roll()) === undefined && chances.length === 0,
    'AbilityCrit: вне способности молчит и не тратит бросок',
  );
  ok(
    ability.decide(roll({ inAbility: true, rng: fakeRng([true]) })) === true && chances[0] === 0.25,
    'AbilityCrit: способность критует с шансом 25%',
  );
  chances.length = 0;
  ok(
    new ChanceCrit(Percent.of(10)).decide(roll({ rng: fakeRng([false]) })) === false &&
      chances[0] === 0.1,
    'ChanceCrit: решает броском с шансом героя',
  );
  chances.length = 0;
  const policy = new CritPolicy([new RoomOpeningCrit(), new ChanceCrit(Percent.of(50))]);
  const rng = fakeRng([true]);
  ok(
    policy.decide(roll({ rng })) === true && chances.length === 0 && policy.decide(roll({ rng })),
    'CritPolicy: первое правило решило — до шанса дело не дошло',
  );
  ok(chances.length === 1, 'CritPolicy: второй удар решил шанс — один бросок');
}

// ---------------------------------------------------------------- мана: 1 за ход, цена ощущается
{
  const lin = CLASSES.mage.lineage;
  const stats = buildPlayerStats({
    classId: 'mage',
    lineage: newLineageSave(TREES[lin]),
    weapon: null,
    armor: null,
  });
  ok(stats.regen === 1, `мана восстанавливается по 1 за ход (${stats.regen})`);
  const bolt = PERK_BY_ID.mage_start.ability;
  const battle = RoomBattleFactory.standard().create({
    room: ROOMS[1],
    stats: { ...stats, maxHp: 100000 },
    weapon: null,
    armor: null,
    consumables: cons(),
    rng: makeRng(7),
  });
  battle.start();
  battle.cards.fill(null);
  battle.playerCell = CellIndex.of(4);
  battle.hp = 100000;
  battle.cards[1] = new Card({ uid: 777, kind: 'enemy', defId: 'skeleton', hp: 100000 });
  battle.res = 10;
  battle.usePerk('lightning');
  battle.tap(CellIndex.of(1));
  ok(
    battle.res === 10 - (bolt.cost ?? 0) + 1,
    `молния за ${bolt.cost} маны: 10 → ${battle.res} (с учётом +1 за ход)`,
  );
  // скидка «Экономия маны» не делает основной удар дешевле двух — иначе он окупался бы регенерацией
  const cheap = RoomBattleFactory.standard().create({
    room: ROOMS[1],
    stats: { ...stats, perkCostDown: 1 },
    weapon: null,
    armor: null,
    consumables: cons(),
    rng: makeRng(8),
  });
  ok(
    cheap.perkCostOf(bolt) === 2,
    `скидка не опускает цену молнии ниже 2 (${cheap.perkCostOf(bolt)})`,
  );
  ok(
    cheap.perkCostOf(PERK_BY_ID.mage_p2.ability) === (PERK_BY_ID.mage_p2.ability.cost ?? 0) - 1,
    'дорогие заклинания скидка удешевляет',
  );
}

// ---------------------------------------------------------------- плавающий крит
{
  const tree = TREES.mercenary;
  const base = buildPlayerStats({
    classId: 'mercenary',
    lineage: newLineageSave(tree),
    weapon: null,
    armor: null,
  });
  const stats = {
    ...base,
    crit: Percent.of(100),
    damage: 10,
    maxHp: 1e6,
    dodge: Percent.of(0),
    parry: Percent.of(0),
    block: Percent.of(0),
  };
  const battle = RoomBattleFactory.standard().create({
    room: ROOMS[0],
    stats,
    weapon: null,
    armor: null,
    consumables: cons(),
    rng: makeRng(5),
  });
  battle.start();
  battle.hp = 1e6;
  const seen = new Set<number>();
  let sum = 0;
  const N = 300;
  for (let i = 0; i < N; i++) {
    battle.cards[5] = new Card({ uid: 9000 + i, kind: 'enemy', defId: 'skeleton', hp: 999999 });
    const hit = battle
      .tap(CellIndex.of(5))
      .events.find((e) => e.type === 'hit' && e.target === 'enemy');
    ok(!!hit && hit.type === 'hit' && hit.crit, 'крит при шансе 100%');
    if (hit && hit.type === 'hit') {
      seen.add(hit.amount);
      sum += hit.amount;
    }
  }
  const lo = Math.round(10 * CombatBalance.critMulMin);
  const hi = Math.round(10 * CombatBalance.critMulMax);
  ok(
    [...seen].every((v) => v >= lo && v <= hi),
    `крит-урон в пределах ${lo}..${hi}: ${[...seen].sort((a, b) => a - b).join(',')}`,
  );
  ok(seen.size >= 5, `крит бьёт по-разному (разных значений: ${seen.size})`);
  const avg = sum / N;
  ok(avg > 10 * 1.4 && avg < 10 * 1.9, `средний крит разумный (${avg.toFixed(2)})`);
}

// ---------------------------------------------------------------- автоприменение расходников
{
  const mk = (
    lin: 'mage' | 'warrior' | 'archer' | 'mercenary',
    perks: string[] = [],
  ): RoomBattle => {
    const tree = TREES[lin];
    const ls = newLineageSave(tree);
    for (const id of perks) ls.ranks[id] = 1;
    const stats = buildPlayerStats({ classId: lin, lineage: ls, weapon: null, armor: null });
    const battle = RoomBattleFactory.standard().create({
      room: ROOMS[0],
      stats,
      weapon: null,
      armor: null,
      consumables: { potion_heal: 2, potion_regen: 2, artifact: 2 },
      rng: makeRng(3),
    });
    battle.start();
    battle.cards.fill(null);
    return battle;
  };
  const enemy = (atk: number, hp = 3): Card =>
    new Card({ uid: Math.floor(Math.random() * 1e9), kind: 'enemy', defId: 'skeleton', hp, atk });

  const heal = mk('mage');
  heal.pool.push(enemy(1));
  heal.hp = heal.stats.maxHp - heal.healPotionAmount();
  ok(needsHeal(heal), 'зелье исцеления: не хватает ровно на объём лечения — применяем');
  heal.hp = heal.stats.maxHp - heal.healPotionAmount() + 1;
  ok(!needsHeal(heal), 'зелье исцеления: лечение пропало бы зря — держим');
  heal.cards[5] = enemy(500);
  heal.hp = 3;
  ok(needsHeal(heal), 'зелье исцеления: рядом враг, удар может убить — пьём');
  heal.consumables.potion_heal = 0;
  ok(!needsHeal(heal), 'зелье исцеления: нет зелий — нечего применять');

  const regen = mk('mage');
  regen.cards[5] = enemy(1);
  regen.res = 0;
  ok(needsRegen(regen), 'зелье восстановления: мане не хватает на заклинание — применяем');
  regen.res = regen.stats.resMax;
  ok(!needsRegen(regen), 'зелье восстановления: маны хватает — держим');
  const warrior = mk('warrior');
  warrior.cards[5] = enemy(1);
  warrior.res = 0;
  ok(needsRegen(warrior), 'зелье восстановления: воину нужна выносливость на мощный удар');
  const merc = mk('mercenary');
  merc.cards[5] = enemy(1);
  merc.res = merc.stats.resMax - 1;
  ok(!needsRegen(merc), 'зелье восстановления: шкала почти полна — не тратим');
  merc.res = 0;
  ok(needsRegen(merc), 'зелье восстановления: шкала пуста — применяем');

  const art = mk('mage', ['perk/mage/p2']);
  const dmg = art.artifactDamage();
  art.cards[0] = enemy(1, dmg);
  art.cards[1] = enemy(1, dmg);
  ok(!worthArtifact(art), 'артефакт: две цели без опасности — держим');
  art.cards[2] = enemy(1, dmg);
  ok(worthArtifact(art), 'артефакт: три цели — применяем');
  ok(!worthArtifact(mk('warrior')), 'артефакт: только линейка мага');

  const pick = mk('mage', ['perk/mage/p2']);
  pick.cards[5] = enemy(500);
  pick.hp = 2;
  pick.res = 0;
  const cfg = { heal: true, regen: true, artifact: true };
  ok(pickAutoUse(pick, cfg) === 'potion_heal', 'выбор: сначала жизнь');
  ok(
    pickAutoUse(pick, { ...cfg, heal: false }) === 'potion_regen',
    'выбор: без лечения берём ресурс',
  );
  ok(
    pickAutoUse(pick, { heal: false, regen: false, artifact: false }) === null,
    'выбор: всё выключено — ничего не применяется',
  );
}
