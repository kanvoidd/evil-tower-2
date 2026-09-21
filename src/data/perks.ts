import type { ClassId } from '../types';

/**
 * Реестр перков. Перк — это способность класса: либо кнопка на поле боя (⚡ цена в ресурсе),
 * либо базовое действие линейки (выстрел через карту, удар в спину, удар молнии — применяется
 * нажатием по карте), либо пассивный триггер (🔁 работает сам).
 *
 * Чтобы «прикрутить» иконку — положите файл perk_<id>.png в src/assets/images.
 * Логика способности — `ability`, см. `applyAbility` в src/logic/run.ts.
 */
export type AbilityId =
  // воин
  | 'power_strike' | 'earthquake' | 'never_give_up'
  | 'shield_bash' | 'war_cry' | 'duel'
  | 'whirlwind' | 'rage' | 'carnage' | 'madness'
  | 'holy_wrath' | 'justice_beam' | 'verdict' | 'heavens_wrath'
  // маг
  | 'lightning' | 'magic_shot' | 'chain_lightning'
  | 'swap' | 'deck_draw' | 'rewind'
  | 'corpse_blast' | 'ghosts' | 'voodoo' | 'dead_harvest'
  | 'ignite' | 'fireball' | 'detonate' | 'inferno'
  // лучник
  | 'pierce_shot' | 'diagonal' | 'ricochet'
  | 'falcon_hunt' | 'falcon_courier' | 'eagle_eye'
  | 'double_shot' | 'hunter_thrill' | 'arrow_rain' | 'starfall'
  | 'rail_shot' | 'armor_piercing' | 'hunters_mark' | 'one_shot'
  // наёмник
  | 'backstab' | 'bribe' | 'cold_blood'
  | 'shadow_dance' | 'sentence' | 'lethal_dose'
  | 'death_mark' | 'chain_mark' | 'shadow_reap' | 'reaper'
  | 'shuriken_fan' | 'substitution' | 'smoke_screen' | 'wind_shadow';

/**
 * Куда применяется способность:
 * - `self` — срабатывает сразу по нажатию кнопки, цель не нужна;
 * - `enemy` — любой враг на поле;
 * - `adjacent` — соседний враг;
 * - `line` — враг на одной линии с героем;
 * - `card` — любая карта, кроме врагов (золото, сундук, зелье);
 * - `any_card` — любая карта;
 * - `two` — две карты подряд (два касания).
 */
export type PerkTarget = 'self' | 'enemy' | 'adjacent' | 'line' | 'card' | 'any_card' | 'two';

export type PerkSlot = 'start' | 'p2' | 'p3' | 'legend';

export interface PerkDef {
  id: string;
  classId: ClassId;
  slot: PerkSlot;
  ability: AbilityId;
  /** Ключ текстуры иконки (perk_<id>); если файла нет — рисуется заглушка. */
  icon: string;
  name: { ru: string; en: string };
  desc: { ru: string; en: string };
  /** Пассивный перк (🔁): кнопки нет, работает сам. */
  passive?: boolean;
  /** Базовое действие линейки: кнопки нет, применяется нажатием по карте; переходит ко всем эволюциям. */
  basic?: boolean;
  /** Цена в ресурсе класса. FULL_BAR — вся шкала. */
  cost?: number;
  /** Доля золота из кошеля комнаты (для «Подкупа»). */
  goldCost?: number;
  target?: PerkTarget;
  /** Один раз за комнату. */
  once?: boolean;
}

/** Цена «вся шкала» — легендарные перки. */
export const FULL_BAR = -1;

interface Opts {
  ability: AbilityId;
  ru: string;
  en: string;
  dru: string;
  den: string;
  cost?: number;
  goldCost?: number;
  target?: PerkTarget;
  passive?: boolean;
  basic?: boolean;
  once?: boolean;
}

