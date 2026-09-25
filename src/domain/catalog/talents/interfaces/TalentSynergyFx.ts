/**
 * Синергии — таланты, которые меняют уже полученные способности, а не просто прибавляют
 * характеристику («Живое пламя» заставляет любую способность поджигать цель). В дереве они
 * помечены значком молнии.
 */
export type TalentSynergyFx =
  | 'abilityIgnite'
  | 'abilityStun'
  | 'abilitySplash'
  | 'abilityPoison'
  | 'abilityVuln'
  | 'abilityCrit'
  | 'abilityLifesteal'
  | 'abilityRefund'
  | 'abilityShield'
  | 'killBlast'
  | 'perkCostDown'
  | 'stepHeal';
