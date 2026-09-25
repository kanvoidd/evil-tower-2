import type { ClassDef } from '../../classes/interfaces/ClassDef';
import { FULL_BAR } from '../../perks/fullBar';
import type { PerkDef } from '../../perks/interfaces/PerkDef';
import type { TalentDef } from '../../talents/interfaces/TalentDef';
import { HeroFactory } from '../hero-factory/HeroFactory';
import type { LineageDef } from '../interfaces/LineageDef';

/**
 * Маг · мана. Пассивка линейки — самый большой запас ресурса и подбор артефактов;
 * рукой маг не бьёт вовсе, только заклинаниями.
 */
export class MageFactory extends HeroFactory {
  readonly lineage = 'mage';

  createLineage(): LineageDef {
    return this.lineageDef({
      resource: 'mana',
      base: { damage: 5, crit: 5, health: 18, dodge: 0, defense: 0, parry: 0, luck: 1 },
      resMax: 14,
      resRegen: 1,
      goldBonus: 0,
      artifacts: true,
      attack: 'spell',
      // «Аварийный барьер» сжигает всю ману
      cheatDeathPrice: { drainsResource: true, goldShare: 0 },
    });
  }

  createClasses(): ClassDef[] {
    return [
      this.classDef('mage', 0, null),
      this.classDef('magister', 1, 'mage', { damage: 3, health: 5 }),
      this.classDef('necromancer', 2, 'magister', { damage: 4, health: 6, luck: 1 }),
      this.classDef('pyromancer', 2, 'magister', { damage: 6, crit: 5 }),
    ];
  }

