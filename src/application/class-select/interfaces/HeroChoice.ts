import type { Trait } from '../../../domain/progression/traits/traits';
import type { ClassId, LineageId } from '../../../domain/types';

/** Герой в карусели выбора. */
export interface HeroChoice {
  /** Текущий класс героя (улучшенный класс заменяет прежний), у закрытого героя — базовый. */
  classId: ClassId;
  lineage: LineageId;
  /** Герой открыт (в первом запуске — все). */
  opened: boolean;
  /** Лучший забег героя: пройдено комнат из скольких. */
  climbed: number;
  total: number;
  /** Сводка «что даёт класс». */
  traits: Trait[];
  /** Основные показатели на старте (со стартовой способностью). */
  stats: { maxHp: number; damage: number; crit: number };
  /** Что сделает главная кнопка: начать, открыть за золото, «уже в игре», выбрать. */
  action: 'start' | 'unlock' | 'current' | 'pick';
}
