/** Самопроверка логики: npm run selftest */
import { CLASSES, LINEAGE_ORDER, classesOfLineage } from '../src/data/classes';
import { ENEMY_LIST } from '../src/data/enemies';
import { FLOORS, MODIFIERS, ROOMS, ROOMS_PER_FLOOR, rollRoom } from '../src/data/levels';
import { hasButton, PERKS, PERK_BY_ID, perkOf, perksOfClass, FULL_BAR, VFX_STYLES } from '../src/data/perks';
import { PATH_ORDER, SYNERGY_FX, TALENTS, maxRank, talentChain, talentsOfClass, talentsOfTier, talentValue } from '../src/data/talents';
import { perkCost, talentRankCost } from '../src/data/economy';
import {
  activePerkIds, applyBuy, applyCancelMetamorphosis, canBuy, canCancelMetamorphosis, canInvest, costOf, currentClassOf,
  isClassOwned, isPurchasable, newLineageSave, nodeState, openedClasses, rankOf, talentBonuses, TREES, type TreeNode,
} from '../src/logic/skillTree';
import { buildPlayerStats, CAPS } from '../src/logic/stats';
import { makeRng } from '../src/logic/rng';
import { Run, type Card } from '../src/logic/run';
import { needsHeal, needsRegen, pickAutoUse, worthArtifact } from '../src/logic/autoUse';
import { branchOf, inferBranch, planAutoSkill } from '../src/logic/autoSkill';
import { classTraits, type TraitId } from '../src/logic/traits';
import { GAMEPLAY } from '../src/config';
import { ru } from '../src/i18n/ru';
import { en } from '../src/i18n/en';
import type { AutoSkillSave, ClassId, TalentPath } from '../src/types';

let failed = 0;
const ok = (cond: boolean, msg: string): void => {
  if (!cond) {
    failed++;
    console.error('FAIL:', msg);
  }
};

const cons = () => ({ potion_heal: 0, potion_regen: 0, artifact: 0 });

// ---------------------------------------------------------------- данные перков и талантов
for (const cls of Object.keys(CLASSES) as ClassId[]) {
  const perks = perksOfClass(cls);
  const stage = CLASSES[cls].stage;
  ok(perks.length === (stage === 2 ? 4 : 3), `${cls}: перков ${perks.length}, ожидалось ${stage === 2 ? 4 : 3}`);
  ok(!!perkOf(cls, 'start'), `${cls}: есть стартовая способность`);
  const buttons = perks.filter(hasButton).length;
  ok(buttons <= 4, `${cls}: кнопок способностей ${buttons} (максимум 4 на класс)`);

  const talents = talentsOfClass(cls);
  ok(talents.length === 15, `${cls}: талантов ${talents.length}, ожидалось 15`);
  for (const tier of [1, 2, 3] as const) {
    const list = talentsOfTier(cls, tier);
    ok(list.length === 5, `${cls}: на ярусе ${tier} пять талантов (${list.length})`);
    ok(new Set(list.map((t) => t.path)).size === 3, `${cls}: на ярусе ${tier} все три пути`);
    // цепочки путей разной длины — прокачка идёт «вразнобой», а не одинаковыми тройками
    const lens = PATH_ORDER.map((path) => talentChain(cls, tier, path).length);
    ok(lens.reduce((a, b) => a + b, 0) === 5, `${cls}/${tier}: цепочки покрывают ярус (${lens.join('-')})`);
    ok(new Set(lens).size > 1, `${cls}/${tier}: цепочки разной длины (${lens.join('-')})`);
    for (const path of PATH_ORDER) {
      const chain = talentChain(cls, tier, path);
      ok(chain.length >= 1 && chain.length <= 3, `${cls}/${tier}/${path}: длина цепочки ${chain.length}`);
      ok(chain.every((t, i) => t.step === i), `${cls}/${tier}/${path}: шаги цепочки по порядку`);
    }
  }
  const ranks = talents.reduce((a, t) => a + maxRank(t), 0);
  ok(ranks >= 30 && ranks <= 40, `${cls}: суммарно рангов ${ranks} (ожидалось 30–40)`);
  for (const t of talents) {
    ok(t.v.length >= 1 && t.v.length <= 5, `${t.id}: рангов ${t.v.length}`);
    // значения суммарные, значит строго возрастают
    ok(t.v.every((v, i) => i === 0 || v > t.v[i - 1]), `${t.id}: значения рангов возрастают (${t.v.join('/')})`);
    ok(`tal.${t.fx}` in ru && `tal.${t.fx}` in en, `перевод эффекта таланта tal.${t.fx}`);
  }
}
ok(new Set(TALENTS.map((t) => t.id)).size === TALENTS.length, 'id талантов уникальны');
// таланты-синергии: прокачка между способностями усиливает сами способности
{
  const fx = (cls: ClassId, f: string): boolean => talentsOfClass(cls).some((t) => t.fx === f);
  ok(fx('pyromancer', 'abilityIgnite'), 'пиромант: талант «любая способность поджигает»');
  ok(fx('necromancer', 'killBlast'), 'некромант: талант «взрыв трупа»');
  for (const f of SYNERGY_FX) ok(TALENTS.some((t) => t.fx === f), `синергия ${f} встречается в дереве`);
  const withSyn = (Object.keys(CLASSES) as ClassId[]).filter((c) => talentsOfClass(c).some((t) => SYNERGY_FX.has(t.fx)));
  ok(withSyn.length === 16, `у каждого класса есть талант-синергия (${withSyn.length})`);
  // у каждого класса есть талант на запас здоровья: иначе живучесть держится только на броне
  for (const c of Object.keys(CLASSES) as ClassId[]) {
    ok(talentsOfClass(c).some((t) => t.fx === 'hpPct'), `${c}: в дереве есть запас здоровья`);
  }
}
ok(new Set(PERKS.map((p) => p.id)).size === PERKS.length, 'id перков уникальны');
const STYLES = new Set<string>(VFX_STYLES);
for (const p of PERKS) {
  ok(!!p.desc.ru && !!p.desc.en, `${p.id}: есть описание`);
  ok(STYLES.has(p.vfx), `${p.id}: задан эффект ${p.vfx}`);
  if (hasButton(p)) ok(p.target !== undefined, `${p.id}: у кнопки задана цель`);
  if (p.cost === FULL_BAR) ok(!!p.once, `${p.id}: способность за всю шкалу применяется раз за комнату`);
}
// базовое действие осталось у лучника (выстрел) и наёмника (удар в спину);
// воин бьёт рукой, а маг вообще не бьёт — только молнией по кнопке
const basics = PERKS.filter((p) => p.basic).map((p) => p.classId);
ok(basics.length === 2 && !basics.includes('warrior') && !basics.includes('mage'), `базовые действия линеек: ${basics.join(',')}`);

