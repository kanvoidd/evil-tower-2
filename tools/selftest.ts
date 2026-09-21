/** Самопроверка логики: npm run selftest */
import { CLASSES, LINEAGE_ORDER } from '../src/data/classes';
import { ROOMS } from '../src/data/levels';
import {
  activePerkIds, applyBuy, applyCancelMetamorphosis, canBuy, canCancelMetamorphosis, costOf, currentClassOf, isClassOwned, isPurchasable,
  newLineageSave, nodeState, openedClasses, treeBonuses, TREES,
} from '../src/logic/skillTree';
import { buildPlayerStats } from '../src/logic/stats';
import { makeRng } from '../src/logic/rng';
import { Run, type Card } from '../src/logic/run';
import { needsHeal, needsRegen, pickAutoUse, worthArtifact } from '../src/logic/autoUse';
import { branchOf, inferBranch, planAutoSkill } from '../src/logic/autoSkill';
import { classTraits, type TraitId } from '../src/logic/traits';
import { GAMEPLAY } from '../src/config';
import { ru } from '../src/i18n/ru';
import { en } from '../src/i18n/en';
import type { AutoSkillSave, ChainKind } from '../src/types';

let failed = 0;
const ok = (cond: boolean, msg: string): void => {
  if (!cond) {
    failed++;
    console.error('FAIL:', msg);
  }
};

// ---------------------------------------------------------------- skill-tree
for (const lin of LINEAGE_ORDER) {
  const tree = TREES[lin];
  const ls = newLineageSave(tree);
  ok(isClassOwned(tree, ls, lin), `${lin}: базовый класс открыт`);
  ok(activePerkIds(tree, ls, lin).length === 1, `${lin}: активен только стартовый перк`);

  const buyable = () => tree.nodes.filter((n) => isPurchasable(n) && nodeState(tree, ls, n) === 'available');
  const buyCheapest = (pred: (n: (typeof tree.nodes)[number]) => boolean = () => true): boolean => {
    const list = buyable().filter(pred).sort((a, b) => costOf(a) - costOf(b));
    if (!list.length) return false;
    applyBuy(tree, ls, list[0]);
    return true;
  };

  // развилка: купили один вариант — второй заблокирован
  const first = buyable().find((n) => n.kind === 'stat' && n.excl !== undefined);
  if (first) {
    ok(canBuy(tree, ls, first, 1e9).ok, `${lin}: развилочный узел покупается`);
    applyBuy(tree, ls, first);
    ok(nodeState(tree, ls, tree.byId.get(first.excl!)!) === 'blocked', `${lin}: вторая опция развилки заблокирована`);
  }

  // прокачиваем всё вплоть до второй ступени
  let guard = 0;
  while (!isClassOwned(tree, ls, tree.second) && guard++ < 3000) {
    if (!buyCheapest((n) => n.kind !== 'class' || n.classId === tree.second)) break;
  }
  ok(isClassOwned(tree, ls, tree.second), `${lin}: достижима вторая ступень (${tree.second})`);
  const ownedPerks = ls.owned.filter((id) => tree.byId.get(id)!.kind === 'perk' && tree.byId.get(id)!.owner === lin);
  ok(ownedPerks.length === 0, `${lin}: перки базового класса потеряны после метаморфозы`);
  const bonus = treeBonuses(tree, ls);
  ok(bonus.damage + bonus.health + bonus.defense > 0, `${lin}: характеристики сохранились`);
  ok(activePerkIds(tree, ls, tree.second).length >= 1, `${lin}: у нового класса есть стартовый перк`);
  ok(openedClasses(tree, ls).length === 2, `${lin}: открыты два класса`);

  // до финала: обе ветки
  guard = 0;
  const [a, b] = tree.terminals;
  while (!tree.terminals.some((c) => isClassOwned(tree, ls, c)) && guard++ < 3000) {
    if (!buyCheapest((n) => n.kind !== 'class' || n.classId === a)) break;
  }
  ok(isClassOwned(tree, ls, a), `${lin}: достижим финальный класс ${a}`);
  ok(nodeState(tree, ls, tree.classNode[b]!) === 'blocked', `${lin}: соседняя ветка ${b} недоступна`);
  ok(canCancelMetamorphosis(tree, ls, a), `${lin}: отмена метаморфозы доступна`);
  const before = ls.owned.length;
  const { refund } = applyCancelMetamorphosis(tree, ls, a);
  ok(ls.owned.length <= before && !isClassOwned(tree, ls, a), `${lin}: ветка ${a} сброшена`);
  ok(nodeState(tree, ls, tree.classNode[b]!) === 'available', `${lin}: ${b} снова доступна`);
  ok(refund >= 0, `${lin}: возврат душ >= 0`);
  const stats = buildPlayerStats({ classId: tree.second, lineage: ls, weapon: null, armor: null });
  ok(stats.maxHp > 0 && stats.damage > 0, `${lin}: характеристики считаются`);
}

