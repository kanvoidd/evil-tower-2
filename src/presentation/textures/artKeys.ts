import type { AbilityId } from '../../domain/catalog';
import {
  CLASS_ORDER,
  CONSUMABLE_SLOTS,
  CONSUMABLES,
  ENEMIES,
  ITEMS,
  PERKS,
} from '../../domain/catalog';

/**
 * Ключи текстур — единственное, что остальной код знает о графике. Картинка из `src/assets/images`
 * с именем ключа (`hero_warrior.png`) подменяет процедурную заглушку (`queueExternalArt`);
 * здесь — какие ключи бывают.
 */
export const ART_KEY_FAMILIES: ReadonlyArray<{ key: string; what: string }> = [
  { key: 'hero_<класс>', what: 'портрет героя на поле и в карусели' },
  { key: 'cls_<класс>', what: 'значок класса: герой на круге цвета линейки' },
  { key: 'enemy_<враг>', what: 'враг на поле' },
  { key: 'item_w_<линейка>_<ступень>, item_a_<ступень>', what: 'оружие и броня в лавке' },
  { key: 'item_potion_heal, item_potion_regen, item_artifact', what: 'расходники' },
  { key: 'ability_<способность>', what: 'значок способности (по её id)' },
  { key: 'ico_gold, ico_soul, ico_pouch', what: 'валюты и кошель' },
  { key: 'spr_chest, spr_exit, spr_gold', what: 'сундук, переход и кучка золота на поле' },
  { key: 'orb_<характеристика>, tal_<путь>, tal_max, evo_gate', what: 'значки дерева прокачки' },
  { key: 'card_<вид>', what: 'рамки карточек поля' },
  { key: 'svg_<имя>, svgw_<имя>', what: 'векторные значки интерфейса: тёмные и светлые' },
  { key: 'bg_stone, ring, glow, px, dot, flame, arrow_vfx', what: 'фон и частицы эффектов' },
];

/** Ключ значка способности — по её id: способность, перенесённая в другой класс, уносит значок. */
export const abilityIcon = (id: AbilityId): string => `ability_${id}`;

/** Ключи картинок содержимого игры — всё, что художник может заменить файлом. */
export const contentArtKeys = (): string[] => [
  ...CLASS_ORDER.flatMap((id) => [`hero_${id}`, `cls_${id}`]),
  ...Object.keys(ENEMIES).map((id) => `enemy_${id}`),
  ...ITEMS.map((it) => it.icon),
  ...CONSUMABLE_SLOTS.map((id) => CONSUMABLES[id].icon),
  ...PERKS.map((p) => abilityIcon(p.ability.id)),
  'ico_gold',
  'ico_soul',
  'ico_pouch',
  'spr_chest',
  'spr_exit',
  'spr_gold',
];
