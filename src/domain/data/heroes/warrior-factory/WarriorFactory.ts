import { HandAttack } from '../../../logic/hero/attack/hand-attack/HandAttack';
import type { ClassDef } from '../../classes/interfaces/ClassDef';
import { FULL_BAR } from '../../perks/fullBar';
import type { PerkDef } from '../../perks/interfaces/PerkDef';
import type { TalentDef } from '../../talents/interfaces/TalentDef';
import { HeroFactory } from '../hero-factory/HeroFactory';
import type { LineageDef } from '../interfaces/LineageDef';

/** Воин · выносливость. Пассивка линейки — самый большой запас здоровья. */
export class WarriorFactory extends HeroFactory {
  readonly lineage = 'warrior';

  createLineage(): LineageDef {
    return this.lineageDef({
      resource: 'stamina',
      base: { damage: 3, crit: 5, health: 30, dodge: 0, defense: 1, parry: 0, luck: 0 },
      resMax: 10, resRegen: 1, goldBonus: 0, artifacts: false,
      attack: new HandAttack(),
      cheatDeathPrice: { drainsResource: false, goldShare: 0 },
    });
  }

  createClasses(): ClassDef[] {
    return [
      this.classDef('warrior', 0, null),
      this.classDef('knight', 1, 'warrior', { health: 10, defense: 2 }),
      this.classDef('berserk', 2, 'knight', { damage: 4, crit: 5, health: 6 }),
      this.classDef('paladin', 2, 'knight', { defense: 3, health: 12, parry: 5 }),
    ];
  }

  createPerks(): PerkDef[] {
    return [
      this.perk('warrior', 'start', {
        ability: 'power_strike', vfx: 'slam', cost: 3, target: 'adjacent',
        ru: 'Мощный удар', en: 'Power Strike',
        dru: 'Следующий удар вдвое сильнее. Излишек урона проламывает цель и бьёт врага за ней по той же линии.',
        den: 'Your next blow hits twice as hard. Overkill damage punches through into the enemy behind the target.',
      }),
      this.perk('warrior', 'p2', {
        ability: 'earthquake', vfx: 'quake', cost: 6, target: 'self',
        ru: 'Землетрясение', en: 'Earthquake',
        dru: 'Топот по земле: все враги в ряду и столбце героя получают 60% урона и оглушены.',
        den: 'A ground stomp: every enemy in the hero’s row and column takes 60% damage and is stunned.',
      }),
      this.perk('warrior', 'p3', {
        ability: 'never_give_up', vfx: 'quake', passive: true,
        ru: 'Не сдамся', en: 'Never Give Up',
        dru: 'Раз за комнату смертельный удар оставляет 1 здоровья и взрывается ударной волной: все враги получают вдвое больше урона, чем приняли вы.',
        den: 'Once per room a lethal blow leaves you at 1 HP and bursts into a shockwave: every enemy takes twice the damage you absorbed.',
      }),

      this.perk('knight', 'start', {
        ability: 'shield_bash', vfx: 'slam', cost: 3, target: 'adjacent',
        ru: 'Таран щитом', en: 'Shield Bash',
        dru: 'Удар с отбросом: враг отлетает на клетку назад и меняется местами с картой за ним. Оба получают урон от столкновения, у края поля — вдвое. Цель оглушена.',
        den: 'A shoving blow: the enemy is knocked one cell back and swaps with the card behind it. Both take collision damage — doubled against the wall. The target is stunned.',
      }),
      this.perk('knight', 'p2', {
        ability: 'war_cry', vfx: 'banner', cost: 5, target: 'self',
        ru: 'Боевой клич', en: 'War Cry',
        dru: 'Над полем разворачивается знамя: атака всех врагов на поле падает на 40% до конца комнаты.',
        den: 'A banner unfurls over the board: every enemy loses 40% attack until the room ends.',
      }),
      this.perk('knight', 'p3', {
        ability: 'duel', vfx: 'swap', cost: 4, target: 'self',
        ru: 'Вызов на дуэль', en: 'Challenge',
        dru: 'Самый опасный враг перелетает в клетку рядом с героем и оглушён — голема или босса можно бить без ответа.',
        den: 'The deadliest enemy is dragged to a cell next to you and stunned — a golem or boss can be hit without answering.',
      }),

      this.perk('berserk', 'start', {
        ability: 'whirlwind', vfx: 'blades', cost: 4, target: 'self',
        ru: 'Вихрь', en: 'Whirlwind',
        dru: 'Герой раскручивается и бьёт всех соседних врагов на 70% урона.',
        den: 'You spin and strike every adjacent enemy for 70% damage.',
      }),
      this.perk('berserk', 'p2', {
        ability: 'rage', vfx: 'slam', passive: true,
        ru: 'Ярость', en: 'Rage',
        dru: 'Каждые 2 потерянных единицы здоровья дают 1 выносливости. Чем больнее — тем чаще Вихрь.',
        den: 'Every 2 HP you lose grants 1 stamina. The more it hurts, the more often you whirl.',
      }),
      this.perk('berserk', 'p3', {
        ability: 'carnage', vfx: 'blades', passive: true,
        ru: 'Резня', en: 'Carnage',
        dru: 'Убийства подряд копят +20% урона за каждое, до +80%. Ход без убийства обнуляет бонус.',
        den: 'Consecutive kills stack +20% damage each, up to +80%. A turn without a kill resets it.',
      }),
      this.perk('berserk', 'legend', {
        ability: 'madness', vfx: 'blades', cost: FULL_BAR, target: 'self', once: true,
        ru: 'Безумие берсерка', en: "Berserker's Madness",
        dru: 'Три хода красной пелены: каждый удар задевает всех соседей цели, выжившие не отвечают. В конце герой теряет 20% текущего здоровья.',
        den: 'Three turns of red haze: every blow splashes onto the target’s neighbours and survivors never answer. At the end you lose 20% of your current HP.',
      }),

      this.perk('paladin', 'start', {
        ability: 'holy_wrath', vfx: 'holy', cost: 3, target: 'adjacent',
        ru: 'Святая кара', en: 'Holy Wrath',
        dru: 'Удар светом в полтора раза сильнее, а по нежити и демонам — втрое.',
        den: 'A strike of light at 1.5× damage — or 3× against undead and demons.',
      }),
      this.perk('paladin', 'p2', {
        ability: 'justice_beam', vfx: 'beam', cost: 5, target: 'enemy',
        ru: 'Луч правосудия', en: 'Beam of Justice',
        dru: 'Столб света бьёт весь столбец выбранной карты: каждый враг получает полный урон, нежить и демоны — двойной.',
        den: 'A pillar of light sweeps the target’s whole column: every enemy takes full damage, undead and demons take double.',
      }),
      this.perk('paladin', 'p3', {
        ability: 'verdict', vfx: 'holy', cost: 6, target: 'self',
        ru: 'Вердикт', en: 'Verdict',
        dru: 'Золотые колонны обрушиваются на поле: все враги, у которых здоровья не больше 150% вашего урона, гибнут сразу (кроме боссов).',
        den: 'Golden pillars crash down: every enemy at or below 150% of your damage dies instantly (bosses excepted).',
      }),
      this.perk('paladin', 'legend', {
        ability: 'heavens_wrath', vfx: 'holy', cost: FULL_BAR, target: 'self', once: true,
        ru: 'Гнев небес', en: 'Wrath of Heaven',
        dru: 'Небо раскалывается: каждый враг получает двойной урон (нежить и демоны — четырёхкратный) и оглушён.',
        den: 'The sky splits: every enemy takes double damage — quadruple for undead and demons — and is stunned.',
      }),
    ];
  }

