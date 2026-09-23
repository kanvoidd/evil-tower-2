import type { ClassId } from '../../../types';
import type { AbilityId } from './AbilityId';
import type { PerkSlot } from './PerkSlot';
import type { PerkTarget } from './PerkTarget';
import type { VfxStyle } from './VfxStyle';

export interface PerkDef {
  id: string;
  classId: ClassId;
  slot: PerkSlot;
  ability: AbilityId;
  /** Ключ текстуры иконки (perk_<id>); если файла нет — рисуется заглушка. */
  icon: string;
  name: { ru: string; en: string };
  desc: { ru: string; en: string };
  /** Пассивный перк (🔁): кнопки нет, работает сам. */
  passive?: boolean;
  /** Базовое действие линейки: кнопки нет, применяется нажатием по карте; переходит ко всем эволюциям. */
  basic?: boolean;
  /** Цена в ресурсе класса. FULL_BAR — вся шкала. */
  cost?: number;
  /** Доля золота из кошеля комнаты (для «Подкупа»). */
  goldCost?: number;
  target?: PerkTarget;
  /** Один раз за комнату. */
  once?: boolean;
  /** Перезарядка в ходах после применения. */
  cooldown?: number;
  /** Как способность выглядит на поле. */
  vfx: VfxStyle;
}