// ---------------------------------------------------------------- этажи и враги
ok(ROOMS.length === FLOORS * ROOMS_PER_FLOOR, `комнат ${ROOMS.length}, ожидалось ${FLOORS * ROOMS_PER_FLOOR}`);
for (let f = 1; f <= FLOORS; f++) {
  ok(`floor.${f}.name` in ru && `floor.${f}.name` in en, `перевод названия этажа ${f}`);
  const bosses = ENEMY_LIST.filter((e) => e.floor === f && e.boss);
  ok(bosses.length === 1, `этаж ${f}: ровно один босс (${bosses.length})`);
  ok(ENEMY_LIST.filter((e) => e.floor === f).length >= 5, `этаж ${f}: не меньше пяти видов врагов`);
}
for (const m of MODIFIERS) {
  ok(`mod.${m.id}` in ru && `mod.${m.id}.desc` in ru, `перевод свойства комнаты ${m.id}`);
  ok(`mod.${m.id}` in en && `mod.${m.id}.desc` in en, `английский перевод свойства комнаты ${m.id}`);
}
// сила врагов растёт от этажа к этажу
for (let f = 2; f <= FLOORS; f++) {
  const prev = ENEMY_LIST.find((e) => e.floor === f - 1 && e.role === 'normal')!;
  const cur = ENEMY_LIST.find((e) => e.floor === f && e.role === 'normal')!;
  ok(cur.hp > prev.hp && cur.atk >= prev.atk && cur.souls > prev.souls, `этаж ${f}: враги сильнее и дороже предыдущих`);
}
// каждый заход собирается заново
{
  const room = ROOMS[12];
  const a = rollRoom(room, makeRng(1));
  const b = rollRoom(room, makeRng(2));
  const same = JSON.stringify(a.enemies) === JSON.stringify(b.enemies) && a.mod.id === b.mod.id;
  ok(!same, 'состав комнаты меняется от захода к заходу');
  ok(JSON.stringify(rollRoom(room, makeRng(1))) === JSON.stringify(a), 'один и тот же seed даёт один и тот же расклад');
  for (const r of ROOMS) {
    const plan = rollRoom(r, makeRng(r.floor * 100 + r.index));
    ok(plan.enemies.length >= r.count[0], `${r.id}: врагов не меньше минимума`);
    ok(plan.enemies.some((e) => e.id.startsWith('boss_')) === r.boss, `${r.id}: босс только в пятой комнате`);
  }
}

// ---------------------------------------------------------------- дерево талантов
for (const lin of LINEAGE_ORDER) {
  const tree = TREES[lin];
  const ls = newLineageSave(tree);
  ok(isClassOwned(tree, ls, lin), `${lin}: базовый класс открыт`);
  ok(activePerkIds(tree, ls, lin).length === 1, `${lin}: активна только стартовая способность`);
  ok(tree.nodes.filter((n) => n.kind === 'talent').length === 15 * 4, `${lin}: 60 талантов в дереве`);

  // ворота: перк 2 закрыт, пока ни один талант первого яруса не прокачан до максимума
  const p2 = tree.nodes.find((n) => n.kind === 'perk' && n.owner === lin && n.slot === 'p2')!;
  ok(nodeState(tree, ls, p2) === 'locked', `${lin}: перк 2 закрыт до прокачки яруса`);
  const chainStarts = tree.nodes.filter((n) => n.kind === 'talent' && n.owner === lin && n.tier === 1 && n.step === 0);
  ok(chainStarts.length === 3, `${lin}: на первом ярусе три цепочки (${chainStarts.length})`);
  for (const n of chainStarts) ok(nodeState(tree, ls, n) === 'available', `${lin}: начала цепочек первого яруса доступны сразу`);
  // берём самую длинную цепочку — её середина должна открываться только после предыдущего таланта
  const chain1 = tree.nodes
    .filter((n) => n.kind === 'talent' && n.owner === lin && n.tier === 1 && n.path === chainStarts[0].path)
    .sort((a, b) => a.step! - b.step!);
  const longest = (['attack', 'vitality', 'guard'] as TalentPath[])
    .map((path) => tree.nodes.filter((n) => n.kind === 'talent' && n.owner === lin && n.tier === 1 && n.path === path).sort((a, b) => a.step! - b.step!))
    .sort((a, b) => b.length - a.length)[0];
  void chain1;
  if (longest.length > 1) ok(nodeState(tree, ls, longest[1]) === 'locked', `${lin}: продолжение цепочки закрыто до прокачки предыдущего`);
  const t1 = longest[0];
  applyBuy(tree, ls, t1);
  ok(maxRank(TALENTS.find((t) => t.id === t1.talentId!)!) === 1 || nodeState(tree, ls, t1) === 'partial', `${lin}: талант частично прокачан`);
  for (const n of longest) {
    while (nodeState(tree, ls, n) !== 'owned') applyBuy(tree, ls, n);
  }
  ok(nodeState(tree, ls, p2) === 'available', `${lin}: пройденная цепочка открыла перк 2`);
  ok(rankOf(ls, t1.id) === (t1.ranks ?? 1), `${lin}: ранг не превышает максимум`);
  ok(costOf(ls, t1) === 0, `${lin}: у прокачанного до конца таланта нет цены`);

  // цена ранга растёт
  ok(talentRankCost(lin, 1, 2) > talentRankCost(lin, 1, 1), `${lin}: второй ранг дороже первого`);
  ok(perkCost(lin, 'p3') > perkCost(lin, 'p2'), `${lin}: третья способность дороже второй`);
  ok(perkCost(lin, 'start') === 0, `${lin}: стартовая способность бесплатна`);
}

