import type { ClassId } from '../../../domain/types';

/** Подтверждения в дереве навыков. true — игрок согласился. */
export interface ISkillTreeDialogs {
  confirmMetamorphosis(from: ClassId, to: ClassId): Promise<boolean>;
  /** Отказ от класса `from` в пользу `to`; вернётся `refundPct` % потраченных душ. */
  confirmCancel(from: ClassId, to: ClassId, refundPct: number): Promise<boolean>;
}
