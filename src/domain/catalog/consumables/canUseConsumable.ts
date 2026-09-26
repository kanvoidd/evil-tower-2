import { LINEAGE_ORDER, LINEAGES } from '../heroes/heroRegistry';
import type { LineageDef } from '../heroes/interfaces/LineageDef';
import { CONSUMABLES } from './consumableRegistry';
import type { ConsumableId } from './interfaces/ConsumableId';

/**
 * Может ли герой линейки применять расходник: расходник чужой линейки — нет, артефакт — только
 * у линейки, которой артефакты сейчас доступны (`LineageDef.artifacts`).
 */
export const canUseConsumable = (id: ConsumableId, lineage: LineageDef): boolean => {
  const own = CONSUMABLES[id].lineage;
  if (own && own !== lineage.id) return false;
  return id !== 'artifact' || lineage.artifacts;
};

/** Есть ли расходник в игре сейчас: артефакты — пока хоть одной линейке они доступны. */
export const consumableInGame = (id: ConsumableId): boolean =>
  id !== 'artifact' || LINEAGE_ORDER.some((l) => LINEAGES[l].artifacts);