// ---------------------------------------------------------------- метаморфоза
for (const lin of LINEAGE_ORDER) {
  const tree = TREES[lin];
  const ls = newLineageSave(tree);
  const buyAll = (pred: (n: TreeNode) => boolean): void => {
    for (let guard = 0; guard < 4000; guard++) {
      const list = tree.nodes.filter((n) => isPurchasable(n) && pred(n) && canInvest(tree, ls, n));
      if (!list.length) return;
      applyBuy(tree, ls, list.sort((a, b) => costOf(ls, a) - costOf(ls, b))[0]);
    }
  };
  buyAll((n) => n.owner === lin && n.kind !== 'class');
  const bonusBefore = talentBonuses(tree, ls);
  const perksBefore = activePerkIds(tree, ls, lin);
  ok(perksBefore.length === 3, `${lin}: у базового класса три способности (${perksBefore.length})`);

  const second = tree.classNode[tree.second];
  ok(canBuy(tree, ls, second, 1e9).ok, `${lin}: метаморфоза доступна после прокачки третьего яруса`);
  applyBuy(tree, ls, second);
  const bonusAfter = talentBonuses(tree, ls);
  ok(JSON.stringify(bonusBefore) === JSON.stringify(bonusAfter), `${lin}: таланты сохранились при метаморфозе`);
  // способности прежнего класса остаются с героем — метаморфоза ничего не отнимает
  const afterMeta = activePerkIds(tree, ls, tree.second);
  ok(perksBefore.every((id) => afterMeta.includes(id)), `${lin}: способности базового класса сохранились`);
  ok(afterMeta.length === perksBefore.length + 1, `${lin}: к ним добавилась стартовая способность нового класса (${afterMeta.length})`);
  ok(openedClasses(tree, ls).length === 2, `${lin}: открыты два класса`);
  ok(currentClassOf(tree, ls) === tree.second, `${lin}: в выборе класса новый класс заменил прежний`);

  buyAll((n) => n.owner === tree.second && n.kind !== 'class');
  const [a, b] = tree.terminals;
  ok(canBuy(tree, ls, tree.classNode[a], 1e9).ok, `${lin}: финальный класс ${a} доступен`);
  applyBuy(tree, ls, tree.classNode[a]);
  ok(nodeState(tree, ls, tree.classNode[b]) === 'blocked', `${lin}: соседняя ветка ${b} закрыта`);
  ok(canCancelMetamorphosis(tree, ls, a), `${lin}: отмена метаморфозы доступна`);
  const legend = tree.nodes.find((n) => n.kind === 'perk' && n.owner === a && n.slot === 'legend')!;
  ok(nodeState(tree, ls, legend) === 'locked', `${lin}: легендарная способность закрыта до третьего яруса`);
  buyAll((n) => n.owner === a && n.kind !== 'class');
  ok(nodeState(tree, ls, legend) === 'owned', `${lin}: легендарная способность покупается`);
  // 3 (база) + 3 (второй класс) + 4 (финальный) — все они в руках героя одновременно
  const full = activePerkIds(tree, ls, a);
  ok(full.length === 10, `${lin}: у финального класса десять способностей (${full.length})`);
  ok(perksBefore.every((id) => full.includes(id)), `${lin}: перки базового класса дошли до финала`);

  const { refund } = applyCancelMetamorphosis(tree, ls, a);
  ok(refund > 0 && !isClassOwned(tree, ls, a), `${lin}: ветка ${a} сброшена, возврат ${refund}`);
  ok(nodeState(tree, ls, tree.classNode[b]) === 'available', `${lin}: ${b} снова доступна`);
  ok(currentClassOf(tree, ls) === tree.second, `${lin}: после отмены — снова второй класс`);
}

