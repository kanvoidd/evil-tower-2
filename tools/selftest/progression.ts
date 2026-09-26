/** Самопроверка: Прогресс героя: дерево талантов, цены в душах, метаморфозы, характеристики, автопрокачка. */
import { Profile } from '../../src/domain/account/profile';
import type { ClassId, LineageId, TalentPath, TalentPlace } from '../../src/domain/catalog';
import { hasButton } from '../../src/domain/catalog/abilities';
import {
  baseClassOf,
  childrenOf,
  CLASS_DEFINITIONS,
  CLASSES,
  isBranched,
} from '../../src/domain/catalog/classes';
import { LINEAGE_ORDER, LINEAGES } from '../../src/domain/catalog/heroes';
import { PERK_BY_ID, perksOfClass } from '../../src/domain/catalog/perks';
import {
  maxRank,
  placesOfClass,
  talent,
  TALENT_PLACE_BY_ID,
  TALENT_PLACES,
} from '../../src/domain/catalog/talents';
import { bonus } from '../../src/domain/catalog/talents/talentEffects';
import { ATTACK_STRATEGIES, HandAttack } from '../../src/domain/combat/attack';
import type { AutoSkillSave } from '../../src/domain/progression';
import {
  branchOf,
  inferBranch,
  planAutoSkill,
} from '../../src/domain/progression/auto-skill/autoSkill';
import { HeroClassState } from '../../src/domain/progression/hero';
import {
  activePerkIds,
  applyBuy,
  applyCancelMetamorphosis,
  type BranchedTree,
  canBuy,
  canCancelMetamorphosis,
  canInvest,
  costOf,
  currentClassOf,
  isClassOwned,
  isPurchasable,
  learnedTalents,
  type LineageSave,
  newLineageSave,
  nodeState,
  openedClasses,
  ownedPerks,
  rankOf,
  type TieredTree,
  type Tree,
  type TreeNode,
  TREES,
} from '../../src/domain/progression/skill-tree';
import {
  SOUL_PRICING,
  type SoulPriceTable,
  StageTablePricing,
} from '../../src/domain/progression/soul-prices';
import { buildPlayerStats, CAPS } from '../../src/domain/progression/stats/stats';
import { talentBonuses } from '../../src/domain/progression/stats/talent-bonuses/talentBonuses';
import { CellIndex, DayKey, Ratio, Souls } from '../../src/domain/shared';
import { SkillTreeLayout } from '../../src/presentation/views/skill-tree/SkillTreeLayout';
import { ok } from './harness';

const TIERED = LINEAGE_ORDER.filter((l) => TREES[l].shape === 'tiered');
const BRANCHED = LINEAGE_ORDER.filter((l) => TREES[l].shape === 'branched');
const tieredTree = (l: LineageId): TieredTree => TREES[l] as TieredTree;
const branchedTree = (l: LineageId): BranchedTree => TREES[l] as BranchedTree;

/** Купить всё, что подходит, — дешёвое первым (как игрок, у которого души не кончаются). */
const buyAll = (tree: Tree, ls: LineageSave, pred: (n: TreeNode) => boolean): void => {
  for (let guard = 0; guard < 4000; guard++) {
    const list = tree.nodes.filter((n) => isPurchasable(n) && pred(n) && canInvest(tree, ls, n));
    if (!list.length) return;
    applyBuy(tree, ls, list.sort((a, b) => costOf(ls, a) - costOf(ls, b))[0]);
  }
};

ok(
  TIERED.length === 2 && BRANCHED.length === 2,
  'воин и наёмник — деревья с ярусами, маг и охотник — с ветками',
);

