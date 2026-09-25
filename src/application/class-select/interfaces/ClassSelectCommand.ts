import type { ClassId } from '../../../domain/types';

/** Что игрок сделал в выборе героя. Листание карусели — дело экрана. */
export type ClassSelectCommand =
  /** Главная кнопка под героем: начать, открыть или выбрать. */
  { type: 'choose'; classId: ClassId } | { type: 'back' };
