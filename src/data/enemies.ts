import type { EnemyTag } from '../types';

/**
 * Враги башни. Числа не пишутся руками: у каждого врага есть этаж и роль, а сила считается
 * по кривой этажа. Так баланс правится двумя-тремя константами, а не полусотней строк.
 *
 * Роль:
 *  - `weak`   — пушечное мясо, гибнет с одного удара;
 *  - `normal` — обычный враг этажа;
 *  - `tough`  — крепкий, держит 2–3 удара;
 *  - `elite`  — редкий и опасный, даёт много добычи;
 *  - `boss`   — один на этаж, финал комнаты 5.
 */
export type EnemyRole = 'weak' | 'normal' | 'tough' | 'elite' | 'boss';

/**
 * Множители этажа. Подобраны так, чтобы на любом этаже обычный враг умирал с 2–3 ударов,
 * а герой держал 10–14 ответных ударов: здоровье врагов растёт чуть быстрее урона героя,
 * а их атака — быстрее запаса здоровья героя, поэтому поздние этажи ощутимо опаснее ранних.
 *
 * Золото и опыт душ разведены: золото копится медленнее (под восемь ступеней экипировки),
 * души — быстрее (под дерево талантов, которое и есть долгая цель).
 */
export const FLOOR_HP = 1.66;
export const FLOOR_ATK = 1.70;
export const FLOOR_GOLD = 1.48;
export const FLOOR_SOULS = 1.7;

/** Сила обычного врага первого этажа — точка отсчёта для всей кривой. */
const BASE = { hp: 7, atk: 3, gold: 3, souls: 4 };

const ROLE: Record<EnemyRole, { hp: number; atk: number; val: number }> = {
  weak: { hp: 0.55, atk: 0.7, val: 0.6 },
  normal: { hp: 1, atk: 1, val: 1 },
  tough: { hp: 1.9, atk: 1.2, val: 1.75 },
  elite: { hp: 3.2, atk: 1.55, val: 3.4 },
  boss: { hp: 8.5, atk: 2, val: 20 },
};

export interface EnemyTraits {
  /** Плоское снижение получаемого урона (пробивается талантом «пробивание»). */
  armor?: number;
  /** Лечится в конце каждого хода (доля максимального здоровья). */
  regen?: number;
  /** Возвращает эту долю полученного урона герою. */
  thorns?: number;
  /** Шанс, %, увернуться от вашего удара. */
  evade?: number;
  /** Каждое попадание по нему поднимает его атаку на эту долю базовой. */
  enrage?: number;
  /** Бьёт магией: против него работает сопротивление магии. */
  magic?: boolean;
  /** Бьёт ядом/огнём: урон догоняет вас в начале хода. */
  venom?: number;
}

export interface EnemyDef extends EnemyTraits {
  id: string;
  floor: number;
  role: EnemyRole;
  tag: EnemyTag;
  hp: number;
  atk: number;
  gold: number;
  souls: number;
  boss: boolean;
  icon: string;
  name: { ru: string; en: string };
}

const pw = (m: number, floor: number): number => Math.pow(m, floor - 1);

/**
 * Надбавка вершины башни. К девятому этажу герой получает финальный класс и восьмую ступень
 * снаряжения — скачок силы такой, что ровная кривая превращает последний этаж в прогулку.
 * Поэтому два верхних этажа получают собственную наценку: это единственное место, где кривая
 * не гладкая, и оно намеренное.
 */
const PEAK: Record<number, { hp: number; atk: number }> = {
  9: { hp: 1.08, atk: 1.06 },
  10: { hp: 1.55, atk: 1.46 },
};
const peak = (floor: number): { hp: number; atk: number } => PEAK[floor] ?? { hp: 1, atk: 1 };

const E = (
  id: string, ru: string, en: string, floor: number, role: EnemyRole, tag: EnemyTag, traits: EnemyTraits = {},
): EnemyDef => {
  const r = ROLE[role];
  const round = (v: number): number => (v >= 100 ? Math.round(v / 5) * 5 : Math.max(1, Math.round(v)));
  return {
    id, floor, role, tag,
    hp: round(BASE.hp * r.hp * pw(FLOOR_HP, floor) * peak(floor).hp),
    atk: round(BASE.atk * r.atk * pw(FLOOR_ATK, floor) * peak(floor).atk),
    gold: round(BASE.gold * r.val * pw(FLOOR_GOLD, floor)),
    souls: round(BASE.souls * r.val * pw(FLOOR_SOULS, floor)),
    boss: role === 'boss',
    icon: `enemy_${id}`,
    name: { ru, en },
    ...traits,
  };
};