// ---------------------------------------------------------------- характеристики и потолки
for (const id of Object.keys(CLASSES) as ClassId[]) {
  const lin = CLASSES[id].lineage;
  const tree = TREES[lin];
  const ls = newLineageSave(tree);
  for (const n of tree.nodes) if (n.kind === 'talent') ls.ranks[n.id] = n.ranks ?? 1;
  const s = buildPlayerStats({ classId: id, lineage: ls, weapon: null, armor: null });
  ok(s.maxHp > 0 && s.damage > 0, `${id}: характеристики считаются`);
  ok(s.crit <= CAPS.crit && s.dodge <= CAPS.dodge && s.parry <= CAPS.parry && s.block <= CAPS.block, `${id}: потолки характеристик соблюдены`);
  ok(s.perkPower >= 1, `${id}: сила способностей не меньше базовой`);
  ok(s.abilities.every(hasButton), `${id}: в ряду кнопок только активные способности`);
  // нижняя панель боя рассчитана на две полки по пять кнопок
  ok(s.abilities.length <= 10, `${id}: кнопок не больше десяти (${s.abilities.length})`);
}
// пассивка линеек по ТЗ
{
  const start = (id: ClassId) => buildPlayerStats({ classId: id, lineage: newLineageSave(TREES[CLASSES[id].lineage]), weapon: null, armor: null });
  const w = start('warrior');
  const m = start('mage');
  const a = start('archer');
  const c = start('mercenary');
  ok(w.maxHp > m.maxHp && w.maxHp > a.maxHp && w.maxHp > c.maxHp, 'воин: самый большой запас здоровья');
  ok(m.resMax > w.resMax && m.resMax > a.resMax && m.resMax > c.resMax, 'маг: самый большой запас ресурса');
  ok(a.crit > w.crit && a.crit > m.crit && a.crit > c.crit, 'лучник: самый высокий шанс крита');
  ok(Math.abs(c.goldBonus - 0.2) < 1e-9, 'наёмник: +20% золота');
  ok(!m.melee && w.melee && a.melee && c.melee, 'маг вообще не бьёт рукой, остальные бьют');
  ok(m.ranged === 'none' && a.ranged === 'skip' && c.ranged === 'any' && w.ranged === 'none', 'базовые действия линеек');
  ok(c.rangedCrit && !a.rangedCrit, 'гарантированный крит только у удара в спину');
}