  createPerks(): PerkDef[] {
    return [
      this.perk('mage', 'start', {
        ability: 'lightning',
        vfx: 'bolt',
        cost: 3,
        target: 'adjacent',
        ru: 'Удар молнии',
        en: 'Lightning Bolt',
        dru: 'Маг вообще не бьёт рукой — только молнией. Нажмите кнопку способности и выберите соседнего врага (вверх, вниз, влево или вправо): 250% урона заклинанием за 3 маны. Мана восстанавливается всего по 1 за ход — следите за ней: маг, которого зажали со всех сторон с пустой шкалой, обречён.',
        den: 'The mage never strikes with his hands — only with lightning. Tap the ability button and pick an adjacent enemy (up, down, left or right) for 250% spell damage at 3 mana. Mana returns only 1 per turn — watch it: a mage cornered on every side with an empty bar is doomed.',
      }),
      this.perk('mage', 'p2', {
        ability: 'magic_shot',
        vfx: 'arcane',
        cost: 6,
        target: 'line',
        cooldown: 1,
        ru: 'Магический выстрел',
        en: 'Arcane Shot',
        dru: '150% урона по цели на одной линии с героем — но только ЧЕРЕЗ карту: вплотную выстрел не бьёт. Перезарядка 1 ход.',
        den: '150% damage to a target in line with you — but only THROUGH a card: the shot cannot hit an adjacent enemy. 1-turn cooldown.',
      }),
      this.perk('mage', 'p3', {
        ability: 'chain_lightning',
        vfx: 'chain',
        cost: 5,
        target: 'enemy',
        cooldown: 2,
        ru: 'Цепная молния',
        en: 'Chain Lightning',
        dru: 'Бьёт цель и перескакивает по соседним врагам: 100% → 75% → 50%. Перезарядка 2 хода.',
        den: 'Strikes the target and arcs to neighbours: 100% → 75% → 50%. 2-turn cooldown.',
      }),

      this.perk('magister', 'start', {
        ability: 'swap',
        vfx: 'swap',
        cost: 2,
        target: 'two',
        cooldown: 5,
        ru: 'Перестановка',
        en: 'Rearrange',
        dru: 'Поменять местами две любые карты (два касания): подтянуть зелье поближе или убрать голема от героя. Перезарядка 5 ходов.',
        den: 'Swap any two cards (two taps): pull a potion closer or shove a golem away. 5-turn cooldown.',
      }),
      this.perk('magister', 'p2', {
        ability: 'deck_draw',
        vfx: 'arcane',
        cost: 3,
        target: 'any_card',
        cooldown: 4,
        ru: 'Жребий колоды',
        en: 'Draw of Fate',
        dru: 'Отправить выбранную карту (кроме босса) вниз колоды и вытянуть новую на её место. Перезарядка 4 хода.',
        den: 'Send the chosen card (bosses excepted) to the bottom of the deck and draw a new one in its place. 4-turn cooldown.',
      }),
      this.perk('magister', 'p3', {
        ability: 'rewind',
        vfx: 'rewind',
        cost: 6,
        target: 'self',
        once: true,
        ru: 'Откат времени',
        en: 'Rewind',
        dru: 'Раз за комнату отматывает последний ход целиком: поле, здоровье, ресурс. В новой попытке случайность выпадет иначе.',
        den: 'Once per room, rewinds the last turn entirely — board, health, resource. The dice fall differently on the retry.',
      }),

      this.perk('necromancer', 'start', {
        ability: 'corpse_blast',
        vfx: 'corpse',
        cost: 3,
        target: 'enemy',
        cooldown: 1,
        ru: 'Взрыв трупа',
        en: 'Corpse Blast',
        dru: 'Пометьте врага: когда он умрёт, его труп взорвётся — соседи получат половину его максимального здоровья. Помеченные соседи рвутся цепью. Перезарядка 1 ход.',
        den: 'Mark an enemy: when it dies, its corpse bursts — neighbours take half its maximum health. Marked neighbours chain the blast. 1-turn cooldown.',
      }),
      this.perk('necromancer', 'p2', {
        ability: 'ghosts',
        vfx: 'ghost',
        cost: 3,
        target: 'enemy',
        cooldown: 4,
        ru: 'Призрачные слуги',
        en: 'Spectral Servants',
        dru: 'Заразите врага: когда он умрёт, на его месте встанет призрак. Три хода призрак бьёт соседних врагов (вверх, вниз, влево, вправо) на 60% вашего урона. Не больше двух призраков на поле. Перезарядка 4 хода.',
        den: 'Infect an enemy: when it dies, a ghost rises in its place. For three turns the ghost strikes adjacent enemies (up, down, left, right) for 60% of your damage. At most two ghosts at once. 4-turn cooldown.',
      }),
      this.perk('necromancer', 'p3', {
        ability: 'voodoo',
        vfx: 'voodoo',
        cost: 5,
        target: 'enemy',
        cooldown: 2,
        ru: 'Кукла вуду',
        en: 'Voodoo Doll',
        dru: 'Связывает врага: половина урона, который он получает, достаётся всем остальным врагам на поле. Перезарядка 2 хода.',
        den: 'Binds an enemy: half of the damage it takes is dealt to every other enemy on the board. 2-turn cooldown.',
      }),
      this.perk('necromancer', 'legend', {
        ability: 'dead_harvest',
        vfx: 'harvest',
        cost: FULL_BAR,
        target: 'self',
        once: true,
        ru: 'Жатва мёртвых',
        en: 'Harvest of the Dead',
        dru: 'Каждый враг теряет половину текущего здоровья (боссы — четверть). Умершие дают вдвое больше душ.',
        den: 'Every enemy loses half its current health (bosses a quarter). Those that die give double souls.',
      }),

      this.perk('pyromancer', 'start', {
        ability: 'ignite',
        vfx: 'ignite',
        cost: 2,
        target: 'enemy',
        cooldown: 1,
        ru: 'Поджог',
        en: 'Ignite',
        dru: 'Поджигает любого врага на 3 хода. Умерший от огня передаёт пламя соседям. Перезарядка 1 ход.',
        den: 'Sets any enemy ablaze for 3 turns. One that dies burning passes the flame to its neighbours. 1-turn cooldown.',
      }),
      this.perk('pyromancer', 'p2', {
        ability: 'fireball',
        vfx: 'fireball',
        cost: 0,
        target: 'enemy',
        cooldown: 3,
        ru: 'Огненный шар',
        en: 'Fireball',
        dru: 'Дальний бросок: цель получает 120% урона, соседи — 70%, все загораются. Маны не стоит — его сдерживает перезарядка в 3 хода.',
        den: 'A long throw: the target takes 120% damage, neighbours 70%, and everyone catches fire. Costs no mana — a 3-turn cooldown keeps it in check.',
      }),
      this.perk('pyromancer', 'p3', {
        ability: 'detonate',
        vfx: 'detonate',
        cost: 5,
        target: 'self',
        cooldown: 4,
        ru: 'Детонация',
        en: 'Detonation',
        dru: 'Все горящие враги взрываются: 200% урона себе и 100% соседям. Взрывы идут цепью по всему полю. Перезарядка 4 хода.',
        den: 'Every burning enemy explodes for 200% on itself and 100% on its neighbours — the blasts chain across the board. 4-turn cooldown.',
      }),
      this.perk('pyromancer', 'legend', {
        ability: 'inferno',
        vfx: 'inferno',
        cost: FULL_BAR,
        target: 'self',
        once: true,
        ru: 'Инферно',
        en: 'Inferno',
        dru: 'Огненный шторм волнами расходится от героя: все враги горят 5 ходов по 40% вашего урона за ход.',
        den: 'A firestorm rolls out in waves: every enemy burns for 5 turns at 40% of your damage per turn.',
      }),
    ];
  }

