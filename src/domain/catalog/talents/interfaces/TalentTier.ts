import type { TalentDef } from './TalentDef';
import type { TalentPath } from './TalentPath';

/**
 * Ярус дерева класса: по цепочке на каждый путь, сверху вниз. Цепочки РАЗНОЙ длины (где-то один
 * талант, где-то три); последний талант цепочки — самый сильный.
 */
export type TalentTier = Readonly<Record<TalentPath, readonly TalentDef[]>>;
