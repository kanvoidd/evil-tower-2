/**
 * Самопроверка: механики профессионального развития мага и охотника — каждая на маленьком поле:
 * поджог и взрыв, лёд, молния и «Перегрузка», цепь, выстрел по линии и «Заряд», манипуляция полем,
 * скверна и мёртвый слуга, щит, выстрел через карту, стрелок на месте, болт, крюк, кабаны, сокол,
 * капкан и взведённая ловушка.
 */
import {
  ABILITY_BY_ID,
  abilityAtLevel,
  type AbilityDef,
  type ClassId,
  withPatch,
} from '../../src/domain/catalog';
import { CLASSES } from '../../src/domain/catalog/classes';
import { ROOMS } from '../../src/domain/catalog/levels';
import { Card } from '../../src/domain/combat/card';
import { Grid } from '../../src/domain/combat/engine';
import type { PlayerStats } from '../../src/domain/combat/player';
import { type RoomBattle, RoomBattleFactory } from '../../src/domain/combat/room-battle';
import { newLineageSave, TREES } from '../../src/domain/progression/skill-tree';
import { buildPlayerStats } from '../../src/domain/progression/stats/stats';
import { CellIndex, Ratio } from '../../src/domain/shared';
import { makeRng } from '../../src/domain/shared/rng/rng';
import { cons, ok } from './harness';

let uid = 1_000_000;
/** Враг без свойств (скелет) или с бронёй (замёрзший рыцарь, броня 9). */
const enemy = (hp: number, atk = 1, defId = 'skeleton'): Card =>
  new Card({ uid: uid++, kind: 'enemy', defId, hp, atk });
const gold = (value: number): Card => new Card({ uid: uid++, kind: 'gold', value });

/**
 * Герой класса `id` с купленными узлами дерева (`ranks`: id узла → ранг) и правкой характеристик;
 * без уворота, парирования, блока и крита, чтобы числа были точными.
 */
const hero = (
  id: ClassId,
  ranks: Record<string, number> = {},
  patch: Partial<PlayerStats> = {},
): PlayerStats => {
  const tree = TREES[CLASSES[id].lineage];
  const ls = newLineageSave(tree);
  for (let c: ClassId | undefined = id; c; c = CLASSES[c].parents[0])
    ls.ranks[tree.classNode[c].id] = 1;
  Object.assign(ls.ranks, ranks);
  const s = buildPlayerStats({ classId: id, lineage: ls, weapon: null, armor: null });
  return {
    ...s,
    maxHp: 100000,
    damage: 40,
    dodge: 0 as PlayerStats['dodge'],
    parry: 0 as PlayerStats['parry'],
    block: 0 as PlayerStats['block'],
    crit: 0 as PlayerStats['crit'],
    ...patch,
  };
};

/** Пустое поле, герой на клетке `at`, много здоровья и полная шкала; колода пуста. */
const arena = (stats: PlayerStats, at = 4, seed = 5): RoomBattle => {
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
  battle.pool.length = 0;
  battle.playerCell = CellIndex.of(at);
  battle.hp = 100000;
  battle.shield = 0;
  battle.res = stats.resMax;
  return battle;
};

const C = CellIndex.of;
/** Применить способность по клетке (или на себя) и вернуть события хода. */
const cast = (battle: RoomBattle, id: string, cell?: number) => {
  const r = battle.usePerk(id);
  ok(r.ok, `${id}: кнопка нажата (${r.reason ?? ''})`);
  return cell === undefined ? r : battle.tap(C(cell));
};
/** Урон по врагу в событиях хода. */
const dealt = (events: ReturnType<RoomBattle['tap']>['events'], cell: number): number =>
  events
    .filter((e) => e.type === 'hit' && e.target === 'enemy' && e.cell === cell)
    .reduce((a, e) => a + (e as { amount: number }).amount, 0);
/** Ход без шага: удар рукой по неубиваемому соседу без атаки. */
const wait = (battle: RoomBattle, cell: number): void => {
  if (!battle.cards[cell]) battle.cards[cell] = enemy(1e9, 0);
  battle.tap(C(cell));
  battle.hp = 100000;
};
/** Способности героя с заменой одной (для правки чисел в проверке). */
const withAbility = (stats: PlayerStats, a: AbilityDef): PlayerStats => ({
  ...stats,
  abilities: [...stats.abilities.filter((x) => x.id !== a.id), a],
  allAbilities: [...stats.allAbilities.filter((x) => x.id !== a.id), a],
});

