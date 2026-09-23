import type { ClassDef } from '../../classes/interfaces/ClassDef';
import { FULL_BAR } from '../../perks/fullBar';
import type { PerkDef } from '../../perks/interfaces/PerkDef';
import type { TalentDef } from '../../talents/interfaces/TalentDef';
import { HeroFactory } from '../hero-factory/HeroFactory';
import type { LineageDef } from '../interfaces/LineageDef';

/** Наёмник · осмотрительность. Пассивка линейки — +20% золота. */
export class MercenaryFactory extends HeroFactory {
  readonly lineage = 'mercenary';

  createLineage(): LineageDef {
    return this.lineageDef({
      resource: 'vigilance',
      base: { damage: 3, crit: 10, health: 22, dodge: 5, defense: 0, parry: 0, luck: 0 },
      resMax: 7, resRegen: 2, goldBonus: 0.2, artifacts: false, melee: true,
    });
  }

  createClasses(): ClassDef[] {
    return [
      this.classDef('mercenary', 0, null),
      this.classDef('assassin', 1, 'mercenary', { crit: 8, dodge: 5, health: 3 }),
      this.classDef('darkassassin', 2, 'assassin', { damage: 4, crit: 10 }),
      this.classDef('ninja', 2, 'assassin', { dodge: 12, damage: 3 }),
    ];
  }

  createPerks(): PerkDef[] {
    return [
      this.perk('mercenary', 'start', {
        ability: 'backstab', vfx: 'smoke', basic: true, cost: 4, target: 'enemy',
        ru: 'Удар в спину', en: 'Backstab',
        dru: 'Телепорт за спину любого врага на поле и гарантированный критический удар без ответа.',
        den: 'Teleport behind any enemy on the board and land a guaranteed critical hit with no answer.',
      }),
      this.perk('mercenary', 'p2', {
        ability: 'bribe', vfx: 'smoke', goldCost: 0.25, target: 'enemy',
        ru: 'Подкуп', en: 'Bribe',
        dru: 'Вы платите 25% золота из кошеля комнаты (минимум 5): не-босс уходит с поля. Ни души, ни золота за него — только безопасность.',
        den: 'You pay 25% of the room pouch (at least 5) and a non-boss simply leaves. No souls, no gold — only safety.',
      }),
      this.perk('mercenary', 'p3', {
        ability: 'cold_blood', vfx: 'smoke', passive: true,
        ru: 'Хладнокровие', en: 'Cold Blood',
        dru: 'Удар в спину, убивший врага, возвращает 3 осмотрительности.',
        den: 'A backstab that kills refunds 3 vigilance.',
      }),

      this.perk('assassin', 'start', {
        ability: 'shadow_dance', vfx: 'smoke', passive: true,
        ru: 'Танец теней', en: 'Dance of Shadows',
        dru: 'Удар в спину, убивший врага, бесплатно телепортирует героя к самому слабому врагу. Цепь до трёх ударов.',
        den: 'A backstab that kills teleports you to the weakest enemy for free — a chain of up to three strikes.',
      }),
      this.perk('assassin', 'p2', {
        ability: 'sentence', vfx: 'mark', cost: 2, target: 'enemy',
        ru: 'Приговор', en: 'Death Sentence',
        dru: 'Цель получает на 50% больше урона от всех источников. Её смерть возвращает всю осмотрительность.',
        den: 'The target takes 50% more damage from every source. Its death refunds all of your vigilance.',
      }),
      this.perk('assassin', 'p3', {
        ability: 'lethal_dose', vfx: 'dark', passive: true,
        ru: 'Смертельная доза', en: 'Lethal Dose',
        dru: 'Удар в спину отравляет: 10% максимального здоровья за ход, 3 хода (у боссов — 5%).',
        den: 'A backstab poisons: 10% of maximum health per turn for 3 turns (5% on bosses).',
      }),

      this.perk('darkassassin', 'start', {
        ability: 'death_mark', vfx: 'mark', cost: 3, target: 'enemy',
        ru: 'Клеймо смерти', en: 'Death Mark',
        dru: 'Череп с отсчётом на карточке: через три хода враг умирает, а босс теряет 30% максимального здоровья.',
        den: 'A counting skull appears on the card: after three turns the enemy dies, and a boss loses 30% of its maximum health.',
      }),
      this.perk('darkassassin', 'p2', {
        ability: 'chain_mark', vfx: 'mark', passive: true,
        ru: 'Цепное клеймо', en: 'Chained Mark',
        dru: 'Когда помеченный враг умирает, клеймо перескакивает на ближайшего.',
        den: 'When a marked enemy dies, the mark leaps to the nearest one.',
      }),
      this.perk('darkassassin', 'p3', {
        ability: 'shadow_reap', vfx: 'dark', cost: 5, target: 'self',
        ru: 'Жатва теней', en: 'Shadow Reaping',
        dru: 'Все помеченные враги умирают мгновенно (боссы теряют 30% максимального здоровья).',
        den: 'Every marked enemy dies at once (bosses lose 30% of their maximum health).',
      }),
      this.perk('darkassassin', 'legend', {
        ability: 'reaper', vfx: 'dark', cost: FULL_BAR, target: 'self', once: true,
        ru: 'Жнец', en: 'Reaper',
        dru: 'Три хода жатвы: удар в спину бесплатен и убивает любого не-босса, а каждое убийство продлевает жатву на ход.',
        den: 'Three turns of reaping: the backstab is free and kills any non-boss, and every kill extends the reaping by a turn.',
      }),

      this.perk('ninja', 'start', {
        ability: 'shuriken_fan', vfx: 'blades', cost: 3, target: 'self',
        ru: 'Веер сюрикенов', en: 'Shuriken Fan',
        dru: 'Четыре сюрикена летят в ближайших врагов по 60% урона с отдельными критами.',
        den: 'Four shuriken fly at the nearest enemies for 60% each, rolling separate crits and drawing no answer.',
      }),
      this.perk('ninja', 'p2', {
        ability: 'substitution', vfx: 'smoke', passive: true,
        ru: 'Подмена', en: 'Substitution',
        dru: 'При успешном увороте герой исчезает, оставив бревно, появляется за спиной нападавшего и бьёт критом.',
        den: 'On a successful dodge you vanish, leaving a log behind, reappear at the attacker’s back and strike a crit.',
      }),
      this.perk('ninja', 'p3', {
        ability: 'smoke_screen', vfx: 'smoke', cost: 4, target: 'self',
        ru: 'Дымовая завеса', en: 'Smoke Screen',
        dru: 'Два хода враги не отвечают на ваши удары — поле в дыму.',
        den: 'For two turns enemies never answer your blows — the board is full of smoke.',
      }),
      this.perk('ninja', 'legend', {
        ability: 'wind_shadow', vfx: 'blades', cost: FULL_BAR, target: 'self', once: true,
        ru: 'Тень ветра', en: 'Wind Shadow',
        dru: 'Герой проносится по всему полю и бьёт каждого врага дважды, второй удар — критический.',
        den: 'You sweep across the whole board and hit every enemy twice — the second blow is a crit.',
      }),
    ];
  }

