/** Самопроверка: Содержимое игры: способности и таланты, этажи и враги, ключи картинок, тексты. */
import type { ClassId } from '../../src/domain/catalog';
import {
  ABILITY_BY_ID,
  ABILITY_LIST,
  abilityAtLevel,
  FULL_BAR,
  hasButton,
  levelsOf,
  withPatch,
} from '../../src/domain/catalog/abilities';
import { CLASSES, isBranched } from '../../src/domain/catalog/classes';
import { CONSUMABLES } from '../../src/domain/catalog/consumables';
import { ENEMY_LIST } from '../../src/domain/catalog/enemies';
import { FLOOR_SCALING, FloorCurveScaling, FLOORS } from '../../src/domain/catalog/floors';
import { HEROES } from '../../src/domain/catalog/heroes';
import { ITEMS } from '../../src/domain/catalog/items';
import { MODIFIERS, rollRoom, ROOMS, ROOMS_PER_FLOOR } from '../../src/domain/catalog/levels';
import { PERK_BY_ABILITY, perkOf, PERKS, perksOfClass } from '../../src/domain/catalog/perks';
import {
  basePlacesOf,
  isSynergy,
  maxRank,
  patchAt,
  PATH_ORDER,
  placesOfClass,
  placesOfTier,
  TALENT_PLACES,
  talentChain,
  type TalentEffect,
  TALENTS,
} from '../../src/domain/catalog/talents';
import { ABILITY_BEHAVIORS, FX_STYLES } from '../../src/domain/combat';
import { classTraits, type TraitId } from '../../src/domain/progression/traits/traits';
import { ACHIEVEMENTS } from '../../src/domain/rewards';
import { makeRng } from '../../src/domain/shared/rng/rng';
import { abilityValues } from '../../src/i18n/abilityValues';
import { en } from '../../src/i18n/en';
import { ru } from '../../src/i18n/ru';
import { abilityIcon, contentArtKeys } from '../../src/presentation/textures/artKeys';
import { ABILITY_FX } from '../../src/presentation/theme/abilityFx';
import { ok } from './harness';

/** Значения эффекта таланта по рангам: у пары «шанс / сила» — шансы, у правки перка — пусто. */
const rankValues = (e: TalentEffect): readonly number[] =>
  e.kind === 'chance' ? e.chance : e.kind === 'modify' ? [] : e.perRank;

const ALL_CLASSES = Object.keys(CLASSES) as ClassId[];
const TIERED = ALL_CLASSES.filter((c) => !isBranched(CLASSES[c]));
const BRANCHED = ALL_CLASSES.filter((c) => isBranched(CLASSES[c]));

/** Проверки одного таланта: ранги, их значения, перевод эффекта. */
const checkTalent = (t: TalentEffect, id: string): void => {
  if (t.kind === 'modify') {
    ok(t.perRank.length >= 1 && t.perRank.length <= 5, `${id}: рангов ${t.perRank.length}`);
    ok(
      t.perRank.every((patch) => Object.keys(patch).length > 0),
      `${id}: каждый ранг правит числа перка`,
    );
    ok(`talent.${id}.desc` in ru && `talent.${id}.desc` in en, `описание таланта-правки ${id}`);
    return;
  }
  const v = rankValues(t);
  ok(v.length >= 1 && v.length <= 5, `${id}: рангов ${v.length}`);
  // значения суммарные, значит строго возрастают
  ok(
    v.every((x, i) => i === 0 || x > v[i - 1]),
    `${id}: значения рангов возрастают (${v.join('/')})`,
  );
  if (t.kind === 'chance')
    ok(t.power.length === v.length, `${id}: у каждого ранга есть и шанс, и сила`);
  ok(`tal.${t.fx}` in ru && `tal.${t.fx}` in en, `перевод эффекта таланта tal.${t.fx}`);
};