// ---------------------------------------------------------------- способности в бою
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
  const enemy = (hp: number, atk = 1): Card => ({
    uid: Math.floor(Math.random() * 1e9), kind: 'enemy', defId: 'skeleton', hp, maxHp: hp, atk, baseAtk: atk, value: 0,
    elite: false, stun: 0, burn: 0, burnDmg: 0, poison: 0, poisonDmg: 0, mark: 0, link: false, vuln: 0, hits: 0, swings: 0,
  });

  let used = 0;
  for (const id of Object.keys(CLASSES) as ClassId[]) {
    const stats = build(id);
    for (const perk of [...stats.abilities, ...stats.perks.map((p) => PERK_BY_ID[p]).filter((p) => p.basic)]) {
      const run = new Run({ room: ROOMS[20], stats, weapon: null, armor: null, consumables: cons(), rng: makeRng(7) });
      run.start();
      run.cards.fill(null);
      run.playerCell = 4;
      run.hp = 100000;
      run.res = stats.resMax;
      // ставим врагов вокруг и в углах, чтобы сработали и соседские, и дальние способности
      for (const c of [0, 1, 2, 3, 5, 6, 7, 8]) run.cards[c] = enemy(500, 3);
      run.cards[4] = null;
      // «Сокол-курьер» и «Перестановка» работают с картами добычи, «Подкуп» — с золотом кошеля
      run.cards[8] = { ...enemy(1), kind: 'gold', defId: 'gold', value: 25, hp: 0, maxHp: 0, atk: 0, baseAtk: 0 };
      run.totals.gold = 400;
      if (perk.basic) {
        const act = run.actionFor(0);
        ok(act.kind === 'ranged' || act.kind === 'none', `${id}/${perk.id}: базовое действие определено`);
        continue;
      }
      const res = run.usePerk(perk.id);
      ok(res.ok, `${id}/${perk.id}: способность применяется (${res.reason ?? ''})`);
      if (!res.ok) continue;
      used++;
      if (run.armed) {
        const cell = [0, 1, 2, 3, 5, 6, 7, 8].find((c) => run.perkTargetOk(run.armed!, c));
        ok(cell !== undefined, `${id}/${perk.id}: нашлась подходящая цель`);
        if (cell !== undefined) {
          const r2 = run.tap(cell);
          ok(r2.ok, `${id}/${perk.id}: способность наводится на цель`);
          // «Перестановка» требует двух касаний
          if (run.armed) ok(run.tap(cell === 0 ? 1 : 0).ok, `${id}/${perk.id}: второе касание`);
        }
      }
      ok(run.res >= 0 && run.res <= run.stats.resMax, `${id}/${perk.id}: ресурс в пределах шкалы`);
      ok(run.cards.every((c, i) => i === run.playerCell ? c === null : true), `${id}/${perk.id}: клетка героя пуста`);
    }
  }
  ok(used >= 35, `проверены все активные способности (${used})`);

  // маг вообще не бьёт рукой, зато ходит по пустым клеткам
  {
    for (const id of ['mage', 'magister', 'necromancer', 'pyromancer'] as ClassId[]) {
      const stats = build(id);
      const run = new Run({ room: ROOMS[10], stats, weapon: null, armor: null, consumables: cons(), rng: makeRng(11) });
      run.start();
      run.cards.fill(null);
      run.playerCell = 4;
      run.cards[1] = enemy(500, 3);
      run.hp = 100000;
      const act = run.actionFor(1);
      ok(act.kind === 'none' && act.reason === 'melee', `${id}: рукой не бьёт (${act.kind}/${act.reason ?? ''})`);
      ok(!run.tap(1).ok, `${id}: касание соседнего врага не тратит ход`);
      ok(run.cards[1] !== null && run.cards[1]!.hp === 500, `${id}: враг не получил урона`);
      // молния по кнопке — единственный способ ударить
      run.res = stats.resMax;
      // «Удар молнии» мага остаётся в руках у всей линейки — метаморфоза ничего не отнимает
      ok(stats.abilities.some((p2) => p2.id === 'mage_start'), `${id}: молния мага сохранилась`);
      ok(run.usePerk('mage_start').ok, `${id}: молния мага доступна`);
      if (run.armed) ok(run.tap(1).ok, `${id}: молния наводится на соседнего врага`);
      ok(run.cards[1] === null || run.cards[1]!.hp < 500, `${id}: молния нанесла урон`);
    }
    // ход на пустую соседнюю клетку — полноценный ход для всех классов
    for (const id of ['warrior', 'archer', 'mage', 'ninja'] as ClassId[]) {
      const stats = build(id);
      const run = new Run({ room: ROOMS[10], stats, weapon: null, armor: null, consumables: cons(), rng: makeRng(12) });
      run.start();
      run.cards.fill(null);
      run.playerCell = 4;
      run.hp = 100000;
      ok(run.actionFor(3).kind === 'move', `${id}: пустая соседняя клетка — ход`);
      ok(run.actionFor(0).kind === 'none', `${id}: пустая клетка по диагонали недоступна`);
      const turns = run.totals.turns;
      ok(run.tap(3).ok && run.playerCell === 3, `${id}: герой встал на пустую клетку`);
      ok(run.totals.turns > turns, `${id}: шаг по пустой клетке засчитан ходом`);
    }
  }

  // Кто умеет бить рукой — не попадает в тупик никогда.
  {
    for (const id of Object.keys(CLASSES) as ClassId[]) {
      const stats = build(id);
      if (!stats.melee) continue;
      const run = new Run({ room: ROOMS[30], stats, weapon: null, armor: null, consumables: cons(), rng: makeRng(17) });
      run.start();
      run.cards.fill(null);
      run.playerCell = 4;
      run.hp = 100000;
      run.res = 0;
      for (const c of [0, 1, 2, 3, 5, 6, 7, 8]) run.cards[c] = enemy(500, 3);
      ok(!run.cornered(), `${id}: боец рукой в тупик не попадает`);
      ok([1, 3, 5, 7].some((c) => run.actionFor(c).kind === 'melee'), `${id}: соседний враг доступен рукой`);
    }
  }

  // «Растерзание»: мага без маны, зажатого со всех сторон, карты добивают насмерть
  {
    const surround = (id: ClassId, patch: Partial<{ res: number; potion_regen: number; artifact: number }> = {}) => {
      const stats = build(id);
      const run = new Run({
        room: ROOMS[30], stats, weapon: null, armor: null,
        consumables: { ...cons(), potion_regen: patch.potion_regen ?? 0, artifact: patch.artifact ?? 0 }, rng: makeRng(17),
      });
      run.start();
      run.cards.fill(null);
      run.playerCell = 4;
      run.hp = 400;
      run.res = patch.res ?? 0;
      for (const c of [0, 1, 2, 3, 5, 6, 7, 8]) run.cards[c] = enemy(100000, 3);
      return run;
    };
    for (const id of ['mage', 'magister', 'necromancer', 'pyromancer'] as ClassId[]) {
      ok(surround(id).cornered(), `${id}: пустая шкала в окружении — это тупик`);
    }
    // Ход, который сам загоняет в угол: герой шагает на пустую клетку, освободившуюся
    // занимает новый враг — и в конце хода отбиваться уже нечем.
    {
      const stats = build('mage');
      const run = new Run({ room: ROOMS[30], stats, weapon: null, armor: null, consumables: cons(), rng: makeRng(29) });
      run.start();
      run.cards.fill(null);
      run.pool.length = 0;
      run.pool.push(enemy(100000, 4));
      run.playerCell = 0;
      run.hp = 400;
      run.res = 0;
      run.cards[1] = enemy(100000, 4);
      run.cards[4] = enemy(100000, 4);
      run.cards[6] = enemy(100000, 4);
      const res = run.tap(3);
      ok(res.ok, 'шаг на пустую клетку сделан');
      ok(res.events.some((e) => e.type === 'swarm'), 'карты бросаются на героя');
      ok(run.over === 'lose' && run.hp === 0, 'растерзание доводит до смерти');
      const hits = res.events.filter((e) => e.type === 'hit' && e.target === 'player').length;
      ok(hits >= 4, `бьют все карты по очереди (${hits})`);
      // поднявшись, герой получает полную шкалу и снова может бить
      run.revive();
      ok(!run.cornered(), 'после воскрешения герой снова может ходить');
    }
    // выходы из окружения: мана, зелье восстановления, артефакт мага
    ok(!surround('mage', { res: 20 }).cornered(), 'мана на молнию — не тупик');
    ok(!surround('mage', { potion_regen: 1 }).cornered(), 'зелье восстановления — не тупик');
    ok(!surround('mage', { artifact: 1 }).cornered(), 'артефакт мага — не тупик');
    // поднявшись, герой получает полную шкалу и снова может бить
  }

  // постоянное клеймо не вешается на уже заклеймённую цель — ход не пропадает зря
  {
    const cases: Array<[ClassId, string, (c: Card) => void]> = [
      ['assassin', 'assassin_p2', (c) => (c.vuln = 1)],
      ['darkassassin', 'darkassassin_start', (c) => (c.mark = 3)],
      ['necromancer', 'necromancer_p3', (c) => (c.link = true)],
    ];
    for (const [id, perkId2, apply] of cases) {
      const stats = build(id);
      const run = new Run({ room: ROOMS[30], stats, weapon: null, armor: null, consumables: cons(), rng: makeRng(23) });
      run.start();
      run.cards.fill(null);
      run.playerCell = 4;
      run.hp = 100000;
      run.res = stats.resMax;
      run.cards[1] = enemy(500, 3);
      const perk = PERK_BY_ID[perkId2];
      ok(run.perkTargetOk(perk, 1), `${perkId2}: чистая цель подходит`);
      apply(run.cards[1]!);
      ok(!run.perkTargetOk(perk, 1), `${perkId2}: заклеймённая цель больше не подсвечивается`);
    }
  }

  // усиление нельзя навесить дважды: ход и ресурс не сгорают впустую
  {
    const stats = build('necromancer');
    const run = new Run({ room: ROOMS[30], stats, weapon: null, armor: null, consumables: cons(), rng: makeRng(19) });
    run.start();
    run.hp = 100000;
    run.res = stats.resMax;
    ok(run.usePerk('necromancer_start').ok, 'взрыв трупа применяется');
    const again = run.perkReady(PERK_BY_ID.necromancer_start);
    ok(!again.ok && again.reason === 'active', `повторный взрыв трупа недоступен (${again.reason ?? 'ok'})`);
  }

  // у каждой способности есть своя вспышка
  {
    let noFx = 0;
    for (const id of Object.keys(CLASSES) as ClassId[]) {
      const stats = build(id);
      for (const perk of stats.abilities) {
        const run = new Run({ room: ROOMS[20], stats, weapon: null, armor: null, consumables: cons(), rng: makeRng(13) });
        run.start();
        run.cards.fill(null);
        run.playerCell = 4;
        run.hp = 100000;
        run.res = stats.resMax;
        run.totals.gold = 400;
        for (const c of [0, 1, 2, 3, 5, 6, 7]) run.cards[c] = enemy(500, 3);
        run.cards[8] = { ...enemy(1), kind: 'gold', defId: 'gold', value: 25, hp: 0, maxHp: 0, atk: 0, baseAtk: 0 };
        const r = run.usePerk(perk.id);
        let events = r.events;
        while (run.armed) {
          const cell = [0, 1, 2, 3, 5, 6, 7, 8].find((c) => run.perkTargetOk(run.armed!, c));
          if (cell === undefined) break;
          // «Перестановка» требует двух касаний — эффект рисуется на последнем
          events = [...events, ...run.tap(cell).events];
        }
        const drew = events.some((e) => e.type === 'fx' || (e.type === 'attack' && e.by === 'player'));
        if (!drew) noFx++;
        ok(drew, `${id}/${perk.id}: способность рисует эффект`);
      }
    }
    ok(noFx === 0, `все способности со вспышкой (без эффекта: ${noFx})`);
  }

  // «один раз за комнату» действительно один раз
  {
    const stats = build('berserk');
    const run = new Run({ room: ROOMS[20], stats, weapon: null, armor: null, consumables: cons(), rng: makeRng(3) });
    run.start();
    run.cards.fill(null);
    for (const c of [0, 1, 3, 5]) run.cards[c] = enemy(400, 2);
    run.hp = 100000;
    run.res = stats.resMax;
    ok(run.usePerk('berserk_legend').ok, 'легендарная способность применяется');
    run.res = stats.resMax;
    ok(!run.usePerk('berserk_legend').ok, 'легендарная способность — один раз за комнату');
  }

  // оглушение: враг не отвечает
  {
    const stats = build('knight');
    const run = new Run({ room: ROOMS[10], stats, weapon: null, armor: null, consumables: cons(), rng: makeRng(4) });
    run.start();
    run.cards.fill(null);
    run.playerCell = 4;
    run.cards[1] = enemy(100000, 50);
    run.hp = 100000;
    run.res = stats.resMax;
    run.usePerk('knight_start');
    run.tap(1);
    const target = run.cards.find((c) => c?.kind === 'enemy');
    ok(!!target && target.stun > 0, 'таран щитом оглушает цель');
    const before = run.hp;
    run.tap(run.cards.indexOf(target!));
    ok(run.hp === before, 'оглушённый враг не отвечает на удар');
  }

  // горение тикает и гаснет
  {
    const stats = build('pyromancer');
    const run = new Run({ room: ROOMS[10], stats, weapon: null, armor: null, consumables: cons(), rng: makeRng(9) });
    run.start();
    run.cards.fill(null);
    run.playerCell = 4;
    run.cards[0] = enemy(100000, 1);
    run.hp = 100000;
    run.res = stats.resMax;
    run.usePerk('pyromancer_start');
    run.tap(0);
    const burning = run.cards[0]!;
    ok(burning.burn > 0 && burning.burnDmg > 0, 'поджог вешает горение');
    const hp0 = burning.hp;
    // маг рукой не бьёт, зато ходит по пустым клеткам — это полноценный ход
    ok(run.tap(1).ok, 'ход на пустую соседнюю клетку засчитывается');
    ok(run.cards[0]!.hp < hp0, 'горение отнимает здоровье в конце хода');
  }

  // талант «перк сильнее» действительно усиливает способность
  {
    const weak = build('warrior');
    const strong = { ...weak, perkPower: 2 };
    const hit = (stats: typeof weak): number => {
      const run = new Run({ room: ROOMS[10], stats, weapon: null, armor: null, consumables: cons(), rng: makeRng(21) });
      run.start();
      run.cards.fill(null);
      run.playerCell = 4;
      run.cards[1] = enemy(100000, 0);
      run.hp = 100000;
      run.res = stats.resMax;
      run.usePerk('warrior_start');
      run.tap(1);
      return 100000 - run.cards[1]!.hp;
    };
    ok(hit(strong) > hit(weak), 'талант «способности сильнее» повышает урон способности');
  }
}

