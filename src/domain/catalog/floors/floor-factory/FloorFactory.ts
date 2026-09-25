import { Gold, Souls } from '../../../shared';
import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import type { EnemyRole } from '../../enemies/interfaces/EnemyRole';
import type { EnemyTag } from '../../enemies/interfaces/EnemyTag';
import type { EnemyTraits } from '../../enemies/interfaces/EnemyTraits';
import type { RoomDef } from '../../levels/interfaces/RoomDef';
import type { FloorTune } from './interfaces/FloorTune';
import type { RoleScale } from './interfaces/RoleScale';
import type { RoomShape } from './interfaces/RoomShape';

/**
 * Абстрактная фабрика этажа башни (паттерн Abstract Factory).
 *
 * Этаж — семейство связанных продуктов: его враги и его комнаты (уровни). Они обязаны
 * сходиться друг с другом — комнаты этажа набирают состав из врагов этого этажа, а сила
 * врагов считается по кривой именно этого этажа, — поэтому всё семейство выпускает одна
 * конкретная фабрика (`CryptFloor`, `CatacombsFloor`, …, см. папку `floors`).
 *
 * Реестры `ENEMY_LIST` и `ROOMS` собираются из списка фабрик только через этот абстрактный
 * интерфейс: новый этаж — это новая фабрика в `FLOOR_FACTORIES`.
 *
 * Числа врагов не пишутся руками: у врага есть роль, а сила считается по кривой этажа.
 * Так баланс правится двумя-тремя константами, а не полусотней строк.
 */
export abstract class FloorFactory {
  static readonly ROOMS_PER_FLOOR = 5;

  /**
   * Множители этажа. Подобраны так, чтобы на любом этаже обычный враг умирал с 2–3 ударов,
   * а герой держал 10–14 ответных ударов: здоровье врагов растёт чуть быстрее урона героя,
   * а их атака — быстрее запаса здоровья героя, поэтому поздние этажи ощутимо опаснее ранних.
   *
   * Золото и опыт душ разведены: золото копится медленнее (под восемь ступеней экипировки),
   * души — быстрее (под дерево талантов, которое и есть долгая цель).
   */
  private static readonly FLOOR_HP = 1.66;
  private static readonly FLOOR_ATK = 1.7;
  private static readonly FLOOR_GOLD = 1.48;
  private static readonly FLOOR_SOULS = 1.7;

  /**
   * Доля награды в забеге. Каждый забег заново проходит нижние этажи и заново получает за них
   * добычу и бонус комнаты, поэтому полная ставка «одна комната — одна награда» раскручивала
   * героя за шесть-семь забегов. С этой долей прокачка идёт ступенями: забег приносит на
   * несколько комнат дальше, а не сразу на этаж.
   */
  private static readonly RUN_REWARD = 0.7;

  /** Сила обычного врага первого этажа — точка отсчёта для всей кривой. */
  private static readonly BASE = { hp: 7, atk: 3, gold: 3, souls: 4 };

  private static readonly ROLE: Record<EnemyRole, RoleScale> = {
    weak: { hp: 0.55, atk: 0.7, val: 0.6 },
    normal: { hp: 1, atk: 1, val: 1 },
    tough: { hp: 1.9, atk: 1.2, val: 1.75 },
    elite: { hp: 3.2, atk: 1.55, val: 3.4 },
    boss: { hp: 8.5, atk: 2, val: 20 },
  };

  /**
   * Поправки на концах кривой — единственные места, где она намеренно не гладкая.
   *
   * Низ: первые этажи мягче расчётных. Ход врагов бьёт сразу всеми соседями, и на голом герое
   * с двумя десятками здоровья ровная кривая превращает обучение в мясорубку.
   *
   * Верх: к девятому этажу герой получает финальный класс и восьмую ступень снаряжения —
   * скачок силы такой, что без наценки последний этаж становится прогулкой.
   */
  private static readonly FLOOR_TUNE: Record<number, FloorTune> = {
    1: { hp: 0.8, atk: 0.6 },
    2: { hp: 0.9, atk: 0.78 },
    3: { hp: 1, atk: 0.9 },
    9: { hp: 1.08, atk: 1.06 },
    10: { hp: 1.55, atk: 1.46 },
  };

