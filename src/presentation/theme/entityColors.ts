/** Цвета линеек: рамки значков классов и способностей, карточка героя, карусель выбора. */
export const LINEAGE_COLOR: Record<string, string> = {
  warrior: '#e67e22',
  mage: '#5b8def',
  archer: '#3fae55',
  mercenary: '#9b59b6',
};

/**
 * Цвета характеристик. Оттенки разнесены по кругу (красный, янтарный, зелёный, голубой, синий, фиолетовый),
 * чтобы значки урона и здоровья, а также соседние ветки дерева не сливались.
 */
export const STAT_COLOR: Record<string, string> = {
  damage: '#f0483a',
  crit: '#ffb31a',
  health: '#3fdb84',
  dodge: '#22c9e6',
  defense: '#3f8cf4',
  parry: '#a07cf6',
  luck: '#f472b6',
};

/** Цвета путей дерева талантов: урон / жизнь / защита. */
export const PATH_COLOR: Record<string, string> = {
  attack: STAT_COLOR.damage,
  vitality: STAT_COLOR.health,
  guard: STAT_COLOR.defense,
};

/** Цвета значков состояний на карточках врагов. */
export const STATUS_TINT: Record<string, number> = {
  stun: 0xffd86b,
  burn: 0xff7a2a,
  poison: 0x9fd12a,
  mark: 0xb287ff,
  vuln: 0xff4d6d,
  weak: 0x7fc4ff,
  brittle: 0xb8d8ff,
  bleed: 0xe0314a,
  infect: 0x8fd14f,
  servant: 0xa9e8ff,
};

/** Цвет пути дерева числом для Phaser. */
export const pathHex = (path: string): number =>
  parseInt((PATH_COLOR[path] ?? '#888888').slice(1), 16);

/** Цвет характеристики числом для Phaser. */
export const statHex = (stat: string): number => {
  const h = STAT_COLOR[stat];
  return h ? parseInt(h.slice(1), 16) : 0x888888;
};