// ---------------------------------------------------------------- огонь
{
  const fire1 = { 'perk/elementalist/fire-1': 1 };
  const b = arena(hero('elementalist', fire1));
  b.cards[1] = enemy(100000);
  const r = cast(b, 'ignite', 1);
  ok(b.cards[1]!.burn === 2 && dealt(r.events, 1) === 0, 'поджог: два тика горения, без удара');
  let ticks = 0;
  for (let i = 0; i < 4; i++) {
    const hp = b.cards[1]!.hp;
    wait(b, 3);
    if (b.cards[1]!.hp < hp) ticks++;
  }
  ok(ticks === 2 && b.cards[1]!.burn === 0, `поджог тикает ровно два раза (${ticks})`);

  // тики копятся: второй поджог прибавляет к оставшимся
  const acc = arena(hero('elementalist', fire1));
  acc.cards[1] = enemy(100000);
  cast(acc, 'ignite', 1);
  acc.state.cooldowns = {};
  cast(acc, 'ignite', 1);
  ok(acc.cards[1]!.burn === 4, `повторный поджог копит тики (${acc.cards[1]!.burn})`);

  // «Воспламенение»: на четырёх тиках — взрыв по цели и соседям, горение сгорает
  const burst = arena(hero('elementalist', { ...fire1, 'tal/elementalist/fire-2': 1 }));
  burst.cards[1] = enemy(100000);
  burst.cards[0] = enemy(100000);
  cast(burst, 'ignite', 1);
  burst.state.cooldowns = {};
  const r2 = cast(burst, 'ignite', 1);
  ok(burst.cards[1]!.burn === 0 && dealt(r2.events, 1) > 0, 'воспламенение: взрыв сжёг горение');
  ok(dealt(r2.events, 0) > 0, 'воспламенение: взрыв задел соседа');

  // второй уровень поджога: три тика
  const lv2 = arena(hero('elementalist', { 'perk/elementalist/fire-1': 2 }));
  lv2.cards[1] = enemy(100000);
  cast(lv2, 'ignite', 1);
  ok(lv2.cards[1]!.burn === 3, 'поджог второго уровня: три тика');

  // «Детонация»: взрываются все горящие
  const det = arena(
    hero('elementalist', { ...fire1, 'tal/elementalist/fire-2': 1, 'perk/elementalist/fire-3': 1 }),
  );
  det.cards[1] = enemy(100000);
  det.cards[7] = enemy(100000);
  cast(det, 'ignite', 1);
  det.state.cooldowns = {};
  cast(det, 'ignite', 7);
  const r3 = cast(det, 'detonate');
  ok(
    det.cards[1]!.burn === 0 &&
      det.cards[7]!.burn === 0 &&
      dealt(r3.events, 1) > 0 &&
      dealt(r3.events, 7) > 0,
    'детонация взрывает всех горящих',
  );
}

