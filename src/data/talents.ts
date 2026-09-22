import type { ClassId, TalentPath } from '../types';

/**
 * Дерево талантов в духе WoW: три пути (урон / здоровье / защита), между способностями — не
 * три одинаковых шарика, а цепочки РАЗНОЙ длины: где-то один талант, где-то три. Все цепочки
 * яруса сходятся в следующую способность.
 *
 * Значения в `v` — СУММАРНЫЕ: [20, 30, 40] значит «+20% → +30% → +40%», а не прибавку к предыдущему рангу.
 *
 * Правило ворот: следующая способность (и метаморфоза) открывается, когда ЛЮБАЯ одна цепочка
 * яруса пройдена целиком — все её таланты прокачаны до максимума.
 *
 * Таланты и способности сохраняются при метаморфозе: пиромант владеет и заклинаниями мага,
 * и приёмами магистра, и своими. Поэтому в цепочках есть таланты-синергии — они меняют способности,
 * полученные раньше («Живое пламя» заставляет любую способность поджигать цель, так что цепная
 * молния мага у пироманта начинает поджигать).
 */
export type TalentFx =
  // ---- урон и способности (путь У)
  | 'dmgPct' | 'crit' | 'critMul' | 'perkPower' | 'artifactMul' | 'execute' | 'pierce'
  // усиление конкретных заклинаний мага
  | 'lightningPower' | 'shotPower' | 'chainPower'
  | 'doubleStrike' | 'lowHpDmg' | 'fullHpDmg' | 'bossDmg' | 'ignite' | 'killDmg'
  | 'rageDmg' | 'goldDmg' | 'defDmg' | 'everyThird' | 'roomCrit'
  // ---- здоровье и запас (путь З)
  | 'hpPct' | 'resMaxPct' | 'lowHpDr' | 'bigHitCut' | 'startShield' | 'potionPct'
  | 'cheatDeath' | 'revive' | 'killHp' | 'bossHp' | 'freePerk' | 'healShield' | 'stepHeal'
  // ---- защита и ослабление врагов (путь Щ)
  | 'def' | 'parry' | 'dodge' | 'block' | 'thorns' | 'weaken' | 'firstHitDown'
  | 'armorBonus' | 'dotDr' | 'bossDr' | 'magicDr' | 'killDefTurn' | 'killDefStack'
  | 'roomGuard' | 'counterBuff' | 'highHpDef' | 'resDef' | 'perkDef' | 'scarDef' | 'manaShield'
  // ---- синергии: меняют уже полученные способности
  | 'abilityIgnite' | 'abilityStun' | 'abilitySplash' | 'abilityPoison' | 'abilityVuln'
  | 'abilityCrit' | 'abilityLifesteal' | 'abilityRefund' | 'abilityShield'
  | 'killBlast' | 'basicSplit' | 'perkCostDown';

/**
 * Синергии — таланты, которые меняют уже полученные способности (а не просто прибавляют
 * характеристику). В дереве они помечены значком молнии, чтобы их было видно среди обычных.
 */
export const SYNERGY_FX = new Set<TalentFx>([
  'abilityIgnite', 'abilityStun', 'abilitySplash', 'abilityPoison', 'abilityVuln', 'abilityCrit',
  'abilityLifesteal', 'abilityRefund', 'abilityShield', 'killBlast', 'basicSplit', 'perkCostDown', 'stepHeal',
]);

export interface TalentDef {
  /** `warrior/a1-2` — класс, путь (a/v/g), ярус и место в цепочке. */
  id: string;
  classId: ClassId;
  path: TalentPath;
  tier: 1 | 2 | 3;
  /** Место в цепочке яруса, начиная с нуля. */
  step: number;
  fx: TalentFx;
  /** Суммарное значение эффекта на каждом ранге. Длина массива = число рангов. */
  v: number[];
  /** Второе значение ранга для эффектов из пары «шанс / сила» (например, раздвоение молнии). */
  v2?: number[];
  name: { ru: string; en: string };
}

