import type { ClassId, TalentPath } from '../types';

/**
 * Дерево талантов в духе WoW: у класса девять талантов вместо сотни мелких шариков.
 * Три пути (урон / здоровье / защита) по одному таланту на ярус, у каждого 1–5 рангов.
 *
 * Значения в `v` — СУММАРНЫЕ: [20, 30, 40] значит «+20% → +30% → +40%», а не прибавку к предыдущему рангу.
 *
 * Правило ворот: перк следующего слота (и метаморфоза) открывается, когда ЛЮБОЙ один талант
 * этого яруса прокачан до максимума. Прокачивать все три пути не обязательно — но выгодно.
 *
 * Таланты сохраняются при метаморфозе (это постоянный рост героя), перки — заменяются.
 */
export type TalentFx =
  // ---- урон и способности (путь У)
  | 'dmgPct' | 'crit' | 'critMul' | 'perkPower' | 'artifactMul' | 'execute' | 'pierce'
  | 'doubleStrike' | 'lowHpDmg' | 'fullHpDmg' | 'bossDmg' | 'ignite' | 'killDmg'
  | 'rageDmg' | 'goldDmg' | 'defDmg' | 'everyThird' | 'roomCrit'
  // ---- здоровье и запас (путь З)
  | 'hpPct' | 'resMaxPct' | 'lowHpDr' | 'bigHitCut' | 'startShield' | 'potionPct'
  | 'cheatDeath' | 'revive' | 'killHp' | 'bossHp' | 'freePerk' | 'healShield'
  // ---- защита и ослабление врагов (путь Щ)
  | 'def' | 'parry' | 'dodge' | 'block' | 'thorns' | 'weaken' | 'firstHitDown'
  | 'armorBonus' | 'dotDr' | 'bossDr' | 'magicDr' | 'killDefTurn' | 'killDefStack'
  | 'roomGuard' | 'counterBuff' | 'highHpDef' | 'resDef' | 'perkDef' | 'scarDef' | 'manaShield';

export interface TalentDef {
  /** `warrior/a1` — класс, путь (a/v/g) и ярус. */
  id: string;
  classId: ClassId;
  path: TalentPath;
  tier: 1 | 2 | 3;
  fx: TalentFx;
  /** Суммарное значение эффекта на каждом ранге. Длина массива = число рангов. */
  v: number[];
  name: { ru: string; en: string };
}

const PATH_KEY: Record<'a' | 'v' | 'g', TalentPath> = { a: 'attack', v: 'vitality', g: 'guard' };

type Row = ['a' | 'v' | 'g', 1 | 2 | 3, string, string, TalentFx, number[]];

const build = (classId: ClassId, rows: Row[]): TalentDef[] =>
  rows.map(([p, tier, ru, en, fx, v]) => ({
    id: `${classId}/${p}${tier}`,
    classId,
    path: PATH_KEY[p],
    tier,
    fx,
    v,
    name: { ru, en },
  }));

