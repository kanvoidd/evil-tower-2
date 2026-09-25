import { Gold, Souls } from '../../../../shared';
import type { EnemyRole } from '../../../enemies/interfaces/EnemyRole';
import type { EnemyNumbers } from '../interfaces/EnemyNumbers';
import type { FloorTune } from '../interfaces/FloorTune';
import type { IFloorScaling } from '../interfaces/IFloorScaling';
import type { RoleScale } from '../interfaces/RoleScale';
import type { RoomRewards } from '../interfaces/RoomRewards';

/**
 * Кривая этажа: каждая величина растёт от этажа к этажу в одно и то же число раз (множитель
 * в степени «этаж − 1»), с ручными поправками на концах башни. Так баланс правится двумя-тремя
 * константами, а не полусотней строк.
 */
export class FloorCurveScaling implements IFloorScaling {
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
   * Бонус за прохождение комнаты первого этажа до доли забега; каждая следующая комната этажа
   * платит больше на `ROOM_STEP` от него, комната босса — в `BOSS_BONUS` раз.
   */
  private static readonly CLEAR = { gold: 24, souls: 22 };
  private static readonly ROOM_STEP = 0.3;
  private static readonly BOSS_BONUS = { gold: 2.6, souls: 3 };

  /** Числа от сотни округляются до пяти — так их легче читать в карточке. */
  private static readonly ROUND_STEP = 5;
  private static readonly ROUND_FROM = 100;

  enemy(floor: number, role: EnemyRole): EnemyNumbers {
    const F = FloorCurveScaling;
    const r = F.ROLE[role];
    const tune = F.FLOOR_TUNE[floor] ?? { hp: 1, atk: 1 };
    const round = (v: number): number =>
      v >= F.ROUND_FROM ? Math.round(v / F.ROUND_STEP) * F.ROUND_STEP : Math.max(1, Math.round(v));
    return {
      hp: round(F.BASE.hp * r.hp * F.growth(F.FLOOR_HP, floor) * tune.hp),
      atk: round(F.BASE.atk * r.atk * F.growth(F.FLOOR_ATK, floor) * tune.atk),
      gold: round(F.BASE.gold * r.val * F.growth(F.FLOOR_GOLD, floor) * F.RUN_REWARD),
      souls: round(F.BASE.souls * r.val * F.growth(F.FLOOR_SOULS, floor) * F.RUN_REWARD),
    };
  }

  room(floor: number, index: number, boss: boolean): RoomRewards {
    const F = FloorCurveScaling;
    const step = 1 + F.ROOM_STEP * (index - 1);
    const gold = F.growth(F.FLOOR_GOLD, floor);
    const souls = F.growth(F.FLOOR_SOULS, floor);
    const goldBoss = boss ? F.BOSS_BONUS.gold : 1;
    const soulsBoss = boss ? F.BOSS_BONUS.souls : 1;
    return {
      goldScale: Math.round(gold * step * F.RUN_REWARD * 100) / 100,
      clearGold: Gold.of(Math.round(F.CLEAR.gold * step * goldBoss * gold * F.RUN_REWARD)),
      clearSouls: Souls.of(Math.round(F.CLEAR.souls * step * soulsBoss * souls * F.RUN_REWARD)),
    };
  }

  /** Рост величины к этажу: множитель в степени (этаж − 1). */
  private static growth(m: number, floor: number): number {
    return Math.pow(m, floor - 1);
  }
}
