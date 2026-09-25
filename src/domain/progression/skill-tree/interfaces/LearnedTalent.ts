import type { TalentPlace } from '../../../catalog';

/** Изученный талант: его место в дереве и купленный ранг (больше нуля). */
export interface LearnedTalent {
  readonly place: TalentPlace;
  readonly rank: number;
}
