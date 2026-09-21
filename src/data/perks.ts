import type { ClassId, StatKey } from '../types';

/**
 * Реестр перков. Каждый перк — одна запись: чтобы «прикрутить» иконку, название, описание
 * или эффект, достаточно поправить эту запись (иконка — файл perk_<id>.png в src/assets/images,
 * тексты — ключи perk.<id>.name / perk.<id>.desc в i18n, либо поля name/desc ниже).
 */
export type PerkEffect =
  | { type: 'stat'; stat: StatKey | 'resMax' | 'regen' | 'attackCost'; add: number }
  | { type: 'onKillHeal'; amount: number }
  | { type: 'onKillResource'; amount: number }
  | { type: 'burst'; cost: number; mul: number }
  | { type: 'thorns'; ratio: number }
  | { type: 'lifesteal'; ratio: number }
  | { type: 'startShield'; amount: number }
  | { type: 'goldBonus'; ratio: number }
  | { type: 'soulBonus'; ratio: number }
  | { type: 'execute'; ratio: number }
  | { type: 'splash'; ratio: number }
  | { type: 'rangedCost'; add: number }
  | { type: 'rangedMul'; ratio: number }
  | { type: 'critMul'; add: number }
  | { type: 'artifactMul'; ratio: number };

export type PerkSlot = 'start' | 'p2' | 'p3' | 'legend';

export interface PerkDef {
  id: string;
  classId: ClassId;
  slot: PerkSlot;
  /** Ключ текстуры иконки (perk_<id>); если файла нет — рисуется заглушка. */
  icon: string;
  name: { ru: string; en: string };
  /** Необязательное ручное описание; по умолчанию собирается из effects. */
  desc?: { ru: string; en: string };
  effects: PerkEffect[];
}

const st = (stat: StatKey | 'resMax' | 'regen' | 'attackCost', add: number): PerkEffect => ({ type: 'stat', stat, add });

const P = (
  classId: ClassId, slot: PerkSlot, ru: string, en: string, ...effects: PerkEffect[]
): PerkDef => {
  const id = `${classId}_${slot}`;
  return { id, classId, slot, icon: `perk_${id}`, name: { ru, en }, effects };
};