// ---------------------------------------------------------------- плавающий крит
{
  const tree = TREES.mercenary;
  const base = buildPlayerStats({ classId: 'mercenary', lineage: newLineageSave(tree), weapon: null, armor: null });
  const stats = { ...base, crit: 100, damage: 10, maxHp: 1e6, dodge: 0, parry: 0 };
  const run = new Run({ room: ROOMS[0], stats, weapon: null, armor: null, consumables: { potion_heal: 0, potion_regen: 0, artifact: 0 }, rng: makeRng(5) });
  run.start();
  run.hp = 1e6;
  const seen = new Set<number>();
  let sum = 0;
  const N = 400;
  for (let i = 0; i < N; i++) {
    run.cards[5] = { uid: 9000 + i, kind: 'enemy', defId: 'skeleton', hp: 99999, maxHp: 99999, atk: 0, value: 0 } as Card;
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
  ok(avg > 10 * 1.45 && avg < 10 * 1.85, `средний крит разумный (${avg.toFixed(2)})`);
}

// ---------------------------------------------------------------- автоприменение расходников
{
  const mk = (lin: 'mage' | 'warrior' | 'archer', patch: Partial<Record<string, number>> = {}): Run => {
    const tree = TREES[lin];
    const stats = buildPlayerStats({ classId: lin, lineage: newLineageSave(tree), weapon: null, armor: null });
    const run = new Run({
      room: ROOMS[0], stats, weapon: null, armor: null, consumables: { potion_heal: 2, potion_regen: 2, artifact: 2 }, rng: makeRng(3),
    });
    run.start();
    run.cards.fill(null);
    Object.assign(run, patch);
    return run;
  };
  const enemy = (atk: number, hp = 3): Card => ({ uid: Math.floor(Math.random() * 1e9), kind: 'enemy', defId: 'skeleton', hp, maxHp: hp, atk, value: 0 });

  // исцеление: не хватает целого зелья — пьём; мало — держим, пока не грозит смерть
  const heal = mk('mage');
  heal.pool.push(enemy(1));
  heal.hp = heal.stats.maxHp - GAMEPLAY.healPotionHp;
  ok(needsHeal(heal), 'зелье исцеления: не хватает ровно на объём лечения — применяем');
  heal.hp = heal.stats.maxHp - GAMEPLAY.healPotionHp + 1;
  ok(!needsHeal(heal), 'зелье исцеления: лечение пропало бы зря — держим');
  heal.cards[5] = enemy(50);
  heal.hp = 8;
  ok(needsHeal(heal), 'зелье исцеления: рядом враг, удар может убить — пьём даже с потерями');
  heal.cards[5] = enemy(1);
  ok(!needsHeal(heal), 'зелье исцеления: слабый враг рядом — не тратим');
  heal.consumables.potion_heal = 0;
  heal.hp = 2;
  ok(!needsHeal(heal), 'зелье исцеления: нет зелий — нечего применять');

  // восстановление: ресурса не хватает на основное действие, враги ещё есть
  const regen = mk('mage');
  regen.cards[5] = enemy(1);
  regen.res = 1;
  ok(needsRegen(regen), 'зелье восстановления: мане не хватает на удар — применяем');
  regen.res = regen.stats.attackCost;
  ok(!needsRegen(regen), 'зелье восстановления: маны хватает — держим');
  const warrior = mk('warrior');
  warrior.cards[5] = enemy(1);
  warrior.res = 0;
  ok(!needsRegen(warrior), 'зелье восстановления: воину ресурс нужен только для мощного удара — не тратим');
  const archer = mk('archer');
  archer.cards[5] = enemy(1);
  archer.res = 0;
  ok(needsRegen(archer), 'зелье восстановления: лучнику не хватает на выстрел — применяем');
  // наёмник: удар в спину стоит всю шкалу — зелье не тратим, пока шкала не почти пуста
  const merc = mk('mercenary');
  merc.cards[5] = enemy(1);
  merc.res = 3;
  ok(!needsRegen(merc), 'зелье восстановления: у наёмника шкала наполовину полна — само доберёт, зелье не тратим');
  merc.res = 1;
  ok(needsRegen(merc), 'зелье восстановления: у наёмника шкала почти пуста — применяем');

  // артефакт: 3+ убийства (или 2 при опасности)
  const art = mk('mage');
  const dmg = art.artifactDamage();
  art.cards[0] = enemy(1, dmg);
  art.cards[1] = enemy(1, dmg);
  ok(!worthArtifact(art), 'артефакт: две цели без опасности — держим');
  art.cards[2] = enemy(1, dmg);
  ok(worthArtifact(art), 'артефакт: три цели — применяем');
  art.cards[2] = enemy(1, dmg + 50);
  ok(!worthArtifact(art), 'артефакт: третья цель не умирает — держим');
  art.cards[5] = enemy(60, dmg);
  art.hp = 5;
  ok(worthArtifact(art), 'артефакт: две убиваемые цели и опасность — применяем');
  ok(!worthArtifact(mk('warrior')), 'артефакт: только маг');

  // выбор: приоритет и уважение настроек
  const pick = mk('mage');
  pick.cards[5] = enemy(50);
  pick.hp = 3;
  pick.res = 0;
  const cfg = { heal: true, regen: true, artifact: true };
  ok(pickAutoUse(pick, cfg) === 'potion_heal', 'выбор: сначала жизнь');
  ok(pickAutoUse(pick, { ...cfg, heal: false }) === 'potion_regen', 'выбор: зелье исцеления отключено — берём ресурс');
  ok(pickAutoUse(pick, { heal: false, regen: false, artifact: false }) === null, 'выбор: всё выключено — ничего не применяется');
}

// ---------------------------------------------------------------- автопрокачка
const CHAIN_LIST: ChainKind[] = ['damage', 'health', 'defense'];
for (const lin of LINEAGE_ORDER) {
  const tree = TREES[lin];
  for (const chain of CHAIN_LIST) {
    for (const alt of [false, true]) {
      const cfg: AutoSkillSave = { on: true, chain, alt };
      const ls = newLineageSave(tree);
      const tag = `${lin}/${chain}/${alt ? 'alt' : 'main'}`;
      const plan = planAutoSkill(tree, ls, 1e9, cfg);
      ok(plan.buys.length > 20, `автопрокачка ${tag}: купила много узлов (${plan.buys.length})`);
      ok(plan.stop === 'meta', `автопрокачка ${tag}: остановилась перед метаморфозой (${plan.stop})`);
      ok(plan.buys.every((n) => n.kind !== 'class'), `автопрокачка ${tag}: не покупает смену класса`);
      ok(plan.buys.every((n) => n.kind === 'perk' || n.chain === chain), `автопрокачка ${tag}: только выбранная ветка`);
      ok(plan.buys.filter((n) => n.kind === 'perk').length === 2, `автопрокачка ${tag}: перки-ворота между ступенями`);
      const forks = plan.buys.filter((n) => n.kind === 'stat' && n.excl !== undefined);
      ok(forks.length > 0 && forks.every((n) => !!n.alt === alt), `автопрокачка ${tag}: на развилках берёт ${alt ? 'особый' : 'основной'} стат`);
      // повторяем покупки честно: каждая доступна и оплачена, ни одной пары развилки одновременно
      const sim = newLineageSave(tree);
      let souls = plan.spent;
      for (const n of plan.buys) {
        const r = canBuy(tree, sim, n, souls);
        ok(r.ok, `автопрокачка ${tag}: узел ${n.id} покупается по порядку`);
        if (r.ok) souls -= r.cost;
        applyBuy(tree, sim, n);
      }
      ok(souls === 0, `автопрокачка ${tag}: потрачено ровно столько, сколько в плане`);
      ok(plan.buys.every((n) => n.excl === undefined || !sim.owned.includes(n.excl)), `автопрокачка ${tag}: обе опции развилки не куплены`);
      // повторный запуск ничего не делает
      const again = planAutoSkill(tree, sim, 1e9, cfg);
      ok(again.buys.length === 0 && again.stop === 'meta', `автопрокачка ${tag}: повтор ничего не покупает`);
      // после ручной метаморфозы идёт дальше по новому классу
      const second = tree.classNode[tree.second]!;
      ok(canBuy(tree, sim, second, 1e9).ok, `автопрокачка ${tag}: метаморфоза доступна игроку`);
      applyBuy(tree, sim, second);
      const next = planAutoSkill(tree, sim, 1e9, cfg);
      ok(next.buys.length > 10, `автопрокачка ${tag}: продолжает после метаморфозы (${next.buys.length})`);
      ok(next.buys.every((n) => n.owner === tree.second), `автопрокачка ${tag}: покупает узлы нового класса`);
      ok(next.stop === 'meta', `автопрокачка ${tag}: снова ждёт выбора финального класса`);
    }
  }
  // ограниченные души: не перепрыгивает через дорогой узел и не уходит в минус
  const ls = newLineageSave(tree);
  const small = planAutoSkill(tree, ls, 60, { on: true, chain: 'damage', alt: false });
  ok(small.spent <= 60 && small.buys.length > 0, `автопрокачка ${lin}: на малые души купила часть (${small.buys.length}, ${small.spent})`);
  ok(small.stop === 'souls', `автопрокачка ${lin}: остановилась из-за нехватки душ`);
  ok(planAutoSkill(tree, ls, 0, { on: true, chain: 'health', alt: false }).buys.length === 0, `автопрокачка ${lin}: без душ ничего не покупает`);
}

// ---------------------------------------------------------------- автопрокачка: ветка запоминается по последней ручной покупке
{
  const tree = TREES.warrior;
  const ls = newLineageSave(tree);
  ok(inferBranch(tree, ls) === null, 'ветка автопрокачки: без покупок неизвестна');
  const plain = (chain: ChainKind) =>
    tree.nodes.find((n) => n.kind === 'stat' && n.chain === chain && n.excl === undefined && n.owner === tree.base)!;
  const forkMain = tree.nodes.find((n) => n.kind === 'stat' && n.chain === 'damage' && n.excl !== undefined && !n.alt && n.owner === tree.base)!;
  const forkAlt = tree.byId.get(forkMain.excl!)!;
  applyBuy(tree, ls, plain('health'));
  const h = inferBranch(tree, ls);
  ok(!!h && h.chain === 'health' && h.alt === false, 'ветка автопрокачки: последнее улучшение — здоровье');
  applyBuy(tree, ls, plain('damage'));
  applyBuy(tree, ls, forkAlt);
  const d = inferBranch(tree, ls);
  ok(!!d && d.chain === 'damage' && d.alt === true, 'ветка автопрокачки: выбор особого стата на развилке запоминается');
  ok(branchOf(forkAlt).alt === true && branchOf(forkMain).alt === false, 'ветка автопрокачки: узел развилки задаёт тип выбора');
  ok(branchOf(plain('health')).chain === 'health' && branchOf(plain('health')).alt === undefined, 'ветка автопрокачки: обычный узел задаёт только ветку');
  const perk = tree.nodes.find((n) => n.kind === 'perk' && n.seg === 1)!;
  ok(Object.keys(branchOf(perk)).length === 0, 'ветка автопрокачки: перк ветку не меняет');
}

// ---------------------------------------------------------------- метаморфоза заменяет класс в выборе героя
for (const lin of LINEAGE_ORDER) {
  const tree = TREES[lin];
  const ls = newLineageSave(tree);
  ok(currentClassOf(tree, ls) === tree.base, `${lin}: без метаморфоз текущий класс — базовый`);
  applyBuy(tree, ls, tree.classNode[tree.second]!);
  ok(currentClassOf(tree, ls) === tree.second, `${lin}: после метаморфозы в выборе класса вместо ${tree.base} — ${tree.second}`);
  applyBuy(tree, ls, tree.classNode[tree.terminals[0]]!);
  ok(currentClassOf(tree, ls) === tree.terminals[0], `${lin}: финальный класс занимает место второго`);
  applyCancelMetamorphosis(tree, ls, tree.terminals[0]);
  ok(currentClassOf(tree, ls) === tree.second, `${lin}: после отмены метаморфозы — снова второй класс`);
}

// ---------------------------------------------------------------- наёмник: телепорт за спину и удар критом
{
  const enemyCard = (hp: number): Card => ({ uid: 777000 + hp, kind: 'enemy', defId: 'skeleton', hp, maxHp: hp, atk: 0, value: 0 });
  const build = (lin: 'mercenary' | 'archer', patch: Record<string, number>, cell: number): Run => {
    const tree = TREES[lin];
    const base = buildPlayerStats({ classId: lin, lineage: newLineageSave(tree), weapon: null, armor: null });
    const run = new Run({
      room: ROOMS[0], stats: { ...base, ...patch }, weapon: null, armor: null,
      consumables: { potion_heal: 0, potion_regen: 0, artifact: 0 }, rng: makeRng(11),
    });
    run.start();
    run.cards.fill(null);
    run.playerCell = cell;
    run.hp = 1e6;
    return run;
  };
  const merc = build('mercenary', { crit: 0, damage: 10, maxHp: 1e6, dodge: 0, parry: 0 }, 4);
  ok(merc.stats.rangedCost === 6 && merc.stats.ranged === 'any', 'наёмник: удар в спину стоит 6 осмотрительности, цель — любой враг');
  merc.res = 6;
  merc.cards[0] = enemyCard(99999);
  ok(merc.actionFor(0).kind === 'ranged', 'наёмник: дальний враг доступен для удара в спину');
  const strike = merc.tap(0);
  const att = strike.events.find((e) => e.type === 'attack');
  const hit = strike.events.find((e) => e.type === 'hit' && e.target === 'enemy');
  ok(!!att && att.type === 'attack' && att.ranged && att.style === 'backstab', 'наёмник: событие удара помечено как «удар в спину» (анимация вместо сюрикена)');
  ok(!!hit && hit.type === 'hit' && hit.crit && hit.amount >= 11, 'наёмник: удар в спину — крит со 100% шансом даже при шансе крита 0');
  ok(merc.res === 1, `наёмник: удар потратил 6 осмотрительности (осталось ${merc.res})`);
  merc.res = 5;
  merc.cards[0] = enemyCard(99999);
  const denied = merc.actionFor(0);
  ok(denied.kind === 'none' && denied.reason === 'resource', 'наёмник: за 5 очков удар в спину недоступен');
  // подсветка «добьёт» учитывает гарантированный крит
  const merc2 = build('mercenary', { crit: 0, damage: 10, maxHp: 1e6, dodge: 0, parry: 0 }, 4);
  merc2.res = 6;
  merc2.cards[0] = enemyCard(12);
  ok(merc2.wouldKill(0), 'наёмник: враг с 12 здоровья добивается ударом в спину при уроне 10 (крит не меньше ×1.3)');
  // лучник по-прежнему стреляет обычным выстрелом без гарантированного крита
  const archer = build('archer', { crit: 0, damage: 10, maxHp: 1e6, dodge: 0, parry: 0 }, 0);
  archer.res = 6;
  archer.cards[2] = enemyCard(99999);
  const shot = archer.tap(2);
  const shotAtt = shot.events.find((e) => e.type === 'attack');
  const shotHit = shot.events.find((e) => e.type === 'hit' && e.target === 'enemy');
  ok(!!shotAtt && shotAtt.type === 'attack' && shotAtt.style === 'shot', 'лучник: выстрел остаётся выстрелом');
  ok(!!shotHit && shotHit.type === 'hit' && !shotHit.crit, 'лучник: гарантированного крита нет');
}

// ---------------------------------------------------------------- краткие сводки классов и тексты
const TRAIT_IDS = new Set<TraitId>();
for (const id of Object.keys(CLASSES) as Array<keyof typeof CLASSES>) {
  const list = classTraits(id);
  list.forEach((tr) => TRAIT_IDS.add(tr.id));
  const lineage = CLASSES[id].lineage;
  ok(list.length >= 2 && list.length <= 4, `сводка ${id}: 2–4 строки (${list.length})`);
  // у воина отдельной строки про механику нет («ближний бой; перки тратят выносливость» убрано), у остальных она первая
  ok(lineage === 'warrior' ? !list.some((tr) => tr.id === 'mech') : list[0].id === 'mech' && list[0].lineage === lineage, `сводка ${id}: механика линейки`);
  ok(new Set(list.map((tr) => tr.id)).size === list.length, `сводка ${id}: без повторов`);
  ok((lineage === 'mage') === list.some((tr) => tr.id === 'artifact'), `сводка ${id}: артефакты только у магов`);
  ok(!(list as Array<{ id: string }>).some((tr) => tr.id === 'resMax'), `сводка ${id}: без строки «запас ресурса больше на N»`);
  const back = list.find((tr) => tr.id === 'backstab');
  ok((lineage === 'mercenary') === !!back, `сводка ${id}: удар в спину только у наёмников`);
  if (back) ok(back.n === buildPlayerStats({ classId: id, lineage: newLineageSave(TREES[lineage]), weapon: null, armor: null }).rangedCost, `сводка ${id}: цена удара в спину берётся из данных`);
}
for (const id of TRAIT_IDS) {
  if (id === 'mech') continue;
  ok(`trait.${id}` in ru && `trait.${id}` in en, `перевод строки сводки trait.${id}`);
}
for (const lin of LINEAGE_ORDER) {
  if (lin === 'warrior') ok(!(`trait.mech.${lin}` in ru) && !(`trait.mech.${lin}` in en), 'строки про механику воина больше нет');
  else ok(`trait.mech.${lin}` in ru && `trait.mech.${lin}` in en, `перевод механики ${lin}`);
}
{
  const bad = /[×xх]\s?1[.,]5\b/;
  for (const [lang, dict] of [['ru', ru], ['en', en]] as const) {
    for (const [k, v] of Object.entries(dict)) ok(!bad.test(v as string), `${lang}: в тексте «${k}» нет упоминания ×1.5`);
  }
}

// ---------------------------------------------------------------- фазз-тест поля боя
const dist =(a: number, b: number): number => Math.abs(Math.floor(a / 3) - Math.floor(b / 3)) + Math.abs((a % 3) - (b % 3));
let runs = 0;
let autoPicks = 0;
for (const lin of LINEAGE_ORDER) {
  const tree = TREES[lin];
  const ls = newLineageSave(tree);
  for (let room = 0; room < ROOMS.length; room++) {
    for (let k = 0; k < 40; k++) {
      const rng = makeRng(room * 1000 + k + 7);
      const stats = buildPlayerStats({ classId: lin, lineage: ls, weapon: null, armor: null });
      const run = new Run({ room: ROOMS[room], stats, weapon: null, armor: null, consumables: { potion_heal: 3, potion_regen: 2, artifact: 2 }, rng });
      run.start();
      runs++;
      for (let step = 0; step < 300 && !run.over; step++) {
        const cells = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((c) => run.cards[c]);
        if (!cells.length) {
          ok(false, `${lin} ${ROOMS[room].id}: на поле не осталось карт, но комната не завершена`);
          break;
        }
        const r = rng.next();
        if (r < 0.1) run.useItem(rng.pick(['potion_heal', 'potion_regen', 'artifact'] as const));
        else run.tap(rng.pick(cells));
        // автоприменение никогда не предлагает невозможное действие
        const auto = run.over ? null : pickAutoUse(run, { heal: true, regen: true, artifact: true });
        if (auto) {
          autoPicks++;
          ok(run.useItem(auto).ok, `${lin} ${ROOMS[room].id}: автоприменение предложило невозможное действие ${auto}`);
        }
        // инварианты
        ok(run.hp <= run.stats.maxHp, 'hp не превышает максимум');
        ok(run.res >= 0 && run.res <= run.stats.resMax, 'ресурс в пределах');
        ok(run.cards[run.playerCell] === null, 'клетка игрока пуста в массиве карт');
        if (run.pool.length === 0 && !run.over) {
          // карты «складываются»: все связаны с игроком
          const seen = new Set([run.playerCell]);
          const q = [run.playerCell];
          while (q.length) {
            const c = q.shift()!;
            for (let n = 0; n < 9; n++) if (dist(c, n) === 1 && run.cards[n] && !seen.has(n)) (seen.add(n), q.push(n));
          }
          const loose = run.cards.some((c, i) => c && !seen.has(i));
          ok(!loose, `${lin} ${ROOMS[room].id}: пустые клетки разделили карты`);
        }
        if (run.over) break;
      }
      if (run.over === 'win') ok(run.enemiesLeft === 0, 'победа только после уничтожения всех врагов');
    }
  }
}
ok(autoPicks > 50, `автоприменение реально срабатывает в фазз-тесте (${autoPicks})`);
console.log(`Прогонов боя: ${runs} (автоприменений: ${autoPicks}). ${failed ? `ОШИБОК: ${failed}` : 'Все проверки пройдены.'}`);
if (failed) throw new Error('selftest failed');
