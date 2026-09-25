import type { TalentTier } from './TalentTier';

/**
 * Дерево талантов класса: три яруса, между ними — способности класса (`ClassDef.perks`).
 * Лежит в `heroes/<линейка>/talents/<класс>.ts`, класс ссылается на него (`ClassDef.talents`).
 */
export type TalentTree = readonly [TalentTier, TalentTier, TalentTier];
