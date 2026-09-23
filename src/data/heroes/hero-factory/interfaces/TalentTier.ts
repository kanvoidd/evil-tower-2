import type { TalentSeed } from './TalentSeed';

/** Ярус: по цепочке на каждый путь. Последний талант цепочки — самый сильный. */
export interface TalentTier {
  a: TalentSeed[];
  v: TalentSeed[];
  g: TalentSeed[];
}
