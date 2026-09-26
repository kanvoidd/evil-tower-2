/** Самопроверка: Фазз-тест поля боя: сотни случайных комнат без падений и нарушений правил. */
import type { AbilityDef } from '../../src/domain/catalog';
import { LINEAGE_ORDER } from '../../src/domain/catalog/heroes';
import { ROOMS } from '../../src/domain/catalog/levels';
import { pickAutoUse } from '../../src/domain/combat/auto-use/autoUse';
import { Grid } from '../../src/domain/combat/engine';
import { type RoomBattle, RoomBattleFactory } from '../../src/domain/combat/room-battle';
import { newLineageSave, TREES } from '../../src/domain/progression/skill-tree';
import { buildPlayerStats } from '../../src/domain/progression/stats/stats';
import { CellIndex, type Rng } from '../../src/domain/shared';
import { makeRng } from '../../src/domain/shared/rng/rng';
import { fuzz, ok } from './harness';

// ---------------------------------------------------------------- фазз-тест поля боя
const dist = (a: number, b: number): number =>
  Math.abs(Math.floor(a / 3) - Math.floor(b / 3)) + Math.abs((a % 3) - (b % 3));

/** Случайная способность; заряженную — навести на подходящую клетку или снять заряд. */
const usePerkAtRandom = (
  battle: RoomBattle,
  rng: Rng,
  abilities: readonly AbilityDef[],
  cells: CellIndex[],
): void => {
  const perk = rng.pick(abilities);
  if (battle.usePerk(perk.id).ok) fuzz.perkUses++;
  if (!battle.armed) return;
  const target = cells.find((c) => battle.perkTargetOk(battle.armed!, c));
  if (target === undefined) {
    battle.cancelPerk();
    return;
  }
  battle.tap(target);
  if (battle.armed) battle.tap(cells.find((c) => c !== target) ?? target);
};

/** Случайный ход: расходник, способность или касание клетки с картой. */
const randomMove = (
  battle: RoomBattle,
  rng: Rng,
  cells: CellIndex[],
  abilities: readonly AbilityDef[],
): void => {
  const r = rng.next();
  if (r < 0.08) battle.useItem(rng.pick(['potion_heal', 'potion_regen', 'artifact'] as const));
  else if (r < 0.32 && abilities.length) usePerkAtRandom(battle, rng, abilities, cells);
  else battle.tap(rng.pick(cells));
};

/** Автоприменение со всеми переключателями: предложенное должно применяться. */
const autoUse = (battle: RoomBattle, where: string): void => {
  const auto = battle.over
    ? null
    : pickAutoUse(battle, { heal: true, regen: true, artifact: true });
  if (!auto) return;
  fuzz.autoPicks++;
  ok(battle.useItem(auto).ok, `${where}: автоприменение предложило невозможное действие ${auto}`);
};

/** Инварианты боя после каждого хода. */
const checkInvariants = (battle: RoomBattle): void => {
  ok(battle.hp <= battle.stats.maxHp, 'hp не превышает максимум');
  ok(battle.res >= 0 && battle.res <= battle.stats.resMax, 'ресурс в пределах');
  ok(battle.cards[battle.playerCell] === null, 'клетка игрока пуста в массиве карт');
  ok(
    battle.cards.every((c) => !c || c.hp <= c.maxHp || c.kind !== 'enemy'),
    'здоровье врага не превышает максимум',
  );
};

/** Колода пуста: все карты на поле связаны с героем — пустые клетки их не разделили. */
const checkConnected = (battle: RoomBattle, where: string): void => {
  const seen = new Set([battle.playerCell]);
  const q = [battle.playerCell];
  while (q.length) {
    const c = q.shift()!;
    for (const n of Grid.CELLS)
      if (dist(c, n) === 1 && battle.cards[n] && !seen.has(n)) (seen.add(n), q.push(n));
  }
  ok(
    !battle.cards.some((c, i) => c && !seen.has(CellIndex.of(i))),
    `${where}: пустые клетки разделили карты`,
  );
};

/** Комната случайными ходами — до исхода или 400 ходов. */
const playRoom = (
  battle: RoomBattle,
  rng: Rng,
  abilities: readonly AbilityDef[],
  where: string,
): void => {
  for (let step = 0; step < 400 && !battle.over; step++) {
    const cells = Grid.CELLS.filter((c) => battle.cards[c]);
    if (!cells.length) {
      ok(false, `${where}: на поле не осталось карт, но комната не завершена`);
      break;
    }
    randomMove(battle, rng, cells, abilities);
    autoUse(battle, where);
    checkInvariants(battle);
    if (battle.pool.length === 0 && !battle.over && !battle.armed) checkConnected(battle, where);
    if (battle.over) break;
  }
};

for (const lin of LINEAGE_ORDER) {
  const tree = TREES[lin];
  const ls = newLineageSave(tree);
  // берём последний класс линейки со всеми способностями и талантами — самый сложный случай
  const terminal = tree.shape === 'tiered' ? tree.terminals[0] : tree.transitional[0];
  for (const n of tree.nodes) {
    if (n.kind === 'talent') ls.ranks[n.id] = n.ranks ?? 1;
    if (n.kind === 'class' || n.kind === 'perk') ls.ranks[n.id] = 1;
  }
  for (const room of [0, 14, 27, 40, 49]) {
    for (let k = 0; k < 24; k++) {
      const rng = makeRng(room * 1000 + k + 7);
      const stats = buildPlayerStats({ classId: terminal, lineage: ls, weapon: null, armor: null });
      const battle = RoomBattleFactory.standard().create({
        room: ROOMS[room],
        stats,
        weapon: null,
        armor: null,
        consumables: { potion_heal: 3, potion_regen: 2, artifact: 2 },
        rng,
      });
      battle.start();
      fuzz.runs++;
      playRoom(battle, rng, stats.abilities, `${lin} ${ROOMS[room].id}`);
      if (battle.over === 'win')
        ok(battle.exitOpen, 'победа только после того, как открылся выход');
    }
  }
}
