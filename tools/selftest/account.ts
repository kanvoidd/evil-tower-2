/** Самопроверка: Аккаунт: формат и перенос старых сохранений, календарь награды дня. */
import { Profile } from '../../src/domain/account/profile';
import {
  freshSave,
  type LegacySave,
  SAVE_MIGRATIONS,
  SaveFormat,
} from '../../src/domain/account/save';
import { newLineageSave, TREES } from '../../src/domain/progression/skill-tree';
import { DAILY_REWARDS } from '../../src/domain/rewards/daily';
import { DayKey } from '../../src/domain/shared';
import { ok } from './harness';

// ---------------------------------------------------------------- сохранение: формат и перенос старых
{
  const fresh = freshSave('ru', 5);
  ok(
    JSON.stringify(SaveFormat.restore(structuredClone(fresh), 5)) === JSON.stringify(fresh),
    'сохранение: документ текущего формата переносом не меняется',
  );
  ok(
    SAVE_MIGRATIONS.every(
      (m) => !m.applies(structuredClone(fresh)) || m.id === 'per-item-auto-use',
    ),
    'сохранение: шаги переноса не трогают текущий документ (кроме приведения переключателей)',
  );
  ok(
    !SaveFormat.accepts(null) &&
      !SaveFormat.accepts('x') &&
      !SaveFormat.accepts({ v: 1 }) &&
      SaveFormat.accepts({ v: SaveFormat.VERSION }),
    'сохранение: читается только объект текущей версии',
  );
  const older = { v: 2, savedAt: 10 };
  const newer = { v: 2, savedAt: 20 };
  ok(
    SaveFormat.newest([older, newer]) === newer &&
      SaveFormat.newest([newer, older]) === newer &&
      SaveFormat.newest([{ v: 1, savedAt: 99 }, older]) === older &&
      SaveFormat.newest([null, undefined]) === null,
    'сохранение: из локального и облачного побеждает более свежее той же версии',
  );

  // общий кошелёк → кошельки героев
  const shared: LegacySave = {
    v: 2,
    activeClass: 'mage',
    gold: 100,
    souls: 50,
    consumables: { potion_heal: 2 },
    armor: { id: 'a1', durability: 3 },
    cleared: ['1-1', '1-2'],
    lineages: { archer: newLineageSave(TREES.archer) },
  };
  const s1 = SaveFormat.restore(shared, 5);
  ok(
    s1.heroes.mage?.gold === 100 &&
      s1.heroes.mage.souls === 50 &&
      s1.heroes.mage.consumables.potion_heal === 2 &&
      s1.heroes.mage.consumables.potion_regen === 0 &&
      s1.heroes.mage.armor?.id === 'a1' &&
      s1.heroes.mage.best === 2,
    'сохранение: общий кошелёк и пройденные комнаты уходят линейке, которой играли',
  );
  ok(
    s1.heroes.archer?.gold === 0 && s1.heroes.archer.best === 0 && !s1.heroes.warrior,
    'сохранение: открытая линейка получает пустой кошелёк, неоткрытая — ничего',
  );
  ok(
    ['gold', 'souls', 'consumables', 'armor', 'cleared'].every((k) => !(k in s1)),
    'сохранение: старые общие поля убраны',
  );
  const perLineage = SaveFormat.restore(
    { v: 2, activeClass: null, cleared: { warrior: ['1-1'], archer: ['1-1', '1-2', '1-3'] } },
    5,
  );
  ok(
    perLineage.heroes.warrior?.best === 1 && perLineage.heroes.archer?.best === 3,
    'сохранение: пройденные комнаты по линейкам — рекорд каждой',
  );
  ok(
    SaveFormat.restore({ v: 2, heroes: {}, gold: 7 }, 5).heroes.warrior === undefined,
    'сохранение: кошельки героев уже есть — старые поля только убираются',
  );

  // автоматизация: общий переключатель → по расходнику
  const off = SaveFormat.restore({ v: 2, auto: { use: { on: false, heal: true } } }, 5);
  const on = SaveFormat.restore(
    { v: 2, auto: { use: { heal: true }, skill: { mage: { on: true } } } },
    5,
  );
  const none = SaveFormat.restore({ v: 2 }, 5);
  ok(
    !off.auto.use.heal && on.auto.use.heal && !on.auto.use.regen && on.auto.skill.mage?.on === true,
    'сохранение: выключенный общий переключатель выключает все расходники, свои — сохраняются',
  );
  ok(
    JSON.stringify(none.auto) === JSON.stringify(fresh.auto) && !('on' in off.auto.use),
    'сохранение: без автоматизации — значения по умолчанию, старый переключатель убран',
  );

  // профессиональное развитие: деревья мага и охотника сброшены, души и прочие линейки — целы
  const old: LegacySave = {
    v: 2,
    activeClass: 'pyromancer' as LegacySave['activeClass'],
    lineages: {
      mage: {
        ranks: { 'cls/mage': 1, 'mage/a1-1': 3, 'cls/pyromancer': 1 },
        last: 'cls/pyromancer',
      },
      archer: { ranks: { 'cls/archer': 1 }, last: 'cls/archer' },
      warrior: { ranks: { 'cls/warrior': 1, 'warrior/a1-1': 2 }, last: 'warrior/a1-1' },
    },
    heroes: { mage: { souls: 500 } as never },
  };
  const reworked = SaveFormat.restore(old, 5);
  ok(
    JSON.stringify(reworked.lineages.mage) === JSON.stringify(newLineageSave(TREES.mage)) &&
      JSON.stringify(reworked.lineages.archer) === JSON.stringify(newLineageSave(TREES.archer)),
    'сохранение: деревья мага и охотника начинаются с базового класса',
  );
  ok(
    reworked.lineages.warrior?.ranks['warrior/a1-1'] === 2,
    'сохранение: дерево воина переносом не тронуто',
  );
  ok(reworked.activeClass === 'mage', 'сохранение: удалённый класс — базовый класс своей линейки');
  ok(reworked.heroes.mage?.souls === 500, 'сохранение: души героя при сбросе дерева остаются');
  ok(reworked.treeVersion === 2, 'сохранение: отмечена версия деревьев');
  const archerActive = SaveFormat.restore(
    { v: 2, activeClass: 'archer' as LegacySave['activeClass'] },
    5,
  );
  ok(archerActive.activeClass === 'hunter', 'сохранение: прежний лучник — теперь охотник');
  ok(
    SaveFormat.restore({ v: 2, activeClass: 'mage', gold: 3 }, 5).activeClass === 'mage',
    'сохранение: старый общий кошелёк с магом переносится и после перестройки деревьев',
  );

  // недостающее — по умолчанию, вложенные группы — по полю
  const partial = SaveFormat.restore(
    { v: 2, lang: 'en', stats: { kills: 5 } as never, tutorial: { fight: true } as never },
    5,
  );
  ok(
    partial.lang === 'en' &&
      partial.stats.kills === 5 &&
      partial.stats.deaths === 0 &&
      partial.tutorial.fight &&
      !partial.tutorial.hub &&
      partial.daily.streak === 0,
    'сохранение: недостающие поля и поля групп берутся у нового игрока',
  );
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