  /**
   * Разброс содержимого по номеру комнаты на этаже: чем дальше, тем гуще. Комнаты короткие —
   * забег проходит их подряд, и вся башня за один заход не должна тянуться часами.
   * Зелья — редкость: в забеге здоровье переносится из комнаты в комнату, и щедрые зелья
   * превращали бы любую ошибку в бесплатную. Лечение нужно заслужить (сундук, талант, удача).
   */
  private static readonly SHAPE: RoomShape[] = [
    { count: [3, 4], gold: [2, 3], chests: [1, 1], heal: [0, 1], regen: [0, 0] },
    { count: [3, 5], gold: [2, 3], chests: [1, 1], heal: [0, 1], regen: [0, 1] },
    { count: [4, 5], gold: [2, 4], chests: [1, 2], heal: [0, 1], regen: [0, 1] },
    { count: [4, 6], gold: [3, 4], chests: [1, 2], heal: [1, 1], regen: [0, 1] },
    { count: [3, 5], gold: [3, 4], chests: [1, 2], heal: [1, 1], regen: [0, 1] },
  ];

  /** Номер этажа, с единицы. */
  abstract readonly floor: number;
  /** Оформление этажа: используется для иконок и фона. */
  abstract readonly theme: string;

  /** По четыре врага на этаж плюс босс. */
  abstract createEnemies(): EnemyDef[];

  /**
   * Комнаты этажа. Комната задаётся «рецептом» (пул врагов и разброс количества), а не
   * списком — настоящий состав набирается при каждом заходе в `rollRoom`.
   *
   * `prev` — фабрика предыдущего этажа: крепкие враги оттуда подмешиваются в пул,
   * чтобы переход между этажами не был обрывистым.
   */
  createRooms(prev: FloorFactory | null): RoomDef[] {
    const own = this.createEnemies();
    const below = prev ? prev.createEnemies() : [];
    const rooms: RoomDef[] = [];
    for (let i = 1; i <= FloorFactory.ROOMS_PER_FLOOR; i++)
      rooms.push(this.room(i, this.pool(i, own, below)));
    return rooms;
  }

  protected enemy(
    id: string,
    ru: string,
    en: string,
    role: EnemyRole,
    tag: EnemyTag,
    traits: EnemyTraits = {},
  ): EnemyDef {
    const F = FloorFactory;
    const r = F.ROLE[role];
    const tune = this.tune();
    const round = (v: number): number =>
      v >= 100 ? Math.round(v / 5) * 5 : Math.max(1, Math.round(v));
    return {
      id,
      floor: this.floor,
      role,
      tag,
      hp: round(F.BASE.hp * r.hp * this.growth(F.FLOOR_HP) * tune.hp),
      atk: round(F.BASE.atk * r.atk * this.growth(F.FLOOR_ATK) * tune.atk),
      gold: round(F.BASE.gold * r.val * this.growth(F.FLOOR_GOLD) * F.RUN_REWARD),
      souls: round(F.BASE.souls * r.val * this.growth(F.FLOOR_SOULS) * F.RUN_REWARD),
      boss: role === 'boss',
      icon: `enemy_${id}`,
      name: { ru, en },
      ...traits,
    };
  }

  /** Рост величины к этому этажу: множитель в степени (этаж − 1). */
  private growth(m: number): number {
    return Math.pow(m, this.floor - 1);
  }

  private tune(): FloorTune {
    return FloorFactory.FLOOR_TUNE[this.floor] ?? { hp: 1, atk: 1 };
  }

  /** Пул комнаты: враги своего этажа плюс крепкие с предыдущего. */
  private pool(index: number, own: EnemyDef[], below: EnemyDef[]): string[] {
    const prev = below.filter((e) => e.role === 'tough' || e.role === 'elite');
    // первые комнаты этажа мягче: элита своего этажа появляется с третьей
    const list = own.filter((e) => !e.boss && (e.role !== 'elite' || index >= 3));
    return [...list, ...prev].map((e) => e.id);
  }

  private room(index: number, pool: string[]): RoomDef {
    const F = FloorFactory;
    const s = F.SHAPE[index - 1];
    const boss = index === F.ROOMS_PER_FLOOR;
    const stepGold = 1 + 0.3 * (index - 1);
    const gold = this.growth(F.FLOOR_GOLD);
    const souls = this.growth(F.FLOOR_SOULS);
    return {
      id: `${this.floor}-${index}`,
      floor: this.floor,
      index,
      boss,
      pool,
      count: s.count,
      gold: s.gold,
      chests: s.chests,
      heal: s.heal,
      regen: s.regen,
      goldScale: Math.round(gold * stepGold * F.RUN_REWARD * 100) / 100,
      clearGold: Gold.of(Math.round(24 * stepGold * (boss ? 2.6 : 1) * gold * F.RUN_REWARD)),
      clearSouls: Souls.of(Math.round(22 * stepGold * (boss ? 3 : 1) * souls * F.RUN_REWARD)),
    };
  }
}
