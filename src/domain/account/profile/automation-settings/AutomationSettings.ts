import type { AutoUseSave } from '../../../combat';
import { ProfilePart } from '../profile-part/ProfilePart';

/** Автоматизация: автоприменение расходников в бою. */
export class AutomationSettings extends ProfilePart {
  get autoUse(): AutoUseSave {
    return this.doc.auto.use;
  }

  setAutoUse(patch: Partial<AutoUseSave>): void {
    this.doc.auto.use = { ...this.doc.auto.use, ...patch };
    this.state.touch();
  }
}
