import type { ParamKey } from './interfaces/ParamKey';
import type { ParamUnit } from './interfaces/ParamUnit';

/**
 * Единица каждого числа способностей — та же, что у его типа в `AbilityParams`. Типы значений
 * стираются при сборке, а описанию способности нужно знать, показать ли 0,6 как «60%».
 */
export const PARAM_UNITS: Readonly<Record<ParamKey, ParamUnit>> = {
  arrows: 'count',
  blast: 'ratio',
  blastMul: 'ratio',
  bossHpShare: 'ratio',
  bossPoison: 'ratio',
  burn: 'ratio',
  cap: 'ratio',
  dmg: 'ratio',
  extraStrikes: 'count',
  falloff: 'ratio',
  holyDmg: 'ratio',
  hpCost: 'ratio',
  hpLeft: 'count',
  hpPerResource: 'count',
  hpShare: 'ratio',
  kills: 'count',
  limit: 'ratio',
  maxGhosts: 'count',
  perKill: 'ratio',
  poison: 'ratio',
  resource: 'count',
  share: 'ratio',
  shockMul: 'count',
  soulBonus: 'ratio',
  splash: 'ratio',
  splashMul: 'ratio',
  stepLoss: 'ratio',
  stun: 'turns',
  targets: 'count',
  turns: 'turns',
  vuln: 'ratio',
  wallMul: 'count',
  waves: 'count',
  weaken: 'ratio',
};
