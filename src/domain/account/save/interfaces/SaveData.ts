import type { ClassId, EquipmentSave, LineageId } from '../../../catalog';
import type { LineageSave } from '../../../progression';
import type { PlayerCounters } from '../../../rewards';
import type { Lang } from '../../../shared';
import type { AutoSave } from './AutoSave';
import type { HeroSave } from './HeroSave';

export interface SaveData {
  v: number;
  savedAt: number;
  createdAt: number;
  lang: Lang;
  volume: number;
  muted: boolean;
  /** null — игрок ещё не выбирал класс (первый запуск). */
  activeClass: ClassId | null;
  /** Открытые базовые линейки (для каждой хранится и то, что куплено в дереве). */
  lineages: Partial<Record<LineageId, LineageSave>>;
  weapon: Partial<Record<LineageId, EquipmentSave | null>>;
  /**
   * Всё, что у героя своё: кошелёк, расходники, доспех и рекорд забега. Новый класс
   * начинает с нулями — как будто играешь сначала.
   */
  heroes: Partial<Record<LineageId, HeroSave>>;
  stats: PlayerCounters;
  achievements: string[];
  daily: { lastClaim: string; streak: number };
  gift: { readyAt: number };
  tutorial: { fight: boolean; hub: boolean; skill: boolean; shop: boolean; perk: boolean };
  ads: { lastInterstitial: number; runsSinceAd: number };
  auto: AutoSave;
  reviewAsked: boolean;
}