// ---------------------------------------------------------------- дерево с ярусами
for (const lin of TIERED) {
  const tree = tieredTree(lin);
  const base = baseClassOf(lin);
  const ls = newLineageSave(tree);
  ok(isClassOwned(tree, ls, base), `${lin}: базовый класс открыт`);
  ok(activePerkIds(tree, ls).length === 1, `${lin}: активна только стартовая способность`);
  const talentNodes = tree.nodes.filter((n) => n.kind === 'talent').length;
  ok(talentNodes >= 60 && talentNodes <= 64, `${lin}: талантов в дереве ${talentNodes}`);

  // ворота: перк 2 закрыт, пока ни один талант первого яруса не прокачан до максимума
  const p2 = tree.nodes.find((n) => n.kind === 'perk' && n.owner === base && n.slot === 'p2')!;
  ok(nodeState(tree, ls, p2) === 'locked', `${lin}: перк 2 закрыт до прокачки яруса`);
  const chainStarts = tree.nodes.filter(
    (n) => n.kind === 'talent' && n.owner === base && n.tier === 1 && n.step === 0,
  );
  ok(chainStarts.length === 3, `${lin}: на первом ярусе три цепочки (${chainStarts.length})`);
  for (const n of chainStarts)
    ok(
      nodeState(tree, ls, n) === 'available',
      `${lin}: начала цепочек первого яруса доступны сразу`,
    );
  // берём самую длинную цепочку — её середина должна открываться только после предыдущего таланта
  const longest = (['attack', 'vitality', 'guard'] as TalentPath[])
    .map((path) =>
      tree.nodes
        .filter((n) => n.kind === 'talent' && n.owner === base && n.tier === 1 && n.path === path)
        .sort((a, b) => a.step! - b.step!),
    )
    .sort((a, b) => b.length - a.length)[0];
  if (longest.length > 1)
    ok(
      nodeState(tree, ls, longest[1]) === 'locked',
      `${lin}: продолжение цепочки закрыто до прокачки предыдущего`,
    );
  const t1 = longest[0];
  applyBuy(tree, ls, t1);
  ok(
    maxRank(TALENT_PLACE_BY_ID[t1.talentId!].talent.effect) === 1 ||
      nodeState(tree, ls, t1) === 'partial',
    `${lin}: талант частично прокачан`,
  );
  for (const n of longest) {
    while (nodeState(tree, ls, n) !== 'owned') applyBuy(tree, ls, n);
  }
  ok(nodeState(tree, ls, p2) === 'available', `${lin}: пройденная цепочка открыла перк 2`);
  ok(rankOf(ls, t1.id) === (t1.ranks ?? 1), `${lin}: ранг не превышает максимум`);
  ok(costOf(ls, t1) === 0, `${lin}: у прокачанного до конца таланта нет цены`);

  // цена ранга растёт
  const place = TALENT_PLACE_BY_ID[t1.talentId!];
  ok(
    SOUL_PRICING.talentRank(place, 2) > SOUL_PRICING.talentRank(place, 1),
    `${lin}: второй ранг дороже первого`,
  );
  const perk = (slot: string) => PERK_BY_ID[`${base}_${slot}`];
  ok(
    SOUL_PRICING.perk(perk('p3'), 1) > SOUL_PRICING.perk(perk('p2'), 1),
    `${lin}: третья способность дороже второй`,
  );
  ok(SOUL_PRICING.perk(perk('start'), 1) === 0, `${lin}: стартовая способность бесплатна`);
}

