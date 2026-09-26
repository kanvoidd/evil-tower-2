import type { AbilityDef } from '../../abilities/interfaces/AbilityDef';
import type { TalentDef } from '../../talents/interfaces/TalentDef';

/** Шаг ветки: перк (способность, уровни — у неё самой) или талант, который его развивает. */
export type BranchStep = { readonly perk: AbilityDef } | { readonly talent: TalentDef };