// ---------------------------------------------------------------- лёд
{
  const b = arena(hero('elementalist', { 'perk/elementalist/ice-1': 1 }));
  b.cards[1] = enemy(100000, 100);
  const r = cast(b, 'frost_spike', 1);
  const foe = b.cards[1]!;
  ok(dealt(r.events, 1) === 48 + 0 || dealt(r.events, 1) > 0, 'ледяной шип бьёт');
  ok(foe.weak > 0 && Math.abs(foe.weakShare - 0.3) < 1e-9, 'ледяной шип ослабляет врага');
  ok(Math.round(foe.strikePower()) === 70, `ослабленный бьёт на 30% слабее (${foe.strikePower()})`);
  ok(foe.brittle === 0, 'первый уровень броню не трогает');

  const b2 = arena(hero('elementalist', { 'perk/elementalist/ice-1': 2 }));
  b2.cards[1] = enemy(100000, 1, 'frozen_knight');
  const before = b2.parts.damage.afterArmor(20, b2.cards[1]!);
  cast(b2, 'frost_spike', 1);
  const after = b2.parts.damage.afterArmor(20, b2.cards[1]!);
  ok(
    b2.cards[1]!.brittle > 0 && after > before,
    `второй уровень снижает броню (${before} → ${after})`,
  );

  // «Заморозка»: при шансе 100% цель пропускает удар
  const spike = withPatch(abilityAtLevel(ABILITY_BY_ID.frost_spike, 1), {
    freeze: Ratio.of(1),
    freezeTurns: 1,
  });
  const b3 = arena(withAbility(hero('elementalist', { 'perk/elementalist/ice-1': 1 }), spike));
  b3.cards[1] = enemy(100000, 50);
  const r3 = cast(b3, 'frost_spike', 1);
  ok(
    r3.events.some((e) => e.type === 'miss' && e.kind === 'stun') && b3.hp === 100000,
    'заморозка: замёрзший враг не отвечает',
  );

  // «Ледяной доспех»: щит, защита, ответный удар; второй раз, пока держится, — нельзя
  const armor = {
    'perk/elementalist/ice-1': 1,
    'tal/elementalist/ice-2': 2,
    'perk/elementalist/ice-3': 1,
  };
  const b4 = arena(hero('elementalist', armor));
  const def0 = b4.parts.damage.defenseNow();
  cast(b4, 'ice_armor');
  ok(b4.shield > 0 && b4.parts.damage.defenseNow() === def0 + 3, 'ледяной доспех: щит и защита');
  const ready = b4.perkReady(ABILITY_BY_ID.ice_armor);
  ok(!ready.ok, 'ледяной доспех не надеть второй раз, пока держится');
  b4.cards[1] = enemy(100000, 10);
  const r4 = b4.tap(C(1));
  ok(dealt(r4.events, 1) > 40, 'ударивший героя получает ответный удар');
}

// ---------------------------------------------------------------- молния и «Перегрузка»
{
  const b = arena(hero('elementalist', { 'perk/elementalist/lightning-1': 1 }));
  b.cards[1] = enemy(100000);
  ok(dealt(cast(b, 'lightning', 1).events, 1) === 100, 'молния: 250% урона');

  const hi = arena(hero('elementalist', { 'perk/elementalist/lightning-1': 2 }));
  hi.cards[1] = enemy(100000);
  ok(
    dealt(cast(hi, 'lightning', 1).events, 1) === 120,
    'молния второго уровня при полной мане сильнее',
  );
  const lo = arena(hero('elementalist', { 'perk/elementalist/lightning-1': 2 }));
  lo.cards[1] = enemy(100000);
  lo.res = 4;
  ok(dealt(cast(lo, 'lightning', 1).events, 1) === 100, 'при низкой мане прибавки нет');

  const oc = arena(
    hero('elementalist', { 'perk/elementalist/lightning-1': 1 }, { overcharge: Ratio.of(0.4) }),
  );
  oc.cards[1] = enemy(100000);
  ok(dealt(cast(oc, 'lightning', 1).events, 1) === 140, 'перегрузка: при полной шкале +40%');

  // цепная молния: целей столько, сколько множителей уровня
  for (const [level, n] of [
    [1, 2],
    [3, 4],
  ] as const) {
    const c = arena(
      hero('elementalist', {
        'perk/elementalist/lightning-1': 1,
        'tal/elementalist/lightning-2': 2,
        'perk/elementalist/lightning-3': level,
      }),
    );
    for (const cell of [0, 1, 2, 5, 8]) c.cards[cell] = enemy(100000);
    const r = cast(c, 'chain_lightning', 0);
    const hit = new Set(
      r.events
        .filter((e) => e.type === 'hit' && e.target === 'enemy')
        .map((e) => (e as { cell: number }).cell),
    );
    ok(hit.size === n, `цепная молния уровня ${level}: целей ${hit.size}, ждали ${n}`);
  }
}