// ---------------------------------------------------------------- дерево с ветками
for (const lin of BRANCHED) {
  const tree = branchedTree(lin);
  const base = baseClassOf(lin);
  const ls = newLineageSave(tree);
  const tag = (s: string): string => `${lin}: ${s}`;
  ok(isClassOwned(tree, ls, base), tag('базовый класс открыт'));
  ok(
    ownedPerks(tree, ls).length === 0,
    tag('у базового класса нет перков — сразу выбор подкласса'),
  );
  ok(
    tree.subclasses.length === 3 && tree.transitional.length === 1,
    tag('три подкласса и переходный'),
  );

  // «Основа»: первый ярус открыт сразу, следующий — после любой пройденной цепочки
  const baseNodes = tree.nodes.filter((n) => n.tab === 'base');
  ok(
    baseNodes.length > 20 && baseNodes.every((n) => n.kind === 'talent'),
    tag('«Основа» — таланты'),
  );
  const t1 = baseNodes.filter((n) => n.tier === 1 && n.step === 0);
  ok(
    t1.length === 3 && t1.every((n) => nodeState(tree, ls, n) === 'available'),
    tag('ярус 1 открыт'),
  );
  const t2 = baseNodes.find((n) => n.tier === 2 && n.step === 0)!;
  ok(nodeState(tree, ls, t2) === 'locked', tag('ярус 2 закрыт'));
  const chain = baseNodes.filter((n) => n.tier === 1 && n.path === t1[0].path);
  for (const n of chain) while (nodeState(tree, ls, n) !== 'owned') applyBuy(tree, ls, n);
  ok(nodeState(tree, ls, t2) === 'available', tag('пройденная цепочка открыла ярус 2'));
  ok(
    SOUL_PRICING.talentRank(TALENT_PLACE_BY_ID[t2.talentId!], 1) >
      SOUL_PRICING.talentRank(TALENT_PLACE_BY_ID[t1[0].talentId!], 1),
    tag('ярус 2 «Основы» дороже яруса 1'),
  );

  // подклассы: выбор бесплатный, остальные закрываются
  for (const c of tree.subclasses) {
    const n = tree.classNode[c];
    ok(nodeState(tree, ls, n) === 'available', tag(`подкласс ${c} доступен`));
    ok(costOf(ls, n) === 0, tag(`выбор подкласса ${c} бесплатный`));
  }
  const firstStep = (c: ClassId): TreeNode =>
    tree.nodes.find((n) => n.owner === c && n.branch && n.step === 0)!;
  ok(
    nodeState(tree, ls, firstStep(tree.subclasses[0])) === 'locked',
    tag('ветки закрыты до выбора'),
  );
  const [sub, other] = tree.subclasses;
  applyBuy(tree, ls, tree.classNode[sub]);
  ok(nodeState(tree, ls, tree.classNode[other]) === 'blocked', tag('соседний подкласс закрыт'));
  ok(currentClassOf(tree, ls) === sub, tag('герой стал подклассом'));
  const p1 = firstStep(sub);
  ok(
    p1.kind === 'perk' && nodeState(tree, ls, p1) === 'available',
    tag('первый перк ветки открыт'),
  );
  ok(costOf(ls, p1) > 0 && costOf(ls, p1) <= 100, tag(`первый перк дешёвый (${costOf(ls, p1)})`));
  const magister = tree.classNode[tree.transitional[0]];
  ok(nodeState(tree, ls, magister) === 'locked', tag('переходный класс закрыт до конца ветки'));
  ok(canCancelMetamorphosis(tree, ls, sub), tag('от подкласса можно отказаться'));

  // уровни перка: ранги узла, следующий уровень дороже
  const leveled = tree.nodes.find(
    (n) => n.kind === 'perk' && n.tab === 'profession' && (n.ranks ?? 1) > 1,
  );
  if (leveled) {
    const perk = PERK_BY_ID[`${leveled.owner}_${leveled.slot}`];
    ok(
      SOUL_PRICING.perk(perk, 2) > SOUL_PRICING.perk(perk, 1),
      tag('следующий уровень перка дороже'),
    );
  }

  // все ветки выбранного подкласса — до конца; конец ветки открывает переходный класс
  buyAll(tree, ls, (n) => n.owner === sub && n.kind !== 'class');
  const owned = ownedPerks(tree, ls);
  ok(
    owned.length > 0 && owned.every((o) => o.perk.classId === sub),
    tag('перки подкласса у героя'),
  );
  ok(
    owned.every((o) => o.level === (tree.byId.get(`perk/${sub}/${o.perk.slot}`)!.ranks ?? 1)),
    tag('перки прокачаны до последнего уровня'),
  );
  ok(
    nodeState(tree, ls, magister) === 'available',
    tag('пройденная ветка открыла переходный класс'),
  );
  applyBuy(tree, ls, magister);
  ok(currentClassOf(tree, ls) === magister.classId, tag('герой стал переходным классом'));
  ok(!canCancelMetamorphosis(tree, ls, sub), tag('подкласс не отменить, пока герой ушёл дальше'));
  ok(!canCancelMetamorphosis(tree, ls, magister.classId!), tag('переходный класс не отменить'));
  buyAll(tree, ls, (n) => n.owner === magister.classId && n.kind !== 'class');
  ok(
    ownedPerks(tree, ls).some((o) => o.perk.classId === magister.classId) &&
      ownedPerks(tree, ls).some((o) => o.perk.classId === sub),
    tag('перки подкласса остаются в переходном классе'),
  );

  // отказ от подкласса: ветки сброшены, часть душ возвращается, соседи снова открыты
  const ls2 = newLineageSave(tree);
  applyBuy(tree, ls2, tree.classNode[sub]);
  buyAll(tree, ls2, (n) => n.owner === sub && n.kind !== 'class');
  const { refund } = applyCancelMetamorphosis(tree, ls2, sub);
  ok(refund > 0 && !isClassOwned(tree, ls2, sub), tag(`отказ от подкласса, возврат ${refund}`));
  ok(ownedPerks(tree, ls2).length === 0, tag('после отказа перков нет'));
  ok(nodeState(tree, ls2, tree.classNode[other]) === 'available', tag('соседний подкласс открыт'));
  ok(currentClassOf(tree, ls2) === base, tag('после отказа — снова базовый класс'));
}

// ---------------------------------------------------------------- одна ветка на выбор (стихия)
{
  const tree = branchedTree('mage');
  const ls = newLineageSave(tree);
  applyBuy(tree, ls, tree.classNode.elementalist);
  const starts = tree.nodes.filter((n) => n.owner === 'elementalist' && n.step === 0);
  ok(starts.length === 3, 'элементалист: три стихии');
  ok(
    starts.every((n) => nodeState(tree, ls, n) === 'available'),
    'элементалист: стихии открыты',
  );
  applyBuy(tree, ls, starts[0]);
  ok(
    starts.slice(1).every((n) => nodeState(tree, ls, n) === 'blocked'),
    'элементалист: выбранная стихия закрывает остальные',
  );
  const arc = newLineageSave(tree);
  applyBuy(tree, arc, tree.classNode.arcanist);
  const arcStarts = tree.nodes.filter((n) => n.owner === 'arcanist' && n.step === 0);
  applyBuy(tree, arc, arcStarts[0]);
  ok(
    arcStarts.slice(1).every((n) => nodeState(tree, arc, n) === 'available'),
    'арканист: ветки урона и манипуляции развиваются обе',
  );
}