// ---------------------------------------------------------------- плавающий крит
{
  const tree = TREES.mercenary;
  const base = buildPlayerStats({ classId: 'mercenary', lineage: newLineageSave(tree), weapon: null, armor: null });
  const stats = { ...base, crit: 100, damage: 10, maxHp: 1e6, dodge: 0, parry: 0, block: 0 };
  const run = new Run({ room: ROOMS[0], stats, weapon: null, armor: null, consumables: cons(), rng: makeRng(5) });
  run.start();
  run.hp = 1e6;
  const seen = new Set<number>();
  let sum = 0;
  const N = 300;
  for (let i = 0; i < N; i++) {
    run.cards[5] = { uid: 9000 + i, kind: 'enemy', defId: 'skeleton', hp: 999999, maxHp: 999999, atk: 0, baseAtk: 0, value: 0, elite: false, stun: 0, burn: 0, burnDmg: 0, poison: 0, poisonDmg: 0, mark: 0, link: false, vuln: 0, hits: 0, swings: 0 };
    const hit = run.tap(5).events.find((e) => e.type === 'hit' && e.target === 'enemy');
    ok(!!hit && hit.type === 'hit' && hit.crit, 'крит при шансе 100%');
    if (hit && hit.type === 'hit') {
      seen.add(hit.amount);
      sum += hit.amount;
    }
  }
  const lo = Math.round(10 * GAMEPLAY.critMulMin);
  const hi = Math.round(10 * GAMEPLAY.critMulMax);
  ok([...seen].every((v) => v >= lo && v <= hi), `крит-урон в пределах ${lo}..${hi}: ${[...seen].sort((a, b) => a - b).join(',')}`);
  ok(seen.size >= 5, `крит бьёт по-разному (разных значений: ${seen.size})`);
  const avg = sum / N;
  ok(avg > 10 * 1.4 && avg < 10 * 1.9, `средний крит разумный (${avg.toFixed(2)})`);
}