export const TALENTS: TalentDef[] = [
  // ================================================================ Воин
  ...build('warrior', [
    ['a', 1, 'Тяжёлая рука', 'Heavy Hand', 'dmgPct', [10, 20, 30, 40, 50]],
    ['a', 2, 'Сокрушение', 'Crushing Blow', 'perkPower', [15, 30, 45]],
    ['a', 3, 'Раскол', 'Cleave', 'pierce', [50]],
    ['v', 1, 'Закалка', 'Hardening', 'hpPct', [15, 28, 40]],
    ['v', 2, 'Упорство', 'Stubbornness', 'lowHpDr', [10, 20, 30]],
    ['v', 3, 'Несокрушимый', 'Unbreakable', 'cheatDeath', [1]],
    ['g', 1, 'Толстая шкура', 'Thick Hide', 'def', [3, 7, 12]],
    ['g', 2, 'Отбить удар', 'Deflect', 'parry', [5, 10, 15]],
    ['g', 3, 'Контрудар', 'Riposte', 'counterBuff', [60]],
  ]),
  ...build('knight', [
    ['a', 1, 'Удар щитом', 'Shield Strike', 'defDmg', [25, 50, 75]],
    ['a', 2, 'Рыцарский долг', 'Knightly Duty', 'perkPower', [20, 40, 60]],
    ['a', 3, 'Рыцарский выпад', "Knight's Lunge", 'critMul', [40, 80]],
    ['v', 1, 'Стойкость', 'Fortitude', 'bossDr', [10, 20, 30]],
    ['v', 2, 'Барьер', 'Barrier', 'startShield', [8, 15, 22]],
    ['v', 3, 'Слава победителя', "Victor's Glory", 'bossHp', [6, 12]],
    ['g', 1, 'Латы', 'Plate Armour', 'armorBonus', [15, 30, 45]],
    ['g', 2, 'Стальные шипы', 'Steel Spikes', 'thorns', [15, 30, 45]],
    ['g', 3, 'Несгибаемая стена', 'Unyielding Wall', 'roomGuard', [100]],
  ]),
  ...build('berserk', [
    ['a', 1, 'Ярость', 'Fury', 'rageDmg', [15, 30, 45]],
    ['a', 2, 'Неистовство', 'Frenzy', 'perkPower', [25, 50, 75]],
    ['a', 3, 'Двойной удар', 'Double Strike', 'doubleStrike', [12, 25]],
    ['v', 1, 'Безумие', 'Madness', 'block', [4, 8, 12]],
    ['v', 2, 'Боевой опыт', 'Battle Experience', 'killHp', [1, 2, 3]],
    ['v', 3, 'Предел боли', 'Pain Threshold', 'bigHitCut', [50]],
    ['g', 1, 'Шрамы', 'Scars', 'scarDef', [3, 6, 9]],
    ['g', 2, 'Толстокожий', 'Thick Skinned', 'dotDr', [30, 60]],
    ['g', 3, 'Кровавая пелена', 'Blood Veil', 'perkDef', [30, 60]],
  ]),
  ...build('paladin', [
    ['a', 1, 'Священный гнев', 'Sacred Wrath', 'bossDmg', [15, 30, 45]],
    ['a', 2, 'Карающий свет', 'Punishing Light', 'perkPower', [25, 50, 75]],
    ['a', 3, 'Суд', 'Judgement', 'everyThird', [100]],
    ['v', 1, 'Вера', 'Faith', 'resMaxPct', [15, 30, 45]],
    ['v', 2, 'Ореол', 'Halo', 'firstHitDown', [15, 30, 45]],
    ['v', 3, 'Освящение', 'Consecration', 'healShield', [25]],
    ['g', 1, 'Святая защита', 'Holy Guard', 'magicDr', [10, 20, 30]],
    ['g', 2, 'Обет кротости', 'Vow of Meekness', 'weaken', [10, 20, 30]],
    ['g', 3, 'Оплот', 'Bulwark', 'highHpDef', [15, 30]],
  ]),

  // ================================================================ Маг
  ...build('mage', [
    ['a', 1, 'Сила заклинаний', 'Spell Power', 'dmgPct', [10, 20, 30, 40, 50]],
    ['a', 2, 'Мастер артефактов', 'Artifact Master', 'artifactMul', [25, 50, 75]],
    ['a', 3, 'Арканный резонанс', 'Arcane Resonance', 'crit', [10, 20]],
    ['v', 1, 'Запас маны', 'Mana Reserve', 'resMaxPct', [15, 25, 35]],
    ['v', 2, 'Мерцание', 'Blink', 'dodge', [4, 8, 12]],
    ['v', 3, 'Аварийный барьер', 'Emergency Ward', 'cheatDeath', [1]],
    ['g', 1, 'Мана-щит', 'Mana Shield', 'manaShield', [10, 20, 30]],
    ['g', 2, 'Рунная броня', 'Runic Armour', 'resDef', [10, 20, 30]],
    ['g', 3, 'Зеркальный щит', 'Mirror Shield', 'thorns', [25]],
  ]),
  ...build('magister', [
    ['a', 1, 'Двойное заклинание', 'Twin Cast', 'doubleStrike', [10, 20, 30]],
    ['a', 2, 'Высшее искусство', 'Higher Art', 'perkPower', [20, 40, 60]],
    ['a', 3, 'Безмолвный каст', 'Silent Cast', 'freePerk', [1]],
    ['v', 1, 'Эфирное тело', 'Ethereal Body', 'hpPct', [16, 30, 45]],
    ['v', 2, 'Предвидение', 'Foresight', 'firstHitDown', [15, 30, 45]],
    ['v', 3, 'Философский камень', "Philosopher's Stone", 'potionPct', [30, 60]],
    ['g', 1, 'Антимагия', 'Antimagic', 'magicDr', [10, 20, 30]],
    ['g', 2, 'Контрзаклинание', 'Counterspell', 'parry', [5, 10, 15]],
    ['g', 3, 'Абсолютная защита', 'Absolute Ward', 'perkDef', [100]],
  ]),
  ...build('necromancer', [
    ['a', 1, 'Жатва душ', 'Soul Harvest', 'killDmg', [2, 4, 6]],
    ['a', 2, 'Некрозис', 'Necrosis', 'perkPower', [25, 50, 75]],
    ['a', 3, 'Казнь', 'Execution', 'execute', [20]],
    ['v', 1, 'Костяной доспех', 'Bone Armour', 'startShield', [10, 20, 30]],
    ['v', 2, 'Собиратель душ', 'Soul Collector', 'killHp', [1, 2, 3]],
    ['v', 3, 'Возвращение', 'Return', 'revive', [30]],
    ['g', 1, 'Проклятие слабости', 'Curse of Weakness', 'weaken', [10, 20, 30]],
    ['g', 2, 'Нечувствительность', 'Numbness', 'dotDr', [20, 40, 60]],
    ['g', 3, 'Проклятая броня', 'Cursed Armour', 'killDefTurn', [20, 40]],
  ]),
  ...build('pyromancer', [
    ['a', 1, 'Поджог', 'Kindling', 'ignite', [8, 16, 25]],
    ['a', 2, 'Огненная ярость', 'Fire Fury', 'perkPower', [25, 50, 75]],
    ['a', 3, 'Инферно', 'Inferno', 'critMul', [40, 80]],
    ['v', 1, 'Тлеющий уголь', 'Smouldering Ember', 'lowHpDr', [10, 20, 30]],
    ['v', 2, 'Дым и пламя', 'Smoke and Flame', 'bossDr', [10, 20, 30]],
    ['v', 3, 'Пепельный покров', 'Ashen Shroud', 'bigHitCut', [50]],
    ['g', 1, 'Раскалённая броня', 'Searing Armour', 'def', [4, 9, 15]],
    ['g', 2, 'Огненная стена', 'Wall of Flame', 'block', [4, 8, 12]],
    ['g', 3, 'Огненный покров', 'Cloak of Fire', 'roomGuard', [100]],
  ]),

  // ================================================================ Лучник
  ...build('archer', [
    ['a', 1, 'Меткость', 'Marksmanship', 'crit', [4, 8, 12, 16, 20]],
    ['a', 2, 'Точный выстрел', 'Precise Shot', 'perkPower', [15, 30, 45]],
    ['a', 3, 'Добить', 'Finish Off', 'lowHpDmg', [30, 60]],
    ['v', 1, 'Лёгкие ноги', 'Light Feet', 'dodge', [4, 8, 12]],
    ['v', 2, 'Большой колчан', 'Deep Quiver', 'resMaxPct', [20, 30, 40]],
    ['v', 3, 'Ускользнуть', 'Slip Away', 'cheatDeath', [1]],
    ['g', 1, 'Кожаная броня', 'Leather Armour', 'def', [3, 7, 12]],
    ['g', 2, 'Отбить стрелой', 'Arrow Parry', 'parry', [4, 8, 12]],
    ['g', 3, 'Охотничий трофей', 'Hunting Trophy', 'killDefTurn', [20, 40]],
  ]),
  ...build('hawkeye', [
    ['a', 1, 'Зоркий глаз', 'Keen Eye', 'fullHpDmg', [15, 30, 45]],
    ['a', 2, 'Выверенный выстрел', 'Measured Shot', 'perkPower', [20, 40, 60]],
    ['a', 3, 'Пробивание', 'Penetration', 'pierce', [50]],
    ['v', 1, 'Инстинкт', 'Instinct', 'lowHpDr', [10, 20, 30]],
    ['v', 2, 'Добыча', 'Quarry', 'killHp', [1, 2, 3]],
    ['v', 3, 'Осторожность', 'Caution', 'bossDr', [15, 30]],
    ['g', 1, 'Кожевенное мастерство', 'Tanner’s Craft', 'armorBonus', [15, 30, 45]],
    ['g', 2, 'Прикрытие', 'Cover', 'firstHitDown', [15, 30, 45]],
    ['g', 3, 'Сокол-хранитель', 'Guardian Falcon', 'roomGuard', [100]],
  ]),
  ...build('arrowgod', [
    ['a', 1, 'Град стрел', 'Arrow Hail', 'doubleStrike', [10, 20, 30]],
    ['a', 2, 'Дождь стрел', 'Arrow Shower', 'perkPower', [25, 50, 75]],
    ['a', 3, 'Божественный выстрел', 'Divine Shot', 'freePerk', [1]],
    ['v', 1, 'Божественная стойкость', 'Divine Endurance', 'hpPct', [16, 30, 45]],
    ['v', 2, 'Звёздный щит', 'Star Shield', 'startShield', [8, 15, 22]],
    ['v', 3, 'Дар богов', 'Gift of the Gods', 'potionPct', [30, 60]],
    ['g', 1, 'Небесный покров', 'Heavenly Veil', 'magicDr', [10, 20, 30]],
    ['g', 2, 'Стрелы возмездия', 'Arrows of Retribution', 'thorns', [15, 30, 45]],
    ['g', 3, 'Воля богов', 'Will of the Gods', 'perkDef', [100]],
  ]),
  ...build('sniper', [
    ['a', 1, 'Прицел', 'Scope', 'critMul', [25, 50, 75]],
    ['a', 2, 'Выстрел в голову', 'Headshot', 'perkPower', [25, 50, 75]],
    ['a', 3, 'Тот самый выстрел', 'The Shot', 'roomCrit', [1]],
    ['v', 1, 'Голова босса', "Boss's Head", 'bossHp', [5, 10, 15]],
    ['v', 2, 'Стальные нервы', 'Steel Nerves', 'bigHitCut', [25, 50]],
    ['v', 3, 'Последний шанс', 'Last Chance', 'revive', [25]],
    ['g', 1, 'Хладнокровие', 'Composure', 'highHpDef', [10, 20, 30]],
    ['g', 2, 'Выстрел в колено', 'Kneecapper', 'weaken', [10, 20, 30]],
    ['g', 3, 'Укрытие', 'Cover Position', 'block', [5, 10]],
  ]),

  // ================================================================ Наёмник
  ...build('mercenary', [
    ['a', 1, 'Золотой удар', 'Golden Strike', 'goldDmg', [1, 2, 3]],
    ['a', 2, 'Удар в спину', 'Backstabber', 'perkPower', [15, 30, 45]],
    ['a', 3, 'Нож в рукаве', 'Sleeve Knife', 'crit', [10, 20]],
    ['v', 1, 'Закалка наёмника', "Sellsword's Grit", 'hpPct', [16, 30, 45]],
    ['v', 2, 'Запас на чёрный день', 'Rainy Day Fund', 'potionPct', [20, 40, 60]],
    ['v', 3, 'Откупиться', 'Buy Your Life', 'cheatDeath', [1]],
    ['g', 1, 'Кольчуга', 'Chainmail', 'def', [3, 7, 12]],
    ['g', 2, 'Трофейный доспех', 'Trophy Armour', 'killDefStack', [2, 4, 6]],
    ['g', 3, 'Купленная броня', 'Bought Armour', 'armorBonus', [25, 50]],
  ]),
  ...build('assassin', [
    ['a', 1, 'Смертельная точность', 'Deadly Precision', 'critMul', [25, 50, 75]],
    ['a', 2, 'Смертельный клинок', 'Deadly Blade', 'perkPower', [20, 40, 60]],
    ['a', 3, 'Казнь', 'Execution', 'execute', [20]],
    ['v', 1, 'Хладная кровь', 'Cold Blood', 'bossDr', [10, 20, 30]],
    ['v', 2, 'Кровавый контракт', 'Blood Contract', 'killHp', [1, 2, 3]],
    ['v', 3, 'Плащ теней', 'Shadow Cloak', 'startShield', [10, 20]],
    ['g', 1, 'Скрытность', 'Stealth', 'firstHitDown', [15, 30, 45]],
    ['g', 2, 'Дымовая шашка', 'Smoke Bomb', 'perkDef', [20, 40, 60]],
    ['g', 3, 'Ловкий уход', 'Nimble Escape', 'block', [5, 10]],
  ]),
  ...build('darkassassin', [
    ['a', 1, 'Ночной клинок', 'Night Blade', 'fullHpDmg', [15, 30, 45]],
    ['a', 2, 'Владыка теней', 'Shadow Lord', 'perkPower', [25, 50, 75]],
    ['a', 3, 'Двойной клинок', 'Twin Blade', 'doubleStrike', [12, 25]],
    ['v', 1, 'Пакт теней', 'Shadow Pact', 'lowHpDr', [10, 20, 30]],
    ['v', 2, 'Тёмный покров', 'Dark Shroud', 'bigHitCut', [25, 50]],
    ['v', 3, 'Тёмное возрождение', 'Dark Rebirth', 'revive', [30]],
    ['g', 1, 'Проклятый плащ', 'Cursed Cloak', 'magicDr', [10, 20, 30]],
    ['g', 2, 'Отравленные клинки', 'Poisoned Blades', 'weaken', [10, 20, 30]],
    ['g', 3, 'Покров ночи', 'Veil of Night', 'roomGuard', [100]],
  ]),
  ...build('ninja', [
    ['a', 1, 'Путь клинка', 'Way of the Blade', 'dmgPct', [10, 20, 30, 40, 50]],
    ['a', 2, 'Тень клинка', 'Blade Shadow', 'perkPower', [25, 50, 75]],
    ['a', 3, 'Мгновенное исполнение', 'Instant Execution', 'freePerk', [1]],
    ['v', 1, 'Тень ветра', 'Wind Shadow', 'dodge', [5, 10, 15]],
    ['v', 2, 'Ки', 'Ki', 'resMaxPct', [20, 30, 40]],
    ['v', 3, 'Исчезновение', 'Vanish', 'cheatDeath', [1]],
    ['g', 1, 'Стойка журавля', 'Crane Stance', 'parry', [5, 10, 15]],
    ['g', 2, 'Ки-барьер', 'Ki Barrier', 'resDef', [10, 20, 30]],
    ['g', 3, 'Ответный сюрикен', 'Return Shuriken', 'thorns', [25, 50]],
  ]),
];

export const TALENT_BY_ID: Record<string, TalentDef> = Object.fromEntries(TALENTS.map((t) => [t.id, t]));

export const talentsOfClass = (classId: ClassId): TalentDef[] => TALENTS.filter((t) => t.classId === classId);

export const talentsOfTier = (classId: ClassId, tier: number): TalentDef[] =>
  TALENTS.filter((t) => t.classId === classId && t.tier === tier);

export const maxRank = (t: TalentDef): number => t.v.length;

/** Значение эффекта на купленном ранге (0 — талант не изучен). */
export const talentValue = (t: TalentDef, rank: number): number => (rank <= 0 ? 0 : t.v[Math.min(rank, t.v.length) - 1]);

/** Порядок путей в дереве слева направо. */
export const PATH_ORDER: TalentPath[] = ['attack', 'vitality', 'guard'];