// ---------------------------------------------------------------- арканист
{
  // выстрел по линии: первый уровень — ближайший враг, второй — пробивает
  const one = arena(hero('arcanist', { 'perk/arcanist/damage-1': 1 }), 0);
  one.cards[1] = enemy(100000);
  one.cards[2] = enemy(100000);
  ok(one.perkTargetOk(ABILITY_BY_ID.magic_shot, C(1)), 'магический выстрел бьёт и вплотную');
  const r = cast(one, 'magic_shot', 2);
  ok(
    dealt(r.events, 1) > 0 && dealt(r.events, 2) === 0,
    'первый уровень: только ближайший на линии',
  );
  const cd = one.perkReady(ABILITY_BY_ID.magic_shot);
  ok(!cd.ok && cd.reason === 'cooldown', 'выстрел на перезарядке');

  const two = arena(hero('arcanist', { 'perk/arcanist/damage-1': 2 }), 0);
  two.cards[1] = enemy(100000);
  two.cards[2] = enemy(100000);
  const r2 = cast(two, 'magic_shot', 2);
  ok(
    dealt(r2.events, 2) > 0 && dealt(r2.events, 2) < dealt(r2.events, 1),
    'второй уровень пробивает линию',
  );

  // «Заряд»: пока выстрел готов и ждёт, он копит силу; выстрел тратит заряд
  const ch = arena(
    hero('arcanist', { 'perk/arcanist/damage-1': 1, 'tal/arcanist/damage-2': 1 }),
    0,
  );
  ch.cards[1] = enemy(100000);
  const base = dealt(
    cast(arena(hero('arcanist', { 'perk/arcanist/damage-1': 1 }), 0), 'magic_shot', 1).events,
    1,
  );
  void base;
  wait(ch, 3);
  wait(ch, 3);
  ok(
    ch.chargeOf(ABILITY_BY_ID.magic_shot) === 2,
    `заряд копится (${ch.chargeOf(ABILITY_BY_ID.magic_shot)})`,
  );
  const charged = dealt(cast(ch, 'magic_shot', 1).events, 1);
  ok(charged === 90, `заряженный выстрел сильнее: 150% × 1,5 (${charged})`);
  ok(ch.chargeOf(ABILITY_BY_ID.magic_shot) === 0, 'выстрел потратил заряд');

  // манипуляция: точечная перестановка и перемешивание поля
  const sw = arena(hero('arcanist', { 'perk/arcanist/manipulation-1': 1 }));
  const a = enemy(100);
  const g = gold(10);
  sw.cards[0] = a;
  sw.cards[8] = g;
  sw.usePerk('swap');
  sw.tap(C(0));
  sw.tap(C(8));
  ok(sw.cards[0] === g && sw.cards[8] === a, 'перестановка меняет две карты местами');

  const sh = arena(
    hero('arcanist', { 'perk/arcanist/manipulation-1': 1, 'perk/arcanist/manipulation-2': 1 }),
    4,
    9,
  );
  const cards = [0, 1, 2, 3, 5, 6, 7, 8].map((c) => (sh.cards[c] = enemy(100 + c)));
  cast(sh, 'shuffle');
  const now = [0, 1, 2, 3, 5, 6, 7, 8].map((c) => sh.cards[c]);
  ok(
    sh.cards[4] === null && cards.every((c) => now.includes(c)),
    'перемешивание: те же карты, клетка героя пуста',
  );
  ok(
    now.some((c, i) => c !== cards[i]),
    'перемешивание меняет расклад',
  );
}