// ---------------------------------------------------------------- классы с ветками и «Основа»
ok(
  BRANCHED.length === 10 && TIERED.length === 8,
  'маг и охотник — классы с ветками, воин и наёмник — с ярусами',
);
for (const cls of BRANCHED) {
  const def = CLASSES[cls];
  if (!isBranched(def)) continue;
  ok(`class.${cls}.name` in ru && `class.${cls}.name` in en, `перевод названия класса ${cls}`);
  if (def.stage === 0) {
    ok(def.branches.length === 0, `${cls}: у базового класса нет перков — сразу выбор подкласса`);
    continue;
  }
  ok(def.branches.length >= 1, `${cls}: есть ветки`);
  for (const b of def.branches) {
    ok('perk' in b.steps[0], `${cls}/${b.id}: ветка начинается с перка`);
    ok(
      `branch.${cls}.${b.id}` in ru && `branch.${cls}.${b.id}` in en,
      `перевод ветки ${cls}/${b.id}`,
    );
    for (const st of b.steps) if ('talent' in st) checkTalent(st.talent.effect, st.talent.id);
  }
  for (const b of def.branches) {
    const perks = b.steps.filter((st) => 'perk' in st).length;
    ok(perks >= 1 && perks <= 2, `${cls}/${b.id}: перков в ветке ${perks} (1–2)`);
  }
}
for (const h of HEROES) {
  const base = h.classes.find((c) => c.stage === 0)!;
  if (!isBranched(base)) {
    ok(!h.baseTree, `${h.lineage.id}: у линейки с ярусами нет «Основы»`);
    continue;
  }
  const places = basePlacesOf(base.id);
  ok(h.baseTree?.length === 6 && places.length >= 24, `${h.lineage.id}: «Основа» — шесть ярусов`);
  for (let tier = 1; tier <= 6; tier++) {
    const paths = new Set(places.filter((p) => p.tier === tier).map((p) => p.path));
    ok(paths.size === 3, `${h.lineage.id}: на ярусе «Основы» ${tier} все три пути`);
  }
  ok(
    places.some((p) => p.talent.effect.kind === 'bonus' && p.talent.effect.fx === 'hpPct'),
    `${h.lineage.id}: в «Основе» есть запас здоровья`,
  );
  for (const p of places) checkTalent(p.talent.effect, p.talent.id);
}

