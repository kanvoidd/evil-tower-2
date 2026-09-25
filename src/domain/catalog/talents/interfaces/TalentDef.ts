import type { TalentEffect } from './TalentEffect';
import type { TalentId } from './TalentId';

/**
 * Талант — что он даёт, без места в дереве: переставленный талант уносит эффект и название.
 * Записывается помощником `talent(id, эффект)` в дереве своего класса (`talents/<класс>.ts`).
 */
export interface TalentDef {
  readonly id: TalentId;
  readonly effect: TalentEffect;
}