  createTalents(): TalentDef[] {
    return [
      ...this.talentTree('warrior', [
        {
          a: [
            this.talent('Разминка', 'Warm-Up', 'dmgPct', [4, 8]),
            this.talent('Широкий замах', 'Wide Swing', 'critMul', [15, 30]),
            this.talent('Тяжёлая рука', 'Heavy Hand', 'dmgPct', [10, 20, 30, 40, 50]),
          ],
          v: [this.talent('Закалка', 'Hardening', 'hpPct', [15, 28, 40])],
          g: [this.talent('Толстая шкура', 'Thick Hide', 'def', [3, 7, 12])],
        },
        {
          a: [this.talent('Сокрушение', 'Crushing Blow', 'perkPower', [15, 30, 45])],
          v: [
            this.talent('Второе дыхание', 'Second Wind', 'stepHeal', [2, 4]),
            this.talent('Упорство', 'Stubbornness', 'lowHpDr', [10, 20, 30]),
          ],
          g: [
            this.talent('Наручи', 'Bracers', 'def', [2, 4]),
            this.talent('Отбить удар', 'Deflect', 'parry', [5, 10, 15]),
          ],
        },
        {
          a: [this.talent('Раскол', 'Cleave', 'pierce', [50])],
          v: [this.talent('Несокрушимый', 'Unbreakable', 'cheatDeath', [1])],
          g: [
            this.talent('Выучка', 'Drill', 'parry', [3, 6]),
            this.talent('Глухая стойка', 'Tight Guard', 'block', [4, 8]),
            this.talent('Контрудар', 'Riposte', 'counterBuff', [60]),
          ],
        },
      ]),
      ...this.talentTree('knight', [
        {
          a: [
            this.talent('Окованный умбон', 'Iron Boss', 'abilityStun', [10, 20]),
            this.talent('Удар щитом', 'Shield Strike', 'defDmg', [25, 50, 75]),
          ],
          v: [
            this.talent('Обет', 'Oath', 'hpPct', [10, 20]),
            this.talent('Стойкость', 'Fortitude', 'bossDr', [10, 20, 30]),
          ],
          g: [this.talent('Латы', 'Plate Armour', 'armorBonus', [15, 30, 45])],
        },
        {
          a: [this.talent('Рыцарский долг', 'Knightly Duty', 'perkPower', [20, 40, 60])],
          v: [this.talent('Барьер', 'Barrier', 'startShield', [8, 15, 22])],
          g: [
            this.talent('Наплечники', 'Pauldrons', 'def', [3, 6]),
            this.talent('Отражённый выпад', 'Turned Lunge', 'thorns', [10, 20]),
            this.talent('Стальные шипы', 'Steel Spikes', 'thorns', [15, 30, 45]),
          ],
        },
        {
          a: [
            this.talent('Турнирный опыт', 'Tourney Lessons', 'critMul', [20, 40]),
            this.talent('Натиск', 'Onslaught', 'abilitySplash', [20, 40]),
            this.talent('Рыцарский выпад', "Knight's Lunge", 'critMul', [40, 80]),
          ],
          v: [this.talent('Слава победителя', "Victor's Glory", 'bossHp', [6, 12])],
          g: [this.talent('Несгибаемая стена', 'Unyielding Wall', 'roomGuard', [100])],
        },
      ]),
      ...this.talentTree('berserk', [
        {
          a: [this.talent('Ярость', 'Fury', 'rageDmg', [15, 30, 45])],
          v: [
            this.talent('Толстые кости', 'Thick Bones', 'hpPct', [8, 16]),
            this.talent('Звериный нюх', 'Beast Sense', 'dodge', [3, 6]),
            this.talent('Безумие', 'Madness', 'block', [4, 8, 12]),
          ],
          g: [this.talent('Шрамы', 'Scars', 'scarDef', [3, 6, 9])],
        },
        {
          a: [
            this.talent('Кровь за кровь', 'Blood for Blood', 'abilityLifesteal', [10, 20]),
            this.talent('Неистовство', 'Frenzy', 'perkPower', [25, 50, 75]),
          ],
          v: [this.talent('Боевой опыт', 'Battle Experience', 'killHp', [1, 2, 3])],
          g: [
            this.talent('Дублёная кожа', 'Tanned Hide', 'dotDr', [15, 30]),
            this.talent('Толстокожий', 'Thick Skinned', 'dotDr', [30, 60]),
          ],
        },
        {
          a: [this.talent('Двойной удар', 'Double Strike', 'doubleStrike', [12, 25])],
          v: [
            this.talent('Живучесть', 'Hardiness', 'hpPct', [10, 20]),
            this.talent('Предел боли', 'Pain Threshold', 'bigHitCut', [50]),
          ],
          g: [
            this.talent('Ярость крови', 'Blood Rage', 'abilityShield', [8, 16]),
            this.talent('Кровавая пелена', 'Blood Veil', 'perkDef', [15, 30]),
          ],
        },
      ]),
      ...this.talentTree('paladin', [
        {
          a: [this.talent('Священный гнев', 'Sacred Wrath', 'bossDmg', [15, 30, 45])],
          v: [this.talent('Свет жизни', 'Light of Life', 'hpPct', [12, 24, 36])],
          g: [
            this.talent('Молитва', 'Prayer', 'magicDr', [6, 12]),
            this.talent('Щит веры', 'Shield of Faith', 'abilityShield', [6, 12]),
            this.talent('Святая защита', 'Holy Guard', 'magicDr', [10, 20, 30]),
          ],
        },
        {
          a: [
            this.talent('Длань суда', 'Hand of Judgement', 'abilityStun', [12, 24]),
            this.talent('Карающий свет', 'Punishing Light', 'perkPower', [25, 50, 75]),
          ],
          v: [
            this.talent('Благодать', 'Grace', 'potionPct', [20, 40]),
            this.talent('Ореол', 'Halo', 'firstHitDown', [15, 30, 45]),
          ],
          g: [this.talent('Обет кротости', 'Vow of Meekness', 'weaken', [10, 20, 30])],
        },
        {
          a: [
            this.talent('Возмездие', 'Retribution', 'critMul', [20, 40]),
            this.talent('Свет истины', 'Light of Truth', 'abilitySplash', [25, 50]),
            this.talent('Суд', 'Judgement', 'everyThird', [100]),
          ],
          v: [this.talent('Освящение', 'Consecration', 'healShield', [25])],
          g: [this.talent('Оплот', 'Bulwark', 'highHpDef', [15, 30])],
        },
      ]),
    ];
  }
}
