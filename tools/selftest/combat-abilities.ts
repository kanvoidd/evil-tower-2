/** Самопроверка: Способности в бою — по одной проверке на механику каждой способности. */
import type { ClassId } from '../../src/domain/catalog';
import { CLASSES } from '../../src/domain/catalog/classes';
import { ROOMS } from '../../src/domain/catalog/levels';
import { PERK_BY_ID } from '../../src/domain/catalog/perks';
import type { IAttackStrategy } from '../../src/domain/combat/attack';
import { Card } from '../../src/domain/combat/card';
import { Grid } from '../../src/domain/combat/engine';
import { type RoomBattle, RoomBattleFactory } from '../../src/domain/combat/room-battle';
import { newLineageSave, TREES } from '../../src/domain/progression/skill-tree';
import { buildPlayerStats } from '../../src/domain/progression/stats/stats';
import { CellIndex, Gold } from '../../src/domain/shared';
import { makeRng } from '../../src/domain/shared/rng/rng';
import { cons, ok } from './harness';

// ---------------------------------------------------------------- способности в бою
/** «Взведённая ловушка» заряжена: выбрать для неё первую подходящую способность. */
const pickTrapSkill = (battle: RoomBattle): void => {
  const trap = battle.armed;
  if (trap?.behavior !== 'armed_trap' || battle.trapSkill) return;
  const skill = battle.stats.abilities.find((a) => battle.canArmWith(trap, a));
  if (skill) battle.usePerk(skill.id);
};

/** Навести заряженную способность на первую подходящую цель; «Перестановке» нужно второе касание. */
const aim = (battle: RoomBattle, label: string): void => {
  pickTrapSkill(battle);
  const cell = Grid.CELLS.slice(1).find((c) => battle.perkTargetOk(battle.armed!, c));
  ok(cell !== undefined, `${label}: нашлась подходящая цель`);
  if (cell === undefined) return;
  ok(battle.tap(cell).ok, `${label}: способность наводится на цель`);
  if (battle.armed) ok(battle.tap(CellIndex.of(cell === 1 ? 2 : 1)).ok, `${label}: второе касание`);
};

