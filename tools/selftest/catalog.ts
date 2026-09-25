/** Самопроверка: Содержимое игры: способности и таланты, этажи и враги, ключи картинок, тексты. */
import type { ClassId } from '../../src/domain/catalog';
import { CLASSES, classesOfLineage } from '../../src/domain/catalog/classes';
import { CONSUMABLES } from '../../src/domain/catalog/consumables';
import { ENEMY_LIST } from '../../src/domain/catalog/enemies';
import { FLOOR_SCALING, FloorCurveScaling, FLOORS } from '../../src/domain/catalog/floors';
import { ITEMS } from '../../src/domain/catalog/items';
import { MODIFIERS, rollRoom, ROOMS, ROOMS_PER_FLOOR } from '../../src/domain/catalog/levels';
import {
  FULL_BAR,
  hasButton,
  PERK_BY_ABILITY,
  perkOf,
  PERKS,
  perksOfClass,
  VFX_STYLES,
} from '../../src/domain/catalog/perks';
import {
  maxRank,
  PATH_ORDER,
  SYNERGY_FX,
  talentChain,
  TALENTS,
  talentsOfClass,
  talentsOfTier,
} from '../../src/domain/catalog/talents';
import { ABILITIES } from '../../src/domain/combat';
import { classTraits, type TraitId } from '../../src/domain/progression/traits/traits';
import { ACHIEVEMENTS } from '../../src/domain/rewards';
import { makeRng } from '../../src/domain/shared/rng/rng';
import { en } from '../../src/i18n/en';
import { perkValues } from '../../src/i18n/perkValues';
import { ru } from '../../src/i18n/ru';
import { contentArtKeys } from '../../src/presentation/textures/artKeys';
import { ok } from './harness';

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

// ---------------------------------------------------------------- сменный блок графики: ключи картинок
{
  const keys = new Set(contentArtKeys());
  const icons = [
    ...ENEMY_LIST.map((e) => e.icon),
    ...ITEMS.map((i) => i.icon),
    ...PERKS.map((p) => p.icon),
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