const PATH_KEY: Record<'a' | 'v' | 'g', TalentPath> = { a: 'attack', v: 'vitality', g: 'guard' };

interface Seed {
  ru: string;
  en: string;
  fx: TalentFx;
  v: number[];
  v2?: number[];
}

const T = (ru: string, en: string, fx: TalentFx, v: number[], v2?: number[]): Seed => ({ ru, en, fx, v, v2 });

/** Ярус: по цепочке на каждый путь. Последний талант цепочки — самый сильный. */
interface Tier {
  a: Seed[];
  v: Seed[];
  g: Seed[];
}

const build = (classId: ClassId, tiers: [Tier, Tier, Tier]): TalentDef[] => {
  const out: TalentDef[] = [];
  tiers.forEach((tier, ti) => {
    (['a', 'v', 'g'] as const).forEach((p) => {
      tier[p].forEach((seed, step) => {
        out.push({
          id: `${classId}/${p}${ti + 1}-${step + 1}`,
          classId,
          path: PATH_KEY[p],
          tier: (ti + 1) as 1 | 2 | 3,
          step,
          fx: seed.fx,
          v: seed.v,
          v2: seed.v2,
          name: { ru: seed.ru, en: seed.en },
        });
      });
    });
  });
  return out;
};

export const TALENTS: TalentDef[] = [
  // ================================================================ Воин
  ...build('warrior', [
    {
      a: [
        T('Разминка', 'Warm-Up', 'dmgPct', [4, 8]),
        T('Широкий замах', 'Wide Swing', 'critMul', [15, 30]),
        T('Тяжёлая рука', 'Heavy Hand', 'dmgPct', [10, 20, 30, 40, 50]),
      ],
      v: [T('Закалка', 'Hardening', 'hpPct', [15, 28, 40])],
      g: [T('Толстая шкура', 'Thick Hide', 'def', [3, 7, 12])],
    },
    {
      a: [T('Сокрушение', 'Crushing Blow', 'perkPower', [15, 30, 45])],
      v: [
        T('Второе дыхание', 'Second Wind', 'stepHeal', [2, 4]),
        T('Упорство', 'Stubbornness', 'lowHpDr', [10, 20, 30]),
      ],
      g: [
        T('Наручи', 'Bracers', 'def', [2, 4]),
        T('Отбить удар', 'Deflect', 'parry', [5, 10, 15]),
      ],
    },
    {
      a: [T('Раскол', 'Cleave', 'pierce', [50])],
      v: [T('Несокрушимый', 'Unbreakable', 'cheatDeath', [1])],
      g: [
        T('Выучка', 'Drill', 'parry', [3, 6]),
        T('Глухая стойка', 'Tight Guard', 'block', [4, 8]),
        T('Контрудар', 'Riposte', 'counterBuff', [60]),
      ],
    },
  ]),
  ...build('knight', [
    {
      a: [
        T('Окованный умбон', 'Iron Boss', 'abilityStun', [10, 20]),
        T('Удар щитом', 'Shield Strike', 'defDmg', [25, 50, 75]),
      ],
      v: [
        T('Обет', 'Oath', 'hpPct', [10, 20]),
        T('Стойкость', 'Fortitude', 'bossDr', [10, 20, 30]),
      ],
      g: [T('Латы', 'Plate Armour', 'armorBonus', [15, 30, 45])],
    },
    {
      a: [T('Рыцарский долг', 'Knightly Duty', 'perkPower', [20, 40, 60])],
      v: [T('Барьер', 'Barrier', 'startShield', [8, 15, 22])],
      g: [
        T('Наплечники', 'Pauldrons', 'def', [3, 6]),
        T('Отражённый выпад', 'Turned Lunge', 'thorns', [10, 20]),
        T('Стальные шипы', 'Steel Spikes', 'thorns', [15, 30, 45]),
      ],
    },
    {
      a: [
        T('Турнирный опыт', 'Tourney Lessons', 'critMul', [20, 40]),
        T('Натиск', 'Onslaught', 'abilitySplash', [20, 40]),
        T('Рыцарский выпад', "Knight's Lunge", 'critMul', [40, 80]),
      ],
      v: [T('Слава победителя', "Victor's Glory", 'bossHp', [6, 12])],
      g: [T('Несгибаемая стена', 'Unyielding Wall', 'roomGuard', [100])],
    },
  ]),
  ...build('berserk', [
    {
      a: [T('Ярость', 'Fury', 'rageDmg', [15, 30, 45])],
      v: [
        T('Толстые кости', 'Thick Bones', 'hpPct', [8, 16]),
        T('Звериный нюх', 'Beast Sense', 'dodge', [3, 6]),
        T('Безумие', 'Madness', 'block', [4, 8, 12]),
      ],
      g: [T('Шрамы', 'Scars', 'scarDef', [3, 6, 9])],
    },
    {
      a: [
        T('Кровь за кровь', 'Blood for Blood', 'abilityLifesteal', [10, 20]),
        T('Неистовство', 'Frenzy', 'perkPower', [25, 50, 75]),
      ],
      v: [T('Боевой опыт', 'Battle Experience', 'killHp', [1, 2, 3])],
      g: [
        T('Дублёная кожа', 'Tanned Hide', 'dotDr', [15, 30]),
        T('Толстокожий', 'Thick Skinned', 'dotDr', [30, 60]),
      ],
    },
    {
      a: [T('Двойной удар', 'Double Strike', 'doubleStrike', [12, 25])],
      v: [
        T('Живучесть', 'Hardiness', 'hpPct', [10, 20]),
        T('Предел боли', 'Pain Threshold', 'bigHitCut', [50]),
      ],
      g: [
        T('Ярость крови', 'Blood Rage', 'abilityShield', [8, 16]),
        T('Кровавая пелена', 'Blood Veil', 'perkDef', [30, 60]),
      ],
    },
  ]),
  ...build('paladin', [
    {
      a: [T('Священный гнев', 'Sacred Wrath', 'bossDmg', [15, 30, 45])],
      v: [T('Свет жизни', 'Light of Life', 'hpPct', [12, 24, 36])],
      g: [
        T('Молитва', 'Prayer', 'magicDr', [6, 12]),
        T('Щит веры', 'Shield of Faith', 'abilityShield', [6, 12]),
        T('Святая защита', 'Holy Guard', 'magicDr', [10, 20, 30]),
      ],
    },
    {
      a: [
        T('Длань суда', 'Hand of Judgement', 'abilityStun', [12, 24]),
        T('Карающий свет', 'Punishing Light', 'perkPower', [25, 50, 75]),
      ],
      v: [
        T('Благодать', 'Grace', 'potionPct', [20, 40]),
        T('Ореол', 'Halo', 'firstHitDown', [15, 30, 45]),
      ],
      g: [T('Обет кротости', 'Vow of Meekness', 'weaken', [10, 20, 30])],
    },
    {
      a: [
        T('Возмездие', 'Retribution', 'critMul', [20, 40]),
        T('Свет истины', 'Light of Truth', 'abilitySplash', [25, 50]),
        T('Суд', 'Judgement', 'everyThird', [100]),
      ],
      v: [T('Освящение', 'Consecration', 'healShield', [25])],
      g: [T('Оплот', 'Bulwark', 'highHpDef', [15, 30])],
    },
  ]),

  // ================================================================ Маг
  ...build('mage', [
    {
      a: [
        T('Искра', 'Spark', 'dmgPct', [2, 5, 8]),
        // шанс задеть второго врага и доля урона по нему идут парой
        T('Раздвоение молнии', 'Forked Bolt', 'basicSplit', [8, 12, 16], [12, 14, 16]),
        T('Сила молнии', 'Bolt Power', 'lightningPower', [5, 10, 15, 20, 25]),
      ],
      v: [T('Запас маны', 'Mana Reserve', 'resMaxPct', [15, 25, 35])],
      g: [T('Мана-щит', 'Mana Shield', 'manaShield', [10, 20, 30])],
    },
    {
      a: [
        T('Мастер артефактов', 'Artifact Master', 'artifactMul', [25, 50, 75]),
        T('Сила магического выстрела', 'Arcane Shot Power', 'shotPower', [10, 20, 30, 40, 50]),
      ],
      v: [
        T('Шаг сквозь эфир', 'Ether Step', 'stepHeal', [2, 4]),
        T('Мерцание', 'Blink', 'dodge', [4, 8, 12]),
      ],
      g: [
        T('Рунные знаки', 'Runic Sigils', 'def', [2, 4, 6]),
        T('Рунная броня', 'Runic Armour', 'resDef', [10, 20, 30]),
      ],
    },
    {
      a: [
        T('Арканный резонанс', 'Arcane Resonance', 'crit', [3, 9, 12]),
        T('Сила цепной молнии', 'Chain Power', 'chainPower', [10, 15, 20, 25, 30]),
      ],
      v: [
        T('Эфирная плоть', 'Ether Flesh', 'hpPct', [14, 28]),
        T('Аварийный барьер', 'Emergency Ward', 'cheatDeath', [1]),
      ],
      g: [T('Зеркальный щит', 'Mirror Shield', 'thorns', [25])],
    },
  ]),
  ...build('magister', [
    {
      a: [
        T('Эхо заклинания', 'Spell Echo', 'abilitySplash', [15, 30]),
        T('Двойное заклинание', 'Twin Cast', 'doubleStrike', [10, 20, 30]),
      ],
      v: [
        T('Эфирная кожа', 'Ethereal Skin', 'hpPct', [8, 16]),
        T('Эфирное тело', 'Ethereal Body', 'hpPct', [16, 30, 45]),
      ],
      g: [T('Антимагия', 'Antimagic', 'magicDr', [10, 20, 30])],
    },
    {
      a: [
        T('Экономия маны', 'Mana Thrift', 'perkCostDown', [1]),
        T('Быстрый каст', 'Swift Cast', 'abilityRefund', [20, 40]),
        T('Высшее искусство', 'Higher Art', 'perkPower', [20, 40, 60]),
      ],
      v: [T('Предвидение', 'Foresight', 'firstHitDown', [15, 30, 45])],
      g: [T('Контрзаклинание', 'Counterspell', 'parry', [5, 10, 15])],
    },
    {
      a: [T('Безмолвный каст', 'Silent Cast', 'freePerk', [1])],
      v: [T('Философский камень', "Philosopher's Stone", 'potionPct', [30, 60])],
      g: [
        T('Щит разума', 'Mind Shield', 'abilityShield', [6, 12]),
        T('Барьер воли', 'Barrier of Will', 'block', [4, 8]),
        T('Абсолютная защита', 'Absolute Ward', 'perkDef', [100]),
      ],
    },
  ]),
  ...build('necromancer', [
    {
      a: [
        T('Тлен', 'Decay', 'abilityPoison', [4, 8]),
        T('Взрыв плоти', 'Flesh Burst', 'killBlast', [15, 30]),
        T('Жатва душ', 'Soul Harvest', 'killDmg', [2, 4, 6]),
      ],
      v: [T('Костяной доспех', 'Bone Armour', 'startShield', [10, 20, 30])],
      g: [T('Проклятие слабости', 'Curse of Weakness', 'weaken', [10, 20, 30])],
    },
    {
      a: [T('Некрозис', 'Necrosis', 'perkPower', [25, 50, 75])],
      v: [
        T('Тёмная плоть', 'Dark Flesh', 'hpPct', [8, 16]),
        T('Кража жизни', 'Life Theft', 'abilityLifesteal', [10, 20]),
        T('Собиратель душ', 'Soul Collector', 'killHp', [1, 2, 3]),
      ],
      g: [T('Нечувствительность', 'Numbness', 'dotDr', [20, 40, 60])],
    },
    {
      a: [
        T('Печать смерти', 'Seal of Death', 'abilityVuln', [15, 30]),
        T('Казнь', 'Execution', 'execute', [20]),
      ],
      v: [T('Возвращение', 'Return', 'revive', [30])],
      g: [
        T('Саван', 'Shroud', 'magicDr', [8, 16]),
        T('Проклятая броня', 'Cursed Armour', 'killDefTurn', [20, 40]),
      ],
    },
  ]),
  ...build('pyromancer', [
    {
      a: [
        // Синергия: любая способность (в том числе цепная молния мага) начинает поджигать цель.
        T('Живое пламя', 'Living Flame', 'abilityIgnite', [20, 40]),
        T('Поджог', 'Kindling', 'ignite', [8, 16, 25]),
      ],
      v: [
        T('Жаростойкость', 'Heat Resistance', 'dotDr', [15, 30]),
        T('Тлеющий уголь', 'Smouldering Ember', 'lowHpDr', [10, 20, 30]),
      ],
      g: [T('Раскалённая броня', 'Searing Armour', 'def', [4, 9, 15])],
    },
    {
      a: [
        T('Пепел', 'Ash', 'abilitySplash', [20, 40]),
        T('Жар', 'Swelter', 'dmgPct', [8, 16]),
        T('Огненная ярость', 'Fire Fury', 'perkPower', [25, 50, 75]),
      ],
      v: [T('Дым и пламя', 'Smoke and Flame', 'bossDr', [10, 20, 30])],
      g: [T('Огненная стена', 'Wall of Flame', 'block', [4, 8, 12])],
    },
    {
      a: [T('Инферно', 'Inferno', 'critMul', [40, 80])],
      v: [
        T('Угли под кожей', 'Embers Within', 'hpPct', [10, 20]),
        T('Пепельный покров', 'Ashen Shroud', 'bigHitCut', [50]),
      ],
      g: [
        T('Жаровня', 'Brazier', 'thorns', [15, 30]),
        T('Огненный покров', 'Cloak of Fire', 'roomGuard', [100]),
      ],
    },
  ]),

  // ================================================================ Лучник
  ...build('archer', [
    {
      a: [
        T('Твёрдая рука', 'Steady Hand', 'crit', [3, 6]),
        T('Двойной наконечник', 'Split Tip', 'basicSplit', [12, 24], [25, 40]),
        T('Меткость', 'Marksmanship', 'crit', [4, 8, 12, 16, 20]),
      ],
      v: [T('Лёгкие ноги', 'Light Feet', 'dodge', [4, 8, 12])],
      g: [T('Кожаная броня', 'Leather Armour', 'def', [3, 7, 12])],
    },
    {
      a: [T('Точный выстрел', 'Precise Shot', 'perkPower', [15, 30, 45])],
      v: [
        T('Бег налегке', 'Travel Light', 'stepHeal', [2, 4]),
        T('Закалка', 'Toughening', 'hpPct', [12, 24, 36]),
      ],
      g: [
        T('Наручи лучника', "Archer's Bracers", 'parry', [3, 6]),
        T('Отбить стрелой', 'Arrow Parry', 'parry', [4, 8, 12]),
      ],
    },
    {
      a: [
        T('Натяжение тетивы', 'Draw Weight', 'dmgPct', [12, 24]),
        T('Добить', 'Finish Off', 'lowHpDmg', [30, 60]),
      ],
      v: [T('Ускользнуть', 'Slip Away', 'cheatDeath', [1])],
      g: [
        T('Трофеи', 'Trophies', 'killDefStack', [2, 4]),
        T('Охотничий трофей', 'Hunting Trophy', 'killDefTurn', [20, 40]),
      ],
    },
  ]),
  ...build('hawkeye', [
    {
      a: [T('Зоркий глаз', 'Keen Eye', 'fullHpDmg', [15, 30, 45])],
      v: [
        T('Ровное дыхание', 'Even Breath', 'hpPct', [8, 16]),
        T('Инстинкт', 'Instinct', 'lowHpDr', [10, 20, 30]),
      ],
      g: [
        T('Выделка кож', 'Hide Curing', 'def', [3, 6]),
        T('Кожевенное мастерство', "Tanner's Craft", 'armorBonus', [15, 30, 45]),
      ],
    },
    {
      a: [
        T('Сила выстрела', 'Shot Power', 'dmgPct', [10, 20]),
        T('Сокольничий', 'Falconer', 'abilityStun', [10, 20]),
        T('Выверенный выстрел', 'Measured Shot', 'perkPower', [20, 40, 60]),
      ],
      v: [T('Добыча', 'Quarry', 'killHp', [1, 2, 3])],
      g: [T('Прикрытие', 'Cover', 'firstHitDown', [15, 30, 45])],
    },
    {
      a: [
        T('Бронебойные наконечники', 'Armour Piercers', 'pierce', [15]),
        T('Пробивание', 'Penetration', 'pierce', [50]),
      ],
      v: [
        T('Дыхание охотника', "Hunter's Breath", 'potionPct', [20, 40]),
        T('Осторожность', 'Caution', 'bossDr', [15, 30]),
      ],
      g: [T('Сокол-хранитель', 'Guardian Falcon', 'roomGuard', [100])],
    },
  ]),
  ...build('arrowgod', [
    {
      a: [
        T('Быстрая тетива', 'Swift String', 'abilityRefund', [15, 30]),
        T('Град стрел', 'Arrow Hail', 'doubleStrike', [10, 20, 30]),
      ],
      v: [
        T('Плоть героя', 'Heroic Flesh', 'hpPct', [8, 16]),
        T('Божественная стойкость', 'Divine Endurance', 'hpPct', [16, 30, 45]),
      ],
      g: [T('Небесный покров', 'Heavenly Veil', 'magicDr', [10, 20, 30])],
    },
    {
      a: [T('Дождь стрел', 'Arrow Shower', 'perkPower', [25, 50, 75])],
      v: [T('Звёздный щит', 'Star Shield', 'startShield', [8, 15, 22])],
      g: [
        T('Оперение', 'Fletching', 'def', [3, 6]),
        T('Ответный залп', 'Return Volley', 'thorns', [10, 20]),
        T('Стрелы возмездия', 'Arrows of Retribution', 'thorns', [15, 30, 45]),
      ],
    },
    {
      a: [
        T('Благословение лука', 'Blessed Bow', 'abilityCrit', [8, 16]),
        T('Залп', 'Volley', 'abilitySplash', [20, 40]),
        T('Божественный выстрел', 'Divine Shot', 'freePerk', [1]),
      ],
      v: [T('Дар богов', 'Gift of the Gods', 'potionPct', [30, 60])],
      g: [T('Воля богов', 'Will of the Gods', 'perkDef', [100])],
    },
  ]),
  ...build('sniper', [
    {
      a: [
        T('Дыхание стрелка', "Shooter's Breath", 'critMul', [15, 30]),
        T('Слабая точка', 'Soft Spot', 'abilityCrit', [8, 16]),
        T('Прицел', 'Scope', 'critMul', [25, 50, 75]),
      ],
      v: [T('Голова босса', "Boss's Head", 'bossHp', [5, 10, 15])],
      g: [T('Хладнокровие', 'Composure', 'highHpDef', [10, 20, 30])],
    },
    {
      a: [
        T('Расчёт', 'Calculation', 'abilityVuln', [15, 30]),
        T('Выстрел в голову', 'Headshot', 'perkPower', [25, 50, 75]),
      ],
      v: [
        T('Крепкие нервы', 'Firm Nerves', 'hpPct', [8, 16]),
        T('Стальные нервы', 'Steel Nerves', 'bigHitCut', [25, 50]),
      ],
      g: [T('Выстрел в колено', 'Kneecapper', 'weaken', [10, 20, 30])],
    },
    {
      a: [T('Тот самый выстрел', 'The Shot', 'roomCrit', [1])],
      v: [T('Последний шанс', 'Last Chance', 'revive', [25])],
      g: [
        T('Маскировка', 'Camouflage', 'firstHitDown', [12, 24]),
        T('Окоп', 'Foxhole', 'def', [4, 8]),
        T('Укрытие', 'Cover Position', 'block', [5, 10]),
      ],
    },
  ]),

  // ================================================================ Наёмник
  ...build('mercenary', [
    {
      a: [
        T('Наводка', 'Spotting', 'abilityVuln', [10, 20]),
        T('Хватка наёмника', "Sellsword's Grip", 'dmgPct', [10, 20, 30]),
      ],
      v: [T('Закалка наёмника', "Sellsword's Grit", 'hpPct', [16, 30, 45])],
      g: [
        T('Подкладка', 'Padding', 'def', [2, 5]),
        T('Кольчуга', 'Chainmail', 'def', [3, 7, 12]),
      ],
    },
    {
      a: [
        T('Грязный приём', 'Dirty Trick', 'abilityStun', [10, 20]),
        T('Отработанный удар', 'Practised Strike', 'abilityRefund', [20, 40]),
        T('Удар в спину', 'Backstabber', 'perkPower', [15, 30, 45]),
      ],
      v: [T('Запас на чёрный день', 'Rainy Day Fund', 'potionPct', [20, 40, 60])],
      g: [T('Трофейный доспех', 'Trophy Armour', 'killDefStack', [2, 4, 6])],
    },
    {
      a: [T('Нож в рукаве', 'Sleeve Knife', 'crit', [10, 20])],
      v: [
        T('Страховка', 'Insurance', 'hpPct', [10, 20]),
        T('Откупиться', 'Buy Your Life', 'cheatDeath', [1]),
      ],
      g: [
        T('Торг за броню', 'Haggling', 'armorBonus', [15, 30]),
        T('Купленная броня', 'Bought Armour', 'armorBonus', [25, 50]),
      ],
    },
  ]),
  ...build('assassin', [
    {
      a: [
        T('Уязвимая точка', 'Vital Point', 'abilityCrit', [8, 16]),
        T('Отравленная сталь', 'Poisoned Steel', 'abilityPoison', [4, 8]),
        T('Смертельная точность', 'Deadly Precision', 'critMul', [25, 50, 75]),
      ],
      v: [T('Хладная кровь', 'Cold Blood', 'bossDr', [10, 20, 30])],
      g: [T('Скрытность', 'Stealth', 'firstHitDown', [15, 30, 45])],
    },
    {
      a: [T('Смертельный клинок', 'Deadly Blade', 'perkPower', [20, 40, 60])],
      v: [
        T('Жилистость', 'Wiry Build', 'hpPct', [8, 16]),
        T('Кровавая расплата', 'Blood Price', 'abilityLifesteal', [10, 20]),
        T('Кровавый контракт', 'Blood Contract', 'killHp', [1, 2, 3]),
      ],
      g: [T('Дымовая шашка', 'Smoke Bomb', 'perkDef', [20, 40, 60])],
    },
    {
      a: [
        T('Агония', 'Agony', 'dmgPct', [12, 24]),
        T('Казнь', 'Execution', 'execute', [20]),
      ],
      v: [T('Плащ теней', 'Shadow Cloak', 'startShield', [10, 20])],
      g: [
        T('Танец клинков', 'Blade Dance', 'dodge', [4, 8]),
        T('Ловкий уход', 'Nimble Escape', 'block', [5, 10]),
      ],
    },
  ]),
  ...build('darkassassin', [
    {
      a: [T('Ночной клинок', 'Night Blade', 'fullHpDmg', [15, 30, 45])],
      v: [
        T('Тьма в жилах', 'Dark in the Veins', 'hpPct', [8, 16]),
        T('Пакт теней', 'Shadow Pact', 'lowHpDr', [10, 20, 30]),
      ],
      g: [
        T('Тень на коже', 'Shadowskin', 'magicDr', [6, 12]),
        T('Проклятый плащ', 'Cursed Cloak', 'magicDr', [10, 20, 30]),
      ],
    },
    {
      a: [
        T('Клеймо охотника', "Hunter's Brand", 'abilityVuln', [15, 30]),
        T('Владыка теней', 'Shadow Lord', 'perkPower', [25, 50, 75]),
      ],
      v: [T('Тёмный покров', 'Dark Shroud', 'bigHitCut', [25, 50])],
      g: [
        T('Яд на клинках', 'Blade Venom', 'abilityPoison', [5, 10]),
        T('Отравленные клинки', 'Poisoned Blades', 'weaken', [10, 20, 30]),
      ],
    },
    {
      a: [
        T('Второе лезвие', 'Second Edge', 'dmgPct', [12, 24]),
        T('Жажда крови', 'Bloodthirst', 'abilityLifesteal', [10, 20]),
        T('Двойной клинок', 'Twin Blade', 'doubleStrike', [12, 25]),
      ],
      v: [T('Тёмное возрождение', 'Dark Rebirth', 'revive', [30])],
      g: [T('Покров ночи', 'Veil of Night', 'roomGuard', [100])],
    },
  ]),
  ...build('ninja', [
    {
      a: [
        T('Стойка', 'Stance', 'dmgPct', [6, 12]),
        T('Скрытый бросок', 'Hidden Throw', 'basicSplit', [12, 24], [25, 40]),
        T('Путь клинка', 'Way of the Blade', 'dmgPct', [10, 20, 30, 40, 50]),
      ],
      v: [T('Тень ветра', 'Wind Shadow', 'dodge', [5, 10, 15])],
      g: [T('Стойка журавля', 'Crane Stance', 'parry', [5, 10, 15])],
    },
    {
      a: [
        T('Дыхание ветра', 'Wind Breath', 'perkCostDown', [1]),
        T('Тень клинка', 'Blade Shadow', 'perkPower', [25, 50, 75]),
      ],
      v: [
        T('Лёгкость', 'Lightness', 'stepHeal', [2, 4]),
        T('Закалённое тело', 'Tempered Body', 'hpPct', [12, 24, 36]),
      ],
      g: [T('Ки-барьер', 'Ki Barrier', 'resDef', [10, 20, 30])],
    },
    {
      a: [T('Мгновенное исполнение', 'Instant Execution', 'freePerk', [1])],
      v: [T('Исчезновение', 'Vanish', 'cheatDeath', [1])],
      g: [
        T('Отражение', 'Deflection', 'thorns', [10, 20]),
        T('Уклон', 'Sway', 'dodge', [4, 8]),
        T('Ответный сюрикен', 'Return Shuriken', 'thorns', [25, 50]),
      ],
    },
  ]),
];

