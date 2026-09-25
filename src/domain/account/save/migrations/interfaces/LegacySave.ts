import type { EquipmentSave, LineageId } from '../../../../catalog';
import type { AutoUseSave } from '../../../../combat';
import type { HeroSave } from '../../interfaces/HeroSave';
import type { SaveData } from '../../interfaces/SaveData';

/**
 * Документ сохранения, каким он мог прийти из прошлых версий игры: любых полей может не быть,
 * а старые поля ещё лежат рядом с новыми.
 */
export type LegacySave = Partial<Omit<SaveData, 'auto'>> & {
  /** Автоматизация: раньше у автоприменения был общий переключатель `on`. */
  auto?: { use?: Partial<AutoUseSave> & { on?: boolean }; skill?: SaveData['auto']['skill'] };
  /** Кошелёк, расходники и доспех были общими на профиль. */
  gold?: number;
  souls?: number;
  consumables?: Partial<HeroSave['consumables']>;
  armor?: EquipmentSave | null;
  /** Пройденные комнаты: списком (одна линейка) или по линейкам. */
  cleared?: string[] | Partial<Record<LineageId, string[]>>;
};
