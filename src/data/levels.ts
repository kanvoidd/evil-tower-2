import type { CardKind } from '../types';

export interface EnemyDef {
  id: string;
  hp: number;
  atk: number;
  gold: number;
  souls: number;
  boss?: boolean;
  icon: string;
  name: { ru: string; en: string };
}

const E = (
  id: string, ru: string, en: string, hp: number, atk: number, gold: number, souls: number, boss = false,
): EnemyDef => ({ id, hp, atk, gold, souls, boss, icon: `enemy_${id}`, name: { ru, en } });

export const ENEMIES: Record<string, EnemyDef> = Object.fromEntries(
  [
    // Этаж 1 — Склеп
    E('skeleton', 'Скелет', 'Skeleton', 3, 1, 1, 4),
    E('slime', 'Слизень', 'Slime', 6, 1, 1, 4),
    E('bat', 'Летучая мышь', 'Bat', 3, 2, 1, 3),
    E('skeleton_horned', 'Рогатый скелет', 'Horned Skeleton', 12, 3, 2, 7),
    E('zombie', 'Зомби', 'Zombie', 22, 4, 3, 11),
    E('boss_skeleton_king', 'Король скелетов', 'Skeleton King', 85, 8, 40, 80, true),
    // Этаж 2 — Катакомбы
    E('goblin', 'Гоблин', 'Goblin', 38, 8, 3, 14),
    E('ghost', 'Призрак', 'Ghost', 30, 11, 4, 16),
    E('orc', 'Орк', 'Orc', 70, 10, 5, 22),
    E('wraith', 'Тень', 'Wraith', 56, 14, 6, 30),
    E('boss_ogre', 'Огр-вожак', 'Ogre Chief', 280, 20, 90, 220, true),
    // Этаж 3 — Вершина
    E('imp', 'Бес', 'Imp', 95, 20, 8, 42),
    E('dark_knight', 'Тёмный рыцарь', 'Dark Knight', 175, 24, 10, 60),
    E('golem', 'Голем', 'Golem', 300, 21, 12, 80),
    E('boss_demon', 'Владыка башни', 'Tower Lord', 800, 36, 250, 600, true),
  ].map((e) => [e.id, e]),
);

export interface RoomDef {
  /** "этаж-номер", например "2-3". */
  id: string;
  floor: number;
  index: number;
  enemies: Record<string, number>;
  gold: number;
  chests: number;
  healPotions: number;
  regenPotions: number;
  /** Множитель денежных наград на этой комнате. */
  goldScale: number;
  /** Премия за первое прохождение. */
  clearGold: number;
  clearSouls: number;
}

export const FLOORS = 3;
export const ROOMS_PER_FLOOR = 5;

const room = (
  floor: number, index: number, enemies: Record<string, number>,
  gold: number, chests: number, heal: number, regen: number, goldScale: number,
  clearGold: number, clearSouls: number,
): RoomDef => ({
  id: `${floor}-${index}`, floor, index, enemies, gold, chests,
  healPotions: heal, regenPotions: regen, goldScale, clearGold, clearSouls,
});

export const ROOMS: RoomDef[] = [
  room(1, 1, { skeleton: 4, slime: 2 }, 4, 1, 2, 0, 1, 30, 10),
  room(1, 2, { skeleton: 4, bat: 3, slime: 1 }, 4, 2, 2, 1, 1, 40, 15),
  room(1, 3, { skeleton: 3, bat: 2, skeleton_horned: 3, slime: 1 }, 5, 2, 2, 1, 1.2, 50, 20),
  room(1, 4, { skeleton: 3, skeleton_horned: 3, zombie: 2, bat: 2 }, 5, 2, 3, 1, 1.3, 60, 30),
  room(1, 5, { skeleton: 4, skeleton_horned: 2, zombie: 1, boss_skeleton_king: 1 }, 6, 3, 3, 2, 1.5, 120, 60),

  room(2, 1, { goblin: 4, skeleton_horned: 2, bat: 2 }, 6, 2, 3, 1, 2, 80, 45),
  room(2, 2, { goblin: 4, ghost: 2, zombie: 2 }, 6, 2, 3, 1, 2.2, 90, 60),
  room(2, 3, { goblin: 3, orc: 2, ghost: 3 }, 7, 3, 3, 2, 2.4, 100, 80),
  room(2, 4, { orc: 3, ghost: 2, wraith: 2, goblin: 2 }, 7, 3, 4, 2, 2.6, 120, 100),
  room(2, 5, { orc: 2, wraith: 2, goblin: 2, boss_ogre: 1 }, 8, 3, 4, 2, 3, 250, 220),

  room(3, 1, { imp: 4, wraith: 2, orc: 2 }, 8, 3, 4, 2, 4, 200, 160),
  room(3, 2, { imp: 4, dark_knight: 2, wraith: 2 }, 8, 3, 4, 2, 4.4, 240, 200),
  room(3, 3, { dark_knight: 3, imp: 3, golem: 1, wraith: 2 }, 9, 3, 4, 3, 4.8, 280, 250),
  room(3, 4, { golem: 2, dark_knight: 3, imp: 3, wraith: 2 }, 9, 4, 5, 3, 5.2, 320, 300),
  room(3, 5, { golem: 2, dark_knight: 2, imp: 2, boss_demon: 1 }, 10, 4, 5, 3, 6, 600, 600),
];

export const ROOM_BY_ID: Record<string, RoomDef> = Object.fromEntries(ROOMS.map((r) => [r.id, r]));

export const roomIndexOf = (id: string): number => ROOMS.findIndex((r) => r.id === id);

export const FLOOR_ICON_KIND: Record<number, string> = { 1: 'crypt', 2: 'catacomb', 3: 'summit' };

export const CARD_KINDS: CardKind[] = ['enemy', 'gold', 'chest', 'potion_heal', 'potion_regen', 'artifact'];
