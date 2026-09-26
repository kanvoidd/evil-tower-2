# Доменные области Evil Tower 2

Домен (`src/domain/`) разложен не по техническому признаку («данные», «логика», «движок»),
а по **доменным областям** — частям игры со своим языком и своими правилами. Этот документ —
карта: какие области есть, что в каждой, как в ней называются вещи, от кого область зависит
и что показывает наружу. Соблюдение карты проверяет `npm run archtest`.

Решения о раскладке записаны в `PROJECT-DECISIONS.md`, план второго круга рефакторинга —
`docs/REFACTORING-PLAN-2.md`. Раскладка введена этапом B второго круга, область `expedition/`
— этапом E1.

## Области

| Область | Папка | Что внутри | Язык области |
|---|---|---|---|
| Общее ядро | `shared/` | генератор случайных чисел (`rng/`), доменный сигнал (`signal/`), язык текстов (`lang/`), типы значений (`value/`: проценты, доли, золото, души, ходы, клетки, календарный день) | — |
| Каталог | `catalog/` | содержимое игры без текстов (названия и описания — в словарях `src/i18n/` по id сущности), содержимое героев — определения в папке линейки (`heroes/<линейка>/`: `lineage.ts`, классы с перками по слотам `classes/`, способности `abilities/<класс>.ts`, таланты и дерево класса `talents/<класс>.ts`); виды и реестры способностей — `abilities/`, перков — `perks/`, талантов и их мест в деревьях — `talents/`, этажи, враги и комнаты (`floors/`, `enemies/`, `levels/`, `FloorFactory`) и рост силы и наград от этажа к этажу (`floors/scaling/`: `IFloorScaling`), вещи (`items/`, `weapons/`, `armor/`), расходники (`consumables/`) | линейка, класс, способность, талант, этаж, враг, комната, вещь, расходник |
| Бой | `combat/` | бой в одной комнате (`room-battle/`: фасад `RoomBattle`, состояние комнаты `room-state/`, части боя `parts/`): поле 3×3 и колода (`engine/`), карты (`card/`), события боя (`events/`), стиль атаки линейки (`attack/`), расчёт урона и защиты (`damage/`), крит (`crit/`), способности (`abilities/`), герой глазами боя (`player/`), автоприменение расходников (`auto-use/`), числа общих правил (`balance/`) | комната, ход, удар, статус, способность, добыча |
| Прогресс героя | `progression/` | герой и его класс (`hero/`), дерево прокачки (`skill-tree/`: узлы, состояние, покупка, изученное — без знания эффектов), сборка характеристик (`stats/`, что дают изученные таланты — `stats/talent-bonuses/`), цены в душах (`soul-prices/`: `ISoulPricing` и реализация по таблице ступеней), сводка класса (`traits/`) | герой, класс, метаморфоза, талант, ярус, путь |
| Экономика | `economy/` | кошелёк героя (`wallet/`), правила лавки (`shop/`: что продаётся, что сделать с вещью, предел запаса), цена починки (`repair/`), числа экономики (`balance/`). Покупки над документом сохранения делает `Profile` по этим правилам | золото, души, кошелёк, вещь, прочность, починка |
| Награды | `rewards/` | награда дня (`daily/`), «Дар башни» (`tower-gift/`), достижения (`achievements/`) | награда, серия, дар, достижение |
| Забег | `expedition/` | правила забега между комнатами: подъём по комнатам башни и перенос героя (`tower-climb/`), оплата пройденной комнаты и «без урона» (`room-payout/`), рекорд (`record-policy/`), состояние забега между комнатами `RunCarry`. Порядок вызовов и запись в профиль — `application/game/TowerRun` | забег, сумка, рекорд |
| Аккаунт | `account/` | профиль игрока `Profile` — корень агрегата и фасад над частями (`profile/`: настройки и отметки игрока, автоматизация, герои, всё своё у героя — кошелёк, снаряжение, расходники, рекорд, — счётчики и достижения, награда дня, «Дар башни»); части работают над одним документом сохранения (`AccountState`) | профиль, сохранение, настройки, обучение |

Типы живут у владельцев: содержимое линейки `HeroContent`, id содержимого (`LineageId`, `ClassId`, `ConsumableId`, `TalentPath` …)
— в каталоге рядом с определениями, формат сохранения (`SaveData`, `HeroSave`) — в `account/save/`,
купленное в дереве (`LineageSave`) — в прогрессе, настройки автоприменения — в бою, язык — в
`shared/`. Число сущности живёт в её определении (цена вещи — в реестре оружия и брони, кривые
врагов — в масштабировании этажа `floors/scaling`), а число общего правила — в балансе своей области: `combat/balance`
(`CombatBalance` — крит, броня, воскрешение, парирование; `ConsumableBalance` — зелья и
артефакт; `LootBalance` — золото, сундуки, удача; `DeckBalance` — колода комнаты) и
`progression/balance` (`ProgressionBalance` — цена нового героя, возврат при отказе от
финального класса; `SoulPriceBalance` — цены в душах). Порог правила, который принадлежит одному
классу (модификатору урона, части боя), — его именованная константа. Голых чисел в правилах домена
и в потоках приложения нет — это предупреждение `no-magic-numbers` в `npm run lint`. Файлов вне
областей в домене нет.

