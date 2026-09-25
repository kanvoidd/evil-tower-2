import type { ClassId } from '../../../domain/types';

/** Выбор героя на экране — отклик на решения игрока. */
export interface IClassSelectView {
  /** Стартовый герой выбран — впереди первый забег. */
  started(): void;
  /** Герой открыт за золото. */
  unlocked(classId: ClassId): void;
  noGold(): void;
  /** Герой сменён. */
  switched(): void;
}
