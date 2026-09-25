import type { TalentDef } from './interfaces/TalentDef';
import type { TalentEffect } from './interfaces/TalentEffect';
import type { TalentId } from './interfaces/TalentId';

/** Талант для дерева класса: id по смыслу и эффект (`bonus`, `synergy`, `chanceAndPower`). */
export const talent = (id: TalentId, effect: TalentEffect): TalentDef => ({ id, effect });