export const PERKS: PerkDef[] = [
  // Воин — выносливость тратится на перки.
  P('warrior', 'start', 'Мощный удар', 'Power Strike', { type: 'burst', cost: 3, mul: 0.5 }),
  P('warrior', 'p2', 'Закалка', 'Toughening', st('defense', 1)),
  P('warrior', 'p3', 'Жажда боя', 'Battle Thirst', { type: 'onKillHeal', amount: 2 }),
  P('knight', 'start', 'Рыцарский натиск', "Knight's Charge", { type: 'burst', cost: 3, mul: 0.75 }),
  P('knight', 'p2', 'Латы', 'Plate Armor', st('defense', 2)),
  P('knight', 'p3', 'Шипастый доспех', 'Spiked Armor', { type: 'thorns', ratio: 0.3 }),
  P('berserk', 'start', 'Ярость', 'Rage', { type: 'burst', cost: 2, mul: 1 }),
  P('berserk', 'p2', 'Кровожадность', 'Bloodlust', st('damage', 3)),
  P('berserk', 'p3', 'Вампиризм', 'Vampirism', { type: 'lifesteal', ratio: 0.2 }),
  P('berserk', 'legend', 'Безумие берсерка', "Berserker's Madness", { type: 'burst', cost: 4, mul: 2 }, st('crit', 10)),
  P('paladin', 'start', 'Святой щит', 'Holy Shield', { type: 'startShield', amount: 6 }),
  P('paladin', 'p2', 'Возмездие', 'Retribution', st('parry', 10)),
  P('paladin', 'p3', 'Благословение', 'Blessing', { type: 'onKillHeal', amount: 4 }),
  P('paladin', 'legend', 'Длань света', 'Hand of Light', { type: 'startShield', amount: 20 }, st('defense', 3)),

  // Маг — мана тратится на каждую атаку.
  P('mage', 'start', 'Резерв маны', 'Mana Reserve', st('resMax', 2)),
  P('mage', 'p2', 'Медитация', 'Meditation', st('regen', 1)),
  P('mage', 'p3', 'Везение', 'Serendipity', st('luck', 2)),
  P('magister', 'start', 'Мастер заклинаний', 'Spellmaster', st('attackCost', -1), st('damage', 1)),
  P('magister', 'p2', 'Арканная мощь', 'Arcane Power', st('damage', 3)),
  P('magister', 'p3', 'Знание артефактов', 'Artifact Lore', { type: 'artifactMul', ratio: 0.5 }),
  P('necromancer', 'start', 'Жатва душ', 'Soul Harvest', { type: 'soulBonus', ratio: 0.25 }),
  P('necromancer', 'p2', 'Похищение жизни', 'Life Drain', { type: 'lifesteal', ratio: 0.15 }),
  P('necromancer', 'p3', 'Тёмный ритуал', 'Dark Ritual', { type: 'onKillResource', amount: 2 }),
  P('necromancer', 'legend', 'Повелитель мёртвых', 'Lord of the Dead', { type: 'onKillHeal', amount: 5 }, { type: 'soulBonus', ratio: 0.5 }),
  P('pyromancer', 'start', 'Огненная искра', 'Fire Spark', { type: 'splash', ratio: 0.3 }),
  P('pyromancer', 'p2', 'Жар', 'Blaze', st('damage', 4)),
  P('pyromancer', 'p3', 'Пламя феникса', 'Phoenix Flame', st('crit', 10)),
  P('pyromancer', 'legend', 'Инферно', 'Inferno', { type: 'splash', ratio: 0.6 }, st('damage', 5)),

  // Лучник — концентрация тратится на выстрел «через одну».
  P('archer', 'start', 'Меткий глаз', 'Sharp Eye', st('crit', 5)),
  P('archer', 'p2', 'Дыхание охотника', "Hunter's Breath", st('resMax', 2)),
  P('archer', 'p3', 'Лёгкий шаг', 'Light Step', st('dodge', 5)),
  P('hawkeye', 'start', 'Соколиный взгляд', "Falcon's Gaze", { type: 'rangedCost', add: -1 }),
  P('hawkeye', 'p2', 'Скорострельность', 'Rapid Fire', st('regen', 1)),
  P('hawkeye', 'p3', 'Верный выстрел', 'True Shot', { type: 'rangedMul', ratio: 0.25 }),
  P('arrowgod', 'start', 'Дождь стрел', 'Arrow Rain', { type: 'rangedMul', ratio: 0.5 }),
  P('arrowgod', 'p2', 'Слабое место', 'Weak Spot', st('crit', 10)),
  P('arrowgod', 'p3', 'Божественная концентрация', 'Divine Focus', st('resMax', 4)),
  P('arrowgod', 'legend', 'Бог стрел', 'God of Arrows', { type: 'rangedCost', add: -1 }, { type: 'rangedMul', ratio: 0.5 }),
  P('sniper', 'start', 'Прицел', 'Scope', { type: 'execute', ratio: 0.2 }),
  P('sniper', 'p2', 'Смертельный выстрел', 'Deadly Shot', { type: 'critMul', add: 0.5 }),
  P('sniper', 'p3', 'Терпение', 'Patience', st('regen', 1), st('resMax', 2)),
  P('sniper', 'legend', 'Один выстрел — один труп', 'One Shot One Kill', { type: 'execute', ratio: 0.35 }, st('crit', 15)),

  // Наёмник — осмотрительность тратится на удар по любой цели.
  P('mercenary', 'start', 'Жадность', 'Greed', { type: 'goldBonus', ratio: 0.2 }),
  P('mercenary', 'p2', 'Ловкие руки', 'Nimble Hands', st('dodge', 5)),
  P('mercenary', 'p3', 'Осторожность', 'Wariness', st('resMax', 2)),
  P('assassin', 'start', 'Удар в спину', 'Backstab', { type: 'critMul', add: 0.25 }),
  P('assassin', 'p2', 'Тихий шаг', 'Silent Step', { type: 'rangedCost', add: -1 }),
  P('assassin', 'p3', 'Ядовитый клинок', 'Poisoned Blade', st('damage', 3)),
  P('darkassassin', 'start', 'Клеймо смерти', 'Mark of Death', { type: 'execute', ratio: 0.2 }),
  P('darkassassin', 'p2', 'Тёмная кровь', 'Dark Blood', { type: 'lifesteal', ratio: 0.15 }),
  P('darkassassin', 'p3', 'Тень', 'Shadow', st('dodge', 10)),
  P('darkassassin', 'legend', 'Жнец', 'Reaper', { type: 'execute', ratio: 0.3 }, { type: 'onKillResource', amount: 2 }, st('crit', 10)),
  P('ninja', 'start', 'Ветер', 'Wind', st('dodge', 10)),
  P('ninja', 'p2', 'Контратака', 'Counterstrike', st('parry', 12)),
  P('ninja', 'p3', 'Сюрикены', 'Shuriken', st('regen', 1)),
  P('ninja', 'legend', 'Тень ветра', 'Wind Shadow', st('dodge', 15), st('parry', 10)),
];

export const PERK_BY_ID: Record<string, PerkDef> = Object.fromEntries(PERKS.map((p) => [p.id, p]));

export const perkId = (classId: ClassId, slot: PerkSlot): string => `${classId}_${slot}`;

export const SLOT_BY_SEG: PerkSlot[] = ['start', 'p2', 'p3', 'legend'];
