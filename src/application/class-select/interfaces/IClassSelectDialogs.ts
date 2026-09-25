import type { ClassId } from '../../../domain/types';

/** Подтверждение смены героя. true — игрок согласился. */
export interface IClassSelectDialogs {
  confirmSwitch(classId: ClassId): Promise<boolean>;
}
