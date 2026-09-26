/**
 * Синергии — таланты, которые меняют уже полученные способности, а не просто прибавляют
 * характеристику («Эхо заклинания» бьёт соседей цели любой способностью). В дереве они
 * помечены значком молнии.
 */
export type TalentSynergyFx =
  | 'abilityStun'
  | 'abilitySplash'
  | 'abilityPoison'
  | 'abilityVuln'
  | 'abilityCrit'
  | 'abilityLifesteal'
  | 'abilityRefund'
  | 'abilityShield'
  | 'perkCostDown'
  | 'stepHeal';