// ---------------------------------------------------------------- чернокнижник
{
  const b = arena(hero('warlock', { 'perk/warlock/blight-1': 1 }));
  b.cards[1] = enemy(1000);
  b.cards[0] = enemy(100000);
  cast(b, 'blight_shot', 1);
  ok(!!b.cards[1]?.infect, 'выстрел скверны заражает');
  ok(!b.perkTargetOk(ABILITY_BY_ID.blight_shot, C(4)), 'по герою не стреляют');
  b.cards[1]!.hp = 1;
  const r = b.tap(C(1));
  ok(dealt(r.events, 0) >= 500, `смерть заражённого взрывает соседей (${dealt(r.events, 0)})`);

  // «Распространение»: взрыв заражает выживших соседей
  const spread = withPatch(ABILITY_BY_ID.blight_shot, { spread: Ratio.of(1) });
  const s2 = arena(withAbility(hero('warlock', { 'perk/warlock/blight-1': 1 }), spread));
  s2.cards[1] = enemy(1000);
  s2.cards[0] = enemy(100000);
  cast(s2, 'blight_shot', 1);
  s2.cards[1]!.hp = 1;
  s2.tap(C(1));
  ok(!!s2.cards[0]?.infect, 'распространение заражает соседа');

  // «Мёртвый слуга»: мёртвая версия врага бьёт соседей, враг отвечает ей, через два хода тает
  const sv = arena(
    hero('warlock', {
      'perk/warlock/blight-1': 1,
      'tal/warlock/blight-2': 2,
      'perk/warlock/blight-3': 1,
    }),
    3,
  );
  sv.cards[1] = enemy(1000, 40);
  sv.cards[2] = enemy(100000, 10);
  cast(sv, 'blight_shot', 1);
  sv.cards[1]!.hp = 1;
  sv.state.cooldowns = {};
  cast(sv, 'blight_shot', 1);
  const ghost = sv.cards[1];
  ok(ghost?.kind === 'ghost', `на месте заражённого встал слуга (${ghost?.kind ?? 'пусто'})`);
  ok(
    ghost?.maxHp === 500 && ghost?.atk === 20,
    `слуга: половина здоровья и удара (${ghost?.maxHp}/${ghost?.atk})`,
  );
  ok(sv.cards[2]!.hp < 100000, 'слуга бьёт соседнего врага');
  ok((ghost?.hp ?? 500) < 500, 'враг отвечает слуге');
  wait(sv, 0);
  ok(sv.cards[1]?.kind !== 'ghost', 'через два хода слуга исчезает');
}

// ---------------------------------------------------------------- магистр
{
  const b = arena(hero('magister', { 'perk/magister/arcana-1': 1 }));
  cast(b, 'magic_shield');
  ok(b.shield === 35000, `магический щит: 35% максимального здоровья (${b.shield})`);
}

// ---------------------------------------------------------------- лучник
{
  const bare = arena(hero('hunter'), 0);
  bare.cards[2] = enemy(100000);
  ok(bare.actionFor(C(2)).kind === 'none', 'охотник без перка вдаль не стреляет');

  const b = arena(hero('bowman', { 'perk/bowman/bow-1': 1 }), 0);
  b.cards[2] = enemy(100000);
  ok(b.actionFor(C(2)).kind === 'ranged', 'сквозной выстрел: через карту по прямой');

  const split = arena(hero('bowman', { 'perk/bowman/bow-1': 1, 'tal/bowman/bow-2': 1 }), 0);
  split.cards[2] = enemy(100000);
  split.cards[4] = enemy(100000);
  const r = split.tap(C(2));
  ok(dealt(r.events, 4) > 0, 'раскол наконечника задевает врага по диагонали от цели');

  // «Затаившийся стрелок»: ходы на месте копят урон, шаг сбрасывает
  const aim = { 'perk/bowman/bow-1': 1, 'tal/bowman/bow-2': 2, 'perk/bowman/bow-3': 1 };
  const st = arena(hero('bowman', aim));
  const d0 = st.currentDamage();
  wait(st, 1);
  wait(st, 1);
  wait(st, 1);
  ok(
    st.currentDamage() === Math.round(d0 * 1.4),
    `два стака: +40% (${d0} → ${st.currentDamage()})`,
  );
  st.cards[3] = null;
  st.tap(C(3));
  ok(st.currentDamage() === d0, 'шаг сбрасывает стаки');
  const cam = arena(hero('bowman', { ...aim, 'tal/bowman/bow-4': 1 }));
  for (let i = 0; i < 4; i++) wait(cam, 1);
  ok(cam.currentDamage() === Math.round(d0 * 1.6), `камуфляж: три стака (${cam.currentDamage()})`);
}

