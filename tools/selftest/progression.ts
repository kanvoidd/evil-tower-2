/** Самопроверка: Прогресс героя: дерево талантов, цены в душах, метаморфозы, характеристики, автопрокачка. */
import { Profile } from '../../src/domain/account/profile';
import type { ClassId, LineageId, TalentPath } from '../../src/domain/catalog';
import { CLASS_DEFINITIONS, CLASSES } from '../../src/domain/catalog/classes';
import { LINEAGE_ORDER, LINEAGES } from '../../src/domain/catalog/heroes';
import type { AbilityId } from '../../src/domain/catalog/perks';
import { hasButton, perksOfClass } from '../../src/domain/catalog/perks';
import { maxRank, TALENTS, talentsOfClass } from '../../src/domain/catalog/talents';
import { ATTACK_STRATEGIES, SpellAttack } from '../../src/domain/combat/attack';
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
  canBuy,
  canCancelMetamorphosis,
  canInvest,
  costOf,
  currentClassOf,
  isClassOwned,
  isPurchasable,
  newLineageSave,
  nodeState,
  openedClasses,
  rankOf,
  talentBonuses,
  type TreeNode,
  TREES,
} from '../../src/domain/progression/skill-tree';
import {
  SOUL_PRICING,
  type SoulPriceTable,
  StageTablePricing,
} from '../../src/domain/progression/soul-prices';
import { buildPlayerStats, CAPS } from '../../src/domain/progression/stats/stats';
import { CellIndex, DayKey, Ratio, Souls } from '../../src/domain/shared';
import { SkillTreeLayout } from '../../src/presentation/views/skill-tree/SkillTreeLayout';
import { ok } from './harness';