// ---------------------------------------------------------------- цены в душах по таблице ступеней
{
  const table: SoulPriceTable = {
    talentBase: [
      [10, 20, 30],
      [100, 200, 300],
      [1000, 2000, 3000],
    ],
    rankStep: 0.5,
    perkMul: { start: 0, p2: 2, p3: 3, legend: 4 },
    branchPerkMul: 4,
    perkLevelStep: 1,
    metamorphosis: { second: 500, final: 5000, subclass: 0, transitional: 700 },
  };
  const pr = new StageTablePricing(table, Ratio.of(0.5));
  const place = (classId: ClassId, tier: number, tab: 'base' | 'profession'): TalentPlace => ({
    id: 'test',
    classId,
    tab,
    path: 'attack',
    tier: tier as TalentPlace['tier'],
    step: 0,
    talent: talent('test', bonus('crit', [1, 2, 3])),
  });
  ok(
    pr.talentRank(place('warrior', 1, 'profession'), 1) === 10 &&
      pr.talentRank(place('warrior', 1, 'profession'), 3) === 20 &&
      pr.talentRank(place('knight', 2, 'profession'), 1) === 200 &&
      pr.talentRank(place('paladin', 3, 'profession'), 2) === 4500,
    'цена ранга: база ступени и яруса, каждый ранг дороже на долю базы',
  );
  ok(
    pr.talentRank(place('elementalist', 2, 'profession'), 1) === 20 &&
      pr.talentRank(place('magister', 1, 'profession'), 1) === 100,
    'подкласс платит по первой строке, переходный класс — по второй',
  );
  ok(
    pr.talentRank(place('mage', 3, 'base'), 1) === 30 &&
      pr.talentRank(place('mage', 4, 'base'), 1) === 100,
    '«Основа»: ярусы 1–3 — первая строка, 4–6 — вторая',
  );
  ok(
    pr.talentTotal(place('warrior', 1, 'profession'), 3) === 10 + 15 + 20,
    'полная цена таланта — сумма его рангов',
  );
  ok(
    pr.perk(PERK_BY_ID.warrior_start, 1) === 0 &&
      pr.perk(PERK_BY_ID.warrior_p2, 1) === 20 &&
      pr.perk(PERK_BY_ID.warrior_p3, 1) === 60 &&
      pr.perk(PERK_BY_ID.paladin_legend, 1) === 12000,
    'цена способности класса с ярусами кратна базе яруса, после которого она открывается',
  );
  const ignite = PERK_BY_ID['elementalist_fire-1'];
  const detonate = PERK_BY_ID['elementalist_fire-3'];
  ok(
    pr.perk(ignite, 1) === 40 && pr.perk(ignite, 2) === 80 && pr.perkTotal(ignite, 2) === 120,
    'перк ветки: первый уровень кратен базе, следующие дороже на долю его цены',
  );
  ok(pr.perk(detonate, 1) === 80, 'перк дальше по ветке стоит по следующему ярусу');
  ok(
    pr.metamorphosis('knight') === 500 &&
      pr.metamorphosis('paladin') === 5000 &&
      pr.metamorphosis('elementalist') === 0 &&
      pr.metamorphosis('magister') === 700,
    'метаморфоза: вторая ступень, финал, подкласс (бесплатно), переходный класс',
  );
  ok(pr.refund(101) === 50, 'возврат — доля вложенного с округлением вниз');
}

