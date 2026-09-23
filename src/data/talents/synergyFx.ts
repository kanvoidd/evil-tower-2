import type { TalentFx } from './interfaces/TalentFx';

/**
 * Синергии — таланты, которые меняют уже полученные способности (а не просто прибавляют
 * характеристику). В дереве они помечены значком молнии, чтобы их было видно среди обычных.
 */
export const SYNERGY_FX = new Set<TalentFx>([
  'abilityIgnite', 'abilityStun', 'abilitySplash', 'abilityPoison', 'abilityVuln', 'abilityCrit',
  'abilityLifesteal', 'abilityRefund', 'abilityShield', 'killBlast', 'basicSplit', 'perkCostDown', 'stepHeal',
  'boltEcho',
]);