{
  const build = (id: ClassId, patch: Record<string, number> = {}) => {
    const lin = CLASSES[id].lineage;
    const tree = TREES[lin];
    const ls = newLineageSave(tree);
    for (const n of tree.nodes) {
      if (n.kind === 'class' && CLASSES[n.classId!].stage <= CLASSES[id].stage) ls.ranks[n.id] = 1;
      if (n.kind === 'perk' && n.owner === id) ls.ranks[n.id] = 1;
    }
    const base = buildPlayerStats({ classId: id, lineage: ls, weapon: null, armor: null });
    return { ...base, maxHp: 100000, damage: 40, ...patch };
  };
  const enemy = (hp: number, atk = 1): Card =>
    new Card({ uid: Math.floor(Math.random() * 1e9), kind: 'enemy', defId: 'skeleton', hp, atk });

  let used = 0;
  for (const id of Object.keys(CLASSES) as ClassId[]) {
    const stats = build(id);
    for (const perk of [
      ...stats.abilities,
      ...stats.allAbilities.filter((a) => a.kind === 'basic'),
    ]) {
      const battle = RoomBattleFactory.standard().create({
        room: ROOMS[20],
        stats,
        weapon: null,
        armor: null,
        consumables: cons(),
        rng: makeRng(7),
      });
      battle.start();
      battle.cards.fill(null);
      // герой в углу: «Магический выстрел» бьёт только ЧЕРЕЗ карту, а из центра
      // поля на одной линии нет ни одной клетки на расстоянии двух
      battle.playerCell = CellIndex.of(0);
      battle.hp = 100000;
      battle.res = stats.resMax;
      for (const c of Grid.CELLS.slice(1)) battle.cards[c] = enemy(500, 3);
      battle.cards[0] = null;
      // «Сокол-курьер» и «Перестановка» работают с картами добычи, «Подкуп» — с золотом кошеля
      battle.cards[8] = new Card({ uid: Math.floor(Math.random() * 1e9), kind: 'gold', value: 25 });
      battle.totals.gold = Gold.of(400);
      if (perk.kind === 'basic') {
        const act = battle.actionFor(CellIndex.of(2));
        ok(
          act.kind === 'ranged' || act.kind === 'none',
          `${id}/${perk.id}: базовое действие определено`,
        );
        continue;
      }
      const res = battle.usePerk(perk.id);
      ok(res.ok, `${id}/${perk.id}: способность применяется (${res.reason ?? ''})`);
      if (!res.ok) continue;
      used++;
      if (battle.armed) aim(battle, `${id}/${perk.id}`);
      ok(
        battle.res >= 0 && battle.res <= battle.stats.resMax,
        `${id}/${perk.id}: ресурс в пределах шкалы`,
      );
      ok(
        battle.cards.every((c, i) => (i === battle.playerCell ? c === null : true)),
        `${id}/${perk.id}: клетка героя пуста`,
      );
    }
  }
  ok(used >= 44, `проверены все активные способности (${used})`);

  // базовая атака у всех одна: маг и охотник тоже бьют рукой соседнего врага
  {
    for (const id of ['mage', 'elementalist', 'hunter', 'crossbowman'] as ClassId[]) {
      const stats = build(id);
      const battle = RoomBattleFactory.standard().create({
        room: ROOMS[10],
        stats,
        weapon: null,
        armor: null,
        consumables: cons(),
        rng: makeRng(11),
      });
      battle.start();
      battle.cards.fill(null);
      battle.playerCell = CellIndex.of(4);
      battle.cards[1] = enemy(500, 3);
      battle.hp = 100000;
      ok(battle.actionFor(CellIndex.of(1)).kind === 'melee', `${id}: соседнего врага бьёт рукой`);
      ok(battle.tap(CellIndex.of(1)).ok, `${id}: удар рукой — ход`);
      ok(battle.cards[1] !== null && battle.cards[1]!.hp < 500, `${id}: враг получил урон`);
    }
    // ход на пустую соседнюю клетку — полноценный ход для всех классов
    for (const id of ['warrior', 'bowman', 'mage', 'ninja'] as ClassId[]) {
      const stats = build(id);
      const battle = RoomBattleFactory.standard().create({
        room: ROOMS[10],
        stats,
        weapon: null,
        armor: null,
        consumables: cons(),
        rng: makeRng(12),
      });
      battle.start();
      battle.cards.fill(null);
      battle.playerCell = CellIndex.of(4);
      battle.hp = 100000;
      ok(battle.actionFor(CellIndex.of(3)).kind === 'move', `${id}: пустая соседняя клетка — ход`);
      ok(
        battle.actionFor(CellIndex.of(0)).kind === 'none',
        `${id}: пустая клетка по диагонали недоступна`,
      );
      const turns = battle.totals.turns;
      ok(
        battle.tap(CellIndex.of(3)).ok && battle.playerCell === 3,
        `${id}: герой встал на пустую клетку`,
      );
      ok(battle.totals.turns > turns, `${id}: шаг по пустой клетке засчитан ходом`);
    }
  }

  // Пустые сундуки есть в колоде и ничего не дают; зелья стали редкостью
  {
    let empties = 0;
    let chests = 0;
    let potions = 0;
    let cards = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const battle = RoomBattleFactory.standard().create({
        room: ROOMS[12],
        stats: build('warrior'),
        weapon: null,
        armor: null,
        consumables: cons(),
        rng: makeRng(seed),
      });
      battle.start();
      for (const c of [...battle.cards, ...battle.pool]) {
        if (!c) continue;
        cards++;
        if (c.kind === 'chest') chests++;
        if (c.defId === 'chest_empty') empties++;
        if (c.kind === 'potion_heal' || c.kind === 'potion_regen') potions++;
      }
    }
    ok(
      empties > 0 && empties >= chests / 2,
      `пустых сундуков не меньше половины (${empties} из ${chests})`,
    );
    ok(potions / cards < 0.1, `зелий меньше 10% колоды (${((100 * potions) / cards).toFixed(1)}%)`);
    const battle = RoomBattleFactory.standard().create({
      room: ROOMS[12],
      stats: build('warrior'),
      weapon: null,
      armor: null,
      consumables: cons(),
      rng: makeRng(5),
    });
    battle.start();
    battle.cards.fill(null);
    battle.playerCell = CellIndex.of(4);
    const box = new Card({
      uid: Math.floor(Math.random() * 1e9),
      kind: 'chest',
      defId: 'chest_empty',
    });
    battle.cards[1] = box;
    const gold = battle.totals.gold;
    const res = battle.tap(CellIndex.of(1));
    ok(
      res.events.some((e) => e.type === 'chest' && e.empty),
      'пустой сундук открывается пустым',
    );
    ok(battle.totals.gold === gold, 'из пустого сундука ничего не выпало');
  }

  // «Абсолютная защита» больше не даёт неуязвимости: после способности удар слабее не больше чем вдвое
  {
    const stats = build('magister', { perkDef: 3 } as Record<string, number>);
    const battle = RoomBattleFactory.standard().create({
      room: ROOMS[10],
      stats,
      weapon: null,
      armor: null,
      consumables: cons(),
      rng: makeRng(73),
    });
    battle.start();
    battle.cards.fill(null);
    battle.playerCell = CellIndex.of(4);
    battle.hp = 100000;
    battle.res = 100;
    battle.parts.perks.afterPerk();
    ok(
      battle.state.perkGuard === 0.5,
      `защита после способности не выше 50% (${battle.state.perkGuard})`,
    );
  }

  // «Поддержка с воздуха»: после удара рукой сокол бьёт ту же цель, соседи не задеты
  {
    const stats = build('beastmaster', { echoChance: 1, echoDmg: 0.6 } as Record<string, number>);
    const battle = RoomBattleFactory.standard().create({
      room: ROOMS[10],
      stats,
      weapon: null,
      armor: null,
      consumables: cons(),
      rng: makeRng(71),
    });
    battle.start();
    battle.cards.fill(null);
    battle.playerCell = CellIndex.of(4);
    battle.hp = 100000;
    battle.cards[1] = enemy(100000, 1);
    battle.cards[3] = enemy(100000, 1);
    const hits = battle
      .tap(CellIndex.of(1))
      .events.filter((e) => e.type === 'hit' && e.target === 'enemy')
      .map((e) => (e as { cell: number }).cell);
    ok(
      hits.length === 2 && hits.every((c) => c === 1),
      `поддержка с воздуха бьёт ту же цель второй раз (${hits.join(',')})`,
    );
  }

  // Агр: отвечает тот, с кем вступил в бой, и те, под чью руку герой шагнул, отказавшись от удара.
  {
    const stats = build('warrior');
    const mk2 = (seed: number) => {
      const battle = RoomBattleFactory.standard().create({
        room: ROOMS[10],
        stats,
        weapon: null,
        armor: null,
        consumables: cons(),
        rng: makeRng(seed),
      });
      battle.start();
      battle.cards.fill(null);
      battle.playerCell = CellIndex.of(4);
      battle.hp = 100000;
      battle.shield = 0;
      battle.res = stats.resMax;
      return battle;
    };
    const strikers = (events: ReturnType<RoomBattle['tap']>['events']) =>
      events
        .filter((e) => e.type === 'attack' && e.by === 'enemy')
        .map((e) => (e as { from: number }).from)
        .sort();

    // бью одного из трёх соседей — отвечает только он
    const fight = mk2(41);
    for (const c of [1, 3, 5]) fight.cards[c] = enemy(100000, 20);
    ok(
      JSON.stringify(strikers(fight.tap(CellIndex.of(1)).events)) === '[1]',
      'отвечает только тот, кого ударили',
    );

    // способность по врагу — тоже вступление в бой
    const magic = mk2(42);
    magic.cards[1] = enemy(100000, 20);
    magic.cards[3] = enemy(100000, 20);
    magic.usePerk('power_strike');
    const r2 = magic.tap(CellIndex.of(1));
    ok(
      JSON.stringify(strikers(r2.events)) === '[1]',
      'после способности отвечает её цель, сосед молчит',
    );

    // мог ударить, но ушёл туда, где рядом никого, — урона нет
    const flee2 = mk2(44);
    flee2.cards[1] = enemy(100000, 20);
    const r3 = flee2.tap(CellIndex.of(3));
    ok(strikers(r3.events).length === 0, 'ушёл от врага на свободную клетку — без урона');

    // мог ударить, но шагнул под руку другому врагу — бьёт тот, кто достаёт до новой клетки
    const expose = mk2(48);
    expose.cards[1] = enemy(100000, 20);
    expose.cards[6] = enemy(100000, 20);
    const r5 = expose.tap(CellIndex.of(3));
    ok(
      JSON.stringify(strikers(r5.events)) === '[6]',
      `подставился — бьёт тот, кто рядом с новой клеткой (${strikers(r5.events).join(',')})`,
    );

    // подошёл к врагу, но не бил его и ударить было некого — он не бьёт (в бой ещё не вступили)
    const approach = mk2(45);
    approach.cards[6] = enemy(100000, 20);
    const r4 = approach.tap(CellIndex.of(3));
    ok(strikers(r4.events).length === 0, 'подошёл к врагу — он ждёт, а не бьёт');

    // на добыче рядом с врагами ману не накопишь: шаг мимо удара под чужую руку — больно
    const farm = mk2(46);
    farm.cards[1] = enemy(100000, 20);
    farm.cards[0] = enemy(100000, 20);
    const hp0 = farm.hp;
    farm.tap(CellIndex.of(3));
    ok(farm.hp < hp0, 'бегать по клеткам рядом с врагами больно');

    // маг бьёт рукой, поэтому шаг мимо удара под чужую руку наказывается и без маны
    const mstats = build('mage');
    const dry = RoomBattleFactory.standard().create({
      room: ROOMS[10],
      stats: mstats,
      weapon: null,
      armor: null,
      consumables: cons(),
      rng: makeRng(49),
    });
    dry.start();
    dry.cards.fill(null);
    dry.playerCell = CellIndex.of(4);
    dry.hp = 100000;
    dry.shield = 0;
    dry.res = 0;
    dry.cards[1] = enemy(100000, 20);
    dry.cards[6] = enemy(100000, 20);
    ok(
      JSON.stringify(strikers(dry.tap(CellIndex.of(3)).events)) === '[6]',
      'маг без маны прошёл мимо удара под чужую руку — бьют',
    );
  }

  // Колода бесконечна, карта перехода открывает выход только после нормы
  {
    const stats = build('warrior');
    const battle = RoomBattleFactory.standard().create({
      room: ROOMS[10],
      stats,
      weapon: null,
      armor: null,
      consumables: cons(),
      rng: makeRng(47),
    });
    battle.start();
    battle.hp = 100000;
    ok(
      battle.cards.every((c, i) => (i === battle.playerCell ? c === null : c !== null)),
      'после раздачи поле заполнено',
    );
    ok(!battle.exitOpen, 'выход закрыт, пока норма не выполнена');
    ok(battle.totalEnemies > 0 && battle.killsLeft === battle.totalEnemies, 'норма комнаты задана');
    let steps = 0;
    for (; steps < 900 && !battle.over; steps++) {
      const cells = Grid.CELLS.filter((c) => battle.actionFor(c).kind !== 'none');
      if (!cells.length) break;
      const exitCell = cells.find((c) => battle.cards[c]?.kind === 'exit');
      battle.tap(exitCell ?? cells[0]);
      battle.hp = 100000;
      if (!battle.over) {
        const empty = battle.cards.filter((c, i) => !c && i !== battle.playerCell).length;
        ok(empty === 0, `поле не пустеет (пустых клеток ${empty})`);
      }
    }
    ok(
      battle.over === 'win',
      `комната закрывается шагом на переход (${battle.over ?? 'не закончилась'}, ходов ${steps})`,
    );
    ok(battle.exitOpen && battle.killsLeft === 0, 'выход открылся после нормы');
    // уходя, герой бросает всё, что не подобрал: в этом и выбор
    ok(
      battle.cards.some((c) => c && c.kind !== 'enemy'),
      'добыча остаётся на поле после перехода',
    );
  }

  // Норма выполнена — но враги лезть не перестают: либо уходи, либо рискуй и добирай
  {
    const stats = build('warrior');
    const battle = RoomBattleFactory.standard().create({
      room: ROOMS[10],
      stats,
      weapon: null,
      armor: null,
      consumables: cons(),
      rng: makeRng(61),
    });
    battle.start();
    battle.hp = 100000;
    // выполняем норму искусственно и дальше играем, не трогая переход
    for (let guard = 0; guard < 600 && !battle.exitOpen; guard++) {
      const cell = Grid.CELLS.find(
        (c) => battle.actionFor(c).kind !== 'none' && battle.cards[c]?.kind !== 'exit',
      );
      if (cell === undefined) break;
      battle.tap(cell);
      battle.hp = 100000;
    }
    ok(battle.exitOpen, 'норма выполнена');
    let spawned = 0;
    for (let guard = 0; guard < 120 && !battle.over; guard++) {
      const cell = Grid.CELLS.find(
        (c) => battle.actionFor(c).kind !== 'none' && battle.cards[c]?.kind !== 'exit',
      );
      if (cell === undefined) break;
      spawned += battle
        .tap(cell)
        .events.filter((e) => e.type === 'spawn' && e.card.kind === 'enemy').length;
      battle.hp = 100000;
    }
    ok(spawned > 0, `враги продолжают лезть после нормы (${spawned})`);
  }

  // Кто умеет бить рукой — не попадает в тупик никогда.
  {
    for (const id of Object.keys(CLASSES) as ClassId[]) {
      const stats = build(id);
      if (!stats.attack.melee) continue;
      const battle = RoomBattleFactory.standard().create({
        room: ROOMS[30],
        stats,
        weapon: null,
        armor: null,
        consumables: cons(),
        rng: makeRng(17),
      });
      battle.start();
      battle.cards.fill(null);
      battle.playerCell = CellIndex.of(4);
      battle.hp = 100000;
      battle.res = 0;
      for (const c of [0, 1, 2, 3, 5, 6, 7, 8]) battle.cards[c] = enemy(500, 3);
      ok(!battle.cornered(), `${id}: боец рукой в тупик не попадает`);
      ok(
        [1, 3, 5, 7].map(CellIndex.of).some((c) => battle.actionFor(c).kind === 'melee'),
        `${id}: соседний враг доступен рукой`,
      );
    }
  }

  // «Растерзание»: героя, которому нечем ответить, зажатого со всех сторон, карты добивают насмерть.
  // Рукой сейчас бьют все, поэтому «безрукого» героя собираем стратегией-заглушкой.
  {
    const noHand: IAttackStrategy = {
      melee: false,
      mode: 'none',
      mul: 1,
      guaranteedCrit: false,
      style: 'shot',
      reaches: () => false,
    };
    const handless = (id: ClassId) => ({ ...build(id), attack: noHand });
    const surround = (
      id: ClassId,
      patch: Partial<{ res: number; potion_regen: number; artifact: number }> = {},
    ) => {
      const stats = handless(id);
      const battle = RoomBattleFactory.standard().create({
        room: ROOMS[30],
        stats,
        weapon: null,
        armor: null,
        consumables: {
          ...cons(),
          potion_regen: patch.potion_regen ?? 0,
          artifact: patch.artifact ?? 0,
        },
        rng: makeRng(17),
      });
      battle.start();
      battle.cards.fill(null);
      battle.playerCell = CellIndex.of(4);
      battle.hp = 400;
      battle.res = patch.res ?? 0;
      for (const c of [0, 1, 2, 3, 5, 6, 7, 8]) battle.cards[c] = enemy(100000, 3);
      return battle;
    };
    ok(surround('elementalist').cornered(), 'без руки и маны в окружении — тупик');
    // Ход, который сам загоняет в угол: герой шагает на пустую клетку, освободившуюся
    // занимает новый враг — и в конце хода отбиваться уже нечем.
    {
      const battle = RoomBattleFactory.standard().create({
        room: ROOMS[30],
        stats: handless('mage'),
        weapon: null,
        armor: null,
        consumables: cons(),
        rng: makeRng(29),
      });
      battle.start();
      battle.cards.fill(null);
      battle.pool.length = 0;
      battle.pool.push(enemy(100000, 4));
      battle.playerCell = CellIndex.of(0);
      battle.hp = 400;
      battle.res = 0;
      battle.cards[1] = enemy(100000, 4);
      battle.cards[4] = enemy(100000, 4);
      battle.cards[6] = enemy(100000, 4);
      const res = battle.tap(CellIndex.of(3));
      ok(res.ok, 'шаг на пустую клетку сделан');
      ok(
        res.events.some((e) => e.type === 'swarm'),
        'карты бросаются на героя',
      );
      ok(battle.over === 'lose' && battle.hp === 0, 'растерзание доводит до смерти');
      const hits = res.events.filter((e) => e.type === 'hit' && e.target === 'player').length;
      ok(hits >= 4, `бьют все карты по очереди (${hits})`);
    }
    // выходы из окружения: ресурс на способность, зелье восстановления, артефакт мага
    ok(!surround('elementalist', { res: 20 }).cornered(), 'мана на способность — не тупик');
    ok(
      !surround('elementalist', { potion_regen: 1 }).cornered(),
      'зелье восстановления — не тупик',
    );
    ok(!surround('mage', { artifact: 1 }).cornered(), 'артефакт мага — не тупик');
  }

  // постоянное клеймо не вешается на уже заклеймённую цель — ход не пропадает зря
  {
    const cases: Array<[ClassId, string, (c: Card) => void]> = [
      ['assassin', 'assassin_p2', (c) => (c.vuln = 1)],
      ['darkassassin', 'darkassassin_start', (c) => (c.mark = 3)],
    ];
    for (const [id, perkId2, apply] of cases) {
      const stats = build(id);
      const battle = RoomBattleFactory.standard().create({
        room: ROOMS[30],
        stats,
        weapon: null,
        armor: null,
        consumables: cons(),
        rng: makeRng(23),
      });
      battle.start();
      battle.cards.fill(null);
      battle.playerCell = CellIndex.of(4);
      battle.hp = 100000;
      battle.res = stats.resMax;
      battle.cards[1] = enemy(500, 3);
      const perk = PERK_BY_ID[perkId2].ability;
      ok(battle.perkTargetOk(perk, CellIndex.of(1)), `${perkId2}: чистая цель подходит`);
      apply(battle.cards[1]!);
      ok(
        !battle.perkTargetOk(perk, CellIndex.of(1)),
        `${perkId2}: заклеймённая цель больше не подсвечивается`,
      );
    }
  }

  // у каждой способности есть своя вспышка
  {
    let noFx = 0;
    for (const id of Object.keys(CLASSES) as ClassId[]) {
      const stats = build(id);
      for (const perk of stats.abilities) {
        const battle = RoomBattleFactory.standard().create({
          room: ROOMS[20],
          stats,
          weapon: null,
          armor: null,
          consumables: cons(),
          rng: makeRng(13),
        });
        battle.start();
        battle.cards.fill(null);
        battle.playerCell = CellIndex.of(0);
        battle.hp = 100000;
        battle.res = stats.resMax;
        battle.totals.gold = Gold.of(400);
        for (const c of [1, 2, 3, 4, 5, 6, 7]) battle.cards[c] = enemy(500, 3);
        battle.cards[8] = new Card({
          uid: Math.floor(Math.random() * 1e9),
          kind: 'gold',
          value: 25,
        });
        const r = battle.usePerk(perk.id);
        let events = r.events;
        pickTrapSkill(battle);
        while (battle.armed) {
          const cell = Grid.CELLS.slice(1).find((c) => battle.perkTargetOk(battle.armed!, c));
          if (cell === undefined) break;
          // «Перестановка» требует двух касаний — эффект рисуется на последнем
          events = [...events, ...battle.tap(cell).events];
        }
        const drew = events.some(
          (e) => e.type === 'fx' || e.type === 'cast' || (e.type === 'attack' && e.by === 'player'),
        );
        if (!drew) noFx++;
        ok(drew, `${id}/${perk.id}: способность рисует эффект`);
      }
    }
    ok(noFx === 0, `все способности со вспышкой (без эффекта: ${noFx})`);
  }

  // «один раз за комнату» действительно один раз
  {
    const stats = build('berserk');
    const battle = RoomBattleFactory.standard().create({
      room: ROOMS[20],
      stats,
      weapon: null,
      armor: null,
      consumables: cons(),
      rng: makeRng(3),
    });
    battle.start();
    battle.cards.fill(null);
    for (const c of [0, 1, 3, 5]) battle.cards[c] = enemy(400, 2);
    battle.hp = 100000;
    battle.res = stats.resMax;
    ok(battle.usePerk('madness').ok, 'легендарная способность применяется');
    battle.res = stats.resMax;
    ok(!battle.usePerk('madness').ok, 'легендарная способность — один раз за комнату');
  }

  // оглушение: враг не отвечает
  {
    const stats = build('knight');
    const battle = RoomBattleFactory.standard().create({
      room: ROOMS[10],
      stats,
      weapon: null,
      armor: null,
      consumables: cons(),
      rng: makeRng(4),
    });
    battle.start();
    battle.cards.fill(null);
    battle.playerCell = CellIndex.of(4);
    battle.cards[1] = enemy(100000, 50);
    battle.hp = 100000;
    battle.res = stats.resMax;
    const before = battle.hp;
    battle.usePerk('shield_bash');
    const res = battle.tap(CellIndex.of(1));
    ok(res.ok, 'таран щитом применяется');
    ok(
      res.events.some((e) => e.type === 'miss' && e.kind === 'stun'),
      'оглушённый враг пропускает ход врагов',
    );
    ok(battle.hp === before, 'оглушённый враг не наносит урона');
  }

  // талант «перк сильнее» действительно усиливает способность
  {
    const weak = build('warrior');
    const strong = { ...weak, perkPower: 2 };
    const hit = (stats: typeof weak): number => {
      const battle = RoomBattleFactory.standard().create({
        room: ROOMS[10],
        stats,
        weapon: null,
        armor: null,
        consumables: cons(),
        rng: makeRng(21),
      });
      battle.start();
      battle.cards.fill(null);
      battle.playerCell = CellIndex.of(4);
      battle.cards[1] = enemy(100000, 0);
      battle.hp = 100000;
      battle.res = stats.resMax;
      battle.usePerk('power_strike');
      battle.tap(CellIndex.of(1));
      return 100000 - battle.cards[1]!.hp;
    };
    ok(hit(strong) > hit(weak), 'талант «способности сильнее» повышает урон способности');
  }
}