// ---------------------------------------------------------------- дерево талантов
for (const lin of LINEAGE_ORDER) {
  const tree = TREES[lin];
  const ls = newLineageSave(tree);
  ok(isClassOwned(tree, ls, lin), `${lin}: базовый класс открыт`);
  ok(activePerkIds(tree, ls, lin).length === 1, `${lin}: активна только стартовая способность`);
  const talentNodes = tree.nodes.filter((n) => n.kind === 'talent').length;
  ok(talentNodes >= 60 && talentNodes <= 64, `${lin}: талантов в дереве ${talentNodes}`);

  // ворота: перк 2 закрыт, пока ни один талант первого яруса не прокачан до максимума
  const p2 = tree.nodes.find((n) => n.kind === 'perk' && n.owner === lin && n.slot === 'p2')!;
  ok(nodeState(tree, ls, p2) === 'locked', `${lin}: перк 2 закрыт до прокачки яруса`);
  const chainStarts = tree.nodes.filter(
    (n) => n.kind === 'talent' && n.owner === lin && n.tier === 1 && n.step === 0,
  );
  ok(chainStarts.length === 3, `${lin}: на первом ярусе три цепочки (${chainStarts.length})`);
  for (const n of chainStarts)
    ok(
      nodeState(tree, ls, n) === 'available',
      `${lin}: начала цепочек первого яруса доступны сразу`,
    );
  // берём самую длинную цепочку — её середина должна открываться только после предыдущего таланта
  const chain1 = tree.nodes
    .filter(
      (n) =>
        n.kind === 'talent' && n.owner === lin && n.tier === 1 && n.path === chainStarts[0].path,
    )
    .sort((a, b) => a.step! - b.step!);
  const longest = (['attack', 'vitality', 'guard'] as TalentPath[])
    .map((path) =>
      tree.nodes
        .filter((n) => n.kind === 'talent' && n.owner === lin && n.tier === 1 && n.path === path)
        .sort((a, b) => a.step! - b.step!),
    )
    .sort((a, b) => b.length - a.length)[0];
  void chain1;
  if (longest.length > 1)
    ok(
      nodeState(tree, ls, longest[1]) === 'locked',
      `${lin}: продолжение цепочки закрыто до прокачки предыдущего`,
    );
  const t1 = longest[0];
  applyBuy(tree, ls, t1);
  ok(
    maxRank(TALENTS.find((t) => t.id === t1.talentId!)!) === 1 ||
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
  ok(
    SOUL_PRICING.talentRank(lin, 1, 2) > SOUL_PRICING.talentRank(lin, 1, 1),
    `${lin}: второй ранг дороже первого`,
  );
  ok(
    SOUL_PRICING.perk(lin, 'p3') > SOUL_PRICING.perk(lin, 'p2'),
    `${lin}: третья способность дороже второй`,
  );
  ok(SOUL_PRICING.perk(lin, 'start') === 0, `${lin}: стартовая способность бесплатна`);
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
    metamorphosis: { second: 500, final: 5000 },
  };
  const pr = new StageTablePricing(table, Ratio.of(0.5));
  const ofStage = (stage: number): ClassId =>
    (Object.keys(CLASSES) as ClassId[]).find((c) => CLASSES[c].stage === stage)!;
  const [base, second, final] = [ofStage(0), ofStage(1), ofStage(2)];
  ok(
    pr.talentRank(base, 1, 1) === 10 &&
      pr.talentRank(base, 1, 3) === 20 &&
      pr.talentRank(second, 2, 1) === 200 &&
      pr.talentRank(final, 3, 2) === 4500,
    'цена ранга: база ступени и яруса, каждый ранг дороже на долю базы',
  );
  ok(pr.talentTotal(base, 1, 3) === 10 + 15 + 20, 'полная цена таланта — сумма его рангов');
  ok(
    pr.perk(base, 'start') === 0 &&
      pr.perk(base, 'p2') === 20 &&
      pr.perk(base, 'p3') === 60 &&
      pr.perk(second, 'legend') === 1200,
    'цена способности кратна базе яруса, после которого она открывается',
  );
  ok(
    pr.metamorphosis(second) === 500 && pr.metamorphosis(final) === 5000,
    'метаморфоза: во вторую ступень и в финальный класс',
  );
  ok(pr.refund(101) === 50, 'возврат — доля вложенного с округлением вниз');
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
  ok(
    canBuy(tree, ls, second, Souls.of(1e9)).ok,
    `${lin}: метаморфоза доступна после прокачки третьего яруса`,
  );
  applyBuy(tree, ls, second);
  const bonusAfter = talentBonuses(tree, ls);
  ok(
    JSON.stringify(bonusBefore) === JSON.stringify(bonusAfter),
    `${lin}: таланты сохранились при метаморфозе`,
  );
  // способности прежнего класса остаются с героем — метаморфоза ничего не отнимает
  const afterMeta = activePerkIds(tree, ls, tree.second);
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

  buyAll((n) => n.owner === tree.second && n.kind !== 'class');
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
  buyAll((n) => n.owner === a && n.kind !== 'class');
  ok(nodeState(tree, ls, legend) === 'owned', `${lin}: легендарная способность покупается`);
  // 3 (база) + 3 (второй класс) + 4 (финальный) — все они в руках героя одновременно
  const full = activePerkIds(tree, ls, a);
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
  const a = start('archer');
  const c = start('mercenary');
  ok(
    w.maxHp > m.maxHp && w.maxHp > a.maxHp && w.maxHp > c.maxHp,
    'воин: самый большой запас здоровья',
  );
  ok(
    m.resMax > w.resMax && m.resMax > a.resMax && m.resMax > c.resMax,
    'маг: самый большой запас ресурса',
  );
  ok(a.crit > w.crit && a.crit > m.crit && a.crit > c.crit, 'лучник: самый высокий шанс крита');
  ok(Math.abs(c.goldBonus - 0.2) < 1e-9, 'наёмник: +20% золота');
  ok(
    !m.attack.melee && w.attack.melee && a.attack.melee && c.attack.melee,
    'маг вообще не бьёт рукой, остальные бьют',
  );
  ok(
    m.attack.mode === 'none' &&
      a.attack.mode === 'skip' &&
      c.attack.mode === 'any' &&
      w.attack.mode === 'none',
    'базовые действия линеек',
  );
  ok(
    c.attack.guaranteedCrit && !a.attack.guaranteedCrit,
    'гарантированный крит только у удара в спину',
  );
  ok(
    LINEAGE_ORDER.every((lin) => start(lin).attack === ATTACK_STRATEGIES[LINEAGES[lin].attack]),
    'стиль боя героя — стратегия его линейки',
  );

  // досягаемость базового действия (поле 0 1 2 / 3 4 5 / 6 7 8)
  const reach = (lin: LineageId, from: number, to: number, passives: AbilityId[] = []): boolean =>
    ATTACK_STRATEGIES[LINEAGES[lin].attack].reaches(
      CellIndex.of(from),
      CellIndex.of(to),
      new Set(passives),
    );
  ok(
    reach('archer', 0, 2) &&
      reach('archer', 1, 7) &&
      !reach('archer', 0, 4) &&
      !reach('archer', 0, 8),
    'лучник: выстрел через карту по прямой',
  );
  ok(
    reach('archer', 0, 4, ['diagonal']) && reach('archer', 0, 1, ['eagle_eye']),
    'лучник: «Косой прицел» — диагонали, «Орлиный глаз» — соседи',
  );
  ok(reach('mercenary', 0, 8) && reach('mercenary', 4, 2), 'удар в спину достаёт любую клетку');
  ok(
    !reach('warrior', 0, 2) && !reach('mage', 0, 2) && !reach('mage', 0, 4, ['diagonal']),
    'воин и маг вдаль не бьют',
  );

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
    'воин и лучник спасаются даром',
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
  const sameBlock = (a: TreeNode, b: TreeNode): boolean => a.owner === b.owner;
  const ordered = tree.nodes.every((a) =>
    tree.nodes.every(
      (b) =>
        !sameBlock(a, b) || Math.sign(a.row - b.row) === Math.sign(layout.at(a).y - layout.at(b).y),
    ),
  );
  ok(ordered, `${lin}: выше по уровню — выше на экране`);
}

