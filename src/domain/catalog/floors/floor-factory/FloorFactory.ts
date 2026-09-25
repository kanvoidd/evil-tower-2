import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import type { EnemyRole } from '../../enemies/interfaces/EnemyRole';
import type { EnemyTag } from '../../enemies/interfaces/EnemyTag';
import type { EnemyTraits } from '../../enemies/interfaces/EnemyTraits';
import type { RoomDef } from '../../levels/interfaces/RoomDef';
import { FLOOR_SCALING } from '../scaling/floorScaling';
import type { IFloorScaling } from '../scaling/interfaces/IFloorScaling';
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
 * Числа врагов не пишутся руками: у врага есть роль, а сила и добыча по роли и этажу, как и
 * награды комнат, — у масштабирования башни (`IFloorScaling`, кривая `FloorCurveScaling`).
 */
export abstract class FloorFactory {
  static readonly ROOMS_PER_FLOOR = 5;

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

  /** Рост силы и наград от этажа к этажу. */
  protected readonly scaling: IFloorScaling = FLOOR_SCALING;

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

  protected enemy(id: string, role: EnemyRole, tag: EnemyTag, traits: EnemyTraits = {}): EnemyDef {
    const n = this.scaling.enemy(this.floor, role);
    return {
      id,
      floor: this.floor,
      role,
      tag,
      hp: n.hp,
      atk: n.atk,
      gold: n.gold,
      souls: n.souls,
      boss: role === 'boss',
      icon: `enemy_${id}`,
      ...traits,
    };
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
      ...this.scaling.room(this.floor, index, boss),
    };
  }
}