  createTalents(): TalentDef[] {
    return [
      ...this.talentTree('mercenary', [
        {
          a: [
            this.talent('Наводка', 'Spotting', 'abilityVuln', [10, 20]),
            this.talent('Хватка наёмника', "Sellsword's Grip", 'dmgPct', [10, 20, 30]),
          ],
          v: [this.talent('Закалка наёмника', "Sellsword's Grit", 'hpPct', [16, 30, 45])],
          g: [
            this.talent('Подкладка', 'Padding', 'def', [2, 5]),
            this.talent('Кольчуга', 'Chainmail', 'def', [3, 7, 12]),
          ],
        },
        {
          a: [
            this.talent('Грязный приём', 'Dirty Trick', 'abilityStun', [10, 20]),
            this.talent('Отработанный удар', 'Practised Strike', 'abilityRefund', [20, 40]),
            this.talent('Удар в спину', 'Backstabber', 'perkPower', [15, 30, 45]),
          ],
          v: [this.talent('Запас на чёрный день', 'Rainy Day Fund', 'potionPct', [20, 40, 60])],
          g: [this.talent('Трофейный доспех', 'Trophy Armour', 'killDefStack', [2, 4, 6])],
        },
        {
          a: [this.talent('Нож в рукаве', 'Sleeve Knife', 'crit', [10, 20])],
          v: [
            this.talent('Страховка', 'Insurance', 'hpPct', [10, 20]),
            this.talent('Откупиться', 'Buy Your Life', 'cheatDeath', [1]),
          ],
          g: [
            this.talent('Торг за броню', 'Haggling', 'armorBonus', [15, 30]),
            this.talent('Купленная броня', 'Bought Armour', 'armorBonus', [25, 50]),
          ],
        },
      ]),
      ...this.talentTree('assassin', [
        {
          a: [
            this.talent('Уязвимая точка', 'Vital Point', 'abilityCrit', [8, 16]),
            this.talent('Отравленная сталь', 'Poisoned Steel', 'abilityPoison', [4, 8]),
            this.talent('Смертельная точность', 'Deadly Precision', 'critMul', [25, 50, 75]),
          ],
          v: [this.talent('Хладная кровь', 'Cold Blood', 'bossDr', [10, 20, 30])],
          g: [this.talent('Скрытность', 'Stealth', 'firstHitDown', [15, 30, 45])],
        },
        {
          a: [this.talent('Смертельный клинок', 'Deadly Blade', 'perkPower', [20, 40, 60])],
          v: [
            this.talent('Жилистость', 'Wiry Build', 'hpPct', [8, 16]),
            this.talent('Кровавая расплата', 'Blood Price', 'abilityLifesteal', [10, 20]),
            this.talent('Кровавый контракт', 'Blood Contract', 'killHp', [1, 2, 3]),
          ],
          g: [this.talent('Дымовая шашка', 'Smoke Bomb', 'perkDef', [10, 20, 30])],
        },
        {
          a: [
            this.talent('Агония', 'Agony', 'dmgPct', [12, 24]),
            this.talent('Казнь', 'Execution', 'execute', [20]),
          ],
          v: [this.talent('Плащ теней', 'Shadow Cloak', 'startShield', [10, 20])],
          g: [
            this.talent('Танец клинков', 'Blade Dance', 'dodge', [4, 8]),
            this.talent('Ловкий уход', 'Nimble Escape', 'block', [5, 10]),
          ],
        },
      ]),
      ...this.talentTree('darkassassin', [
        {
          a: [this.talent('Ночной клинок', 'Night Blade', 'fullHpDmg', [15, 30, 45])],
          v: [
            this.talent('Тьма в жилах', 'Dark in the Veins', 'hpPct', [8, 16]),
            this.talent('Пакт теней', 'Shadow Pact', 'lowHpDr', [10, 20, 30]),
          ],
          g: [
            this.talent('Тень на коже', 'Shadowskin', 'magicDr', [6, 12]),
            this.talent('Проклятый плащ', 'Cursed Cloak', 'magicDr', [10, 20, 30]),
          ],
        },
        {
          a: [
            this.talent('Клеймо охотника', "Hunter's Brand", 'abilityVuln', [15, 30]),
            this.talent('Владыка теней', 'Shadow Lord', 'perkPower', [25, 50, 75]),
          ],
          v: [this.talent('Тёмный покров', 'Dark Shroud', 'bigHitCut', [25, 50])],
          g: [
            this.talent('Яд на клинках', 'Blade Venom', 'abilityPoison', [5, 10]),
            this.talent('Отравленные клинки', 'Poisoned Blades', 'weaken', [10, 20, 30]),
          ],
        },
        {
          a: [
            this.talent('Второе лезвие', 'Second Edge', 'dmgPct', [12, 24]),
            this.talent('Жажда крови', 'Bloodthirst', 'abilityLifesteal', [10, 20]),
            this.talent('Двойной клинок', 'Twin Blade', 'doubleStrike', [12, 25]),
          ],
          v: [this.talent('Тёмное возрождение', 'Dark Rebirth', 'revive', [30])],
          g: [this.talent('Покров ночи', 'Veil of Night', 'roomGuard', [100])],
        },
      ]),
      ...this.talentTree('ninja', [
        {
          a: [
            this.talent('Стойка', 'Stance', 'dmgPct', [6, 12]),
            this.talent('Скрытый бросок', 'Hidden Throw', 'basicSplit', [12, 24], [25, 40]),
            this.talent('Путь клинка', 'Way of the Blade', 'dmgPct', [10, 20, 30, 40, 50]),
          ],
          v: [this.talent('Тень ветра', 'Wind Shadow', 'dodge', [5, 10, 15])],
          g: [this.talent('Стойка журавля', 'Crane Stance', 'parry', [5, 10, 15])],
        },
        {
          a: [
            this.talent('Дыхание ветра', 'Wind Breath', 'perkCostDown', [1]),
            this.talent('Тень клинка', 'Blade Shadow', 'perkPower', [25, 50, 75]),
          ],
          v: [
            this.talent('Лёгкость', 'Lightness', 'stepHeal', [2, 4]),
            this.talent('Закалённое тело', 'Tempered Body', 'hpPct', [12, 24, 36]),
          ],
          g: [this.talent('Ки-барьер', 'Ki Barrier', 'resDef', [10, 20, 30])],
        },
        {
          a: [this.talent('Мгновенное исполнение', 'Instant Execution', 'freePerk', [1])],
          v: [this.talent('Исчезновение', 'Vanish', 'cheatDeath', [1])],
          g: [
            this.talent('Отражение', 'Deflection', 'thorns', [10, 20]),
            this.talent('Уклон', 'Sway', 'dodge', [4, 8]),
            this.talent('Ответный сюрикен', 'Return Shuriken', 'thorns', [25, 50]),
          ],
        },
      ]),
    ];
  }
}