## Карта зависимостей

Область может зависеть только от областей из своей строки. Циклов нет: каждая строка
ссылается только на области выше себя.

| Область | Может зависеть от |
|---|---|
| `shared` | — |
| `catalog` | `shared` |
| `combat` | `catalog`, `shared` |
| `progression` | `combat`, `catalog`, `shared` |
| `economy` | `catalog`, `shared` |
| `rewards` | `economy`, `catalog`, `shared` |
| `expedition` | `progression`, `combat`, `economy`, `catalog`, `shared` |
| `account` | `progression`, `combat`, `economy`, `rewards`, `catalog`, `shared` |


Почему стрелки идут так:

- **Каталог ниже боя.** Бой читает содержимое (способности, врагов, комнаты), а каталог не знает,
  как идёт бой. Поэтому стиль атаки линейки каталог называет по id (`LineageDef.attack`),
  а стратегию по этому id выдаёт бой (`combat/attack`).
- **Прогресс выше боя.** Прогресс собирает из героя, талантов и снаряжения `PlayerStats` — то,
  что бою нужно знать о герое, — а бой не знает, откуда взялись эти числа. Поэтому `PlayerStats`
  — тип боя (`combat/player`), а `buildPlayerStats` — служба прогресса.
- **Награды над экономикой.** Награда начисляет золото и души, но кошелёк о наградах не знает.
- **Аккаунт наверху.** Профиль держит части всех областей и сохраняет их одним документом;
  сами области о профиле не знают. Отсюда же зависимость аккаунта от боя: настройки
  автоприменения расходников — часть профиля, а их смысл и значения по умолчанию — правило боя.

## Правила

1. **Снаружи область видна только через свой `index.ts`** — это её публичный API. Импорт
   в глубину чужой области запрещён. Внутри области файлы импортируют друг друга напрямую,
   а не через свой `index.ts` (иначе цикл).
2. **Зависимости между областями — только по карте**, циклов нет, `shared` не зависит ни от чего.
3. **Внутри боя поле и колода (`combat/engine`) не знают правил боя** (`room-battle`, `attack`,
   `auto-use`).
4. **Слои снаружи домена** (application, presentation, infrastructure, composition) тоже берут
   домен только через `index.ts` областей. Инструменты (`tools/`) могут смотреть внутрь — это
   проверки.
5. **Новая сущность кладётся в область, на чьём языке она называется.** Если слово нужно двум
   областям, владелец — та, чьё правило его меняет, а вторая получает его через публичный API
   владельца.

## Публичный API областей

Полный список имён — в `index.ts` области и в `index.ts` её папок, которые он перечисляет
(`export *`); здесь — что область обещает наружу.

