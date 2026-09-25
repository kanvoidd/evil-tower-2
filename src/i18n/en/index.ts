import type { TKey } from '../ru';
import { abilities } from './abilities';
import { achievements } from './achievements';
import { enemies } from './enemies';
import { items } from './items';
import { talents } from './talents';
import { ui } from './ui';

/** Английский словарь: те же ключи, что у русского (тип требует каждый). */
export const en: Record<TKey, string> = {
  ...ui,
  ...abilities,
  ...talents,
  ...enemies,
  ...items,
  ...achievements,
};