  createTalents(): TalentDef[] {
    return [
      ...this.talentTree('mage', [
        {
          a: [
            this.talent('Искра', 'Spark', 'dmgPct', [2, 5, 8]),
            // шанс второго разряда и его сила идут парой; бьёт ту же цель, а не соседа
            this.talent('Раздвоение молнии', 'Forked Bolt', 'boltEcho', [8, 12, 16], [12, 14, 16]),
            this.talent('Сила молнии', 'Bolt Power', 'lightningPower', [5, 10, 15, 20, 25]),
          ],
          v: [this.talent('Запас маны', 'Mana Reserve', 'resMaxPct', [15, 25, 35])],
          g: [this.talent('Мана-щит', 'Mana Shield', 'manaShield', [10, 20, 30])],
        },
        {
          a: [
            this.talent('Мастер артефактов', 'Artifact Master', 'artifactMul', [25, 50, 75]),
            this.talent(
              'Сила магического выстрела',
              'Arcane Shot Power',
              'shotPower',
              [10, 20, 30, 40, 50],
            ),
          ],
          v: [
            this.talent('Шаг сквозь эфир', 'Ether Step', 'stepHeal', [2, 4]),
            this.talent('Мерцание', 'Blink', 'dodge', [4, 8, 12]),
          ],
          g: [
            this.talent('Рунные знаки', 'Runic Sigils', 'def', [2, 4, 6]),
            this.talent('Рунная броня', 'Runic Armour', 'resDef', [10, 20, 30]),
          ],
        },
        {
          a: [
            this.talent('Арканный резонанс', 'Arcane Resonance', 'crit', [3, 9, 12]),
            this.talent('Сила цепной молнии', 'Chain Power', 'chainPower', [10, 15, 20, 25, 30]),
          ],
          v: [
            this.talent('Эфирная плоть', 'Ether Flesh', 'hpPct', [14, 28]),
            this.talent('Аварийный барьер', 'Emergency Ward', 'cheatDeath', [1]),
          ],
          g: [this.talent('Зеркальный щит', 'Mirror Shield', 'thorns', [25])],
        },
      ]),
      ...this.talentTree('magister', [
        {
          a: [
            this.talent('Эхо заклинания', 'Spell Echo', 'abilitySplash', [15, 30]),
            this.talent('Двойное заклинание', 'Twin Cast', 'doubleStrike', [10, 20, 30]),
          ],
          v: [
            this.talent('Эфирная кожа', 'Ethereal Skin', 'hpPct', [8, 16]),
            this.talent('Эфирное тело', 'Ethereal Body', 'hpPct', [16, 30, 45]),
          ],
          g: [this.talent('Антимагия', 'Antimagic', 'magicDr', [10, 20, 30])],
        },
        {
          a: [
            this.talent('Экономия маны', 'Mana Thrift', 'perkCostDown', [1]),
            this.talent('Быстрый каст', 'Swift Cast', 'abilityRefund', [20, 40]),
            this.talent('Высшее искусство', 'Higher Art', 'perkPower', [20, 40, 60]),
          ],
          v: [this.talent('Предвидение', 'Foresight', 'firstHitDown', [15, 30, 45])],
          g: [this.talent('Контрзаклинание', 'Counterspell', 'parry', [5, 10, 15])],
        },
        {
          a: [this.talent('Безмолвный каст', 'Silent Cast', 'freePerk', [1])],
          v: [this.talent('Философский камень', "Philosopher's Stone", 'potionPct', [30, 60])],
          g: [
            this.talent('Щит разума', 'Mind Shield', 'abilityShield', [6, 12]),
            this.talent('Барьер воли', 'Barrier of Will', 'block', [4, 8]),
            this.talent('Абсолютная защита', 'Absolute Ward', 'perkDef', [25, 50]),
          ],
        },
      ]),
      ...this.talentTree('necromancer', [
        {
          a: [
            this.talent('Тлен', 'Decay', 'abilityPoison', [4, 8]),
            this.talent('Взрыв плоти', 'Flesh Burst', 'killBlast', [15, 30]),
            this.talent('Жатва душ', 'Soul Harvest', 'killDmg', [2, 4, 6]),
          ],
          v: [this.talent('Костяной доспех', 'Bone Armour', 'startShield', [10, 20, 30])],
          g: [this.talent('Проклятие слабости', 'Curse of Weakness', 'weaken', [10, 20, 30])],
        },
        {
          a: [this.talent('Некрозис', 'Necrosis', 'perkPower', [25, 50, 75])],
          v: [
            this.talent('Тёмная плоть', 'Dark Flesh', 'hpPct', [8, 16]),
            this.talent('Кража жизни', 'Life Theft', 'abilityLifesteal', [10, 20]),
            this.talent('Собиратель душ', 'Soul Collector', 'killHp', [1, 2, 3]),
          ],
          g: [this.talent('Нечувствительность', 'Numbness', 'dotDr', [20, 40, 60])],
        },
        {
          a: [
            this.talent('Печать смерти', 'Seal of Death', 'abilityVuln', [15, 30]),
            this.talent('Казнь', 'Execution', 'execute', [20]),
          ],
          v: [this.talent('Возвращение', 'Return', 'revive', [30])],
          g: [
            this.talent('Саван', 'Shroud', 'magicDr', [8, 16]),
            this.talent('Проклятая броня', 'Cursed Armour', 'killDefTurn', [20, 40]),
          ],
        },
      ]),
      ...this.talentTree('pyromancer', [
        {
          a: [
            // Синергия: любая способность (в том числе цепная молния мага) начинает поджигать цель.
            this.talent('Живое пламя', 'Living Flame', 'abilityIgnite', [20, 40]),
            this.talent('Поджог', 'Kindling', 'ignite', [8, 16, 25]),
          ],
          v: [
            this.talent('Жаростойкость', 'Heat Resistance', 'dotDr', [15, 30]),
            this.talent('Тлеющий уголь', 'Smouldering Ember', 'lowHpDr', [10, 20, 30]),
          ],
          g: [this.talent('Раскалённая броня', 'Searing Armour', 'def', [4, 9, 15])],
        },
        {
          a: [
            this.talent('Пепел', 'Ash', 'abilitySplash', [20, 40]),
            this.talent('Жар', 'Swelter', 'dmgPct', [8, 16]),
            this.talent('Огненная ярость', 'Fire Fury', 'perkPower', [25, 50, 75]),
          ],
          v: [this.talent('Дым и пламя', 'Smoke and Flame', 'bossDr', [10, 20, 30])],
          g: [this.talent('Огненная стена', 'Wall of Flame', 'block', [4, 8, 12])],
        },
        {
          a: [this.talent('Инферно', 'Inferno', 'critMul', [40, 80])],
          v: [
            this.talent('Угли под кожей', 'Embers Within', 'hpPct', [10, 20]),
            this.talent('Пепельный покров', 'Ashen Shroud', 'bigHitCut', [50]),
          ],
          g: [
            this.talent('Жаровня', 'Brazier', 'thorns', [15, 30]),
            this.talent('Огненный покров', 'Cloak of Fire', 'roomGuard', [100]),
          ],
        },
      ]),
    ];
  }
}
