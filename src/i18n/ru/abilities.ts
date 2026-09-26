/** Названия и описания способностей по id способности. Числа — плейсхолдерами из её чисел (`AbilityDef.params`, цена, перезарядка). */
export const abilities = {
  // warrior
  'ability.power_strike.name': 'Мощный удар',
  'ability.power_strike.desc':
    'Следующий удар вдвое сильнее. Излишек урона проламывает цель и бьёт врага за ней по той же линии.',
  'ability.earthquake.name': 'Землетрясение',
  'ability.earthquake.desc':
    'Топот по земле: все враги в ряду и столбце героя получают {dmg}% урона и оглушены.',
  'ability.never_give_up.name': 'Не сдамся',
  'ability.never_give_up.desc':
    'Раз за комнату смертельный удар оставляет {hpLeft} здоровья и взрывается ударной волной: все враги получают вдвое больше урона, чем приняли вы.',
  // knight
  'ability.shield_bash.name': 'Таран щитом',
  'ability.shield_bash.desc':
    'Удар с отбросом: враг отлетает на клетку назад и меняется местами с картой за ним. Оба получают урон от столкновения, у края поля — вдвое. Цель оглушена.',
  'ability.war_cry.name': 'Боевой клич',
  'ability.war_cry.desc':
    'Над полем разворачивается знамя: атака всех врагов на поле падает на {weaken}% до конца комнаты.',
  'ability.duel.name': 'Вызов на дуэль',
  'ability.duel.desc':
    'Самый опасный враг перелетает в клетку рядом с героем и оглушён — голема или босса можно бить без ответа.',
  // berserk
  'ability.whirlwind.name': 'Вихрь',
  'ability.whirlwind.desc': 'Герой раскручивается и бьёт всех соседних врагов на {dmg}% урона.',
  'ability.rage.name': 'Ярость',
  'ability.rage.desc':
    'Каждые {hpPerResource} потерянных единицы здоровья дают {resource} выносливости. Чем больнее — тем чаще Вихрь.',
  'ability.carnage.name': 'Резня',
  'ability.carnage.desc':
    'Убийства подряд копят +{perKill}% урона за каждое, до +{cap}%. Ход без убийства обнуляет бонус.',
  'ability.madness.name': 'Безумие берсерка',
  'ability.madness.desc':
    'Три хода красной пелены: каждый удар задевает всех соседей цели, выжившие не отвечают. В конце герой теряет {hpCost}% текущего здоровья.',
  // paladin
  'ability.holy_wrath.name': 'Святая кара',
  'ability.holy_wrath.desc': 'Удар светом в полтора раза сильнее, а по нежити и демонам — втрое.',
  'ability.justice_beam.name': 'Луч правосудия',
  'ability.justice_beam.desc':
    'Столб света бьёт весь столбец выбранной карты: каждый враг получает полный урон, нежить и демоны — двойной.',
  'ability.verdict.name': 'Вердикт',
  'ability.verdict.desc':
    'Золотые колонны обрушиваются на поле: все враги, у которых здоровья не больше {limit}% вашего урона, гибнут сразу (кроме боссов).',
  'ability.heavens_wrath.name': 'Гнев небес',
  'ability.heavens_wrath.desc':
    'Небо раскалывается: каждый враг получает двойной урон (нежить и демоны — четырёхкратный) и оглушён.',
  // mage: elementalist
  'ability.ignite.name': 'Поджог',
  'ability.ignite.desc':
    'Поджигает любого врага: тиков горения — {ticks}, по {burn}% урона за тик. Тики копятся на цели. Перезарядка {cooldown} ход.',
  'ability.ignite.lv2': 'Тиков горения за поджог: {ticks}',
  'ability.detonate.name': 'Детонация',
  'ability.detonate.desc':
    'Все горящие враги взрываются: себе {blastMul}% накопленного горения, соседям {splashMul}%. Перезарядка {cooldown} хода.',
  'ability.frost_spike.name': 'Ледяной шип',
  'ability.frost_spike.desc':
    'Шип в любого врага: {dmg}% урона, враг бьёт на {weaken}% слабее ещё {debuffTurns} хода. Перезарядка {cooldown} ход.',
  'ability.frost_spike.lv2': 'Ещё и броня врага меньше на {armorBreak}%',
  'ability.ice_armor.name': 'Ледяной доспех',
  'ability.ice_armor.desc':
    'На {turns} хода: щит на {shield}% здоровья, +{defense} к защите, а каждый ударивший вас получает {thorns}% урона. Перезарядка {cooldown} ходов.',
  'ability.lightning.name': 'Молния',
  'ability.lightning.desc': 'Разряд в соседнего врага: {dmg}% урона за {cost} маны.',
  'ability.lightning.lv2': 'При мане от {manaAbove}% шкалы — ещё +{manaBonus}% урона',
  'ability.chain_lightning.name': 'Цепная молния',
  'ability.chain_lightning.desc':
    'Бьёт цель и перескакивает на соседнего врага: {falloff1}% → {falloff2}%. Перезарядка {cooldown} хода.',
  'ability.chain_lightning.lv2': 'Третья цель цепи: {falloff3}%',
  'ability.chain_lightning.lv3': 'Четвёртая цель цепи: {falloff4}%',
  // mage: arcanist
  'ability.magic_shot.name': 'Магический выстрел',
  'ability.magic_shot.desc':
    'Бьёт ближайшего врага на выбранной линии: {dmg}% урона. Перезарядка {cooldown} ход.',
  'ability.magic_shot.lv2': 'Пробивает линию: следующий враг получает на {stepLoss}% меньше',
  'ability.swap.name': 'Точечная перестановка',
  'ability.swap.desc':
    'Поменять местами две любые карты (два касания): подтянуть зелье или убрать врага от героя. Перезарядка {cooldown} ходов.',
  'ability.shuffle.name': 'Перемешивание поля',
  'ability.shuffle.desc':
    'Все карты поля, кроме героя, встают на новые места. Перезарядка {cooldown} хода.',
  // mage: warlock
  'ability.blight_shot.name': 'Выстрел скверны',
  'ability.blight_shot.desc':
    '{dmg}% урона и заражение: умирая, враг взрывается и бьёт соседей на {infect}% своего здоровья. Перезарядка {cooldown} ход.',
  'ability.dead_servant.name': 'Мёртвый слуга',
  'ability.dead_servant.desc':
    'Заражённый враг, умирая, встаёт вашим слугой: {hp}% его здоровья и {dmg}% удара. Ходов слуги: {turns} — он бьёт соседних врагов.',
  // mage: magister
  'ability.magic_shield.name': 'Магический щит',
  'ability.magic_shield.desc':
    'Щит на {shield}% максимального здоровья. Перезарядка {cooldown} хода.',
  // hunter: bowman
  'ability.pierce_shot.name': 'Сквозной выстрел',
  'ability.pierce_shot.desc':
    'Выстрел через карту: нажмите на врага в двух клетках по прямой — {cost} концентрации.',
  'ability.still_aim.name': 'Затаившийся стрелок',
  'ability.still_aim.desc':
    'Каждый ход на месте: урон +{perStack}%, стаков до {maxStacks}. Шаг сбрасывает стаки.',
  // hunter: crossbowman
  'ability.bolt_volley.name': 'Залп болтом',
  'ability.bolt_volley.desc':
    'Выстрел через карту за {cost} концентрации, а удар вплотную пробивает броню врага.',
  'ability.hook_bolt.name': 'Крюк-болт',
  'ability.hook_bolt.desc':
    'Притягивает дальнего врага с вашей строки или столбца на соседнюю клетку. Перезарядка {cooldown} хода.',
  // hunter: beastmaster
  'ability.stampede.name': 'Стадо кабанов',
  'ability.stampede.desc':
    'Кабаны пробегают вашу строку или столбец: враги получают {dmg}% урона и оглушены, кучки золота смяты до монеты. Перезарядка {cooldown} хода.',
  'ability.stampede.lv2': 'Кабаны бегут по любой линии поля',
  'ability.falcon.name': 'Сокол',
  'ability.falcon.desc':
    'Сокол бьёт любого врага: {dmg}% урона и кровотечение по {bleed}% за ход, ходов: {bleedTurns}. Перезарядка {cooldown} ход.',
  // hunter: huntsman
  'ability.snare.name': 'Капкан',
  'ability.snare.desc':
    'Ловушка на клетку: враг, попавший на неё, получает {dmg}% урона и оглушение. Перезарядка {cooldown} хода.',
  'ability.armed_trap.name': 'Взведённая ловушка',
  'ability.armed_trap.desc':
    'Нажмите кнопку другой способности: каждое нажатие — ход задержки, до {maxDelay}. Затем выберите клетку — способность сработает там сама. Ловушек за комнату: {charges}.',
  // mercenary
  'ability.backstab.name': 'Удар в спину',
  'ability.backstab.desc':
    'Телепорт за спину любого врага на поле и гарантированный критический удар без ответа.',
  'ability.bribe.name': 'Подкуп',
  'ability.bribe.desc':
    'Вы платите {goldShare}% золота из кошеля комнаты (минимум {goldMin}): не-босс уходит с поля. Ни души, ни золота за него — только безопасность.',
  'ability.cold_blood.name': 'Хладнокровие',
  'ability.cold_blood.desc': 'Удар в спину, убивший врага, возвращает {resource} осмотрительности.',
  // assassin
  'ability.shadow_dance.name': 'Танец теней',
  'ability.shadow_dance.desc':
    'Удар в спину, убивший врага, бесплатно телепортирует героя к самому слабому врагу. Цепь до трёх ударов.',
  'ability.sentence.name': 'Приговор',
  'ability.sentence.desc':
    'Цель получает на {vuln}% больше урона от всех источников. Её смерть возвращает всю осмотрительность.',
  'ability.lethal_dose.name': 'Смертельная доза',
  'ability.lethal_dose.desc':
    'Удар в спину отравляет: {poison}% максимального здоровья за ход, {turns} хода (у боссов — {bossPoison}%).',
  // darkassassin
  'ability.death_mark.name': 'Клеймо смерти',
  'ability.death_mark.desc':
    'Череп с отсчётом на карточке: через три хода враг умирает, а босс теряет {bossHpShare}% максимального здоровья.',
  'ability.chain_mark.name': 'Цепное клеймо',
  'ability.chain_mark.desc': 'Когда помеченный враг умирает, клеймо перескакивает на ближайшего.',
  'ability.shadow_reap.name': 'Жатва теней',
  'ability.shadow_reap.desc':
    'Все помеченные враги умирают мгновенно (боссы теряют {bossHpShare}% максимального здоровья).',
  'ability.reaper.name': 'Жнец',
  'ability.reaper.desc':
    'Три хода жатвы: удар в спину бесплатен и убивает любого не-босса, а каждое убийство продлевает жатву на ход.',
  // ninja
  'ability.shuriken_fan.name': 'Веер сюрикенов',
  'ability.shuriken_fan.desc':
    'Четыре сюрикена летят в ближайших врагов по {dmg}% урона с отдельными критами.',
  'ability.substitution.name': 'Подмена',
  'ability.substitution.desc':
    'При успешном увороте герой исчезает, оставив бревно, появляется за спиной нападавшего и бьёт критом.',
  'ability.smoke_screen.name': 'Дымовая завеса',
  'ability.smoke_screen.desc': 'Два хода враги не отвечают на ваши удары — поле в дыму.',
  'ability.wind_shadow.name': 'Тень ветра',
  'ability.wind_shadow.desc':
    'Герой проносится по всему полю и бьёт каждого врага дважды, второй удар — критический.',
} as const;
