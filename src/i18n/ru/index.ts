import { abilities } from './abilities';
import { achievements } from './achievements';
import { enemies } from './enemies';
import { items } from './items';
import { talents } from './talents';
import { ui } from './ui';

/**
 * Русский словарь — источник истины для всех текстов игры (STYLE.md). Разложен по темам:
 * интерфейс, способности, таланты, враги, вещи, достижения; английский повторяет те же ключи.
 */
export const ru = {
  ...ui,
  ...abilities,
  ...talents,
  ...enemies,
  ...items,
  ...achievements,
} as const;

export type TKey = keyof typeof ru;