// ---------------------------------------------------------------- метаморфоза (ярусы)
for (const lin of TIERED) {
  const tree = tieredTree(lin);
  const base = baseClassOf(lin);
  const ls = newLineageSave(tree);
  buyAll(tree, ls, (n) => n.owner === base && n.kind !== 'class');
  const bonusBefore = talentBonuses(learnedTalents(tree, ls));
  const perksBefore = activePerkIds(tree, ls);
  ok(perksBefore.length === 3, `${lin}: у базового класса три способности (${perksBefore.length})`);

  const second = tree.classNode[tree.second];
  ok(
    canBuy(tree, ls, second, Souls.of(1e9)).ok,
    `${lin}: метаморфоза доступна после прокачки третьего яруса`,
  );
  applyBuy(tree, ls, second);
  const bonusAfter = talentBonuses(learnedTalents(tree, ls));
  ok(
    JSON.stringify(bonusBefore) === JSON.stringify(bonusAfter),
    `${lin}: таланты сохранились при метаморфозе`,
  );
  // способности прежнего класса остаются с героем — метаморфоза ничего не отнимает
  const afterMeta = activePerkIds(tree, ls);
  ok(
    perksBefore.every((id) => afterMeta.includes(id)),
    `${lin}: способности базового класса сохранились`,
  );
  ok(
    afterMeta.length === perksBefore.length + 1,
    `${lin}: к ним добавилась стартовая способность нового класса (${afterMeta.length})`,
  );
  ok(openedClasses(tree, ls).length === 2, `${lin}: открыты два класса`);
  ok(
    currentClassOf(tree, ls) === tree.second,
    `${lin}: в выборе класса новый класс заменил прежний`,
  );

  buyAll(tree, ls, (n) => n.owner === tree.second && n.kind !== 'class');
  const [a, b] = tree.terminals;
  ok(
    canBuy(tree, ls, tree.classNode[a], Souls.of(1e9)).ok,
    `${lin}: финальный класс ${a} доступен`,
  );
  applyBuy(tree, ls, tree.classNode[a]);
  ok(nodeState(tree, ls, tree.classNode[b]) === 'blocked', `${lin}: соседняя ветка ${b} закрыта`);
  ok(canCancelMetamorphosis(tree, ls, a), `${lin}: отмена метаморфозы доступна`);
  const legend = tree.nodes.find((n) => n.kind === 'perk' && n.owner === a && n.slot === 'legend')!;
  ok(
    nodeState(tree, ls, legend) === 'locked',
    `${lin}: легендарная способность закрыта до третьего яруса`,
  );
  buyAll(tree, ls, (n) => n.owner === a && n.kind !== 'class');
  ok(nodeState(tree, ls, legend) === 'owned', `${lin}: легендарная способность покупается`);
  // 3 (база) + 3 (второй класс) + 4 (финальный) — все они в руках героя одновременно
  const full = activePerkIds(tree, ls);
  ok(full.length === 10, `${lin}: у финального класса десять способностей (${full.length})`);
  ok(
    perksBefore.every((id) => full.includes(id)),
    `${lin}: перки базового класса дошли до финала`,
  );

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
  ok(
    s.crit <= CAPS.crit && s.dodge <= CAPS.dodge && s.parry <= CAPS.parry && s.block <= CAPS.block,
    `${id}: потолки характеристик соблюдены`,
  );
  ok(s.perkPower >= 1, `${id}: сила способностей не меньше базовой`);
  ok(s.abilities.every(hasButton), `${id}: в ряду кнопок только активные способности`);
  // нижняя панель боя рассчитана на две полки по пять кнопок
  ok(s.abilities.length <= 10, `${id}: кнопок не больше десяти (${s.abilities.length})`);
}
// пассивка линеек по ТЗ
{
  const start = (id: ClassId) =>
    buildPlayerStats({
      classId: id,
      lineage: newLineageSave(TREES[CLASSES[id].lineage]),
      weapon: null,
      armor: null,
    });
  const w = start('warrior');
  const m = start('mage');
  const a = start('hunter');
  const c = start('mercenary');
  ok(
    w.maxHp > m.maxHp && w.maxHp > a.maxHp && w.maxHp > c.maxHp,
    'воин: самый большой запас здоровья',
  );
  ok(
    m.resMax > w.resMax && m.resMax > a.resMax && m.resMax > c.resMax,
    'маг: самый большой запас ресурса',
  );
  ok(a.crit > w.crit && a.crit > m.crit && a.crit > c.crit, 'охотник: самый высокий шанс крита');
  ok(Math.abs(c.goldBonus - 0.2) < 1e-9, 'наёмник: +20% золота');
  ok(
    [w, m, a, c].every((s) => s.attack.melee),
    'базовая атака у всех одна: рукой по соседнему врагу',
  );
  ok(
    m.attack instanceof HandAttack && a.attack instanceof HandAttack,
    'маг и охотник без перков бьют только рукой',
  );
  ok(
    m.attack.mode === 'none' &&
      a.attack.mode === 'none' &&
      c.attack.mode === 'any' &&
      w.attack.mode === 'none',
    'базовые дальние действия: только у наёмника с самого начала',
  );
  ok(
    c.attack.guaranteedCrit && !a.attack.guaranteedCrit,
    'гарантированный крит только у удара в спину',
  );
  ok(
    LINEAGE_ORDER.every(
      (lin) => start(baseClassOf(lin)).attack === ATTACK_STRATEGIES[LINEAGES[lin].attack],
    ),
    'без перков стиль боя героя — стратегия его линейки',
  );
  // дальний выстрел — перк: «Сквозной выстрел» лучника и «Залп болтом» арбалетчика
  for (const [cls, perkId] of [
    ['bowman', 'bowman_bow-1'],
    ['crossbowman', 'crossbowman_crossbow-1'],
  ] as const) {
    const tree = TREES.archer;
    const ls = newLineageSave(tree);
    applyBuy(tree, ls, tree.classNode[cls]);
    applyBuy(tree, ls, tree.byId.get(`perk/${cls}/${PERK_BY_ID[perkId].slot}`)!);
    const s = buildPlayerStats({ classId: cls, lineage: ls, weapon: null, armor: null });
    ok(
      s.attack === ATTACK_STRATEGIES.shot && s.rangedCost === PERK_BY_ID[perkId].ability.cost,
      `${cls}: базовый перк даёт выстрел через карту`,
    );
  }

  // досягаемость базового действия (поле 0 1 2 / 3 4 5 / 6 7 8)
  const reach = (style: 'hand' | 'shot' | 'backstab', from: number, to: number): boolean =>
    ATTACK_STRATEGIES[style].reaches(CellIndex.of(from), CellIndex.of(to));
  ok(
    reach('shot', 0, 2) && reach('shot', 1, 7) && !reach('shot', 0, 4) && !reach('shot', 0, 8),
    'выстрел: через карту по прямой',
  );
  ok(reach('backstab', 0, 8) && reach('backstab', 4, 2), 'удар в спину достаёт любую клетку');
  ok(!reach('hand', 0, 2), 'рукой вдаль не достать');

  // цена спасения от смерти
  const price = (lin: LineageId) => LINEAGES[lin].cheatDeathPrice;
  ok(
    price('mage').drainsResource && price('mage').goldShare === 0,
    'маг платит за спасение всей маной',
  );
  ok(
    !price('mercenary').drainsResource && Math.abs(price('mercenary').goldShare - 0.2) < 1e-9,
    'наёмник откупается пятой частью золота',
  );
  ok(
    !price('warrior').drainsResource &&
      price('warrior').goldShare === 0 &&
      !price('archer').drainsResource &&
      price('archer').goldShare === 0,
    'воин и охотник спасаются даром',
  );
}