// ---------------------------------------------------------------- классы с ярусами: перки и таланты
for (const cls of TIERED) {
  const perks = perksOfClass(cls);
  const stage = CLASSES[cls].stage;
  ok(
    perks.length === (stage === 2 ? 4 : 3),
    `${cls}: перков ${perks.length}, ожидалось ${stage === 2 ? 4 : 3}`,
  );
  ok(!!perkOf(cls, 'start'), `${cls}: есть стартовая способность`);
  const buttons = perks.filter((p) => hasButton(p.ability)).length;
  ok(buttons <= 4, `${cls}: кнопок способностей ${buttons} (максимум 4 на класс)`);

  const talents = placesOfClass(cls);
  ok(
    talents.length >= 15 && talents.length <= 16,
    `${cls}: талантов ${talents.length}, ожидалось 15–16`,
  );
  let variedTiers = 0;
  for (const tier of [1, 2, 3] as const) {
    const list = placesOfTier(cls, tier);
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
  const ranks = talents.reduce((a, t) => a + maxRank(t.talent.effect), 0);
  ok(ranks >= 30 && ranks <= 50, `${cls}: суммарно рангов ${ranks} (ожидалось 30–50)`);
  for (const { talent: t } of talents) checkTalent(t.effect, t.id);
}
ok(
  new Set(TALENT_PLACES.map((t) => t.id)).size === TALENT_PLACES.length,
  'места талантов уникальны',
);
ok(new Set(TALENTS.map((t) => t.id)).size === TALENTS.length, 'id талантов уникальны');
// таланты-синергии: прокачка между способностями усиливает сами способности
{
  const fx = (cls: ClassId, f: string): boolean =>
    placesOfClass(cls).some((t) => t.talent.effect.kind !== 'modify' && t.talent.effect.fx === f);
  const withSyn = TIERED.filter((c) => placesOfClass(c).some((t) => isSynergy(t.talent.effect)));
  ok(
    withSyn.length === TIERED.length,
    `у каждого класса с ярусами есть талант-синергия (${withSyn.length})`,
  );
  // у каждого класса есть талант на запас здоровья: иначе живучесть держится только на броне
  for (const c of TIERED) ok(fx(c, 'hpPct'), `${c}: в дереве есть запас здоровья`);
}
ok(new Set(PERKS.map((p) => p.id)).size === PERKS.length, 'id перков уникальны');
// у каждой механики с кнопкой — класс в реестре боя; пассивки и базовые действия работают в правилах боя
ok(
  ABILITY_LIST.every((a) => (ABILITY_BEHAVIORS[a.behavior] !== undefined) === hasButton(a)),
  'реализация в бою есть ровно у механик способностей с кнопкой',
);
// способность выдаёт один перк: по нему её тексты берут восстановление ресурса линейки
ok(
  new Set(ABILITY_LIST.map((a) => a.id)).size === ABILITY_LIST.length &&
    ABILITY_LIST.length === PERKS.length &&
    PERKS.every(
      (p) => PERK_BY_ABILITY[p.ability.id] === p && ABILITY_BY_ID[p.ability.id] === p.ability,
    ),
  'id способностей уникальны, у каждой способности один перк',
);
const STYLES = new Set<string>(FX_STYLES);
for (const a of ABILITY_LIST) {
  ok(
    [`ability.${a.id}.name`, `ability.${a.id}.desc`].every((k) => k in ru && k in en),
    `${a.id}: есть название и описание на обоих языках`,
  );
  ok(STYLES.has(ABILITY_FX[a.id]), `${a.id}: задана вспышка ${ABILITY_FX[a.id]}`);
  if (hasButton(a)) ok(a.target !== undefined, `${a.id}: у кнопки задана цель`);
  if (a.cost === FULL_BAR)
    ok(!!a.once, `${a.id}: способность за всю шкалу применяется раз за комнату`);
  // числа способности на каждом уровне — положительные: множители, ходы, штуки (удар без урона — 0)
  for (let level = 1; level <= levelsOf(a); level++) {
    const params = abilityAtLevel(a, level).params as Record<string, number | readonly number[]>;
    const nums = Object.entries(params)
      .filter(([k]) => !(a.behavior === 'strike' && k === 'dmg'))
      .flatMap(([, v]) => v);
    ok(
      nums.every((n) => Number.isFinite(n) && n > 0),
      `${a.id}/${level}: числа способности положительные (${nums.join(', ')})`,
    );
  }
}
ok(
  Object.keys(ABILITY_FX).every((id) => id in ABILITY_BY_ID),
  'во вспышках способностей нет способностей, которых нет в игре',
);
// базовая атака у всех — рука; дальнее базовое действие — перк: выстрел лучника и арбалетчика,
// удар в спину наёмника
const basics = PERKS.filter((p) => p.ability.kind === 'basic').map((p) => p.classId);
ok(
  JSON.stringify(basics.sort()) === JSON.stringify(['bowman', 'crossbowman', 'mercenary']),
  `базовые действия: ${basics.join(',')}`,
);
ok(
  PERKS.filter((p) => p.ability.kind === 'basic').every((p) => !!p.ability.attack),
  'базовое действие называет свой стиль атаки',
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

// ---------------------------------------------------------------- сменный блок графики: ключи картинок
{
  const keys = new Set(contentArtKeys());
  const icons = [
    ...ENEMY_LIST.map((e) => e.icon),
    ...ITEMS.map((i) => i.icon),
    ...ABILITY_LIST.map((a) => abilityIcon(a.id)),
    ...Object.values(CONSUMABLES).map((c) => c.icon),
    ...Object.keys(CLASSES).flatMap((c) => [`hero_${c}`, `cls_${c}`]),
  ];
  const missing = icons.filter((k) => !keys.has(k));
  ok(
    missing.length === 0,
    `у всего содержимого есть ключ картинки в списке сменного блока (${missing.join(', ')})`,
  );
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
for (const cls of ALL_CLASSES) ok(`class.${cls}.name` in ru, `перевод названия класса ${cls}`);

// тексты контента — в словарях по id сущности, числа описаний — только плейсхолдерами
{
  const dict = { ru: ru as Record<string, string>, en: en as Record<string, string> };
  const holes = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  const bareDigits = (text: string): boolean => /\d/.test(text.replace(/\{\w+\}/g, ''));
  /** Текст с плейсхолдерами: все есть в значениях, голых цифр нет. */
  const checkText = (key: string, values: Record<string, unknown>): void => {
    for (const lang of ['ru', 'en'] as const) {
      const text = dict[lang][key] ?? '';
      ok(text !== '', `${key}/${lang}: текст есть`);
      const missing = holes(text).filter((h) => !(h in values));
      ok(!missing.length, `${key}/${lang}: числа текста есть у сущности (${missing.join(', ')})`);
      ok(!bareDigits(text), `${key}/${lang}: нет чисел мимо плейсхолдеров`);
    }
  };
  const levelKeys: string[] = [];
  for (const p of ABILITY_LIST) {
    checkText(`ability.${p.id}.desc`, abilityValues(p));
    // каждый уровень перка со второго — своя строка «что добавляет уровень»
    for (let level = 2; level <= levelsOf(p); level++) {
      levelKeys.push(`ability.${p.id}.lv${level}`);
      checkText(`ability.${p.id}.lv${level}`, abilityValues(abilityAtLevel(p, level)));
    }
  }
  const modifyKeys: string[] = [];
  for (const t of TALENTS) {
    const e = t.effect;
    if (e.kind !== 'modify') continue;
    modifyKeys.push(`talent.${t.id}.desc`);
    for (let rank = 1; rank <= e.perRank.length; rank++)
      checkText(`talent.${t.id}.desc`, abilityValues(withPatch(e.ability, patchAt(e, rank)!)));
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
    ...levelKeys,
    ...modifyKeys,
    ...ABILITY_LIST.flatMap((a) => [`ability.${a.id}.name`, `ability.${a.id}.desc`]),
  ]);
  const orphans = Object.keys(ru)
    .filter((k) => /^(ability|talent|enemy|item)\./.test(k) || /^ach\.[^.]+\.(name|desc)$/.test(k))
    .filter((k) => !known.has(k));
  ok(!orphans.length, `тексты без сущности: ${orphans.slice(0, 5).join(', ')}`);
}
