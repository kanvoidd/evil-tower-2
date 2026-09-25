/** Самопроверка логики: npm run selftest */
import { AD_POLICY } from '../src/application/ads/adPolicy';
import { AdService } from '../src/application/ads/AdService';
import { ClassSelectController } from '../src/application/class-select/ClassSelectController';
import { ClassSelection } from '../src/application/class-select/ClassSelection';
import type { ClassSelectMode } from '../src/application/class-select/interfaces/ClassSelectMode';
import { AutoUseToggles } from '../src/application/game/AutoUseToggles';
import { GameController } from '../src/application/game/GameController';
import type { IGameDialogs } from '../src/application/game/interfaces/IGameDialogs';
import type { IGameRenderer } from '../src/application/game/interfaces/IGameRenderer';
import type { PlayerCommand } from '../src/application/game/interfaces/PlayerCommand';
import type { RunSummary } from '../src/application/game/interfaces/RunSummary';
import { TowerRun } from '../src/application/game/TowerRun';
import { EnterHub } from '../src/application/hub/EnterHub';
import { GetHubState } from '../src/application/hub/GetHubState';
import { HubController } from '../src/application/hub/HubController';
import type { HubMenu } from '../src/application/hub/interfaces/HubMenu';
import type { HubOrigin } from '../src/application/hub/interfaces/HubOrigin';
import type { IClock, IPlatform } from '../src/application/ports';
import { ClaimDailyReward } from '../src/application/rewards/ClaimDailyReward';
import { ClaimTowerGift } from '../src/application/rewards/ClaimTowerGift';
import type { RewardChoice } from '../src/application/rewards/interfaces/RewardChoice';
import { AudioSettings } from '../src/application/settings/AudioSettings';
import { LanguageSettings } from '../src/application/settings/LanguageSettings';
import { SettingsController } from '../src/application/settings/SettingsController';
import { BuyConsumable } from '../src/application/shop/BuyConsumable';
import { BuyItem } from '../src/application/shop/BuyItem';
import type { IShopView } from '../src/application/shop/interfaces/IShopView';
import { ShopCatalog } from '../src/application/shop/ShopCatalog';
import { ShopController } from '../src/application/shop/ShopController';
import { AutoSkill } from '../src/application/skill-tree/AutoSkill';
import { BuySkill } from '../src/application/skill-tree/BuySkill';
import { CancelMetamorphosis } from '../src/application/skill-tree/CancelMetamorphosis';
import type { ISkillTreeView } from '../src/application/skill-tree/interfaces/ISkillTreeView';
import { Metamorphose } from '../src/application/skill-tree/Metamorphose';
import { SkillTreeController } from '../src/application/skill-tree/SkillTreeController';
import { SkillTreeQuery } from '../src/application/skill-tree/SkillTreeQuery';
import { Profile } from '../src/domain/account/profile';
import type { ClassId, LineageId, TalentPath } from '../src/domain/catalog';
import { CLASS_DEFINITIONS, CLASSES, classesOfLineage } from '../src/domain/catalog/classes';
import { CONSUMABLES } from '../src/domain/catalog/consumables';
import { ENEMY_LIST, type EnemyDef } from '../src/domain/catalog/enemies';
import { FLOOR_SCALING, FloorCurveScaling, FLOORS } from '../src/domain/catalog/floors';
import { LINEAGE_ORDER, LINEAGES } from '../src/domain/catalog/heroes';
import { ITEMS } from '../src/domain/catalog/items';
import { MODIFIERS, rollRoom, ROOMS, ROOMS_PER_FLOOR } from '../src/domain/catalog/levels';
import type { AbilityId } from '../src/domain/catalog/perks';
import {
  FULL_BAR,
  hasButton,
  PERK_BY_ABILITY,
  PERK_BY_ID,
  perkOf,
  PERKS,
  perksOfClass,
  VFX_STYLES,
} from '../src/domain/catalog/perks';
import {
  maxRank,
  PATH_ORDER,
  SYNERGY_FX,
  talentChain,
  TALENTS,
  talentsOfClass,
  talentsOfTier,
} from '../src/domain/catalog/talents';
import { ABILITIES, CombatBalance } from '../src/domain/combat';
import { ATTACK_STRATEGIES, SpellAttack } from '../src/domain/combat/attack';
import {
  needsHeal,
  needsRegen,
  pickAutoUse,
  worthArtifact,
} from '../src/domain/combat/auto-use/autoUse';
import { Card } from '../src/domain/combat/card';
import {
  AbilityCrit,
  ChanceCrit,
  CritPolicy,
  type CritRoll,
  EveryNthCrit,
  HuntersMarkCrit,
  RoomOpeningCrit,
} from '../src/domain/combat/crit';
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
} from '../src/domain/combat/damage';
import { Grid } from '../src/domain/combat/engine';
import {
  type BattleCarryStats,
  type RoomBattle,
  RoomBattleFactory,
} from '../src/domain/combat/room-battle';
import { PriceShareRepair, ShopRules, Wallet } from '../src/domain/economy';
import { RecordPolicy, RoomPayout, TowerClimb } from '../src/domain/expedition';
import type { AutoSkillSave } from '../src/domain/progression';
import { ProgressionBalance } from '../src/domain/progression';
import {
  branchOf,
  inferBranch,
  planAutoSkill,
} from '../src/domain/progression/auto-skill/autoSkill';
import { HeroClassState } from '../src/domain/progression/hero';
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
} from '../src/domain/progression/skill-tree';
import {
  SOUL_PRICING,
  type SoulPriceTable,
  StageTablePricing,
} from '../src/domain/progression/soul-prices';
import { buildPlayerStats, CAPS } from '../src/domain/progression/stats/stats';
import { classTraits, type TraitId } from '../src/domain/progression/traits/traits';
import { ACHIEVEMENTS } from '../src/domain/rewards';
import { DAILY_REWARDS } from '../src/domain/rewards/daily';
import { GIFT_REWARD } from '../src/domain/rewards/tower-gift';
import {
  CellIndex,
  DayKey,
  Gold,
  type Lang,
  Percent,
  Ratio,
  type Rng,
  Souls,
} from '../src/domain/shared';
import { makeRng } from '../src/domain/shared/rng/rng';
import { en } from '../src/i18n/en';
import { perkValues } from '../src/i18n/perkValues';
import { ru } from '../src/i18n/ru';
import { SkillTreeLayout } from '../src/presentation/views/skill-tree/SkillTreeLayout';

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
  ok(
    perks.length === (stage === 2 ? 4 : 3),
    `${cls}: перков ${perks.length}, ожидалось ${stage === 2 ? 4 : 3}`,
  );
  ok(!!perkOf(cls, 'start'), `${cls}: есть стартовая способность`);
  const buttons = perks.filter(hasButton).length;
  ok(buttons <= 4, `${cls}: кнопок способностей ${buttons} (максимум 4 на класс)`);

  const talents = talentsOfClass(cls);
  ok(
    talents.length >= 15 && talents.length <= 16,
    `${cls}: талантов ${talents.length}, ожидалось 15–16`,
  );
  let variedTiers = 0;
  for (const tier of [1, 2, 3] as const) {
    const list = talentsOfTier(cls, tier);
    ok(
      list.length >= 5 && list.length <= 6,
      `${cls}: на ярусе ${tier} пять-шесть талантов (${list.length})`,
    );
    ok(new Set(list.map((t) => t.path)).size === 3, `${cls}: на ярусе ${tier} все три пути`);
    const lens = PATH_ORDER.map((path) => talentChain(cls, tier, path).length);
    ok(
      lens.reduce((a, b) => a + b, 0) === list.length,
      `${cls}/${tier}: цепочки покрывают ярус (${lens.join('-')})`,
    );
    if (new Set(lens).size > 1) variedTiers++;
    for (const path of PATH_ORDER) {
      const chain = talentChain(cls, tier, path);
      ok(
        chain.length >= 1 && chain.length <= 3,
        `${cls}/${tier}/${path}: длина цепочки ${chain.length}`,
      );
      ok(
        chain.every((t, i) => t.step === i),
        `${cls}/${tier}/${path}: шаги цепочки по порядку`,
      );
    }
  }
  // прокачка идёт «вразнобой»: хотя бы на двух ярусах из трёх цепочки разной длины
  ok(variedTiers >= 2, `${cls}: цепочки разной длины минимум на двух ярусах (${variedTiers})`);
  const ranks = talents.reduce((a, t) => a + maxRank(t), 0);
  ok(ranks >= 30 && ranks <= 50, `${cls}: суммарно рангов ${ranks} (ожидалось 30–50)`);
  for (const t of talents) {
    ok(t.v.length >= 1 && t.v.length <= 5, `${t.id}: рангов ${t.v.length}`);
    // значения суммарные, значит строго возрастают
    ok(
      t.v.every((v, i) => i === 0 || v > t.v[i - 1]),
      `${t.id}: значения рангов возрастают (${t.v.join('/')})`,
    );
    ok(`tal.${t.fx}` in ru && `tal.${t.fx}` in en, `перевод эффекта таланта tal.${t.fx}`);
  }
}
ok(new Set(TALENTS.map((t) => t.id)).size === TALENTS.length, 'id талантов уникальны');
// таланты-синергии: прокачка между способностями усиливает сами способности
{
  const fx = (cls: ClassId, f: string): boolean => talentsOfClass(cls).some((t) => t.fx === f);
  ok(fx('pyromancer', 'abilityIgnite'), 'пиромант: талант «любая способность поджигает»');
  ok(fx('necromancer', 'killBlast'), 'некромант: талант «взрыв трупа»');
  for (const f of SYNERGY_FX)
    ok(
      TALENTS.some((t) => t.fx === f),
      `синергия ${f} встречается в дереве`,
    );
  const withSyn = (Object.keys(CLASSES) as ClassId[]).filter((c) =>
    talentsOfClass(c).some((t) => SYNERGY_FX.has(t.fx)),
  );
  ok(withSyn.length === 16, `у каждого класса есть талант-синергия (${withSyn.length})`);
  // у каждого класса есть талант на запас здоровья: иначе живучесть держится только на броне
  for (const c of Object.keys(CLASSES) as ClassId[]) {
    ok(
      talentsOfClass(c).some((t) => t.fx === 'hpPct'),
      `${c}: в дереве есть запас здоровья`,
    );
  }
}
ok(new Set(PERKS.map((p) => p.id)).size === PERKS.length, 'id перков уникальны');
// у каждой способности с кнопкой — класс в реестре боя; пассивки и базовые действия работают в правилах боя
ok(
  PERKS.every((p) => (ABILITIES[p.ability] !== undefined) === hasButton(p)),
  'реализация в бою есть ровно у способностей с кнопкой',
);
// у каждой способности одна запись в каталоге: по ней бой берёт числа пассивок и состояний
ok(
  new Set(PERKS.map((p) => p.ability)).size === PERKS.length &&
    PERKS.every((p) => PERK_BY_ABILITY[p.ability] === p),
  'у каждой способности одна запись в каталоге',
);
const STYLES = new Set<string>(VFX_STYLES);
for (const p of PERKS) {
  ok(
    [`perk.${p.id}.name`, `perk.${p.id}.desc`].every((k) => k in ru && k in en),
    `${p.id}: есть название и описание на обоих языках`,
  );
  ok(STYLES.has(p.vfx), `${p.id}: задан эффект ${p.vfx}`);
  if (hasButton(p)) ok(p.target !== undefined, `${p.id}: у кнопки задана цель`);
  if (p.cost === FULL_BAR)
    ok(!!p.once, `${p.id}: способность за всю шкалу применяется раз за комнату`);
  // числа способности — положительные: множители, ходы, штуки
  const nums = Object.values(p.params as Record<string, number | readonly number[]>).flat();
  ok(
    nums.every((n) => Number.isFinite(n) && n > 0),
    `${p.id}: числа способности положительные (${nums.join(', ')})`,
  );
}
// базовое действие осталось у лучника (выстрел) и наёмника (удар в спину);
// воин бьёт рукой, а маг вообще не бьёт — только молнией по кнопке
const basics = PERKS.filter((p) => p.basic).map((p) => p.classId);
ok(
  basics.length === 2 && !basics.includes('warrior') && !basics.includes('mage'),
  `базовые действия линеек: ${basics.join(',')}`,
);