// ---------------------------------------------------------------- уровни перков и правки талантов
{
  const tree = TREES.mage;
  const ls = newLineageSave(tree);
  applyBuy(tree, ls, tree.classNode.elementalist);
  const node = (id: string): TreeNode => tree.byId.get(id)!;
  const stats = () =>
    buildPlayerStats({ classId: 'elementalist', lineage: ls, weapon: null, armor: null });
  applyBuy(tree, ls, node('perk/elementalist/fire-1'));
  const ignite1 = stats().abilities.find((a) => a.id === 'ignite')!;
  ok(
    ignite1.behavior === 'strike' && ignite1.params.ticks === 2,
    'поджог первого уровня: два тика',
  );
  applyBuy(tree, ls, node('perk/elementalist/fire-1'));
  const ignite2 = stats().abilities.find((a) => a.id === 'ignite')!;
  ok(
    ignite2.behavior === 'strike' && ignite2.params.ticks === 3 && !ignite2.params.burstAt,
    'второй уровень: три тика, без «Воспламенения» взрыва нет',
  );
  applyBuy(tree, ls, node('tal/elementalist/fire-2'));
  const ignited = stats().abilities.find((a) => a.id === 'ignite')!;
  ok(
    ignited.behavior === 'strike' && ignited.params.burstAt === 4 && ignited.params.ticks === 3,
    '«Воспламенение» добавляет поджогу взрыв на четырёх тиках, уровень перка сохранён',
  );
}

// ---------------------------------------------------------------- раскладка дерева на экране
// у правил дерева только уровни узлов, пиксели считает вид; они обязаны сходиться
for (const lin of LINEAGE_ORDER) {
  const tree = TREES[lin];
  const layout = new SkillTreeLayout(tree);
  ok(
    tree.nodes.every((n) => !!layout.at(n)),
    `${lin}: раскладка даёт координаты каждому узлу`,
  );
  const sameBlock = (a: TreeNode, b: TreeNode): boolean => a.owner === b.owner && a.tab === b.tab;
  const ordered = tree.nodes.every((a) =>
    tree.nodes.every(
      (b) =>
        !sameBlock(a, b) || Math.sign(a.row - b.row) === Math.sign(layout.at(a).y - layout.at(b).y),
    ),
  );
  ok(ordered, `${lin}: выше по уровню — выше на экране`);
  ok(
    layout.hasBaseTab === (tree.shape === 'branched'),
    `${lin}: вкладка «Основа» у дерева с ветками`,
  );
}