const P = (classId: ClassId, slot: PerkSlot, o: Opts): PerkDef => ({
  id: `${classId}_${slot}`,
  classId,
  slot,
  ability: o.ability,
  icon: `perk_${classId}_${slot}`,
  name: { ru: o.ru, en: o.en },
  desc: { ru: o.dru, en: o.den },
  passive: o.passive,
  basic: o.basic,
  cost: o.cost,
  goldCost: o.goldCost,
  target: o.target,
  once: o.once,
});

export const PERKS: PerkDef[] = [
  // ------------------------------------------------------------------ Воин · выносливость
  P('warrior', 'start', {
    ability: 'power_strike', cost: 3, target: 'adjacent',
    ru: 'Мощный удар', en: 'Power Strike',
    dru: 'Следующий удар вдвое сильнее. Излишек урона проламывает цель и бьёт врага за ней по той же линии.',
    den: 'Your next blow hits twice as hard. Overkill damage punches through into the enemy behind the target.',
  }),
  P('warrior', 'p2', {
    ability: 'earthquake', cost: 6, target: 'self',
    ru: 'Землетрясение', en: 'Earthquake',
    dru: 'Топот по земле: все враги в ряду и столбце героя получают 60% урона и оглушены.',
    den: 'A ground stomp: every enemy in the hero’s row and column takes 60% damage and is stunned.',
  }),
  P('warrior', 'p3', {
    ability: 'never_give_up', passive: true,
    ru: 'Не сдамся', en: 'Never Give Up',
    dru: 'Раз за комнату смертельный удар оставляет 1 здоровья и взрывается ударной волной: все враги получают вдвое больше урона, чем приняли вы.',
    den: 'Once per room a lethal blow leaves you at 1 HP and bursts into a shockwave: every enemy takes twice the damage you absorbed.',
  }),

  P('knight', 'start', {
    ability: 'shield_bash', cost: 3, target: 'adjacent',
    ru: 'Таран щитом', en: 'Shield Bash',
    dru: 'Удар с отбросом: враг отлетает на клетку назад и меняется местами с картой за ним. Оба получают урон от столкновения, у края поля — вдвое. Цель оглушена.',
    den: 'A shoving blow: the enemy is knocked one cell back and swaps with the card behind it. Both take collision damage — doubled against the wall. The target is stunned.',
  }),
  P('knight', 'p2', {
    ability: 'war_cry', cost: 5, target: 'self',
    ru: 'Боевой клич', en: 'War Cry',
    dru: 'Над полем разворачивается знамя: атака всех врагов на поле падает на 40% до конца комнаты.',
    den: 'A banner unfurls over the board: every enemy loses 40% attack until the room ends.',
  }),
  P('knight', 'p3', {
    ability: 'duel', cost: 4, target: 'self',
    ru: 'Вызов на дуэль', en: 'Challenge',
    dru: 'Самый опасный враг перелетает в клетку рядом с героем и оглушён — голема или босса можно бить без ответа.',
    den: 'The deadliest enemy is dragged to a cell next to you and stunned — a golem or boss can be hit without answering.',
  }),

  P('berserk', 'start', {
    ability: 'whirlwind', cost: 4, target: 'self',
    ru: 'Вихрь', en: 'Whirlwind',
    dru: 'Герой раскручивается и бьёт всех соседних врагов на 70% урона. Выжившие отвечают вполсилы.',
    den: 'You spin and strike every adjacent enemy for 70% damage. Survivors answer at half strength.',
  }),
  P('berserk', 'p2', {
    ability: 'rage', passive: true,
    ru: 'Ярость', en: 'Rage',
    dru: 'Каждые 2 потерянных единицы здоровья дают 1 выносливости. Чем больнее — тем чаще Вихрь.',
    den: 'Every 2 HP you lose grants 1 stamina. The more it hurts, the more often you whirl.',
  }),
  P('berserk', 'p3', {
    ability: 'carnage', passive: true,
    ru: 'Резня', en: 'Carnage',
    dru: 'Убийства подряд копят +20% урона за каждое, до +80%. Ход без убийства обнуляет бонус.',
    den: 'Consecutive kills stack +20% damage each, up to +80%. A turn without a kill resets it.',
  }),
  P('berserk', 'legend', {
    ability: 'madness', cost: FULL_BAR, target: 'self', once: true,
    ru: 'Безумие берсерка', en: "Berserker's Madness",
    dru: 'Три хода красной пелены: каждый удар задевает всех соседей цели, выжившие не отвечают. В конце герой теряет 20% текущего здоровья.',
    den: 'Three turns of red haze: every blow splashes onto the target’s neighbours and survivors never answer. At the end you lose 20% of your current HP.',
  }),

  P('paladin', 'start', {
    ability: 'holy_wrath', cost: 3, target: 'adjacent',
    ru: 'Святая кара', en: 'Holy Wrath',
    dru: 'Удар светом в полтора раза сильнее, а по нежити и демонам — втрое.',
    den: 'A strike of light at 1.5× damage — or 3× against undead and demons.',
  }),
  P('paladin', 'p2', {
    ability: 'justice_beam', cost: 5, target: 'enemy',
    ru: 'Луч правосудия', en: 'Beam of Justice',
    dru: 'Столб света бьёт весь столбец выбранной карты: каждый враг получает полный урон, нежить и демоны — двойной.',
    den: 'A pillar of light sweeps the target’s whole column: every enemy takes full damage, undead and demons take double.',
  }),
  P('paladin', 'p3', {
    ability: 'verdict', cost: 6, target: 'self',
    ru: 'Вердикт', en: 'Verdict',
    dru: 'Золотые колонны обрушиваются на поле: все враги, у которых здоровья не больше 150% вашего урона, гибнут сразу (кроме боссов).',
    den: 'Golden pillars crash down: every enemy at or below 150% of your damage dies instantly (bosses excepted).',
  }),
  P('paladin', 'legend', {
    ability: 'heavens_wrath', cost: FULL_BAR, target: 'self', once: true,
    ru: 'Гнев небес', en: 'Wrath of Heaven',
    dru: 'Небо раскалывается: каждый враг получает двойной урон (нежить и демоны — четырёхкратный) и оглушён.',
    den: 'The sky splits: every enemy takes double damage — quadruple for undead and demons — and is stunned.',
  }),

  // ------------------------------------------------------------------ Маг · мана
  P('mage', 'start', {
    ability: 'lightning', basic: true, cost: 4, target: 'enemy',
    ru: 'Удар молнии', en: 'Lightning Bolt',
    dru: 'Маг не бьёт рукой — он бьёт молнией. Нажмите на любого врага на поле: 150% урона без ответного удара. Обычный тычок посохом слаб.',
    den: 'The mage does not punch — he strikes with lightning. Tap any enemy on the board for 150% damage with no counterattack. A plain staff poke is feeble.',
  }),
  P('mage', 'p2', {
    ability: 'magic_shot', cost: 6, target: 'line',
    ru: 'Магический выстрел', en: 'Arcane Shot',
    dru: '200% урона по цели на одной линии с героем, без ответного удара.',
    den: '200% damage to a target in line with you, with no counterattack.',
  }),
  P('mage', 'p3', {
    ability: 'chain_lightning', cost: 5, target: 'enemy',
    ru: 'Цепная молния', en: 'Chain Lightning',
    dru: 'Бьёт цель и перескакивает по соседним врагам: 100% → 75% → 50%. Ответных ударов нет.',
    den: 'Strikes the target and arcs to neighbours: 100% → 75% → 50%. No counterattacks.',
  }),

  P('magister', 'start', {
    ability: 'swap', cost: 2, target: 'two',
    ru: 'Перестановка', en: 'Rearrange',
    dru: 'Поменять местами две любые карты (два касания): подтянуть зелье поближе или убрать голема от героя.',
    den: 'Swap any two cards (two taps): pull a potion closer or shove a golem away.',
  }),
  P('magister', 'p2', {
    ability: 'deck_draw', cost: 3, target: 'any_card',
    ru: 'Жребий колоды', en: 'Draw of Fate',
    dru: 'Отправить выбранную карту (кроме босса) вниз колоды и вытянуть новую на её место.',
    den: 'Send the chosen card (bosses excepted) to the bottom of the deck and draw a new one in its place.',
  }),
  P('magister', 'p3', {
    ability: 'rewind', cost: 6, target: 'self', once: true,
    ru: 'Откат времени', en: 'Rewind',
    dru: 'Раз за комнату отматывает последний ход целиком: поле, здоровье, ресурс. В новой попытке случайность выпадет иначе.',
    den: 'Once per room, rewinds the last turn entirely — board, health, resource. The dice fall differently on the retry.',
  }),

  P('necromancer', 'start', {
    ability: 'corpse_blast', cost: 3, target: 'self',
    ru: 'Взрыв трупа', en: 'Corpse Blast',
    dru: 'Следующий убитый враг взрывается: соседи получают урон, равный половине его максимального здоровья. Взрывы идут цепью.',
    den: 'The next enemy you kill bursts: neighbours take half of its maximum health as damage, and the blasts chain.',
  }),
  P('necromancer', 'p2', {
    ability: 'ghosts', passive: true,
    ru: 'Призрачные слуги', en: 'Spectral Servants',
    dru: 'Каждое убийство поднимает призрака. В конце хода он бьёт случайного врага на 50% вашего урона, до трёх призраков.',
    den: 'Every kill raises a ghost. At the end of the turn it strikes a random enemy for 50% of your damage — up to three ghosts.',
  }),
  P('necromancer', 'p3', {
    ability: 'voodoo', cost: 5, target: 'enemy',
    ru: 'Кукла вуду', en: 'Voodoo Doll',
    dru: 'Связывает врага: половина урона, который он получает, достаётся всем остальным врагам на поле.',
    den: 'Binds an enemy: half of the damage it takes is dealt to every other enemy on the board.',
  }),
  P('necromancer', 'legend', {
    ability: 'dead_harvest', cost: FULL_BAR, target: 'self', once: true,
    ru: 'Жатва мёртвых', en: 'Harvest of the Dead',
    dru: 'Каждый враг теряет половину текущего здоровья (боссы — четверть). Умершие дают вдвое больше душ.',
    den: 'Every enemy loses half its current health (bosses a quarter). Those that die give double souls.',
  }),

  P('pyromancer', 'start', {
    ability: 'ignite', cost: 2, target: 'enemy',
    ru: 'Поджог', en: 'Ignite',
    dru: 'Поджигает любого врага. Умерший от огня передаёт пламя соседям.',
    den: 'Sets any enemy ablaze. One that dies burning passes the flame to its neighbours.',
  }),
  P('pyromancer', 'p2', {
    ability: 'fireball', cost: 4, target: 'enemy',
    ru: 'Огненный шар', en: 'Fireball',
    dru: 'Дальний бросок: цель получает 150% урона, соседи — 70%, все загораются.',
    den: 'A long throw: the target takes 150% damage, neighbours 70%, and everyone catches fire.',
  }),
  P('pyromancer', 'p3', {
    ability: 'detonate', cost: 5, target: 'self',
    ru: 'Детонация', en: 'Detonation',
    dru: 'Все горящие враги взрываются: 200% урона себе и 100% соседям. Взрывы идут цепью по всему полю.',
    den: 'Every burning enemy explodes for 200% on itself and 100% on its neighbours — the blasts chain across the board.',
  }),
  P('pyromancer', 'legend', {
    ability: 'inferno', cost: FULL_BAR, target: 'self', once: true,
    ru: 'Инферно', en: 'Inferno',
    dru: 'Огненный шторм волнами расходится от героя: все враги горят 5 ходов по 40% вашего урона за ход.',
    den: 'A firestorm rolls out in waves: every enemy burns for 5 turns at 40% of your damage per turn.',
  }),

  // ------------------------------------------------------------------ Лучник · концентрация
  P('archer', 'start', {
    ability: 'pierce_shot', basic: true, cost: 2, target: 'line',
    ru: 'Сквозной выстрел', en: 'Piercing Shot',
    dru: 'Выстрел через карту: нажмите на врага в двух клетках по прямой — он получит урон без ответного удара.',
    den: 'A shot through a card: tap an enemy two cells away in a straight line and it takes damage with no counterattack.',
  }),
  P('archer', 'p2', {
    ability: 'diagonal', passive: true,
    ru: 'Косой прицел', en: 'Angled Aim',
    dru: 'Стрелять можно и по диагональным соседям, до которых обычно не дотянуться.',
    den: 'You can also shoot the diagonal neighbours that are normally out of reach.',
  }),
  P('archer', 'p3', {
    ability: 'ricochet', cost: 3, target: 'enemy',
    ru: 'Рикошет', en: 'Ricochet',
    dru: 'Стрела отскакивает от цели к ближайшему врагу (50%), затем ещё раз (25%).',
    den: 'The arrow bounces from the target to the nearest enemy (50%) and then once more (25%).',
  }),

  P('hawkeye', 'start', {
    ability: 'falcon_hunt', cost: 3, target: 'enemy',
    ru: 'Сокол-охотник', en: 'Hunting Falcon',
    dru: 'Сокол пикирует на любого врага на поле: 120% урона и оглушение.',
    den: 'The falcon dives at any enemy on the board for 120% damage and a stun.',
  }),
  P('hawkeye', 'p2', {
    ability: 'falcon_courier', cost: 2, target: 'card',
    ru: 'Сокол-курьер', en: 'Falcon Courier',
    dru: 'Сокол приносит любую нужную карту — золото, сундук или зелье, — а герой остаётся на месте.',
    den: 'The falcon fetches any card you need — gold, chest or potion — while you stay put.',
  }),
  P('hawkeye', 'p3', {
    ability: 'eagle_eye', passive: true,
    ru: 'Орлиный взор', en: "Eagle's Sight",
    dru: 'Над полем видны три верхние карты колоды. Стрелять можно и по соседним врагам — без ответа.',
    den: 'The top three cards of the deck are visible. You may also shoot adjacent enemies — without an answer.',
  }),

  P('arrowgod', 'start', {
    ability: 'double_shot', cost: 3, target: 'enemy',
    ru: 'Двойной выстрел', en: 'Double Shot',
    dru: 'Две стрелы подряд. Если первая убила — вторая летит в ближайшего врага.',
    den: 'Two arrows in a row. If the first one kills, the second flies at the nearest enemy.',
  }),
  P('arrowgod', 'p2', {
    ability: 'hunter_thrill', passive: true,
    ru: 'Азарт охотника', en: "Hunter's Thrill",
    dru: 'Критический выстрел возвращает потраченную концентрацию.',
    den: 'A critical shot refunds the concentration it cost.',
  }),
  P('arrowgod', 'p3', {
    ability: 'arrow_rain', cost: 4, target: 'self',
    ru: 'Дождь стрел', en: 'Arrow Rain',
    dru: 'Пять стрел падают с неба на случайных врагов, по 60% урона каждая.',
    den: 'Five arrows fall from the sky onto random enemies for 60% damage each.',
  }),
  P('arrowgod', 'legend', {
    ability: 'starfall', cost: FULL_BAR, target: 'self', once: true,
    ru: 'Звездопад', en: 'Starfall',
    dru: 'Небо чернеет от стрел: каждый враг получает три попадания по 60% с отдельными критами.',
    den: 'The sky goes black with arrows: every enemy takes three hits of 60%, each rolling its own crit.',
  }),

  P('sniper', 'start', {
    ability: 'rail_shot', cost: 3, target: 'enemy',
    ru: 'Пробивающий выстрел', en: 'Rail Shot',
    dru: 'Стрела пробивает всю линию: все враги в ряду или столбце цели получают урон, каждый следующий на 20% слабее.',
    den: 'The arrow punches through the whole line: every enemy in the target’s row or column is hit, each 20% weaker than the last.',
  }),
  P('sniper', 'p2', {
    ability: 'armor_piercing', cost: 3, target: 'enemy',
    ru: 'Бронебойный', en: 'Armour Piercer',
    dru: 'Выстрел с бонусом в 25% максимального здоровья цели. Главные жертвы — големы и боссы.',
    den: 'A shot with a bonus equal to 25% of the target’s maximum health. Golems and bosses suffer most.',
  }),
  P('sniper', 'p3', {
    ability: 'hunters_mark', passive: true,
    ru: 'Охотничья метка', en: "Hunter's Mark",
    dru: 'Первый выстрел по неповреждённому врагу всегда критический.',
    den: 'Your first shot at an undamaged enemy always crits.',
  }),
  P('sniper', 'legend', {
    ability: 'one_shot', cost: FULL_BAR, target: 'enemy', once: true,
    ru: 'Один выстрел — один труп', en: 'One Shot, One Kill',
    dru: 'Время замедляется: выстрел мгновенно убивает любого не-босса и летит дальше по линии, до трёх убийств. Босс теряет 40% максимального здоровья.',
    den: 'Time slows: the shot instantly kills any non-boss and travels on down the line, up to three kills. A boss loses 40% of its maximum health.',
  }),

  // ------------------------------------------------------------------ Наёмник · осмотрительность
  P('mercenary', 'start', {
    ability: 'backstab', basic: true, cost: 6, target: 'enemy',
    ru: 'Удар в спину', en: 'Backstab',
    dru: 'Телепорт за спину любого врага на поле и гарантированный критический удар без ответа.',
    den: 'Teleport behind any enemy on the board and land a guaranteed critical hit with no answer.',
  }),
  P('mercenary', 'p2', {
    ability: 'bribe', goldCost: 0.25, target: 'enemy',
    ru: 'Подкуп', en: 'Bribe',
    dru: 'Вы платите 25% золота из кошеля комнаты (минимум 5): не-босс уходит с поля. Ни души, ни золота за него — только безопасность.',
    den: 'You pay 25% of the room pouch (at least 5) and a non-boss simply leaves. No souls, no gold — only safety.',
  }),
  P('mercenary', 'p3', {
    ability: 'cold_blood', passive: true,
    ru: 'Хладнокровие', en: 'Cold Blood',
    dru: 'Удар в спину, убивший врага, возвращает 3 осмотрительности.',
    den: 'A backstab that kills refunds 3 vigilance.',
  }),

  P('assassin', 'start', {
    ability: 'shadow_dance', passive: true,
    ru: 'Танец теней', en: 'Dance of Shadows',
    dru: 'Удар в спину, убивший врага, бесплатно телепортирует героя к самому слабому врагу. Цепь до трёх ударов.',
    den: 'A backstab that kills teleports you to the weakest enemy for free — a chain of up to three strikes.',
  }),
  P('assassin', 'p2', {
    ability: 'sentence', cost: 2, target: 'enemy',
    ru: 'Приговор', en: 'Death Sentence',
    dru: 'Цель получает на 50% больше урона от всех источников. Её смерть возвращает всю осмотрительность.',
    den: 'The target takes 50% more damage from every source. Its death refunds all of your vigilance.',
  }),
  P('assassin', 'p3', {
    ability: 'lethal_dose', passive: true,
    ru: 'Смертельная доза', en: 'Lethal Dose',
    dru: 'Удар в спину отравляет: 10% максимального здоровья за ход, 3 хода (у боссов — 5%).',
    den: 'A backstab poisons: 10% of maximum health per turn for 3 turns (5% on bosses).',
  }),

  P('darkassassin', 'start', {
    ability: 'death_mark', cost: 3, target: 'enemy',
    ru: 'Клеймо смерти', en: 'Death Mark',
    dru: 'Череп с отсчётом на карточке: через три хода враг умирает, а босс теряет 30% максимального здоровья.',
    den: 'A counting skull appears on the card: after three turns the enemy dies, and a boss loses 30% of its maximum health.',
  }),
  P('darkassassin', 'p2', {
    ability: 'chain_mark', passive: true,
    ru: 'Цепное клеймо', en: 'Chained Mark',
    dru: 'Когда помеченный враг умирает, клеймо перескакивает на ближайшего.',
    den: 'When a marked enemy dies, the mark leaps to the nearest one.',
  }),
  P('darkassassin', 'p3', {
    ability: 'shadow_reap', cost: 5, target: 'self',
    ru: 'Жатва теней', en: 'Shadow Reaping',
    dru: 'Все помеченные враги умирают мгновенно (боссы теряют 30% максимального здоровья).',
    den: 'Every marked enemy dies at once (bosses lose 30% of their maximum health).',
  }),
  P('darkassassin', 'legend', {
    ability: 'reaper', cost: FULL_BAR, target: 'self', once: true,
    ru: 'Жнец', en: 'Reaper',
    dru: 'Три хода жатвы: удар в спину бесплатен и убивает любого не-босса, а каждое убийство продлевает жатву на ход.',
    den: 'Three turns of reaping: the backstab is free and kills any non-boss, and every kill extends the reaping by a turn.',
  }),

  P('ninja', 'start', {
    ability: 'shuriken_fan', cost: 3, target: 'self',
    ru: 'Веер сюрикенов', en: 'Shuriken Fan',
    dru: 'Четыре сюрикена летят в ближайших врагов по 60% урона с отдельными критами, без ответных ударов.',
    den: 'Four shuriken fly at the nearest enemies for 60% each, rolling separate crits and drawing no answer.',
  }),
  P('ninja', 'p2', {
    ability: 'substitution', passive: true,
    ru: 'Подмена', en: 'Substitution',
    dru: 'При успешном увороте герой исчезает, оставив бревно, появляется за спиной нападавшего и бьёт критом.',
    den: 'On a successful dodge you vanish, leaving a log behind, reappear at the attacker’s back and strike a crit.',
  }),
  P('ninja', 'p3', {
    ability: 'smoke_screen', cost: 4, target: 'self',
    ru: 'Дымовая завеса', en: 'Smoke Screen',
    dru: 'Два хода враги не отвечают на ваши удары — поле в дыму.',
    den: 'For two turns enemies never answer your blows — the board is full of smoke.',
  }),
  P('ninja', 'legend', {
    ability: 'wind_shadow', cost: FULL_BAR, target: 'self', once: true,
    ru: 'Тень ветра', en: 'Wind Shadow',
    dru: 'Герой проносится по всему полю и бьёт каждого врага дважды, второй удар — критический.',
    den: 'You sweep across the whole board and hit every enemy twice — the second blow is a crit.',
  }),
];

export const PERK_BY_ID: Record<string, PerkDef> = Object.fromEntries(PERKS.map((p) => [p.id, p]));

export const perkId = (classId: ClassId, slot: PerkSlot): string => `${classId}_${slot}`;

export const perkOf = (classId: ClassId, slot: PerkSlot): PerkDef | undefined => PERK_BY_ID[perkId(classId, slot)];

export const SLOT_ORDER: PerkSlot[] = ['start', 'p2', 'p3', 'legend'];

/** Перки класса по порядку слотов (у базового и второго класса легендарного нет). */
export const perksOfClass = (classId: ClassId): PerkDef[] =>
  SLOT_ORDER.map((s) => perkOf(classId, s)).filter((p): p is PerkDef => !!p);

/** Есть ли у перка кнопка на поле боя. */
export const hasButton = (p: PerkDef): boolean => !p.passive && !p.basic;
