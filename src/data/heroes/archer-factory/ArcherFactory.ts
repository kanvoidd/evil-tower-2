import type { ClassDef } from '../../classes/interfaces/ClassDef';
import { FULL_BAR } from '../../perks/fullBar';
import type { PerkDef } from '../../perks/interfaces/PerkDef';
import type { TalentDef } from '../../talents/interfaces/TalentDef';
import { HeroFactory } from '../hero-factory/HeroFactory';
import type { LineageDef } from '../interfaces/LineageDef';

/** Лучник · концентрация. Пассивка линейки — самый высокий шанс крита. */
export class ArcherFactory extends HeroFactory {
  readonly lineage = 'archer';

  createLineage(): LineageDef {
    return this.lineageDef({
      resource: 'concentration',
      base: { damage: 3, crit: 18, health: 22, dodge: 4, defense: 0, parry: 0, luck: 0 },
      resMax: 7, resRegen: 2, goldBonus: 0, artifacts: false, melee: true,
    });
  }

  createClasses(): ClassDef[] {
    return [
      this.classDef('archer', 0, null),
      this.classDef('hawkeye', 1, 'archer', { crit: 6, damage: 2, health: 3 }),
      this.classDef('arrowgod', 2, 'hawkeye', { damage: 4, crit: 8 }),
      this.classDef('sniper', 2, 'hawkeye', { damage: 6, dodge: 3 }),
    ];
  }

  createPerks(): PerkDef[] {
    return [
      this.perk('archer', 'start', {
        ability: 'pierce_shot', vfx: 'shot', basic: true, cost: 2, target: 'line',
        ru: 'Сквозной выстрел', en: 'Piercing Shot',
        dru: 'Выстрел через карту: нажмите на врага в двух клетках по прямой — он получит урон, оставаясь вне досягаемости руки.',
        den: 'A shot through a card: tap an enemy two cells away in a straight line and it takes damage from outside melee reach.',
      }),
      this.perk('archer', 'p2', {
        ability: 'diagonal', vfx: 'shot', passive: true,
        ru: 'Косой прицел', en: 'Angled Aim',
        dru: 'Стрелять можно и по диагональным соседям, до которых обычно не дотянуться.',
        den: 'You can also shoot the diagonal neighbours that are normally out of reach.',
      }),
      this.perk('archer', 'p3', {
        ability: 'ricochet', vfx: 'shot', cost: 3, target: 'enemy',
        ru: 'Рикошет', en: 'Ricochet',
        dru: 'Стрела отскакивает от цели к ближайшему врагу (50%), затем ещё раз (25%).',
        den: 'The arrow bounces from the target to the nearest enemy (50%) and then once more (25%).',
      }),

      this.perk('hawkeye', 'start', {
        ability: 'falcon_hunt', vfx: 'arrows', cost: 3, target: 'enemy',
        ru: 'Сокол-охотник', en: 'Hunting Falcon',
        dru: 'Сокол пикирует на любого врага на поле: 120% урона и оглушение.',
        den: 'The falcon dives at any enemy on the board for 120% damage and a stun.',
      }),
      this.perk('hawkeye', 'p2', {
        ability: 'falcon_courier', vfx: 'arrows', cost: 2, target: 'card',
        ru: 'Сокол-курьер', en: 'Falcon Courier',
        dru: 'Сокол приносит любую нужную карту — золото, сундук или зелье, — а герой остаётся на месте.',
        den: 'The falcon fetches any card you need — gold, chest or potion — while you stay put.',
      }),
      this.perk('hawkeye', 'p3', {
        ability: 'eagle_eye', vfx: 'arrows', passive: true,
        ru: 'Орлиный взор', en: "Eagle's Sight",
        dru: 'Над полем видны три верхние карты колоды. Стрелять можно и по соседним врагам — без ответа.',
        den: 'The top three cards of the deck are visible. You may also shoot adjacent enemies — without an answer.',
      }),

      this.perk('arrowgod', 'start', {
        ability: 'double_shot', vfx: 'shot', cost: 3, target: 'enemy',
        ru: 'Двойной выстрел', en: 'Double Shot',
        dru: 'Две стрелы подряд. Если первая убила — вторая летит в ближайшего врага.',
        den: 'Two arrows in a row. If the first one kills, the second flies at the nearest enemy.',
      }),
      this.perk('arrowgod', 'p2', {
        ability: 'hunter_thrill', vfx: 'shot', passive: true,
        ru: 'Азарт охотника', en: "Hunter's Thrill",
        dru: 'Критический выстрел возвращает потраченную концентрацию.',
        den: 'A critical shot refunds the concentration it cost.',
      }),
      this.perk('arrowgod', 'p3', {
        ability: 'arrow_rain', vfx: 'arrows', cost: 4, target: 'self',
        ru: 'Дождь стрел', en: 'Arrow Rain',
        dru: 'Пять стрел падают с неба на случайных врагов, по 60% урона каждая.',
        den: 'Five arrows fall from the sky onto random enemies for 60% damage each.',
      }),
      this.perk('arrowgod', 'legend', {
        ability: 'starfall', vfx: 'arrows', cost: FULL_BAR, target: 'self', once: true,
        ru: 'Звездопад', en: 'Starfall',
        dru: 'Небо чернеет от стрел: каждый враг получает три попадания по 60% с отдельными критами.',
        den: 'The sky goes black with arrows: every enemy takes three hits of 60%, each rolling its own crit.',
      }),

      this.perk('sniper', 'start', {
        ability: 'rail_shot', vfx: 'shot', cost: 3, target: 'enemy',
        ru: 'Пробивающий выстрел', en: 'Rail Shot',
        dru: 'Стрела пробивает всю линию: все враги в ряду или столбце цели получают урон, каждый следующий на 20% слабее.',
        den: 'The arrow punches through the whole line: every enemy in the target’s row or column is hit, each 20% weaker than the last.',
      }),
      this.perk('sniper', 'p2', {
        ability: 'armor_piercing', vfx: 'shot', cost: 3, target: 'enemy',
        ru: 'Бронебойный', en: 'Armour Piercer',
        dru: 'Выстрел с бонусом в 25% максимального здоровья цели. Главные жертвы — големы и боссы.',
        den: 'A shot with a bonus equal to 25% of the target’s maximum health. Golems and bosses suffer most.',
      }),
      this.perk('sniper', 'p3', {
        ability: 'hunters_mark', vfx: 'mark', passive: true,
        ru: 'Охотничья метка', en: "Hunter's Mark",
        dru: 'Первый выстрел по неповреждённому врагу всегда критический.',
        den: 'Your first shot at an undamaged enemy always crits.',
      }),
      this.perk('sniper', 'legend', {
        ability: 'one_shot', vfx: 'beam', cost: FULL_BAR, target: 'enemy', once: true,
        ru: 'Один выстрел — один труп', en: 'One Shot, One Kill',
        dru: 'Время замедляется: выстрел мгновенно убивает любого не-босса и летит дальше по линии, до трёх убийств. Босс теряет 40% максимального здоровья.',
        den: 'Time slows: the shot instantly kills any non-boss and travels on down the line, up to three kills. A boss loses 40% of its maximum health.',
      }),
    ];
  }