// ---------------------------------------------------------------- автоприменение расходников
{
  const mk = (lin: 'mage' | 'warrior' | 'archer' | 'mercenary', perks: string[] = []): Run => {
    const tree = TREES[lin];
    const ls = newLineageSave(tree);
    for (const id of perks) ls.ranks[id] = 1;
    const stats = buildPlayerStats({ classId: lin, lineage: ls, weapon: null, armor: null });
    const run = new Run({
      room: ROOMS[0], stats, weapon: null, armor: null, consumables: { potion_heal: 2, potion_regen: 2, artifact: 2 }, rng: makeRng(3),
    });
    run.start();
    run.cards.fill(null);
    return run;
  };
  const enemy = (atk: number, hp = 3): Card => ({
    uid: Math.floor(Math.random() * 1e9), kind: 'enemy', defId: 'skeleton', hp, maxHp: hp, atk, baseAtk: atk, value: 0,
    elite: false, stun: 0, burn: 0, burnDmg: 0, poison: 0, poisonDmg: 0, mark: 0, link: false, vuln: 0, hits: 0, swings: 0,
  });

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
  ok(pickAutoUse(pick, { ...cfg, heal: false }) === 'potion_regen', 'выбор: без лечения берём ресурс');
  ok(pickAutoUse(pick, { heal: false, regen: false, artifact: false }) === null, 'выбор: всё выключено — ничего не применяется');
}

// ---------------------------------------------------------------- автопрокачка
const PATHS: TalentPath[] = ['attack', 'vitality', 'guard'];
for (const lin of LINEAGE_ORDER) {
  const tree = TREES[lin];
  for (const path of PATHS) {
    const cfg: AutoSkillSave = { on: true, path };
    const ls = newLineageSave(tree);
    const tag = `${lin}/${path}`;
    const plan = planAutoSkill(tree, ls, 1e9, cfg);
    ok(plan.buys.length >= 8, `автопрокачка ${tag}: купила ветку (${plan.buys.length})`);
    ok(plan.stop === 'meta', `автопрокачка ${tag}: остановилась перед метаморфозой (${plan.stop})`);
    ok(plan.buys.every((n) => n.kind !== 'class'), `автопрокачка ${tag}: не покупает смену класса`);
    ok(plan.buys.every((n) => n.kind === 'perk' || n.path === path), `автопрокачка ${tag}: только выбранный путь`);
    ok(plan.buys.filter((n) => n.kind === 'perk').length === 2, `автопрокачка ${tag}: перки-ворота между ярусами`);

    const sim = newLineageSave(tree);
    let souls = plan.spent;
    for (const n of plan.buys) {
      const r = canBuy(tree, sim, n, souls);
      ok(r.ok, `автопрокачка ${tag}: узел ${n.id} покупается по порядку`);
      if (r.ok) souls -= r.cost;
      applyBuy(tree, sim, n);
    }
    ok(souls === 0, `автопрокачка ${tag}: потрачено ровно столько, сколько в плане`);
    const again = planAutoSkill(tree, sim, 1e9, cfg);
    ok(again.buys.length === 0 && again.stop === 'meta', `автопрокачка ${tag}: повтор ничего не покупает`);

    applyBuy(tree, sim, tree.classNode[tree.second]);
    const next = planAutoSkill(tree, sim, 1e9, cfg);
    ok(next.buys.length >= 8, `автопрокачка ${tag}: продолжает после метаморфозы (${next.buys.length})`);
    ok(next.buys.every((n) => n.owner === tree.second), `автопрокачка ${tag}: покупает узлы нового класса`);
  }
  const ls = newLineageSave(tree);
  const small = planAutoSkill(tree, ls, 40, { on: true, path: 'attack' });
  ok(small.spent <= 40 && small.buys.length > 0, `автопрокачка ${lin}: на малые души купила часть (${small.buys.length}, ${small.spent})`);
  ok(small.stop === 'souls', `автопрокачка ${lin}: остановилась из-за нехватки душ`);
  ok(planAutoSkill(tree, ls, 0, { on: true, path: 'vitality' }).buys.length === 0, `автопрокачка ${lin}: без душ ничего не покупает`);
}
{
  const tree = TREES.warrior;
  const ls = newLineageSave(tree);
  ok(inferBranch(tree, ls) === null, 'путь автопрокачки: без покупок неизвестен');
  const guard = tree.nodes.find((n) => n.kind === 'talent' && n.owner === 'warrior' && n.path === 'guard' && n.tier === 1)!;
  applyBuy(tree, ls, guard);
  ok(inferBranch(tree, ls)?.path === 'guard', 'путь автопрокачки: берётся из последней покупки');
  ok(branchOf(guard).path === 'guard', 'узел таланта задаёт путь');
  const perk = tree.nodes.find((n) => n.kind === 'perk' && n.slot === 'p2')!;
  ok(Object.keys(branchOf(perk)).length === 0, 'способность путь не меняет');
}