// ---------------------------------------------------------------- этажи и враги
ok(
  ROOMS.length === FLOORS * ROOMS_PER_FLOOR,
  `комнат ${ROOMS.length}, ожидалось ${FLOORS * ROOMS_PER_FLOOR}`,
);
for (let f = 1; f <= FLOORS; f++) {
  ok(`floor.${f}.name` in ru && `floor.${f}.name` in en, `перевод названия этажа ${f}`);
  const bosses = ENEMY_LIST.filter((e) => e.floor === f && e.boss);
  ok(bosses.length === 1, `этаж ${f}: ровно один босс (${bosses.length})`);
  ok(ENEMY_LIST.filter((e) => e.floor === f).length >= 5, `этаж ${f}: не меньше пяти видов врагов`);
}
for (const m of MODIFIERS) {
  ok(`mod.${m.id}` in ru && `mod.${m.id}.desc` in ru, `перевод свойства комнаты ${m.id}`);
  ok(
    `mod.${m.id}` in en && `mod.${m.id}.desc` in en,
    `английский перевод свойства комнаты ${m.id}`,
  );
}
// сила врагов растёт от этажа к этажу
for (let f = 2; f <= FLOORS; f++) {
  const prev = ENEMY_LIST.find((e) => e.floor === f - 1 && e.role === 'normal')!;
  const cur = ENEMY_LIST.find((e) => e.floor === f && e.role === 'normal')!;
  ok(
    cur.hp > prev.hp && cur.atk >= prev.atk && cur.souls > prev.souls,
    `этаж ${f}: враги сильнее и дороже предыдущих`,
  );
}
// масштабирование этажа: фабрики берут числа у него, кривая растёт и округляет как обещано
for (const e of ENEMY_LIST) {
  const n = FLOOR_SCALING.enemy(e.floor, e.role);
  ok(
    e.hp === n.hp && e.atk === n.atk && e.gold === n.gold && e.souls === n.souls,
    `${e.id}: сила и добыча — по масштабированию этажа`,
  );
}
for (const r of ROOMS) {
  const n = FLOOR_SCALING.room(r.floor, r.index, r.boss);
  ok(
    r.goldScale === n.goldScale && r.clearGold === n.clearGold && r.clearSouls === n.clearSouls,
    `${r.id}: награды комнаты — по масштабированию этажа`,
  );
}
{
  const curve = new FloorCurveScaling();
  for (let f = 1; f <= FLOORS; f++) {
    for (const role of ['weak', 'normal', 'tough', 'elite', 'boss'] as const) {
      const n = curve.enemy(f, role);
      ok(
        Object.values(n).every((v) => v >= 1 && (v < 100 || v % 5 === 0)),
        `этаж ${f}, ${role}: числа не меньше 1, от сотни — кратны пяти`,
      );
    }
    const first = curve.room(f, 1, false);
    const last = curve.room(f, ROOMS_PER_FLOOR - 1, false);
    const boss = curve.room(f, ROOMS_PER_FLOOR, true);
    ok(
      last.clearGold > first.clearGold && last.goldScale > first.goldScale,
      `этаж ${f}: дальние комнаты платят больше`,
    );
    ok(
      boss.clearGold > last.clearGold && boss.clearSouls > last.clearSouls,
      `этаж ${f}: комната босса платит больше обычной`,
    );
  }
  ok(
    curve.room(2, 1, false).clearSouls > curve.room(1, 1, false).clearSouls &&
      curve.enemy(2, 'boss').gold > curve.enemy(1, 'boss').gold,
    'награды растут от этажа к этажу',
  );
}
// каждый заход собирается заново
{
  const room = ROOMS[12];
  const a = rollRoom(room, makeRng(1));
  const b = rollRoom(room, makeRng(2));
  const same = JSON.stringify(a.enemies) === JSON.stringify(b.enemies) && a.mod.id === b.mod.id;
  ok(!same, 'состав комнаты меняется от захода к заходу');
  ok(
    JSON.stringify(rollRoom(room, makeRng(1))) === JSON.stringify(a),
    'один и тот же seed даёт один и тот же расклад',
  );
  for (const r of ROOMS) {
    const plan = rollRoom(r, makeRng(r.floor * 100 + r.index));
    ok(plan.enemies.length >= r.count[0], `${r.id}: врагов не меньше минимума`);
    ok(
      plan.enemies.some((e) => e.id.startsWith('boss_')) === r.boss,
      `${r.id}: босс только в пятой комнате`,
    );
  }
}

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
  const enemy = (hp: number, atk = 1): Card =>
    new Card({ uid: Math.floor(Math.random() * 1e9), kind: 'enemy', defId: 'skeleton', hp, atk });

  let used = 0;
  for (const id of Object.keys(CLASSES) as ClassId[]) {
    const stats = build(id);
    for (const perk of [
      ...stats.abilities,
      ...stats.perks.map((p) => PERK_BY_ID[p]).filter((p) => p.basic),
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
      if (perk.basic) {
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
      if (battle.armed) {
        const cell = Grid.CELLS.slice(1).find((c) => battle.perkTargetOk(battle.armed!, c));
        ok(cell !== undefined, `${id}/${perk.id}: нашлась подходящая цель`);
        if (cell !== undefined) {
          const r2 = battle.tap(cell);
          ok(r2.ok, `${id}/${perk.id}: способность наводится на цель`);
          // «Перестановка» требует двух касаний
          if (battle.armed)
            ok(battle.tap(CellIndex.of(cell === 1 ? 2 : 1)).ok, `${id}/${perk.id}: второе касание`);
        }
      }
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
  ok(used >= 35, `проверены все активные способности (${used})`);

  // маг вообще не бьёт рукой, зато ходит по пустым клеткам
  {
    for (const id of ['mage', 'magister', 'necromancer', 'pyromancer'] as ClassId[]) {
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
      const act = battle.actionFor(CellIndex.of(1));
      ok(
        act.kind === 'none' && act.reason === 'melee',
        `${id}: рукой не бьёт (${act.kind}/${act.reason ?? ''})`,
      );
      ok(!battle.tap(CellIndex.of(1)).ok, `${id}: касание соседнего врага не тратит ход`);
      ok(battle.cards[1] !== null && battle.cards[1]!.hp === 500, `${id}: враг не получил урона`);
      // молния по кнопке — единственный способ ударить
      battle.res = stats.resMax;
      // «Удар молнии» мага остаётся в руках у всей линейки — метаморфоза ничего не отнимает
      ok(
        stats.abilities.some((p2) => p2.id === 'mage_start'),
        `${id}: молния мага сохранилась`,
      );
      ok(battle.usePerk('mage_start').ok, `${id}: молния мага доступна`);
      if (battle.armed)
        ok(battle.tap(CellIndex.of(1)).ok, `${id}: молния наводится на соседнего врага`);
      ok(battle.cards[1] === null || battle.cards[1]!.hp < 500, `${id}: молния нанесла урон`);
    }
    // ход на пустую соседнюю клетку — полноценный ход для всех классов
    for (const id of ['warrior', 'archer', 'mage', 'ninja'] as ClassId[]) {
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

  // «Раздвоение молнии»: второй разряд по той же цели, соседи не задеты
  {
    const stats = build('mage', { echoChance: 1, echoDmg: 0.16 } as Record<string, number>);
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
    battle.res = stats.resMax;
    battle.cards[1] = enemy(100000, 1);
    battle.cards[3] = enemy(100000, 1);
    battle.usePerk('mage_start');
    const hits = battle
      .tap(CellIndex.of(1))
      .events.filter((e) => e.type === 'hit' && e.target === 'enemy')
      .map((e) => (e as { cell: number }).cell);
    ok(
      hits.length === 2 && hits.every((c) => c === 1),
      `молния бьёт одну цель дважды (${hits.join(',')})`,
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
    magic.usePerk('warrior_start');
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

    // маг без маны ударить не может — значит, и шаг к другому врагу не наказывается
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
      strikers(dry.tap(CellIndex.of(3)).events).length === 0,
      'маг без маны шагает к врагу — удара нет',
    );
    // а с маной на молнию тот же шаг — уже подставиться
    const wet = RoomBattleFactory.standard().create({
      room: ROOMS[10],
      stats: mstats,
      weapon: null,
      armor: null,
      consumables: cons(),
      rng: makeRng(50),
    });
    wet.start();
    wet.cards.fill(null);
    wet.playerCell = CellIndex.of(4);
    wet.hp = 100000;
    wet.shield = 0;
    wet.res = mstats.resMax;
    wet.cards[1] = enemy(100000, 20);
    wet.cards[6] = enemy(100000, 20);
    ok(
      JSON.stringify(strikers(wet.tap(CellIndex.of(3)).events)) === '[6]',
      'маг с маной прошёл мимо удара под чужую руку — бьют',
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

  // Перезарядка способностей и дальность магического выстрела
  {
    const stats = build('mage');
    const battle = RoomBattleFactory.standard().create({
      room: ROOMS[10],
      stats,
      weapon: null,
      armor: null,
      consumables: cons(),
      rng: makeRng(53),
    });
    battle.start();
    battle.cards.fill(null);
    battle.playerCell = CellIndex.of(0);
    battle.hp = 100000;
    battle.res = 100;
    battle.cards[2] = enemy(100000, 1);
    battle.cards[4] = enemy(100000, 1);
    const shot = PERK_BY_ID.mage_p2;
    ok(!battle.perkTargetOk(shot, CellIndex.of(1)), 'магический выстрел не бьёт вплотную');
    ok(battle.perkTargetOk(shot, CellIndex.of(2)), 'магический выстрел бьёт через карту');
    ok(battle.usePerk(shot.id).ok && battle.tap(CellIndex.of(2)).ok, 'выстрел применяется');
    battle.res = 100;
    const after = battle.perkReady(shot);
    ok(
      !after.ok && after.reason === 'cooldown',
      `выстрел на перезарядке (${after.reason ?? 'готов'})`,
    );
    ok(battle.cooldownOf(shot) === 1, `перезарядка один ход (${battle.cooldownOf(shot)})`);
    const chain = PERK_BY_ID.mage_p3;
    battle.res = 100;
    ok(battle.usePerk(chain.id).ok && battle.tap(CellIndex.of(2)).ok, 'цепная молния применяется');
    battle.res = 100;
    ok(battle.cooldownOf(chain) === 2, `цепная молния на двух ходах (${battle.cooldownOf(chain)})`);
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

  // «Растерзание»: мага без маны, зажатого со всех сторон, карты добивают насмерть
  {
    const surround = (
      id: ClassId,
      patch: Partial<{ res: number; potion_regen: number; artifact: number }> = {},
    ) => {
      const stats = build(id);
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
    for (const id of ['mage', 'magister', 'necromancer'] as ClassId[]) {
      ok(surround(id).cornered(), `${id}: пустая шкала в окружении — это тупик`);
    }
    // у пироманта огненный шар маны не стоит: пока он не на перезарядке, выход есть
    {
      const pyro = surround('pyromancer');
      ok(!pyro.cornered(), 'пиромант: готовый огненный шар — не тупик');
      pyro.state.cooldowns.pyromancer_p2 = 3;
      ok(pyro.cornered(), 'пиромант: шар на перезарядке и пустая шкала — тупик');
    }
    // Ход, который сам загоняет в угол: герой шагает на пустую клетку, освободившуюся
    // занимает новый враг — и в конце хода отбиваться уже нечем.
    {
      const stats = build('mage');
      const battle = RoomBattleFactory.standard().create({
        room: ROOMS[30],
        stats,
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
      // поднявшись, герой получает полную шкалу и снова может бить
      battle.revive();
      ok(!battle.cornered(), 'после воскрешения герой снова может ходить');
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
      const perk = PERK_BY_ID[perkId2];
      ok(battle.perkTargetOk(perk, CellIndex.of(1)), `${perkId2}: чистая цель подходит`);
      apply(battle.cards[1]!);
      ok(
        !battle.perkTargetOk(perk, CellIndex.of(1)),
        `${perkId2}: заклеймённая цель больше не подсвечивается`,
      );
    }
  }

  // «Взрыв трупа» по выбранной цели: рвётся именно она, помеченных повторно не метим
  {
    const stats = build('necromancer');
    const battle = RoomBattleFactory.standard().create({
      room: ROOMS[30],
      stats,
      weapon: null,
      armor: null,
      consumables: cons(),
      rng: makeRng(19),
    });
    battle.start();
    battle.cards.fill(null);
    battle.playerCell = CellIndex.of(4);
    battle.hp = 100000;
    battle.res = 100;
    battle.cards[1] = enemy(10, 1);
    battle.cards[0] = enemy(100000, 1);
    battle.cards[2] = enemy(100000, 1);
    battle.cards[7] = enemy(10, 1);
    ok(
      battle.usePerk('necromancer_start').ok && battle.tap(CellIndex.of(1)).ok,
      'взрыв трупа наводится на врага',
    );
    ok(!!battle.cards[1]?.corpse, 'цель помечена');
    ok(
      !battle.perkTargetOk(PERK_BY_ID.necromancer_start, CellIndex.of(1)),
      'помеченного повторно не метят',
    );
    const hp0 = battle.cards[0]!.hp;
    battle.res = 100;
    battle.usePerk('mage_start');
    battle.tap(CellIndex.of(1));
    ok(battle.cards[0]!.hp < hp0, 'смерть помеченного взрывает соседей');
    // смерть непомеченного ничего не взрывает
    const hp2 = battle.cards[2] ? battle.cards[2]!.hp : 0;
    battle.res = 100;
    battle.state.cooldowns = {};
    battle.usePerk('mage_start');
    const r = battle.tap(CellIndex.of(7));
    ok(!r.events.some((e) => e.type === 'fx' && e.style === 'corpse'), 'непомеченный умирает тихо');
    void hp2;
  }

  // «Призрачные слуги»: призрак встаёт на месте заражённого, бьёт крестом три хода, максимум два
  {
    const stats = build('necromancer');
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
    battle.res = 100;
    battle.cards[1] = enemy(10, 1);
    battle.cards[0] = enemy(100000, 1);
    battle.cards[2] = enemy(100000, 1);
    battle.cards[3] = enemy(100000, 1);
    battle.cards[5] = enemy(100000, 1);
    battle.cards[6] = enemy(100000, 1);
    battle.cards[7] = enemy(100000, 1);
    battle.cards[8] = enemy(100000, 1);
    ok(
      battle.usePerk('necromancer_p2').ok && battle.tap(CellIndex.of(1)).ok,
      'заражение наводится на врага',
    );
    ok(!!battle.cards[1]?.haunt, 'цель заражена');
    battle.res = 100;
    battle.usePerk('mage_start');
    battle.tap(CellIndex.of(1));
    const ghost = battle.cards[1];
    ok(ghost?.kind === 'ghost', `на месте заражённого встал призрак (${ghost?.kind ?? 'пусто'})`);
    ok(ghost?.ttl === 2, `призрак отработал первый ход (${ghost?.ttl})`);
    // призрак бьёт соседей крестом: 0 и 2 — соседи клетки 1, 4 — герой
    ok(battle.cards[0]!.hp < 100000 || battle.cards[2]!.hp < 100000, 'призрак бьёт соседа');
    // ещё два хода — и призрак исчезает
    for (let i = 0; i < 2; i++) {
      battle.res = 100;
      battle.state.cooldowns = {};
      battle.usePerk('mage_start');
      battle.tap(CellIndex.of(3));
    }
    ok(battle.cards[1]?.kind !== 'ghost', 'через три хода призрак растаял');
  }

  // Горение: число на значке — ровно столько тиков, сколько впереди
  {
    const stats = build('pyromancer');
    const battle = RoomBattleFactory.standard().create({
      room: ROOMS[10],
      stats,
      weapon: null,
      armor: null,
      consumables: cons(),
      rng: makeRng(29),
    });
    battle.start();
    battle.cards.fill(null);
    battle.playerCell = CellIndex.of(4);
    battle.hp = 100000;
    battle.res = 100;
    battle.cards[0] = enemy(100000, 1);
    battle.usePerk('pyromancer_start');
    battle.tap(CellIndex.of(0));
    ok(battle.cards[0]!.burn === 3, `после поджога на значке три хода (${battle.cards[0]!.burn})`);
    let ticks = 0;
    for (let i = 0; i < 5; i++) {
      const hp = battle.cards[0]!.hp;
      // любой шаг на не-врага — полноценный ход, горение тикает в его конце
      const step = Grid.CELLS.slice(1).find((c) => battle.actionFor(c).kind === 'move');
      if (step === undefined) break;
      battle.tap(step);
      battle.hp = 100000;
      if (battle.cards[0]!.hp < hp) ticks++;
    }
    ok(ticks === 3, `поджог тикает ровно три раза (${ticks})`);
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
        while (battle.armed) {
          const cell = Grid.CELLS.slice(1).find((c) => battle.perkTargetOk(battle.armed!, c));
          if (cell === undefined) break;
          // «Перестановка» требует двух касаний — эффект рисуется на последнем
          events = [...events, ...battle.tap(cell).events];
        }
        const drew = events.some(
          (e) => e.type === 'fx' || (e.type === 'attack' && e.by === 'player'),
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
    ok(battle.usePerk('berserk_legend').ok, 'легендарная способность применяется');
    battle.res = stats.resMax;
    ok(!battle.usePerk('berserk_legend').ok, 'легендарная способность — один раз за комнату');
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
    battle.usePerk('knight_start');
    const res = battle.tap(CellIndex.of(1));
    ok(res.ok, 'таран щитом применяется');
    ok(
      res.events.some((e) => e.type === 'miss' && e.kind === 'stun'),
      'оглушённый враг пропускает ход врагов',
    );
    ok(battle.hp === before, 'оглушённый враг не наносит урона');
  }

  // горение тикает и гаснет
  {
    const stats = build('pyromancer');
    const battle = RoomBattleFactory.standard().create({
      room: ROOMS[10],
      stats,
      weapon: null,
      armor: null,
      consumables: cons(),
      rng: makeRng(9),
    });
    battle.start();
    battle.cards.fill(null);
    battle.playerCell = CellIndex.of(4);
    battle.cards[0] = enemy(100000, 1);
    battle.hp = 100000;
    battle.res = stats.resMax;
    battle.usePerk('pyromancer_start');
    battle.tap(CellIndex.of(0));
    const burning = battle.cards[0]!;
    ok(burning.burn > 0 && burning.burnDmg > 0, 'поджог вешает горение');
    const hp0 = burning.hp;
    // маг рукой не бьёт, зато ходит по пустым клеткам — это полноценный ход
    ok(battle.tap(CellIndex.of(1)).ok, 'ход на пустую соседнюю клетку засчитывается');
    ok(battle.cards[0]!.hp < hp0, 'горение отнимает здоровье в конце хода');
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
      battle.usePerk('warrior_start');
      battle.tap(CellIndex.of(1));
      return 100000 - battle.cards[1]!.hp;
    };
    ok(hit(strong) > hit(weak), 'талант «способности сильнее» повышает урон способности');
  }
}

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

// ---------------------------------------------------------------- календарь награды дня
{
  ok(DayKey.of(2026, 3, 7) === '2026-03-07', 'день записывается как ГГГГ-ММ-ДД');
  ok(
    DayKey.daysBetween('2026-09-25', '2026-09-26') === 1 &&
      DayKey.daysBetween('2026-12-31', '2027-01-01') === 1 &&
      DayKey.daysBetween('2024-02-28', '2024-03-01') === 2 &&
      DayKey.daysBetween('2026-03-28', '2026-03-30') === 2 &&
      DayKey.daysBetween('2026-10-24', '2026-10-26') === 2,
    'разница дней — по календарю: через месяц, год, 29 февраля и переход на летнее время',
  );
  ok(
    Number.isNaN(DayKey.daysBetween('', '2026-09-25')),
    'испорченная дата не считается соседним днём',
  );
  let today = DayKey.of(2026, 9, 25);
  const p = new Profile(Profile.freshData('ru', 0), () => 0, { today: () => today });
  ok(
    p.dailyStatus().available && p.dailyStatus().dayIndex === 0,
    'награда дня: первая доступна сразу',
  );
  p.claimDaily();
  ok(
    !p.dailyStatus().available && p.data.daily.lastClaim === '2026-09-25',
    'награда дня: в тот же день второй нет',
  );
  today = DayKey.of(2026, 9, 26);
  ok(
    p.dailyStatus().available && p.dailyStatus().dayIndex === 1,
    'награда дня: на следующий день серия продолжается',
  );
  p.claimDaily();
  today = DayKey.of(2026, 9, 28);
  ok(
    p.dailyStatus().available && p.dailyStatus().dayIndex === 0 && p.dailyStatus().streak === 0,
    'награда дня: пропущенный день обнуляет серию',
  );
  for (let d = 0; d < DAILY_REWARDS.length; d++) {
    today = DayKey.of(2026, 10, 1 + d);
    p.claimDaily();
  }
  today = DayKey.of(2026, 10, 1 + DAILY_REWARDS.length);
  ok(
    p.dailyStatus().dayIndex === 0 && p.dailyStatus().streak === DAILY_REWARDS.length,
    'награда дня: после недели наград круг начинается заново, серия растёт',
  );
}

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
  const bolt = PERK_BY_ID.mage_start;
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
  battle.usePerk('mage_start');
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
    cheap.perkCostOf(PERK_BY_ID.mage_p2) === (PERK_BY_ID.mage_p2.cost ?? 0) - 1,
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

// ---------------------------------------------------------------- краткие сводки классов и тексты
const TRAIT_IDS = new Set<TraitId>();
for (const id of Object.keys(CLASSES) as ClassId[]) {
  const list = classTraits(id);
  list.forEach((tr) => TRAIT_IDS.add(tr.id));
  const lineage = CLASSES[id].lineage;
  ok(list.length >= 2 && list.length <= 4, `сводка ${id}: 2–4 строки (${list.length})`);
  ok(
    lineage === 'warrior' ? !list.some((tr) => tr.id === 'mech') : list[0].id === 'mech',
    `сводка ${id}: механика линейки`,
  );
  ok(new Set(list.map((tr) => tr.id)).size === list.length, `сводка ${id}: без повторов`);
  ok(
    (lineage === 'mage') === list.some((tr) => tr.id === 'artifact'),
    `сводка ${id}: артефакты только у магов`,
  );
  ok(
    (lineage === 'mercenary') === list.some((tr) => tr.id === 'gold'),
    `сводка ${id}: бонус золота только у наёмников`,
  );
}
for (const id of TRAIT_IDS) {
  if (id === 'mech') continue;
  ok(`trait.${id}` in ru && `trait.${id}` in en, `перевод строки сводки trait.${id}`);
}
ok(
  Object.keys(ru).every((k) => k in en),
  'английский словарь покрывает все ключи',
);
ok(
  Object.keys(en).every((k) => k in ru),
  'в английском словаре нет лишних ключей',
);
for (const cls of classesOfLineage('warrior'))
  ok(`class.${cls}.name` in ru, `перевод названия класса ${cls}`);

// тексты контента — в словарях по id сущности, числа описаний — только плейсхолдерами
{
  const dict = { ru: ru as Record<string, string>, en: en as Record<string, string> };
  const holes = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  const bareDigits = (text: string): boolean => /\d/.test(text.replace(/\{\w+\}/g, ''));
  for (const p of PERKS) {
    const values = perkValues(p);
    for (const lang of ['ru', 'en'] as const) {
      const desc = dict[lang][`perk.${p.id}.desc`] ?? '';
      const missing = holes(desc).filter((h) => !(h in values));
      ok(
        !missing.length,
        `${p.id}/${lang}: числа описания есть у способности (${missing.join(', ')})`,
      );
      ok(!bareDigits(desc), `${p.id}/${lang}: в описании нет чисел мимо плейсхолдеров`);
    }
  }
  const named = [
    ...TALENTS.map((t) => `talent.${t.id}.name`),
    ...ENEMY_LIST.map((e) => `enemy.${e.id}.name`),
    ...ITEMS.map((i) => `item.${i.id}.name`),
    ...ACHIEVEMENTS.flatMap((a) => [`ach.${a.id}.name`, `ach.${a.id}.desc`]),
  ];
  for (const k of named) ok(k in ru && k in en, `перевод ${k}`);
  for (const a of ACHIEVEMENTS) {
    const allowed = new Set(['target', ...(a.floor !== undefined ? ['floor'] : [])]);
    for (const lang of ['ru', 'en'] as const) {
      const desc = dict[lang][`ach.${a.id}.desc`] ?? '';
      ok(
        holes(desc).every((h) => allowed.has(h)),
        `ach ${a.id}/${lang}: плейсхолдеры описания`,
      );
      ok(!bareDigits(desc), `ach ${a.id}/${lang}: в описании нет чисел мимо плейсхолдеров`);
    }
  }
  // в словарях нет текстов сущностей, которых уже нет в игре
  const known = new Set([
    ...named,
    ...PERKS.flatMap((p) => [`perk.${p.id}.name`, `perk.${p.id}.desc`]),
  ]);
  const orphans = Object.keys(ru)
    .filter((k) => /^(perk|talent|enemy|item)\./.test(k) || /^ach\.[^.]+\.(name|desc)$/.test(k))
    .filter((k) => !known.has(k));
  ok(!orphans.length, `тексты без сущности: ${orphans.slice(0, 5).join(', ')}`);
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

// ---------------------------------------------------------------- фазз-тест поля боя
const dist = (a: number, b: number): number =>
  Math.abs(Math.floor(a / 3) - Math.floor(b / 3)) + Math.abs((a % 3) - (b % 3));
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
      const battle = RoomBattleFactory.standard().create({
        room: ROOMS[room],
        stats,
        weapon: null,
        armor: null,
        consumables: { potion_heal: 3, potion_regen: 2, artifact: 2 },
        rng,
      });
      battle.start();
      runs++;
      for (let step = 0; step < 400 && !battle.over; step++) {
        const cells = Grid.CELLS.filter((c) => battle.cards[c]);
        if (!cells.length) {
          ok(false, `${lin} ${ROOMS[room].id}: на поле не осталось карт, но комната не завершена`);
          break;
        }
        const r = rng.next();
        if (r < 0.08)
          battle.useItem(rng.pick(['potion_heal', 'potion_regen', 'artifact'] as const));
        else if (r < 0.32 && stats.abilities.length) {
          const perk = rng.pick(stats.abilities);
          if (battle.usePerk(perk.id).ok) perkUses++;
          if (battle.armed) {
            const target = cells.find((c) => battle.perkTargetOk(battle.armed!, c));
            if (target === undefined) battle.cancelPerk();
            else {
              battle.tap(target);
              if (battle.armed) battle.tap(cells.find((c) => c !== target) ?? target);
            }
          }
        } else battle.tap(rng.pick(cells));
        const auto = battle.over
          ? null
          : pickAutoUse(battle, { heal: true, regen: true, artifact: true });
        if (auto) {
          autoPicks++;
          ok(
            battle.useItem(auto).ok,
            `${lin} ${ROOMS[room].id}: автоприменение предложило невозможное действие ${auto}`,
          );
        }
        ok(battle.hp <= battle.stats.maxHp, 'hp не превышает максимум');
        ok(battle.res >= 0 && battle.res <= battle.stats.resMax, 'ресурс в пределах');
        ok(battle.cards[battle.playerCell] === null, 'клетка игрока пуста в массиве карт');
        ok(
          battle.cards.every((c) => !c || c.hp <= c.maxHp || c.kind !== 'enemy'),
          'здоровье врага не превышает максимум',
        );
        if (battle.pool.length === 0 && !battle.over && !battle.armed) {
          const seen = new Set([battle.playerCell]);
          const q = [battle.playerCell];
          while (q.length) {
            const c = q.shift()!;
            for (const n of Grid.CELLS)
              if (dist(c, n) === 1 && battle.cards[n] && !seen.has(n)) (seen.add(n), q.push(n));
          }
          ok(
            !battle.cards.some((c, i) => c && !seen.has(CellIndex.of(i))),
            `${lin} ${ROOMS[room].id}: пустые клетки разделили карты`,
          );
        }
        if (battle.over) break;
      }
      if (battle.over === 'win')
        ok(battle.exitOpen, 'победа только после того, как открылся выход');
    }
  }
}
// ---------------------------------------------------------------- приложение: потоки экранов без Phaser
{
  /** Подставная платформа: записывает вызовы; видео с наградой досматривается, если `rewarded`. */
  const fakePlatform = (rewarded: boolean): { platform: IPlatform; calls: string[] } => {
    const calls: string[] = [];
    const platform: IPlatform = {
      ready: () => void calls.push('ready'),
      gameplayStart: () => void calls.push('start'),
      gameplayStop: () => void calls.push('stop'),
      showRewarded: async () => (calls.push('rewarded'), rewarded),
      showInterstitial: async () => (calls.push('interstitial'), true),
      submitScore: async () => undefined,
      setStats: async () => undefined,
    };
    return { platform, calls };
  };
  const clock: IClock = { delay: () => Promise.resolve() };
  /** Дать отработать обещаниям потока (окна, реклама). */
  const settle = (): Promise<void> => new Promise((done) => setTimeout(done, 0));
  const heroProfile = (lin: LineageId): Profile => {
    const p = new Profile(Profile.freshData('ru', 0), () => 0, {
      today: () => DayKey.of(2026, 9, 25),
    });
    p.unlockLineage(lin);
    p.setActiveClass(lin);
    return p;
  };

  // хаб: вход, награды с рекламой, уход один раз, награда дня при возвращении из боя
  {
    const hubFor = (p: Profile, rewarded: boolean, choice: () => RewardChoice) => {
      const { platform, calls } = fakePlatform(rewarded);
      const ads = new AdService(platform, p, () => 0);
      const log: string[] = [];
      const opened: Array<HubMenu | 'play'> = [];
      let asked = 0;
      const hub = new HubController({
        profile: p,
        state: new GetHubState(p, new ShopCatalog(p)),
        daily: new ClaimDailyReward(p, ads),
        gift: new ClaimTowerGift(p, ads),
        view: {
          autoSkilled: (n) => void log.push(`auto:${n}`),
          rewarded: () => void log.push('reward'),
          showRewards: () => undefined,
        },
        dialogs: { daily: async () => (asked++, choice()), gift: async () => (asked++, choice()) },
        navigator: { open: (m) => void opened.push(m), play: () => void opened.push('play') },
        clock,
      });
      return { hub, calls, log, opened, platform, asked: () => asked };
    };
    const p = heroProfile('warrior');
    let choice: RewardChoice = 'double';
    const h = hubFor(p, true, () => choice);
    const entry = new EnterHub(p, h.platform).execute();
    ok(
      h.calls[0] === 'ready' && entry.autoSkillBuys === 0,
      'хаб: вход сообщает платформе о готовности',
    );
    h.hub.execute({ type: 'daily' });
    await settle();
    ok(
      p.gold === DAILY_REWARDS[0].gold! * 2 &&
        !p.dailyStatus().available &&
        h.log.includes('reward'),
      'хаб: награда дня за досмотренное видео — вдвое',
    );
    choice = 'single';
    const gold1 = p.gold;
    h.hub.execute({ type: 'gift' });
    await settle();
    ok(
      p.gold - gold1 === GIFT_REWARD.gold &&
        !p.giftReady() &&
        h.calls.filter((c) => c === 'rewarded').length === 1,
      'хаб: «Дар башни» без видео — обычный, реклама не показывается',
    );
    h.hub.execute({ type: 'open', menu: 'levels' });
    h.hub.execute({ type: 'play' });
    h.hub.execute({ type: 'open', menu: 'shop' });
    ok(h.opened.join() === 'levels', 'хаб: пока идёт уход в меню, остальные нажатия не считаются');

    const back = (from: HubOrigin | undefined) => {
      const q = heroProfile('warrior');
      q.markTutorial('skill');
      const r = hubFor(q, false, () => 'double');
      return { q, r, done: r.hub.start({ autoSkillBuys: 3 }, from) };
    };
    const fromGame = back('game');
    await fromGame.done;
    await settle();
    ok(
      fromGame.r.log[0] === 'auto:3' &&
        fromGame.r.asked() === 1 &&
        fromGame.q.gold === DAILY_REWARDS[0].gold,
      'хаб: из боя — итог автопрокачки и награда дня (видео не досмотрено — обычная)',
    );
    const fromMenu = back('shop');
    await fromMenu.done;
    ok(
      fromMenu.r.asked() === 0 && fromMenu.q.dailyStatus().available,
      'хаб: из меню награду дня сам не предлагает',
    );
  }

  // лавка: покупка, повтор, починка, «слабее надетого», предел зелий, нехватка золота
  {
    const p = heroProfile('warrior');
    p.addGold(Gold.of(20000), false);
    const log: string[] = [];
    let closes = 0;
    const view: IShopView = {
      itemBought: (it, repaired) => void log.push(`${repaired ? 'repaired' : 'bought'}:${it.id}`),
      consumableBought: () => void log.push('potion'),
      noGold: () => void log.push('gold'),
      stackFull: (def) => void log.push(`full:${def.id}`),
      denied: () => void log.push('denied'),
    };
    const shop = new ShopController({
      buyItem: new BuyItem(p),
      buyConsumable: new BuyConsumable(p),
      view,
      navigator: { close: () => void closes++ },
    });
    const catalog = new ShopCatalog(p);
    const [w1, w2] = catalog.items('weapon').map((o) => o.item);
    ok(
      catalog.items('weapon').every((o) => o.item.lineage === 'warrior') &&
        catalog.items('weapon')[0].action === 'buy',
      'лавка: оружие — только линейки героя',
    );
    shop.execute({ type: 'buy-item', item: w1 });
    ok(
      log.at(-1) === `bought:${w1.id}` && catalog.items('weapon')[0].action === 'equipped',
      'лавка: купленная вещь надета',
    );
    shop.execute({ type: 'buy-item', item: w1 });
    ok(log.at(-1) === 'denied', 'лавка: целую надетую вещь второй раз не продаём');
    p.equipped('weapon')!.durability = 1;
    const repair = catalog.items('weapon')[0];
    const gold0 = p.gold;
    shop.execute({ type: 'buy-item', item: w1 });
    ok(
      repair.action === 'repair' &&
        log.at(-1) === `repaired:${w1.id}` &&
        gold0 - p.gold === repair.price,
      'лавка: починка стоит столько, сколько обещано',
    );
    shop.execute({ type: 'buy-item', item: w2 });
    ok(
      catalog.items('weapon')[0].action === 'weaker',
      'лавка: вещь слабее надетой больше не нужна',
    );
    shop.execute({ type: 'buy-item', item: w1 });
    ok(log.at(-1) === 'denied', 'лавка: вещь слабее надетой не продаём');
    for (let i = 0; i < 10; i++) shop.execute({ type: 'buy-consumable', id: 'potion_heal' });
    ok(
      p.heroSave.consumables.potion_heal === CONSUMABLES.potion_heal.max &&
        log.at(-1) === 'full:potion_heal',
      'лавка: зелья — не больше предела запаса',
    );
    shop.execute({ type: 'close' });
    shop.execute({ type: 'close' });
    ok(closes === 1, 'лавка: закрывается один раз');
    ok(
      new ShopCatalog(p).hasAffordableUpgrade(),
      'лавка: при золоте на следующую ступень значок «есть что купить» есть',
    );
    const poor = heroProfile('warrior');
    const poorLog: string[] = [];
    new ShopController({
      buyItem: new BuyItem(poor),
      buyConsumable: new BuyConsumable(poor),
      view: { ...view, noGold: () => void poorLog.push('gold') },
      navigator: { close: () => undefined },
    }).execute({ type: 'buy-item', item: w1 });
    ok(
      poorLog[0] === 'gold' &&
        !poor.equipped('weapon') &&
        !new ShopCatalog(poor).hasAffordableUpgrade(),
      'лавка: без золота не купить, значка нет',
    );
  }

  // дерево навыков: первая покупка, метаморфоза с подтверждением, отказ от финального класса, автопрокачка
  {
    const log: string[] = [];
    const view: ISkillTreeView = {
      refused: (r) => void log.push(`refused:${r}`),
      learned: (n) => void log.push(`learned:${n.id}`),
      metamorphosisCancelled: (to) => void log.push(`cancelled:${to}`),
      autoBought: (plan) => void log.push(`auto:${plan.buys.length}`),
      autoToggled: (on) => void log.push(`toggle:${on}`),
    };
    let confirm = false;
    let closes = 0;
    const treeFor = (p: Profile) => {
      const query = new SkillTreeQuery(p);
      const ctl = new SkillTreeController({
        query,
        buySkill: new BuySkill(p),
        metamorphose: new Metamorphose(p),
        cancelMetamorphosis: new CancelMetamorphosis(p),
        autoSkill: new AutoSkill(p),
        view,
        dialogs: { confirmMetamorphosis: async () => confirm, confirmCancel: async () => confirm },
        navigator: { close: () => void closes++, switchClass: () => undefined },
        clock,
      });
      return { query, ctl };
    };
    const p = heroProfile('mage');
    p.addSouls(Souls.of(1e7), false);
    const { query, ctl } = treeFor(p);
    const tree = query.tree;
    const first = query.tutorialTarget()!;
    ctl.execute({ type: 'buy', node: first });
    ok(
      log.at(-1) === `learned:${first.id}` && p.tutorial.skill && query.tutorialTarget() === null,
      'дерево: первая покупка завершает обучение',
    );
    /** Проходит ярус класса `owner` командами дерева, пока не откроется метаморфоза в `to`. */
    const passTier = (owner: ClassId, to: ClassId): boolean => {
      for (let i = 0; i < 200 && !query.check(tree.classNode[to]).ok; i++) {
        const n = tree.nodes.find(
          (x) => x.kind !== 'class' && x.owner === owner && query.check(x).ok,
        );
        if (!n) break;
        ctl.execute({ type: 'buy', node: n });
      }
      return query.check(tree.classNode[to]).ok;
    };
    ok(passTier('mage', 'magister'), 'дерево: покупки мага открывают метаморфозу в магистра');
    ctl.execute({ type: 'buy', node: tree.classNode.magister });
    await settle();
    ok(p.activeClass === 'mage', 'дерево: без подтверждения метаморфозы нет');
    confirm = true;
    ctl.execute({ type: 'buy', node: tree.classNode.magister });
    await settle();
    ok(
      p.activeClass === 'magister' &&
        p.data.stats.metamorphoses === 1 &&
        log.at(-1) === `learned:${tree.classNode.magister.id}`,
      'дерево: метаморфоза в магистра — с подтверждением и в счётчике',
    );
    ok(passTier('magister', 'pyromancer'), 'дерево: ярус магистра открывает финальные классы');
    ctl.execute({ type: 'buy', node: tree.classNode.pyromancer });
    await settle();
    const souls0 = p.souls;
    ok(p.activeClass === 'pyromancer', 'дерево: метаморфоза в пироманта');
    ctl.execute({ type: 'cancel-metamorphosis' });
    await settle();
    ok(
      p.activeClass === 'magister' && p.souls > souls0 && log.at(-1) === 'cancelled:magister',
      'дерево: отказ от пироманта возвращает магистра и часть душ',
    );
    ctl.execute({ type: 'toggle-auto' });
    ok(log.includes('toggle:true') && p.autoSkillCfg().on, 'дерево: автопрокачка включается');
    ctl.execute({ type: 'toggle-auto' });
    ok(log.at(-1) === 'toggle:false' && !p.autoSkillCfg().on, 'дерево: автопрокачка выключается');
    ctl.execute({ type: 'close' });
    ctl.execute({ type: 'close' });
    ok(closes === 1, 'дерево: закрывается один раз');
    const poor = heroProfile('mage');
    const pt = treeFor(poor);
    const target = pt.query.tree.nodes.find(
      (n) => n.kind !== 'class' && pt.query.state(n) === 'available',
    )!;
    pt.ctl.execute({ type: 'buy', node: target });
    ok(log.at(-1) === 'refused:souls' && !poor.tutorial.skill, 'дерево: без душ не купить');
  }

  // выбор героя: первый запуск, открытие за золото, смена героя, кошелёк у каждого свой
  {
    const p = new Profile(Profile.freshData('ru', 0), () => 0, {
      today: () => DayKey.of(2026, 9, 25),
    });
    const log: string[] = [];
    let games = 0;
    let backs = 0;
    const { platform, calls } = fakePlatform(false);
    const selectFor = (mode: ClassSelectMode) => {
      const selection = new ClassSelection(p, mode);
      const ctl = new ClassSelectController({
        selection,
        platform,
        view: {
          started: () => void log.push('started'),
          unlocked: (c) => void log.push(`unlocked:${c}`),
          noGold: () => void log.push('gold'),
          switched: () => void log.push('switched'),
        },
        dialogs: { confirmSwitch: async () => true },
        navigator: { startGame: () => void games++, back: () => void backs++ },
      });
      return { selection, ctl };
    };
    const first = selectFor('first');
    first.ctl.start();
    ok(
      p.isFirstRun &&
        calls.includes('ready') &&
        first.selection.choices().every((c) => c.opened && c.action === 'start'),
      'выбор героя: в первый запуск доступны все герои',
    );
    first.ctl.execute({ type: 'choose', classId: 'archer' });
    await settle();
    ok(
      p.activeClass === 'archer' && !p.isFirstRun && games === 1 && log.at(-1) === 'started',
      'выбор героя: первый выбор открывает героя и ведёт в забег',
    );
    const sw = selectFor('switch');
    ok(
      sw.selection.choice('archer').action === 'current' &&
        sw.selection.choice('mage').action === 'unlock',
      'выбор героя: текущий герой отмечен, закрытые — за золото',
    );
    sw.ctl.execute({ type: 'choose', classId: 'mage' });
    await settle();
    ok(
      log.at(-1) === 'gold' && !p.isLineageUnlocked('mage'),
      'выбор героя: без золота героя не открыть',
    );
    p.addGold(Gold.of(ProgressionBalance.heroUnlockCost + 100), false);
    sw.ctl.execute({ type: 'choose', classId: 'mage' });
    await settle();
    ok(
      log.at(-1) === 'unlocked:mage' &&
        p.activeClass === 'archer' &&
        p.gold === 100 &&
        sw.selection.choice('mage').action === 'pick',
      'выбор героя: открытие стоит своё и героя не меняет',
    );
    sw.ctl.execute({ type: 'choose', classId: 'mage' });
    await settle();
    ok(
      p.activeClass === 'mage' && backs === 1 && log.at(-1) === 'switched',
      'выбор героя: смена героя — с подтверждением',
    );
    ok(
      p.gold === 0 && p.heroSaveOf('archer').gold === 100,
      'выбор героя: у каждого героя свой кошелёк',
    );
  }

  // настройки: кнопка звука, ползунок громкости, язык
  {
    const p = heroProfile('warrior');
    const out: string[] = [];
    const audio = new AudioSettings(p, {
      setVolume: (v) => void out.push(`vol:${v}`),
      setMuted: (m) => void out.push(`mute:${m}`),
    });
    const applied: Lang[] = [];
    const shown: Array<[number, boolean]> = [];
    let reloads = 0;
    const ctl = new SettingsController({
      audio,
      language: new LanguageSettings(p, { apply: (l) => void applied.push(l) }),
      view: { showVolume: (v, silent) => void shown.push([v, silent]) },
      navigator: { close: () => undefined, reload: () => void reloads++ },
    });
    ok(
      audio.toggleMuted() && p.muted && out.at(-1) === 'mute:true',
      'настройки: кнопка звука выключает звук и помнит выбор',
    );
    ctl.execute({ type: 'volume', value: 0.4 });
    ok(
      p.volume === 0.4 && !p.muted && shown.at(-1)?.[1] === false && out.includes('vol:0.4'),
      'настройки: ползунок громкости снимает «без звука»',
    );
    ctl.execute({ type: 'volume', value: 0 });
    ok(shown.at(-1)?.[1] === true, 'настройки: на нулевой громкости звука нет');
    ctl.execute({ type: 'language', lang: 'ru' });
    ok(reloads === 0 && applied.length === 0, 'настройки: тот же язык ничего не меняет');
    ctl.execute({ type: 'language', lang: 'en' });
    ok(
      reloads === 1 && p.lang === 'en' && applied.join() === 'en',
      'настройки: новый язык сохраняется, применяется и пересобирает экран',
    );
  }

  // реклама: полноэкранная — не в первых комнатах и не чаще кулдауна, видео с наградой — пауза игры
  {
    const p = heroProfile('warrior');
    const { platform, calls } = fakePlatform(true);
    let now = 1_000_000;
    const ads = new AdService(platform, p, () => now);
    const shown = (): number => calls.filter((c) => c === 'interstitial').length;
    await ads.interstitial();
    ok(shown() === 0, 'реклама: полноэкранной нет в первых комнатах');
    p.bump('roomsCleared', AD_POLICY.firstAdAfterRooms);
    await ads.interstitial();
    ok(
      shown() === 1 && p.lastInterstitial === now,
      'реклама: после нескольких комнат — показана и запомнена',
    );
    now += AD_POLICY.interstitialCooldownMs - 1;
    await ads.interstitial();
    ok(shown() === 1, 'реклама: не чаще собственного кулдауна');
    now += 1;
    await ads.interstitial();
    ok(shown() === 2, 'реклама: после кулдауна — снова');
    ok(
      (await ads.rewarded()) && calls.includes('stop'),
      'реклама: видео с наградой ставит игру на паузу',
    );
  }

  // бой: гибель → воскрешение за видео → гибель → итог забега; видео не досмотрено; побег
  {
    const gameFor = (rewarded: boolean, died: Array<'revive' | 'end'>) => {
      const p = heroProfile('warrior');
      p.markTutorial('fight');
      const { platform, calls } = fakePlatform(rewarded);
      const tower = new TowerRun(
        { profile: p, platform, storage: { flush: () => undefined }, seeds: { next: () => 7 } },
        TowerRun.start(p),
      );
      const battle = tower.enterRoom() as RoomBattle;
      const asked: Array<{ canRevive: boolean; lootLost: boolean }> = [];
      const summaries: RunSummary[] = [];
      const nav: string[] = [];
      const shown: string[] = [];
      let send: (cmd: PlayerCommand) => void = () => undefined;
      let killNext = false;
      const dialogs: IGameDialogs = {
        confirmEscape: async () => (shown.push('confirmEscape'), true),
        roomCleared: async () => 'cashout',
        died: async (d) => (asked.push(d), died.shift() ?? 'end'),
        runOver: async (sum) => (summaries.push(sum), 'hub'),
      };
      const view = new Proxy(
        {},
        { get: (_, k) => () => void shown.push(String(k)) },
      ) as IGameRenderer;
      const controller = new GameController({
        battle,
        tower,
        profile: p,
        autoUse: new AutoUseToggles(p),
        ads: new AdService(platform, p, () => 0),
        platform,
        view,
        player: {
          play: async () => {
            // ход, после которого герой погибает: исход решает бой, поток только читает `over`
            if (killNext) battle.over = 'lose';
            killNext = false;
          },
        },
        dialogs,
        navigator: {
          nextRoom: () => void nav.push('next'),
          newRun: () => void nav.push('new'),
          toHub: () => void nav.push('hub'),
        },
        clock,
        input: { onCommand: (h) => void (send = h) },
      });
      /** Ход зельем исцеления; `fatal` — после него герой погибает. */
      const drink = (fatal: boolean): void => {
        battle.hp = 1;
        battle.consumables = { potion_heal: 5, potion_regen: 0, artifact: 0 };
        killNext = fatal;
        send({ type: 'use-item', itemId: 'potion_heal' });
      };
      const settleAll = async (): Promise<void> => {
        for (let i = 0; i < 5; i++) await settle();
      };
      return { p, battle, calls, asked, summaries, nav, shown, controller, drink, send, settleAll };
    };

    const g = gameFor(true, ['revive', 'end']);
    g.controller.start();
    await g.settleAll();
    g.drink(true);
    await g.settleAll();
    ok(
      g.asked.length === 1 && g.asked[0].canRevive && g.battle.over === null && g.battle.revived,
      'бой: после гибели — окно, воскрешение за досмотренное видео',
    );
    g.drink(true);
    await g.settleAll();
    ok(
      g.asked.length === 2 && !g.asked[1].canRevive,
      'бой: второе воскрешение за видео в забеге не предлагается',
    );
    ok(
      g.summaries.length === 1 &&
        g.summaries[0].reason === 'dead' &&
        g.nav.join() === 'hub' &&
        g.p.stats.deaths === 1 &&
        g.calls.filter((c) => c === 'rewarded').length === 1,
      'бой: вторая гибель — итог забега один раз, уход в хаб',
    );
    g.send({ type: 'escape' });
    await g.settleAll();
    ok(
      g.summaries.length === 1 && g.nav.length === 1,
      'бой: после итога забега команды не действуют',
    );

    const noVideo = gameFor(false, ['revive', 'end']);
    noVideo.controller.start();
    await noVideo.settleAll();
    noVideo.drink(true);
    await noVideo.settleAll();
    ok(
      noVideo.asked.length === 2 &&
        noVideo.asked.every((a) => a.canRevive) &&
        !noVideo.battle.revived &&
        noVideo.summaries[0]?.reason === 'dead',
      'бой: видео не досмотрено — окно гибели возвращается, герой не встаёт',
    );

    const run = gameFor(true, []);
    run.controller.start();
    await run.settleAll();
    run.drink(false);
    await run.settleAll();
    ok(
      run.battle.over === null && run.asked.length === 0,
      'бой: обычный ход не заканчивает комнату',
    );
    run.battle.totals.gold = Gold.of(5);
    run.send({ type: 'escape' });
    await run.settleAll();
    ok(
      run.shown.includes('confirmEscape') &&
        run.summaries.length === 1 &&
        run.summaries[0].reason === 'escape' &&
        run.summaries[0].lootLost &&
        run.nav.join() === 'hub' &&
        run.p.stats.deaths === 0,
      'бой: побег — с подтверждением, добыча комнаты пропадает, уход в хаб',
    );
  }
}

ok(autoPicks > 20, `автоприменение срабатывает в фазз-тесте (${autoPicks})`);
ok(perkUses > 200, `способности применяются в фазз-тесте (${perkUses})`);
console.log(
  `Прогонов боя: ${runs} (автоприменений: ${autoPicks}, способностей: ${perkUses}). ${failed ? `ОШИБОК: ${failed}` : 'Все проверки пройдены.'}`,
);
if (failed) throw new Error('selftest failed');