  createTalents(): TalentDef[] {
    return [
      ...this.talentTree('archer', [
        {
          a: [
            this.talent('Твёрдая рука', 'Steady Hand', 'crit', [3, 6]),
            this.talent('Двойной наконечник', 'Split Tip', 'basicSplit', [12, 24], [25, 40]),
            this.talent('Меткость', 'Marksmanship', 'crit', [4, 8, 12, 16, 20]),
          ],
          v: [this.talent('Лёгкие ноги', 'Light Feet', 'dodge', [4, 8, 12])],
          g: [this.talent('Кожаная броня', 'Leather Armour', 'def', [3, 7, 12])],
        },
        {
          a: [this.talent('Точный выстрел', 'Precise Shot', 'perkPower', [15, 30, 45])],
          v: [
            this.talent('Бег налегке', 'Travel Light', 'stepHeal', [2, 4]),
            this.talent('Закалка', 'Toughening', 'hpPct', [12, 24, 36]),
          ],
          g: [
            this.talent('Наручи лучника', "Archer's Bracers", 'parry', [3, 6]),
            this.talent('Отбить стрелой', 'Arrow Parry', 'parry', [4, 8, 12]),
          ],
        },
        {
          a: [
            this.talent('Натяжение тетивы', 'Draw Weight', 'dmgPct', [12, 24]),
            this.talent('Добить', 'Finish Off', 'lowHpDmg', [30, 60]),
          ],
          v: [this.talent('Ускользнуть', 'Slip Away', 'cheatDeath', [1])],
          g: [
            this.talent('Трофеи', 'Trophies', 'killDefStack', [2, 4]),
            this.talent('Охотничий трофей', 'Hunting Trophy', 'killDefTurn', [20, 40]),
          ],
        },
      ]),
      ...this.talentTree('hawkeye', [
        {
          a: [this.talent('Зоркий глаз', 'Keen Eye', 'fullHpDmg', [15, 30, 45])],
          v: [
            this.talent('Ровное дыхание', 'Even Breath', 'hpPct', [8, 16]),
            this.talent('Инстинкт', 'Instinct', 'lowHpDr', [10, 20, 30]),
          ],
          g: [
            this.talent('Выделка кож', 'Hide Curing', 'def', [3, 6]),
            this.talent('Кожевенное мастерство', "Tanner's Craft", 'armorBonus', [15, 30, 45]),
          ],
        },
        {
          a: [
            this.talent('Сила выстрела', 'Shot Power', 'dmgPct', [10, 20]),
            this.talent('Сокольничий', 'Falconer', 'abilityStun', [10, 20]),
            this.talent('Выверенный выстрел', 'Measured Shot', 'perkPower', [20, 40, 60]),
          ],
          v: [this.talent('Добыча', 'Quarry', 'killHp', [1, 2, 3])],
          g: [this.talent('Прикрытие', 'Cover', 'firstHitDown', [15, 30, 45])],
        },
        {
          a: [
            this.talent('Бронебойные наконечники', 'Armour Piercers', 'pierce', [15]),
            this.talent('Пробивание', 'Penetration', 'pierce', [50]),
          ],
          v: [
            this.talent('Дыхание охотника', "Hunter's Breath", 'potionPct', [20, 40]),
            this.talent('Осторожность', 'Caution', 'bossDr', [15, 30]),
          ],
          g: [this.talent('Сокол-хранитель', 'Guardian Falcon', 'roomGuard', [100])],
        },
      ]),
      ...this.talentTree('arrowgod', [
        {
          a: [
            this.talent('Быстрая тетива', 'Swift String', 'abilityRefund', [15, 30]),
            this.talent('Град стрел', 'Arrow Hail', 'doubleStrike', [10, 20, 30]),
          ],
          v: [
            this.talent('Плоть героя', 'Heroic Flesh', 'hpPct', [8, 16]),
            this.talent('Божественная стойкость', 'Divine Endurance', 'hpPct', [16, 30, 45]),
          ],
          g: [this.talent('Небесный покров', 'Heavenly Veil', 'magicDr', [10, 20, 30])],
        },
        {
          a: [this.talent('Дождь стрел', 'Arrow Shower', 'perkPower', [25, 50, 75])],
          v: [this.talent('Звёздный щит', 'Star Shield', 'startShield', [8, 15, 22])],
          g: [
            this.talent('Оперение', 'Fletching', 'def', [3, 6]),
            this.talent('Ответный залп', 'Return Volley', 'thorns', [10, 20]),
            this.talent('Стрелы возмездия', 'Arrows of Retribution', 'thorns', [15, 30, 45]),
          ],
        },
        {
          a: [
            this.talent('Благословение лука', 'Blessed Bow', 'abilityCrit', [8, 16]),
            this.talent('Залп', 'Volley', 'abilitySplash', [20, 40]),
            this.talent('Божественный выстрел', 'Divine Shot', 'freePerk', [1]),
          ],
          v: [this.talent('Дар богов', 'Gift of the Gods', 'potionPct', [30, 60])],
          g: [this.talent('Воля богов', 'Will of the Gods', 'perkDef', [25, 50])],
        },
      ]),
      ...this.talentTree('sniper', [
        {
          a: [
            this.talent('Дыхание стрелка', "Shooter's Breath", 'critMul', [15, 30]),
            this.talent('Слабая точка', 'Soft Spot', 'abilityCrit', [8, 16]),
            this.talent('Прицел', 'Scope', 'critMul', [25, 50, 75]),
          ],
          v: [this.talent('Голова босса', "Boss's Head", 'bossHp', [5, 10, 15])],
          g: [this.talent('Хладнокровие', 'Composure', 'highHpDef', [10, 20, 30])],
        },
        {
          a: [
            this.talent('Расчёт', 'Calculation', 'abilityVuln', [15, 30]),
            this.talent('Выстрел в голову', 'Headshot', 'perkPower', [25, 50, 75]),
          ],
          v: [
            this.talent('Крепкие нервы', 'Firm Nerves', 'hpPct', [8, 16]),
            this.talent('Стальные нервы', 'Steel Nerves', 'bigHitCut', [25, 50]),
          ],
          g: [this.talent('Выстрел в колено', 'Kneecapper', 'weaken', [10, 20, 30])],
        },
        {
          a: [this.talent('Тот самый выстрел', 'The Shot', 'roomCrit', [1])],
          v: [this.talent('Последний шанс', 'Last Chance', 'revive', [25])],
          g: [
            this.talent('Маскировка', 'Camouflage', 'firstHitDown', [12, 24]),
            this.talent('Окоп', 'Foxhole', 'def', [4, 8]),
            this.talent('Укрытие', 'Cover Position', 'block', [5, 10]),
          ],
        },
      ]),
    ];
  }
}