// ---------------------------------------------------------------- автопрокачка
const PATHS: TalentPath[] = ['attack', 'vitality', 'guard'];
for (const lin of LINEAGE_ORDER) {
  const tree = TREES[lin];
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
        def.parent === cls.parent,
      `${id}: определение класса совпадает с классом фабрики`,
    );
    const base = def.lineage.base;
    ok(
      (Object.keys(base) as Array<keyof typeof base>).every(
        (k) => def.baseStats[k] === base[k] + (cls.mods[k] ?? 0),
      ),
      `${id}: база класса = база линейки + бонусы класса`,
    );
    ok(
      JSON.stringify(def.abilities.map((p) => p.id)) ===
        JSON.stringify(perksOfClass(id).map((p) => p.id)),
      `${id}: способности класса по слотам`,
    );
    ok(def.talents.length === talentsOfClass(id).length, `${id}: таланты класса`);
    const children = (Object.keys(CLASSES) as ClassId[]).filter((c) => CLASSES[c].parent === id);
    ok(
      JSON.stringify([...def.next].sort()) === JSON.stringify(children.sort()),
      `${id}: метаморфоза ведёт в дочерние классы (${def.next.join(',')})`,
    );
  }

  // жизненный цикл: маг → магистр → пиромант, тот же экземпляр героя; отмена — назад к магистру
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
          isPurchasable(n) &&
          canInvest(tree, hero.save, n),
      );
      if (!next) return;
      applyBuy(tree, hero.save, next);
    }
  };
  ok(hero.classId === 'mage' && profile.activeClass === 'mage', 'герой начинает базовым классом');
  ok(
    !hero.canMetamorphose('magister', Souls.of(1e9)).ok,
    'метаморфоза закрыта, пока ярус не пройден',
  );
  ok(!hero.canMetamorphose('pyromancer', Souls.of(1e9)).ok, 'через ступень не перепрыгнуть');
  buyOwn('mage');
  ok(
    hero.canMetamorphose('magister', Souls.of(1e9)).ok,
    'после третьего яруса открыта метаморфоза в магистра',
  );
  ok(!hero.canMetamorphose('magister', Souls.of(0)).ok, 'без душ метаморфоза не покупается');
  hero.metamorphose('magister');
  ok(profile.activeHero === hero, 'после метаморфозы — тот же экземпляр героя');
  ok(hero.classId === 'magister' && profile.activeClass === 'magister', 'герой стал магистром');
  ok(
    hero.combatStats(null, null).abilities.some((p) => p.id === 'mage_start'),
    'молния мага осталась у магистра',
  );
  let threw = false;
  try {
    hero.metamorphose('necromancer');
  } catch {
    threw = true;
  }
  ok(threw, 'финальный класс закрыт, пока ярус магистра не пройден');
  buyOwn('magister');
  hero.metamorphose('pyromancer');
  ok(
    hero.classId === 'pyromancer' && hero.classState.next.length === 0,
    'пиромант — финальный класс',
  );
  ok(hero.classState === HeroClassState.of('pyromancer'), 'состояние класса одно на класс');
  ok(
    hero.classState.attack instanceof SpellAttack && !hero.classState.attack.melee,
    'пиромант атакует как маг — только заклинаниями',
  );
  ok(
    hero.classState.getAbilities() === CLASS_DEFINITIONS.pyromancer.abilities,
    'способности состояния — из определения класса',
  );
  ok(!hero.canMetamorphose('necromancer', Souls.of(1e9)).ok, 'соседний финальный класс закрыт');
  ok(hero.canCancelMetamorphosis, 'метаморфозу в финальный класс можно отменить');
  const back = hero.cancelMetamorphosis();
  ok(
    back.to === 'magister' && back.refund > 0 && hero.classId === 'magister',
    `отмена вернула магистра (возврат ${back.refund})`,
  );
  ok(profile.activeHero === hero, 'после отмены — всё тот же герой');
  ok(!hero.canCancelMetamorphosis, 'метаморфозу в магистра не отменить');
}