// ---------------------------------------------------------------- автопрокачка
const PATHS: TalentPath[] = ['attack', 'vitality', 'guard'];
for (const lin of TIERED) {
  const tree = tieredTree(lin);
  for (const path of PATHS) {
    const cfg: AutoSkillSave = { on: true, path };
    const ls = newLineageSave(tree);
    const tag = `${lin}/${path}`;
    const plan = planAutoSkill(tree, ls, Souls.of(1e9), cfg);
    ok(plan.buys.length >= 8, `автопрокачка ${tag}: купила ветку (${plan.buys.length})`);
    ok(plan.stop === 'meta', `автопрокачка ${tag}: остановилась перед метаморфозой (${plan.stop})`);
    ok(
      plan.buys.every((n) => n.kind !== 'class'),
      `автопрокачка ${tag}: не покупает смену класса`,
    );
    ok(
      plan.buys.every((n) => n.kind === 'perk' || n.path === path),
      `автопрокачка ${tag}: только выбранный путь`,
    );
    ok(
      plan.buys.filter((n) => n.kind === 'perk').length === 2,
      `автопрокачка ${tag}: перки-ворота между ярусами`,
    );

    const sim = newLineageSave(tree);
    let souls: number = plan.spent;
    for (const n of plan.buys) {
      const r = canBuy(tree, sim, n, Souls.of(souls));
      ok(r.ok, `автопрокачка ${tag}: узел ${n.id} покупается по порядку`);
      if (r.ok) souls -= r.cost;
      applyBuy(tree, sim, n);
    }
    ok(souls === 0, `автопрокачка ${tag}: потрачено ровно столько, сколько в плане`);
    const again = planAutoSkill(tree, sim, Souls.of(1e9), cfg);
    ok(
      again.buys.length === 0 && again.stop === 'meta',
      `автопрокачка ${tag}: повтор ничего не покупает`,
    );

    applyBuy(tree, sim, tree.classNode[tree.second]);
    const next = planAutoSkill(tree, sim, Souls.of(1e9), cfg);
    ok(
      next.buys.length >= 8,
      `автопрокачка ${tag}: продолжает после метаморфозы (${next.buys.length})`,
    );
    ok(
      next.buys.every((n) => n.owner === tree.second),
      `автопрокачка ${tag}: покупает узлы нового класса`,
    );
  }
}
for (const lin of BRANCHED) {
  const tree = branchedTree(lin);
  const cfg: AutoSkillSave = { on: true, path: 'guard' };
  const ls = newLineageSave(tree);
  const plan = planAutoSkill(tree, ls, Souls.of(1e9), cfg);
  ok(
    plan.buys.length >= 6 &&
      plan.buys.every((n) => n.tab === 'base' && n.path === 'guard') &&
      plan.stop === 'meta',
    `автопрокачка ${lin}: до выбора подкласса — только путь «Основы» (${plan.buys.length})`,
  );
  for (const n of plan.buys) applyBuy(tree, ls, n);
  const sub = tree.subclasses.find((c) => {
    const cls = CLASSES[c];
    return isBranched(cls) && cls.branchChoice === 'all';
  })!;
  applyBuy(tree, ls, tree.classNode[sub]);
  const next = planAutoSkill(tree, ls, Souls.of(1e9), cfg);
  ok(
    next.buys.some((n) => n.kind === 'perk' && n.owner === sub) &&
      next.buys.every((n) => n.kind !== 'class'),
    `автопрокачка ${lin}: после выбора подкласса покупает его перки (${sub})`,
  );
}
{
  const tree = branchedTree('mage');
  const ls = newLineageSave(tree);
  applyBuy(tree, ls, tree.classNode.elementalist);
  const plan = planAutoSkill(tree, ls, Souls.of(1e9), { on: true, path: 'attack' });
  ok(
    plan.buys.every((n) => n.owner !== 'elementalist') && plan.stop === 'meta',
    'автопрокачка: стихию элементалиста выбирает игрок',
  );
}
for (const lin of LINEAGE_ORDER) {
  const tree = TREES[lin];
  const ls = newLineageSave(tree);
  const small = planAutoSkill(tree, ls, Souls.of(40), { on: true, path: 'attack' });
  ok(
    small.spent <= 40 && small.buys.length > 0,
    `автопрокачка ${lin}: на малые души купила часть (${small.buys.length}, ${small.spent})`,
  );
  ok(small.stop === 'souls', `автопрокачка ${lin}: остановилась из-за нехватки душ`);
  ok(
    planAutoSkill(tree, ls, Souls.of(0), { on: true, path: 'vitality' }).buys.length === 0,
    `автопрокачка ${lin}: без душ ничего не покупает`,
  );
}
{
  const tree = TREES.warrior;
  const ls = newLineageSave(tree);
  ok(inferBranch(tree, ls) === null, 'путь автопрокачки: без покупок неизвестен');
  const guard = tree.nodes.find(
    (n) => n.kind === 'talent' && n.owner === 'warrior' && n.path === 'guard' && n.tier === 1,
  )!;
  applyBuy(tree, ls, guard);
  ok(inferBranch(tree, ls)?.path === 'guard', 'путь автопрокачки: берётся из последней покупки');
  ok(branchOf(guard).path === 'guard', 'узел таланта задаёт путь');
  const perk = tree.nodes.find((n) => n.kind === 'perk' && n.slot === 'p2')!;
  ok(Object.keys(branchOf(perk)).length === 0, 'способность путь не меняет');
  const branchTalent = TREES.mage.byId.get('tal/elementalist/fire-2')!;
  ok(Object.keys(branchOf(branchTalent)).length === 0, 'талант ветки путь не меняет');
}