| Область | Что даёт |
|---|---|
| `shared` | `Rng`, `makeRng` (зерно приходит снаружи — порт `ISeedSource` приложения), `Signal`, язык `Lang`, типы значений `Percent`, `Ratio`, `Gold`, `Souls`, `Turns`, `CellIndex`, календарный день `DayKey` |
| `catalog` | реестры и фабрики содержимого (`HEROES`, `LINEAGES`, `CLASSES`, `CLASS_DEFINITIONS`, `ABILITY_LIST`, `PERKS`, `TALENTS`, `TALENT_PLACES`, `FLOORS`, `FLOOR_FACTORIES`, `ENEMIES`, `ROOMS`, `MODIFIERS`, `ITEMS`, `WEAPONS`, `ARMORS`, `CONSUMABLES`) и их поиск (`perkOf`, `ABILITY_BY_ID`, `withBehavior`, `rollRoom`, `ITEM_BY_ID` …), масштабирование этажей (`IFloorScaling`, `FLOOR_SCALING`, `FloorCurveScaling`), содержимое линейки `HeroContent`, id содержимого (`LineageId`, `ClassId`, `ConsumableId`, `TalentPath`, `CardKind` …), надетая вещь `EquipmentSave`, типы определений (`LineageDef`, `ClassDefinition`, `AbilityDef`, `PerkDef`, `AbilityBehaviorId`, `TalentDef`, `TalentEffect`, `TalentPlace`, `TalentTree`, `EnemyDef`, `RoomDef`, `ItemDef` …) |
| `combat` | числа правил боя (`CombatBalance`, `ConsumableBalance`, `LootBalance`, `DeckBalance`), бой в комнате (`RoomBattle` — фасад над частями, `RoomBattleFactory`) и его контракты (`IBattleSession`, `IBattleState`, `BattleInit`, `TurnResult` …), события (`GameEvent`, `Loot`, `FxStyle`, `FX_STYLES`), поле (`Grid`, `Card`), `PlayerStats`, механики способностей с кнопкой (`IAbility`, `ABILITY_BEHAVIORS`), стили атаки (`IAttackStrategy`), автоприменение (`pickAutoUse`, `DEFAULT_AUTO_USE`) |
| `progression` | `ProgressionBalance`, `SoulPriceBalance`, `Hero`, `HeroClassState`, дерево талантов (`TREES`, `Tree`, `TreeNode`, операции над `LineageSave`), `buildPlayerStats`, цены в душах (`ISoulPricing`, `SOUL_PRICING`, `StageTablePricing`), сводка класса (`classTraits`) |
| `economy` | кошелёк `Wallet` (над `Purse`), правила лавки `ShopRules` и `ItemAction`, цена починки (`IRepairPricing`, `REPAIR_PRICING`, `PriceShareRepair`), `EconomyBalance` |
| `expedition` | подъём по башне `TowerClimb` (начало забега, комната, переход, вершина), оплата комнаты `RoomPayout` и её итог `RoomPay`, рекорд `RecordPolicy`, состояние забега `RunCarry` |
| `rewards` | календарь игрока (порт `ICalendar`: какой сегодня день), награда дня (`DAILY_REWARDS`), «Дар башни» (`towerGiftFor` — по рекорду, `GIFT_BASE`, `GIFT_COOLDOWN_MS`), достижения (`ACHIEVEMENTS`) и то, что они читают об игроке (`PlayerCounters`, `AchievementFacts`) |
| `account` | `Profile` и результаты его операций (`DailyStatus`, `ItemPurchase`, `ConsumablePurchase`), формат сохранения (`SaveData`, `HeroSave`, `AutoSave`), документ нового игрока и героя (`freshSave`, `emptyHeroSave`), чтение и перенос старых сохранений (`SaveFormat`, шаги `SAVE_MIGRATIONS`, `LegacySave`) |

## Глоссарий: слово игры → имя в коде

«Run» в именах кода значит **забег** — цепочку комнат (`TowerRun`, `RunCarry`, `RunSummary`,
`RunEndReason`). Бой в одной комнате — `RoomBattle`, переменная — `battle`.