// ---------------------------------------------------------------- арбалетчик
{
  const hand = arena(hero('hunter'));
  hand.cards[1] = enemy(100000, 0, 'frozen_knight');
  const plain = dealt(hand.tap(C(1)).events, 1);
  const bolt = arena(hero('crossbowman', { 'perk/crossbowman/crossbow-1': 1 }, { damage: 40 }));
  bolt.cards[1] = enemy(100000, 0, 'frozen_knight');
  const through = dealt(bolt.tap(C(1)).events, 1);
  ok(through > plain, `залп болтом вплотную пробивает броню (${plain} → ${through})`);

  const pierce = arena(
    hero('crossbowman', { 'perk/crossbowman/crossbow-1': 1, 'tal/crossbowman/crossbow-2': 1 }),
  );
  pierce.cards[1] = enemy(100000);
  pierce.cards[7] = enemy(100000);
  pierce.cards[4] = null;
  pierce.playerCell = C(4);
  const r = pierce.tap(C(1));
  ok(
    dealt(r.events, 1) > 0 && dealt(r.events, 7) === 0,
    'пробивающий выстрел — только по линии выстрела',
  );
  const line = arena(
    hero('crossbowman', { 'perk/crossbowman/crossbow-1': 1, 'tal/crossbowman/crossbow-2': 1 }),
    0,
  );
  line.cards[1] = enemy(100000);
  line.cards[2] = enemy(100000);
  const r2 = line.tap(C(1));
  ok(
    dealt(r2.events, 2) > 0 && dealt(r2.events, 2) < dealt(r2.events, 1),
    'пробивающий выстрел: второй враг на линии получает половину',
  );

  // «Крюк-болт»: дальний враг встаёт рядом, карта между ними — на его место
  const hookRanks = {
    'perk/crossbowman/crossbow-1': 1,
    'tal/crossbowman/crossbow-2': 1,
    'perk/crossbowman/crossbow-3': 1,
  };
  const hk = arena(hero('crossbowman', hookRanks), 0);
  const far = enemy(100000);
  const mid = gold(5);
  hk.cards[2] = far;
  hk.cards[1] = mid;
  cast(hk, 'hook_bolt', 2);
  ok(hk.cards[1] === far && hk.cards[2] === mid, 'крюк притягивает врага на соседнюю клетку');

  const yk = arena(hero('crossbowman', { ...hookRanks, 'tal/crossbowman/crossbow-4': 1 }), 0);
  yk.cards[2] = enemy(100000, 50);
  const r3 = cast(yk, 'hook_bolt', 2);
  ok(
    yk.cards[1]!.stun > 0 || r3.events.some((e) => e.type === 'miss' && e.kind === 'stun'),
    'рывок оглушает притянутого',
  );
  ok(dealt(r3.events, 1) > 0, 'рывок бьёт притянутого');

  const cy = arena(
    hero('crossbowman', {
      ...hookRanks,
      'tal/crossbowman/crossbow-4': 1,
      'tal/crossbowman/crossbow-5': 1,
    }),
    3,
  );
  const col = [2, 5, 8].map((c) => (cy.cards[c] = enemy(100000, 0)));
  cast(cy, 'hook_bolt', 5);
  ok(
    cy.cards[1] === col[0] && cy.cards[4] === col[1] && cy.cards[7] === col[2],
    'цепной рывок сдвигает к герою всю линию цели',
  );
}