/**
 * По четыре врага на этаж плюс босс. Пул комнаты собирается из врагов своего этажа и пары
 * крепких с предыдущего — так на новом этаже сразу видно, что стало опаснее.
 */
export const ENEMY_LIST: EnemyDef[] = [
  // ---- 1. Склеп
  E('skeleton', 'Скелет', 'Skeleton', 1, 'weak', 'undead'),
  E('bat', 'Летучая мышь', 'Bat', 1, 'weak', 'beast', { evade: 15 }),
  E('slime', 'Слизень', 'Slime', 1, 'normal', 'beast'),
  E('skeleton_horned', 'Рогатый скелет', 'Horned Skeleton', 1, 'tough', 'undead'),
  E('zombie', 'Зомби', 'Zombie', 1, 'elite', 'undead', { regen: 0.08 }),
  E('boss_skeleton_king', 'Король скелетов', 'Skeleton King', 1, 'boss', 'undead', { armor: 1 }),

  // ---- 2. Катакомбы
  E('rat_swarm', 'Крысиный рой', 'Rat Swarm', 2, 'weak', 'beast'),
  E('goblin', 'Гоблин', 'Goblin', 2, 'normal', 'humanoid'),
  E('ghost', 'Призрак', 'Ghost', 2, 'normal', 'undead', { evade: 20, magic: true }),
  E('orc', 'Орк', 'Orc', 2, 'tough', 'humanoid', { enrage: 0.12 }),
  E('wraith', 'Тень', 'Wraith', 2, 'elite', 'undead', { magic: true, evade: 10 }),
  E('boss_ogre', 'Огр-вожак', 'Ogre Chief', 2, 'boss', 'humanoid', { enrage: 0.08 }),

  // ---- 3. Затопленные ярусы
  E('mudcrab', 'Грязевой краб', 'Mudcrab', 3, 'weak', 'beast', { armor: 2 }),
  E('drowned', 'Утопленник', 'Drowned', 3, 'normal', 'undead'),
  E('deep_hound', 'Глубинный пёс', 'Deep Hound', 3, 'normal', 'beast', { evade: 12 }),
  E('tide_wraith', 'Дух прилива', 'Tide Wraith', 3, 'tough', 'undead', { magic: true }),
  E('kraken_spawn', 'Отродье кракена', 'Kraken Spawn', 3, 'elite', 'beast', { thorns: 0.2 }),
  E('boss_leviathan', 'Левиафан', 'Leviathan', 3, 'boss', 'beast', { regen: 0.04 }),

  // ---- 4. Оружейная
  E('armored_husk', 'Пустой доспех', 'Hollow Armour', 4, 'weak', 'construct', { armor: 3 }),
  E('blade_dancer', 'Танцор клинков', 'Blade Dancer', 4, 'normal', 'humanoid', { evade: 18 }),
  E('crossbowman', 'Арбалетчик', 'Crossbowman', 4, 'normal', 'humanoid'),
  E('iron_sentinel', 'Железный страж', 'Iron Sentinel', 4, 'tough', 'construct', { armor: 5, thorns: 0.15 }),
  E('warden', 'Надзиратель', 'Warden', 4, 'elite', 'humanoid', { enrage: 0.15 }),
  E('boss_forge_master', 'Мастер оружейной', 'Forge Master', 4, 'boss', 'humanoid', { armor: 4 }),

  // ---- 5. Ведьмин сад
  E('thornling', 'Колючка', 'Thornling', 5, 'weak', 'beast', { thorns: 0.25 }),
  E('spider', 'Паук', 'Spider', 5, 'normal', 'beast', { venom: 0.2 }),
  E('wasp_queen', 'Оса-матка', 'Wasp Queen', 5, 'normal', 'beast', { evade: 22 }),
  E('vine_horror', 'Лозовый ужас', 'Vine Horror', 5, 'tough', 'beast', { regen: 0.1 }),
  E('dryad', 'Дриада', 'Dryad', 5, 'elite', 'beast', { magic: true, regen: 0.06 }),
  E('boss_witch', 'Ведьма сада', 'Garden Witch', 5, 'boss', 'humanoid', { magic: true, venom: 0.15 }),

  // ---- 6. Алхимическая лаборатория
  E('homunculus', 'Гомункул', 'Homunculus', 6, 'weak', 'construct'),
  E('acid_slime', 'Кислотный слизень', 'Acid Slime', 6, 'normal', 'beast', { venom: 0.25 }),
  E('flask_golem', 'Колбяной голем', 'Flask Golem', 6, 'normal', 'construct', { armor: 6 }),
  E('mutant', 'Мутант', 'Mutant', 6, 'tough', 'beast', { enrage: 0.18 }),
  E('plague_doctor', 'Чумной доктор', 'Plague Doctor', 6, 'elite', 'humanoid', { magic: true, venom: 0.3 }),
  E('boss_alchemist', 'Алхимик башни', 'Tower Alchemist', 6, 'boss', 'humanoid', { magic: true, regen: 0.05 }),

  // ---- 7. Ледяные залы
  E('frost_wolf', 'Морозный волк', 'Frost Wolf', 7, 'weak', 'beast', { evade: 16 }),
  E('ice_wraith', 'Ледяной дух', 'Ice Wraith', 7, 'normal', 'undead', { magic: true, evade: 15 }),
  E('snow_troll', 'Снежный тролль', 'Snow Troll', 7, 'tough', 'beast', { regen: 0.12 }),
  E('frozen_knight', 'Скованный льдом рыцарь', 'Frozen Knight', 7, 'tough', 'undead', { armor: 9 }),
  E('yeti', 'Йети', 'Yeti', 7, 'elite', 'beast', { enrage: 0.2 }),
  E('boss_ice_queen', 'Ледяная королева', 'Ice Queen', 7, 'boss', 'humanoid', { magic: true, armor: 6 }),

  // ---- 8. Кузня демонов
  E('imp', 'Бес', 'Imp', 8, 'weak', 'demon', { evade: 14 }),
  E('hellhound', 'Адская гончая', 'Hellhound', 8, 'normal', 'demon', { venom: 0.25 }),
  E('magma_golem', 'Магмовый голем', 'Magma Golem', 8, 'tough', 'construct', { armor: 12, thorns: 0.25 }),
  E('demon_smith', 'Демон-кузнец', 'Demon Smith', 8, 'tough', 'demon', { enrage: 0.15 }),
  E('brimstone_brute', 'Серный громила', 'Brimstone Brute', 8, 'elite', 'demon', { venom: 0.2, armor: 8 }),
  E('boss_forge_demon', 'Владыка кузни', 'Lord of the Forge', 8, 'boss', 'demon', { thorns: 0.2, armor: 10 }),

  // ---- 9. Библиотека проклятых
  E('cursed_tome', 'Проклятый том', 'Cursed Tome', 9, 'weak', 'construct', { magic: true }),
  E('shadow', 'Тень чтеца', 'Reader’s Shadow', 9, 'normal', 'undead', { evade: 25 }),
  E('gargoyle', 'Горгулья', 'Gargoyle', 9, 'tough', 'construct', { armor: 16 }),
  E('lich_scribe', 'Лич-переписчик', 'Lich Scribe', 9, 'tough', 'undead', { magic: true, regen: 0.08 }),
  E('archivist', 'Архивариус', 'Archivist', 9, 'elite', 'undead', { magic: true, armor: 10 }),
  E('boss_lich', 'Лич-хранитель', 'Keeper Lich', 9, 'boss', 'undead', { magic: true, regen: 0.06 }),

  // ---- 10. Вершина башни
  E('tower_guard', 'Страж башни', 'Tower Guard', 10, 'weak', 'humanoid', { armor: 12 }),
  E('soul_eater', 'Пожиратель душ', 'Soul Eater', 10, 'normal', 'demon', { venom: 0.3 }),
  E('golem', 'Голем', 'Golem', 10, 'tough', 'construct', { armor: 24, thorns: 0.2 }),
  E('dark_knight', 'Тёмный рыцарь', 'Dark Knight', 10, 'tough', 'humanoid', { enrage: 0.2 }),
  E('void_herald', 'Вестник пустоты', 'Void Herald', 10, 'elite', 'demon', { magic: true, evade: 15 }),
  E('boss_demon', 'Владыка башни', 'Tower Lord', 10, 'boss', 'demon', { magic: true, armor: 18, enrage: 0.1 }),
];

export const ENEMIES: Record<string, EnemyDef> = Object.fromEntries(ENEMY_LIST.map((e) => [e.id, e]));

export const enemiesOfFloor = (floor: number, role?: EnemyRole): EnemyDef[] =>
  ENEMY_LIST.filter((e) => e.floor === floor && (!role || e.role === role));

export const bossOfFloor = (floor: number): EnemyDef => enemiesOfFloor(floor, 'boss')[0];

/** Нежить и демоны: по ним бьют «Святая кара», «Луч правосудия» и «Гнев небес». */
export const isHolyTarget = (tag: EnemyTag): boolean => tag === 'undead' || tag === 'demon';