export const TALENT_BY_ID: Record<string, TalentDef> = Object.fromEntries(TALENTS.map((t) => [t.id, t]));

export const talentsOfClass = (classId: ClassId): TalentDef[] => TALENTS.filter((t) => t.classId === classId);

export const talentsOfTier = (classId: ClassId, tier: number): TalentDef[] =>
  TALENTS.filter((t) => t.classId === classId && t.tier === tier);

/** Цепочка одного пути на ярусе, по порядку. */
export const talentChain = (classId: ClassId, tier: number, path: TalentPath): TalentDef[] =>
  talentsOfTier(classId, tier).filter((t) => t.path === path).sort((a, b) => a.step - b.step);

export const maxRank = (t: TalentDef): number => t.v.length;

/** Значение эффекта на купленном ранге (0 — талант не изучен). */
export const talentValue = (t: TalentDef, rank: number): number => (rank <= 0 ? 0 : t.v[Math.min(rank, t.v.length) - 1]);

/** Второе значение ранга — для эффектов вида «шанс / сила». */
export const talentValue2 = (t: TalentDef, rank: number): number =>
  rank <= 0 || !t.v2 ? 0 : t.v2[Math.min(rank, t.v2.length) - 1];

/** Порядок путей в дереве слева направо. */
export const PATH_ORDER: TalentPath[] = ['attack', 'vitality', 'guard'];