// ---------------------------------------------------------------- мастер зверей
{
  const b = arena(hero('beastmaster', { 'perk/beastmaster/beasts-1': 1 }));
  ok(
    !b.perkTargetOk(ABILITY_BY_ID.stampede, C(0)),
    'кабаны первого уровня — только по линии героя',
  );
  ok(b.perkTargetOk(ABILITY_BY_ID.stampede, C(1)), 'кабаны: клетка на линии героя подходит');
  b.cards[1] = enemy(100000, 50);
  b.cards[7] = enemy(100000, 50);
  b.cards[3] = enemy(100000, 50);
  const pile = gold(40);
  b.cards[5] = pile;
  const run = cast(b, 'stampede', 3);
  const stunned = (cell: number): boolean =>
    run.events.some((e) => e.type === 'status' && e.kind === 'stun' && e.cell === cell);
  ok(stunned(3) && pile.value === 1, 'кабаны оглушают и сминают золото по строке героя');
  ok(!stunned(1) && !stunned(7), 'столбец героя не задет');

  const any = arena(hero('beastmaster', { 'perk/beastmaster/beasts-1': 2 }));
  const herd2 = any.stats.abilities.find((x) => x.id === 'stampede')!;
  ok(any.perkTargetOk(herd2, C(0)), 'кабаны второго уровня — по любой линии');

  const cross = arena(
    hero('beastmaster', { 'perk/beastmaster/beasts-1': 1, 'tal/beastmaster/beasts-2': 1 }),
  );
  for (const c of [0, 1, 2, 7]) cross.cards[c] = enemy(100000, 50);
  cast(cross, 'stampede', 1);
  ok(
    [0, 2, 7].every((c) => cross.cards[c]!.stun > 0),
    'перекрёстная пробежка: по строке и столбцу выбранной клетки',
  );

  const fal = arena(
    hero('beastmaster', {
      'perk/beastmaster/beasts-1': 1,
      'tal/beastmaster/beasts-2': 1,
      'perk/beastmaster/beasts-3': 1,
    }),
  );
  fal.cards[0] = enemy(100000);
  cast(fal, 'falcon', 0);
  ok(fal.cards[0]!.bleed === 2, 'сокол: кровотечение, первый тик — в ход удара');
  const hp = fal.cards[0]!.hp;
  wait(fal, 1);
  ok(fal.cards[0]!.hp < hp, 'кровотечение отнимает здоровье');
}

// ---------------------------------------------------------------- ловчий
{
  const ranks = { 'perk/huntsman/traps-1': 1, 'perk/huntsman/traps-2': 1 };
  const b = arena(hero('huntsman', ranks));
  const foe = enemy(100000, 50);
  b.cards[2] = foe;
  const g = gold(5);
  b.cards[1] = g;
  cast(b, 'snare', 1);
  ok(b.traps.length === 1 && b.traps[0].cell === 1, 'капкан встал на клетку');
  b.state.engine.swap(C(1), C(2));
  b.parts.traps.springSnares();
  ok(
    b.traps.length === 0 && foe.stun > 0 && foe.hp < 100000,
    'враг попал в капкан: урон и оглушение',
  );

  // «Взведённая ловушка»: кнопкой выбранной способности — задержка, клеткой — место
  const falconL1 = abilityAtLevel(ABILITY_BY_ID.falcon, 1);
  const a = arena(withAbility(hero('huntsman', ranks), falconL1));
  a.cards[0] = enemy(100000);
  ok(a.usePerk('armed_trap').ok, 'взведённая ловушка заряжена');
  ok(!a.perkTargetOk(ABILITY_BY_ID.armed_trap, C(0)), 'без способности клетку не выбрать');
  ok(!a.usePerk('armed_trap').ok || !a.armed, 'повторное нажатие снимает заряд');
  a.usePerk('armed_trap');
  a.usePerk('falcon');
  a.usePerk('falcon');
  ok(a.trapSkill?.id === 'falcon' && a.trapDelay === 2, `выбран сокол, задержка ${a.trapDelay}`);
  a.usePerk('falcon');
  a.usePerk('falcon');
  ok(a.trapDelay === 1, 'задержка по кругу: после предела — снова один ход');
  a.usePerk('falcon');
  const res0 = a.res;
  ok(a.tap(C(0)).ok, 'ловушка встала');
  ok(
    a.res < res0 && a.cooldownOf(ABILITY_BY_ID.falcon) > 0,
    'цена и перезарядка сокола заплачены сразу',
  );
  ok(a.cards[0]!.bleed === 0, 'в ход установки ловушка не срабатывает');
  wait(a, 1);
  ok(a.cards[0]!.bleed === 0, 'после первого хода — ещё рано');
  wait(a, 1);
  ok(a.cards[0]!.bleed > 0 && a.traps.length === 0, 'через два хода сокол сработал на клетке');

  const c2 = arena(withAbility(hero('huntsman', ranks), falconL1));
  for (let i = 0; i < 2; i++) {
    c2.state.cooldowns = {};
    c2.res = 100;
    c2.usePerk('armed_trap');
    c2.usePerk('falcon');
    c2.tap(C(i));
  }
  const spent = c2.perkReady(ABILITY_BY_ID.armed_trap);
  ok(!spent.ok && spent.reason === 'once', 'взведённых ловушек за комнату — две');
}

void Grid;
