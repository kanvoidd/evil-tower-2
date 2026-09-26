/** Версии деревьев прокачки (`SaveData.treeVersion`): каждая — шаг переноса старых рангов. */
export const TREE_VERSION = {
  /** Профессиональное развитие мага и охотника: их деревья построены заново. */
  profession: 2,
  /** Мастер зверей: «Сокол» стал первым перком ветки, «Стадо кабанов» — вторым. */
  falconFirst: 3,
} as const;

/** Версия деревьев нового сохранения — последняя. */
export const CURRENT_TREE_VERSION = TREE_VERSION.falconFirst;
