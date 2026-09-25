import type { ClassId } from '../../classes/interfaces/ClassId';
import type { AbilityId } from './AbilityId';
import type { AbilityParams } from './AbilityParams';
import type { GoldCost } from './GoldCost';
import type { PerkSlot } from './PerkSlot';
import type { PerkTarget } from './PerkTarget';
import type { VfxStyle } from './VfxStyle';

/** Способность с известным id: её числа (`params`) — того вида, который нужен этой способности. */
export interface PerkDefOf<A extends AbilityId> {
  id: string;
  classId: ClassId;
  slot: PerkSlot;
  ability: A;
  /** Числа способности: урон, длительности, доли (см. `AbilityParams`). */
  params: Readonly<AbilityParams[A]>;
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
  /** Цена золотом из кошеля комнаты (для «Подкупа») — вместо ресурса. */
  goldCost?: GoldCost;
  target?: PerkTarget;
  /** Один раз за комнату. */
  once?: boolean;
  /** Перезарядка в ходах после применения. */
  cooldown?: number;
  /** Как способность выглядит на поле. */
  vfx: VfxStyle;
}

/** Любая способность: объединение по `ability`, поэтому `switch (p.ability)` знает вид `p.params`. */
export type PerkDef = { [A in AbilityId]: PerkDefOf<A> }[AbilityId];