| Слово игры | Имя в коде | Область |
|---|---|---|
| этаж башни | `FloorFactory`, `FLOORS` | каталог |
| комната (рецепт состава) | `RoomDef`; собранный состав — `RoomPlan` (`rollRoom()`) | каталог |
| свойство комнаты | `RoomModifier`, `MODIFIERS` | каталог |
| враг, его роль и природа | `EnemyDef`, `EnemyRole`, `EnemyTag` | каталог |
| линейка (воин, маг, охотник — id `archer`, наёмник) | `LineageId`, `LineageDef`, содержимое линейки `HeroContent` (`HEROES`) | каталог |
| класс, ступень класса, прибавки класса | `ClassId`, `ClassDef` (`stage`, `parents`, `bonuses`): с ярусами — `TieredClassDef`, с ветками — `BranchedClassDef`; полное определение — `ClassDefinition` | каталог |
| подкласс (выбор одного из нескольких), переходный класс | `BranchedClassDef` ступени 1 и 2; соседи по выбору — `siblingsOf()` | каталог |
| ветка подкласса («Огонь», «Урон»), её шаги | `BranchDef`, `BranchStep`; одна ветка на выбор — `branchChoice: 'one'` | каталог |
| способность: кнопка, пассивка, базовое действие | `AbilityDef` (`defineAbility`), `AbilityId`, `AbilityKind` | каталог |
| механика способности (что умеет бой) | `AbilityDef.behavior` (`AbilityBehaviorId`); реализация кнопки — `IAbility` (`ABILITY_BEHAVIORS`) | каталог; реализация — бой |
| числа способности (урон, ходы, доли) | `AbilityDef.params` (вид — `AbilityBehaviorParams`), цена золотом — `GoldCost` | каталог |
| уровень перка | `AbilityDef.levels`, `abilityAtLevel()`; ранг узла перка в дереве | каталог |
| перк — способность на месте в дереве класса | `TieredClassDef.perks` или шаг ветки, `PerkDef`, `PerkSlot` (`TieredPerkSlot` / `BranchPerkSlot`) | каталог |
| талант — что он даёт | `TalentDef` (`talent`), эффект `TalentEffect` (`bonus`, `synergy`, `chanceAndPower`, правка перка `modify`), вид эффекта `TalentFx` | каталог |
| «Основа» — общие таланты мага и охотника | `HeroContent.baseTree` (`BaseTree`), места — `TalentPlace.tab === 'base'` | каталог |
| место таланта: ярус, путь (урон / здоровье / защита), шаг цепочки | `TalentPlace` (`TALENT_PLACES`), `TalentTree`, `tier`, `TalentPath` | каталог |
| вещь (оружие, броня), её ступень | `ItemDef`, `ItemTier`, `WEAPONS`, `ARMORS` | каталог |
| расходник (зелья, артефакт) | `ConsumableId`, `ConsumableDef` | каталог |
| бой в комнате | `RoomBattle`; команды — `IBattleSession`, чтение — `IBattleState` | бой |
| ход | `TurnResult`, `Action` | бой |
| поле 3×3, клетка | `Engine`, `Grid`; клетка — `CellIndex` (0–8, `Grid.CELLS`) | бой |
| карта на поле | `Card` | бой |
| вид карты (враг, золото, сундук …) | `CardKind` | каталог |
| колода комнаты | `RoomCardFactory`, `IDeckSupply`, `DeckPlan` | бой |
| статус на враге (оглушение, горение, яд …) | `StatusKind`, `CardStatus` | бой |
| событие боя | `GameEvent` | бой |
| добыча комнаты | `Loot`, `BattleTotals` | бой |
| стиль атаки (рука у всех, выстрел, удар в спину) | `IAttackStrategy`: `HandAttack`, `ShotAttack`, `BackstabAttack`; выстрел — от базового перка (`AbilityDef.attack`) | бой |
| ловушка на клетке («Капкан», «Взведённая ловушка») | `TrapState`, `RoomTraps`; для сцены — `TrapView` | бой |
| слуга героя (мёртвая версия врага) | карта `ghost`, `CardFactory.createServant()` | бой |
| характеристики героя в бою | `PlayerStats` (шансы — `Percent`, доли — `Ratio`) | бой |
| автоприменение расходников | `pickAutoUse`, `AutoUseSave` | бой |
| герой | `Hero` | прогресс |
| класс, за который играет герой | `HeroClassState` | прогресс |
| метаморфоза и её отмена | `Hero.metamorphose()`, `Hero.cancelMetamorphosis()` | прогресс |
| дерево талантов, узел дерева | `Tree` (`TieredTree` / `BranchedTree`), `TreeNode` (уровень `row`, вкладка `tab`), `TREES`, `SkillTreeBuilder`; купленное — `LineageSave`; экранная раскладка — `SkillTreeLayout` в presentation | прогресс |
| сборка характеристик, потолки | `buildPlayerStats`, `Loadout`, `CAPS` | прогресс |
| цена прокачки в душах | `ISoulPricing` (`SOUL_PRICING`): `talentRank`, `perk` (по уровню), `metamorphosis` | прогресс |
| сводка класса | `classTraits`, `Trait` | прогресс |
| золото, души, кошелёк героя | `Gold`, `Souls`; кошелёк — `Wallet` над `HeroSave` (`gold`, `souls`), `Profile.heroSaveOf()` | экономика |
| прочность, починка | `EquipmentSave.durability`, `IRepairPricing` | экономика |
| лавка: купить, починить, «надето», «слабее надетой» | `ShopRules`, `ItemAction` | экономика |
| награда дня, серия | `DAILY_REWARDS`, `DailyReward`, `DailyStatus` | награды |
| «Дар башни» | `towerGiftFor`, `GIFT_BASE`, `GIFT_COOLDOWN_MS` | награды |
| достижение | `AchievementDef`, `ACHIEVEMENTS` | награды |
| забег | правила — `TowerClimb`, `RoomPayout`, `RecordPolicy`, состояние между комнатами — `RunCarry`; учёт в профиле — `TowerRun`, итог — `RunSummary`, `RunEndReason` (`application/game`) | забег |
| рекорд | `HeroSave.best`, `Profile.bestOf()` | аккаунт |
| профиль, сохранение | `Profile`, `SaveData` | аккаунт |
| обучение | `SaveData.tutorial`, `Profile.markTutorial()` | аккаунт |

## Что пока не в своей области

Ничего: раскладка этапа B была механической, а правила, которые жили не у своего хозяина,
переехали на этапах C–G второго круга (забег — в `expedition`, цены — за портами областей, кошелёк
и лавка — в `economy`, календарь — в `rewards`, перенос старых сохранений — в `account/save`).
Новое правило сразу кладётся к хозяину (правило 5 выше).