// ---------------------------------------------------------------- краткие сводки классов и тексты
const TRAIT_IDS = new Set<TraitId>();
for (const id of Object.keys(CLASSES) as ClassId[]) {
  const list = classTraits(id);
  list.forEach((tr) => TRAIT_IDS.add(tr.id));
  const lineage = CLASSES[id].lineage;
  ok(list.length >= 2 && list.length <= 4, `сводка ${id}: 2–4 строки (${list.length})`);
  ok(lineage === 'warrior' ? !list.some((tr) => tr.id === 'mech') : list[0].id === 'mech', `сводка ${id}: механика линейки`);
  ok(new Set(list.map((tr) => tr.id)).size === list.length, `сводка ${id}: без повторов`);
  ok((lineage === 'mage') === list.some((tr) => tr.id === 'artifact'), `сводка ${id}: артефакты только у магов`);
  ok((lineage === 'mercenary') === list.some((tr) => tr.id === 'gold'), `сводка ${id}: бонус золота только у наёмников`);
}
for (const id of TRAIT_IDS) {
  if (id === 'mech') continue;
  ok(`trait.${id}` in ru && `trait.${id}` in en, `перевод строки сводки trait.${id}`);
}
ok(Object.keys(ru).every((k) => k in en), 'английский словарь покрывает все ключи');
ok(Object.keys(en).every((k) => k in ru), 'в английском словаре нет лишних ключей');
for (const cls of classesOfLineage('warrior')) ok(`class.${cls}.name` in ru, `перевод названия класса ${cls}`);

// ---------------------------------------------------------------- фазз-тест поля боя
const dist = (a: number, b: number): number => Math.abs(Math.floor(a / 3) - Math.floor(b / 3)) + Math.abs((a % 3) - (b % 3));
let runs = 0;
let autoPicks = 0;
let perkUses = 0;
for (const lin of LINEAGE_ORDER) {
  const tree = TREES[lin];
  const ls = newLineageSave(tree);
  // берём финальный класс со всеми способностями и талантами — самый сложный случай
  const terminal = tree.terminals[0];
  for (const n of tree.nodes) {
    if (n.kind === 'talent') ls.ranks[n.id] = n.ranks ?? 1;
    if (n.kind === 'class' || n.kind === 'perk') ls.ranks[n.id] = 1;
  }
  for (const room of [0, 14, 27, 40, 49]) {
    for (let k = 0; k < 24; k++) {
      const rng = makeRng(room * 1000 + k + 7);
      const stats = buildPlayerStats({ classId: terminal, lineage: ls, weapon: null, armor: null });
      const run = new Run({ room: ROOMS[room], stats, weapon: null, armor: null, consumables: { potion_heal: 3, potion_regen: 2, artifact: 2 }, rng });
      run.start();
      runs++;
      for (let step = 0; step < 400 && !run.over; step++) {
        const cells = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((c) => run.cards[c]);
        if (!cells.length) {
          ok(false, `${lin} ${ROOMS[room].id}: на поле не осталось карт, но комната не завершена`);
          break;
        }
        const r = rng.next();
        if (r < 0.08) run.useItem(rng.pick(['potion_heal', 'potion_regen', 'artifact'] as const));
        else if (r < 0.32 && stats.abilities.length) {
          const perk = rng.pick(stats.abilities);
          if (run.usePerk(perk.id).ok) perkUses++;
          if (run.armed) {
            const target = cells.find((c) => run.perkTargetOk(run.armed!, c));
            if (target === undefined) run.cancelPerk();
            else {
              run.tap(target);
              if (run.armed) run.tap(cells.find((c) => c !== target) ?? target);
            }
          }
        } else run.tap(rng.pick(cells));
        const auto = run.over ? null : pickAutoUse(run, { heal: true, regen: true, artifact: true });
        if (auto) {
          autoPicks++;
          ok(run.useItem(auto).ok, `${lin} ${ROOMS[room].id}: автоприменение предложило невозможное действие ${auto}`);
        }
        ok(run.hp <= run.stats.maxHp, 'hp не превышает максимум');
        ok(run.res >= 0 && run.res <= run.stats.resMax, 'ресурс в пределах');
        ok(run.cards[run.playerCell] === null, 'клетка игрока пуста в массиве карт');
        ok(run.cards.every((c) => !c || c.hp <= c.maxHp || c.kind !== 'enemy'), 'здоровье врага не превышает максимум');
        if (run.pool.length === 0 && !run.over && !run.armed) {
          const seen = new Set([run.playerCell]);
          const q = [run.playerCell];
          while (q.length) {
            const c = q.shift()!;
            for (let n = 0; n < 9; n++) if (dist(c, n) === 1 && run.cards[n] && !seen.has(n)) (seen.add(n), q.push(n));
          }
          ok(!run.cards.some((c, i) => c && !seen.has(i)), `${lin} ${ROOMS[room].id}: пустые клетки разделили карты`);
        }
        if (run.over) break;
      }
      if (run.over === 'win') ok(run.enemiesLeft === 0, 'победа только после уничтожения всех врагов');
    }
  }
}
ok(autoPicks > 20, `автоприменение срабатывает в фазз-тесте (${autoPicks})`);
ok(perkUses > 200, `способности применяются в фазз-тесте (${perkUses})`);
console.log(`Прогонов боя: ${runs} (автоприменений: ${autoPicks}, способностей: ${perkUses}). ${failed ? `ОШИБОК: ${failed}` : 'Все проверки пройдены.'}`);
if (failed) throw new Error('selftest failed');