// ---------------------------------------------------------------- определения классов и герой
{
  for (const id of Object.keys(CLASSES) as ClassId[]) {
    const def = CLASS_DEFINITIONS[id];
    const cls = CLASSES[id];
    ok(
      !!def &&
        def.lineage.id === cls.lineage &&
        def.stage === cls.stage &&
        JSON.stringify(def.parents) === JSON.stringify(cls.parents),
      `${id}: определение класса совпадает с классом`,
    );
    const base = def.lineage.base;
    ok(
      (Object.keys(base) as Array<keyof typeof base>).every(
        (k) => def.baseStats[k] === base[k] + (cls.bonuses[k] ?? 0),
      ),
      `${id}: база класса = база линейки + бонусы класса`,
    );
    ok(
      JSON.stringify(def.abilities.map((p) => p.id)) ===
        JSON.stringify(perksOfClass(id).map((p) => p.id)),
      `${id}: способности класса`,
    );
    ok(def.talents.length === placesOfClass(id).length, `${id}: таланты класса`);
    ok(
      JSON.stringify([...def.next].sort()) === JSON.stringify(childrenOf(id).sort()),
      `${id}: метаморфоза ведёт в дочерние классы (${def.next.join(',')})`,
    );
  }
  ok(
    TALENT_PLACES.filter((p) => p.tab === 'base').every(
      (p) => p.classId === baseClassOf(CLASSES[p.classId].lineage),
    ),
    '«Основа» принадлежит базовому классу линейки',
  );

  // жизненный цикл: маг → элементалист → магистр, тот же экземпляр героя; отказ — назад к магу
  const profile = new Profile(Profile.freshData('ru', 0), () => 0, {
    today: () => DayKey.of(2026, 9, 25),
  });
  profile.unlockLineage('mage');
  profile.setActiveClass('mage');
  const hero = profile.activeHero;
  const tree = hero.tree;
  const buyOwn = (owner: ClassId): void => {
    for (let guard = 0; guard < 400; guard++) {
      const next = tree.nodes.find(
        (n) =>
          n.owner === owner &&
          n.kind !== 'class' &&
          n.tab === 'profession' &&
          isPurchasable(n) &&
          canInvest(tree, hero.save, n),
      );
      if (!next) return;
      applyBuy(tree, hero.save, next);
    }
  };
  ok(hero.classId === 'mage' && profile.activeClass === 'mage', 'герой начинает базовым классом');
  ok(!hero.canMetamorphose('magister', Souls.of(1e9)).ok, 'через подкласс не перепрыгнуть');
  ok(hero.canMetamorphose('elementalist', Souls.of(0)).ok, 'подкласс выбирается даром');
  hero.metamorphose('elementalist');
  ok(profile.activeHero === hero, 'после метаморфозы — тот же экземпляр героя');
  ok(
    hero.classId === 'elementalist' && profile.activeClass === 'elementalist',
    'герой стал элементалистом',
  );
  ok(!hero.canMetamorphose('arcanist', Souls.of(1e9)).ok, 'соседний подкласс закрыт');
  ok(!hero.canMetamorphose('magister', Souls.of(1e9)).ok, 'магистр закрыт до конца ветки');
  buyOwn('elementalist');
  ok(hero.canMetamorphose('magister', Souls.of(1e9)).ok, 'пройденная стихия открыла магистра');
  ok(hero.canCancelMetamorphosis, 'от подкласса можно отказаться');
  const back = hero.cancelMetamorphosis();
  ok(
    back.to === 'mage' && back.refund > 0 && hero.classId === 'mage',
    `отказ вернул мага (возврат ${back.refund})`,
  );
  hero.metamorphose('warlock');
  buyOwn('warlock');
  hero.metamorphose('magister');
  ok(
    hero.classId === 'magister' && hero.classState.next.length === 0,
    'магистр — переходный класс, дальше пока некуда',
  );
  ok(hero.classState === HeroClassState.of('magister'), 'состояние класса одно на класс');
  ok(
    hero.combatStats(null, null).abilities.some((p) => p.id === 'blight_shot'),
    'перк чернокнижника остался у магистра',
  );
  ok(
    hero.classState.getAbilities() === CLASS_DEFINITIONS.magister.abilities,
    'способности состояния — из определения класса',
  );
  ok(!hero.canCancelMetamorphosis, 'от переходного класса не отказаться');
}
