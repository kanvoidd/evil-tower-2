import type { ConsumableId } from '../../../domain/types';
import type { Point } from '../../animations/interfaces/Point';

/**
 * Что проигрыватель событий боя просит у панелей вокруг поля. HUD только показывает —
 * менять бой он не может.
 */
export interface IBattleHud {
  /** Ресурс, характеристики, прочность, счётчик врагов, расходники — перечитать из боя. */
  refresh(): void;
  /** Кнопки способностей: заряд, цена, перезарядка. */
  refreshAbilities(): void;
  /** Добыча комнаты в кошеле: +золото и +души (отрицательное золото — трата). */
  addLoot(gold: number, souls: number): void;
  /** Куда летят монеты и души. */
  lootAnchor(kind: 'gold' | 'souls'): Point;
  /** Куда летит подобранный расходник. */
  slotAnchor(item: ConsumableId): Point | null;
  /** Слот расходника «подпрыгивает», когда в него прилетает находка. */
  bumpSlot(item: ConsumableId): void;
  /** Строка над полосой ресурса: названия способностей, «Растерзание», «Откат». */
  note(text: string, color: string, size: number): void;
}
