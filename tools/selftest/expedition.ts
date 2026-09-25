/** Самопроверка: Забег: перенос героя между комнатами, оплата комнаты, рекорд, подъём по башне. */
import { CLASSES } from '../../src/domain/catalog/classes';
import { ROOMS } from '../../src/domain/catalog/levels';
import { type BattleCarryStats, RoomBattleFactory } from '../../src/domain/combat/room-battle';
import { RecordPolicy, RoomPayout, TowerClimb } from '../../src/domain/expedition';
import { newLineageSave, TREES } from '../../src/domain/progression/skill-tree';
import { buildPlayerStats } from '../../src/domain/progression/stats/stats';
import { Gold, Ratio, Souls } from '../../src/domain/shared';
import { makeRng } from '../../src/domain/shared/rng/rng';
import { cons, ok } from './harness';

// ---------------------------------------------------------------- забег: перенос между комнатами
{
  const lin = CLASSES.mage.lineage;
  const stats = buildPlayerStats({
    classId: 'mage',
    lineage: newLineageSave(TREES[lin]),
    weapon: null,
    armor: null,
  });
  const mk = (carry?: BattleCarryStats) =>
    RoomBattleFactory.standard().create({
      room: ROOMS[1],
      stats,
      weapon: null,
      armor: null,
      consumables: cons(),
      rng: makeRng(5),
      carry,
    });
  const first = mk();
  ok(
    first.hp === stats.maxHp && first.res === stats.resMax,
    'первая комната забега: полное здоровье и полная шкала',
  );
  first.hp = 7;
  first.res = 3;
  const next = mk(first.carryOut());
  ok(next.hp === 7 && next.res === 3, 'здоровье и мана переходят в следующую комнату');
  const clamp = mk({
    hp: stats.maxHp * 5,
    res: stats.resMax * 5,
    revived: false,
    selfRevived: false,
  });
  ok(clamp.hp === stats.maxHp && clamp.res === stats.resMax, 'перенос не превышает максимум');
  ok(
    mk({ hp: 0, res: -4, revived: false, selfRevived: false }).hp === 1,
    'в новую комнату герой входит живым',
  );
  ok(
    mk({ hp: 5, res: 0, revived: true, selfRevived: false }).revived,
    'воскрешение за рекламу — одно на забег',
  );
  // «Возвращение» тоже одно на забег: истраченное в прошлой комнате не возвращается
  const rs = { ...stats, reviveHp: Ratio.of(0.5) };
  const up = RoomBattleFactory.standard().create({
    room: ROOMS[1],
    stats: rs,
    weapon: null,
    armor: null,
    consumables: cons(),
    rng: makeRng(5),
  });
  up.over = 'lose';
  ok(!!up.autoRevive(), '«Возвращение» поднимает героя');
  const after = RoomBattleFactory.standard().create({
    room: ROOMS[2],
    stats: rs,
    weapon: null,
    armor: null,
    consumables: cons(),
    rng: makeRng(6),
    carry: up.carryOut(),
  });
  after.over = 'lose';
  ok(after.autoRevive() === null, '«Возвращение» не срабатывает второй раз в том же забеге');
}

// ---------------------------------------------------------------- забег: оплата комнаты, рекорд, подъём
{
  const room = ROOMS[3];
  const totals = { gold: Gold.of(12), souls: Souls.of(4), kills: 3, damageTaken: 0, turns: 5 };
  const pay = RoomPayout.of(room, totals);
  ok(
    pay.gold === 12 + room.clearGold && pay.souls === 4 + room.clearSouls,
    'пройденная комната платит сумку боя и бонус комнаты',
  );
  ok(pay.flawless, 'комната без ран — «без урона»');
  ok(
    !RoomPayout.of(room, { ...totals, damageTaken: 1 }).flawless,
    'одна рана — уже не «без урона»',
  );
  ok(
    RoomPayout.atStake(totals) &&
      RoomPayout.atStake({ ...totals, gold: Gold.of(0) }) &&
      !RoomPayout.atStake({ ...totals, gold: Gold.of(0), souls: Souls.of(0) }),
    'добыча в сумке пропадёт при уходе, пустой сумке терять нечего',
  );

  const start = TowerClimb.start(7);
  ok(
    start.index === 0 &&
      start.rooms === 0 &&
      start.gold === 0 &&
      start.souls === 0 &&
      start.best === 7 &&
      !start.hero,
    'забег начинается с пустыми руками и помнит рекорд героя',
  );
  ok(TowerClimb.room(start) === ROOMS[0], 'забег начинается с 1-1');
  const hero = { hp: 10, res: 2, revived: true, selfRevived: false };
  const next = TowerClimb.advance(start, pay, hero);
  ok(
    next.index === 1 &&
      next.rooms === 1 &&
      next.gold === pay.gold &&
      next.souls === pay.souls &&
      next.hero === hero &&
      next.best === 7,
    'после комнаты — следующая комната, заработанное копится, герой переходит',
  );
  ok(start.index === 0 && start.rooms === 0, 'переход не меняет прежнее состояние забега');
  ok(TowerClimb.nextRoomId(next) === ROOMS[1].id, 'номер следующей комнаты');
  const top = { ...start, index: ROOMS.length };
  ok(
    TowerClimb.complete(top) && !TowerClimb.complete(next),
    'башня пройдена после последней комнаты',
  );
  ok(TowerClimb.room(top) === ROOMS[ROOMS.length - 1], 'после вершины комната — последняя в башне');
  ok(TowerClimb.length === ROOMS.length, 'длина подъёма — все комнаты башни');

  ok(RecordPolicy.climb(next) === 1, 'в рекорд сразу пишется число пройденных комнат');
  ok(
    RecordPolicy.isRecord({ ...next, best: 0 }) && !RecordPolicy.isRecord({ ...next, best: 1 }),
    'новый рекорд — только если пройдено больше, чем до забега',
  );
}
