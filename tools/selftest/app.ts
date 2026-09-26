/** Самопроверка: Приложение: потоки экранов без Phaser на подставных портах. */
import { AD_POLICY } from '../../src/application/ads/adPolicy';
import { AdService } from '../../src/application/ads/AdService';
import { ClassSelectController } from '../../src/application/class-select/ClassSelectController';
import { ClassSelection } from '../../src/application/class-select/ClassSelection';
import type { ClassSelectMode } from '../../src/application/class-select/interfaces/ClassSelectMode';
import { AutoUseToggles } from '../../src/application/game/AutoUseToggles';
import { GameController } from '../../src/application/game/GameController';
import type { IGameDialogs } from '../../src/application/game/interfaces/IGameDialogs';
import type { IGameRenderer } from '../../src/application/game/interfaces/IGameRenderer';
import type { PlayerCommand } from '../../src/application/game/interfaces/PlayerCommand';
import type { RunSummary } from '../../src/application/game/interfaces/RunSummary';
import { TowerRun } from '../../src/application/game/TowerRun';
import { EnterHub } from '../../src/application/hub/EnterHub';
import { GetHubState } from '../../src/application/hub/GetHubState';
import { HubController } from '../../src/application/hub/HubController';
import type { HubMenu } from '../../src/application/hub/interfaces/HubMenu';
import type { HubOrigin } from '../../src/application/hub/interfaces/HubOrigin';
import type { IClock, IPlatform } from '../../src/application/ports';
import { ClaimDailyReward } from '../../src/application/rewards/ClaimDailyReward';
import { ClaimTowerGift } from '../../src/application/rewards/ClaimTowerGift';
import type { RewardChoice } from '../../src/application/rewards/interfaces/RewardChoice';
import { AudioSettings } from '../../src/application/settings/AudioSettings';
import { LanguageSettings } from '../../src/application/settings/LanguageSettings';
import { SettingsController } from '../../src/application/settings/SettingsController';
import { BuyConsumable } from '../../src/application/shop/BuyConsumable';
import { BuyItem } from '../../src/application/shop/BuyItem';
import type { IShopView } from '../../src/application/shop/interfaces/IShopView';
import { ShopCatalog } from '../../src/application/shop/ShopCatalog';
import { ShopController } from '../../src/application/shop/ShopController';
import { AutoSkill } from '../../src/application/skill-tree/AutoSkill';
import { BuySkill } from '../../src/application/skill-tree/BuySkill';
import { CancelMetamorphosis } from '../../src/application/skill-tree/CancelMetamorphosis';
import type { ISkillTreeView } from '../../src/application/skill-tree/interfaces/ISkillTreeView';
import { Metamorphose } from '../../src/application/skill-tree/Metamorphose';
import { SkillTreeController } from '../../src/application/skill-tree/SkillTreeController';
import { SkillTreeQuery } from '../../src/application/skill-tree/SkillTreeQuery';
import { Profile } from '../../src/domain/account/profile';
import { baseClassOf, type ClassId, type LineageId } from '../../src/domain/catalog';
import { CONSUMABLES } from '../../src/domain/catalog/consumables';
import { type RoomBattle } from '../../src/domain/combat/room-battle';
import { ProgressionBalance } from '../../src/domain/progression';
import { DAILY_REWARDS } from '../../src/domain/rewards/daily';
import { GIFT_REWARD } from '../../src/domain/rewards/tower-gift';
import { DayKey, Gold, type Lang, Souls } from '../../src/domain/shared';
import { ok } from './harness';

// ---------------------------------------------------------------- приложение: потоки экранов без Phaser
{
  /** Подставная платформа: записывает вызовы; видео с наградой досматривается, если `rewarded`. */
  const fakePlatform = (rewarded: boolean): { platform: IPlatform; calls: string[] } => {
    const calls: string[] = [];
    const platform: IPlatform = {
      ready: () => void calls.push('ready'),
      gameplayStart: () => void calls.push('start'),
      gameplayStop: () => void calls.push('stop'),
      showRewarded: async () => (calls.push('rewarded'), rewarded),
      showInterstitial: async () => (calls.push('interstitial'), true),
      submitScore: async () => undefined,
      setStats: async () => undefined,
    };
    return { platform, calls };
  };
  const clock: IClock = { delay: () => Promise.resolve() };
  /** Дать отработать обещаниям потока (окна, реклама). */
  const settle = (): Promise<void> => new Promise((done) => setTimeout(done, 0));
  const heroProfile = (lin: LineageId): Profile => {
    const p = new Profile(Profile.freshData('ru', 0), () => 0, {
      today: () => DayKey.of(2026, 9, 25),
    });
    p.unlockLineage(lin);
    p.setActiveClass(baseClassOf(lin));
    return p;
  };

  // хаб: вход, награды с рекламой, уход один раз, награда дня при возвращении из боя
  {
    const hubFor = (p: Profile, rewarded: boolean, choice: () => RewardChoice) => {
      const { platform, calls } = fakePlatform(rewarded);
      const ads = new AdService(platform, p, () => 0);
      const log: string[] = [];
      const opened: Array<HubMenu | 'play'> = [];
      let asked = 0;
      const hub = new HubController({
        profile: p,
        state: new GetHubState(p, new ShopCatalog(p)),
        daily: new ClaimDailyReward(p, ads),
        gift: new ClaimTowerGift(p, ads),
        view: {
          autoSkilled: (n) => void log.push(`auto:${n}`),
          rewarded: () => void log.push('reward'),
          showRewards: () => undefined,
        },
        dialogs: { daily: async () => (asked++, choice()), gift: async () => (asked++, choice()) },
        navigator: { open: (m) => void opened.push(m), play: () => void opened.push('play') },
        clock,
      });
      return { hub, calls, log, opened, platform, asked: () => asked };
    };
    const p = heroProfile('warrior');
    let choice: RewardChoice = 'double';
    const h = hubFor(p, true, () => choice);
    const entry = new EnterHub(p, h.platform).execute();
    ok(
      h.calls[0] === 'ready' && entry.autoSkillBuys === 0,
      'хаб: вход сообщает платформе о готовности',
    );
    h.hub.execute({ type: 'daily' });
    await settle();
    ok(
      p.gold === DAILY_REWARDS[0].gold! * 2 &&
        !p.dailyStatus().available &&
        h.log.includes('reward'),
      'хаб: награда дня за досмотренное видео — вдвое',
    );
    choice = 'single';
    const gold1 = p.gold;
    h.hub.execute({ type: 'gift' });
    await settle();
    ok(
      p.gold - gold1 === GIFT_REWARD.gold &&
        !p.giftReady() &&
        h.calls.filter((c) => c === 'rewarded').length === 1,
      'хаб: «Дар башни» без видео — обычный, реклама не показывается',
    );
    h.hub.execute({ type: 'open', menu: 'levels' });
    h.hub.execute({ type: 'play' });
    h.hub.execute({ type: 'open', menu: 'shop' });
    ok(h.opened.join() === 'levels', 'хаб: пока идёт уход в меню, остальные нажатия не считаются');

    const back = (from: HubOrigin | undefined) => {
      const q = heroProfile('warrior');
      q.markTutorial('skill');
      const r = hubFor(q, false, () => 'double');
      return { q, r, done: r.hub.start({ autoSkillBuys: 3 }, from) };
    };
    const fromGame = back('game');
    await fromGame.done;
    await settle();
    ok(
      fromGame.r.log[0] === 'auto:3' &&
        fromGame.r.asked() === 1 &&
        fromGame.q.gold === DAILY_REWARDS[0].gold,
      'хаб: из боя — итог автопрокачки и награда дня (видео не досмотрено — обычная)',
    );
    const fromMenu = back('shop');
    await fromMenu.done;
    ok(
      fromMenu.r.asked() === 0 && fromMenu.q.dailyStatus().available,
      'хаб: из меню награду дня сам не предлагает',
    );
  }

  // лавка: покупка, повтор, починка, «слабее надетого», предел зелий, нехватка золота
  {
    const p = heroProfile('warrior');
    p.addGold(Gold.of(20000), false);
    const log: string[] = [];
    let closes = 0;
    const view: IShopView = {
      itemBought: (it, repaired) => void log.push(`${repaired ? 'repaired' : 'bought'}:${it.id}`),
      consumableBought: () => void log.push('potion'),
      noGold: () => void log.push('gold'),
      stackFull: (def) => void log.push(`full:${def.id}`),
      denied: () => void log.push('denied'),
    };
    const shop = new ShopController({
      buyItem: new BuyItem(p),
      buyConsumable: new BuyConsumable(p),
      view,
      navigator: { close: () => void closes++ },
    });
    const catalog = new ShopCatalog(p);
    const [w1, w2] = catalog.items('weapon').map((o) => o.item);
    ok(
      catalog.items('weapon').every((o) => o.item.lineage === 'warrior') &&
        catalog.items('weapon')[0].action === 'buy',
      'лавка: оружие — только линейки героя',
    );
    shop.execute({ type: 'buy-item', item: w1 });
    ok(
      log.at(-1) === `bought:${w1.id}` && catalog.items('weapon')[0].action === 'equipped',
      'лавка: купленная вещь надета',
    );
    shop.execute({ type: 'buy-item', item: w1 });
    ok(log.at(-1) === 'denied', 'лавка: целую надетую вещь второй раз не продаём');
    p.equipped('weapon')!.durability = 1;
    const repair = catalog.items('weapon')[0];
    const gold0 = p.gold;
    shop.execute({ type: 'buy-item', item: w1 });
    ok(
      repair.action === 'repair' &&
        log.at(-1) === `repaired:${w1.id}` &&
        gold0 - p.gold === repair.price,
      'лавка: починка стоит столько, сколько обещано',
    );
    shop.execute({ type: 'buy-item', item: w2 });
    ok(
      catalog.items('weapon')[0].action === 'weaker',
      'лавка: вещь слабее надетой больше не нужна',
    );
    shop.execute({ type: 'buy-item', item: w1 });
    ok(log.at(-1) === 'denied', 'лавка: вещь слабее надетой не продаём');
    for (let i = 0; i < 10; i++) shop.execute({ type: 'buy-consumable', id: 'potion_heal' });
    ok(
      p.heroSave.consumables.potion_heal === CONSUMABLES.potion_heal.max &&
        log.at(-1) === 'full:potion_heal',
      'лавка: зелья — не больше предела запаса',
    );
    shop.execute({ type: 'close' });
    shop.execute({ type: 'close' });
    ok(closes === 1, 'лавка: закрывается один раз');
    ok(
      new ShopCatalog(p).hasAffordableUpgrade(),
      'лавка: при золоте на следующую ступень значок «есть что купить» есть',
    );
    const poor = heroProfile('warrior');
    const poorLog: string[] = [];
    new ShopController({
      buyItem: new BuyItem(poor),
      buyConsumable: new BuyConsumable(poor),
      view: { ...view, noGold: () => void poorLog.push('gold') },
      navigator: { close: () => undefined },
    }).execute({ type: 'buy-item', item: w1 });
    ok(
      poorLog[0] === 'gold' &&
        !poor.equipped('weapon') &&
        !new ShopCatalog(poor).hasAffordableUpgrade(),
      'лавка: без золота не купить, значка нет',
    );
  }

  // дерево навыков: первая покупка, метаморфоза с подтверждением, отказ от финального класса, автопрокачка
  {
    const log: string[] = [];
    const view: ISkillTreeView = {
      refused: (r) => void log.push(`refused:${r}`),
      learned: (n) => void log.push(`learned:${n.id}`),
      metamorphosisCancelled: (to) => void log.push(`cancelled:${to}`),
      autoBought: (plan) => void log.push(`auto:${plan.buys.length}`),
      autoToggled: (on) => void log.push(`toggle:${on}`),
    };
    let confirm = false;
    let closes = 0;
    const treeFor = (p: Profile) => {
      const query = new SkillTreeQuery(p);
      const ctl = new SkillTreeController({
        query,
        buySkill: new BuySkill(p),
        metamorphose: new Metamorphose(p),
        cancelMetamorphosis: new CancelMetamorphosis(p),
        autoSkill: new AutoSkill(p),
        view,
        dialogs: { confirmMetamorphosis: async () => confirm, confirmCancel: async () => confirm },
        navigator: { close: () => void closes++, switchClass: () => undefined },
        clock,
      });
      return { query, ctl };
    };
    const p = heroProfile('mage');
    p.addSouls(Souls.of(1e7), false);
    const { query, ctl } = treeFor(p);
    const tree = query.tree;
    const first = query.tutorialTarget()!;
    ctl.execute({ type: 'buy', node: first });
    ok(
      log.at(-1) === `learned:${first.id}` && p.tutorial.skill && query.tutorialTarget() === null,
      'дерево: первая покупка завершает обучение',
    );
    /** Проходит ветку класса `owner` командами дерева, пока не откроется метаморфоза в `to`. */
    const passBranch = (owner: ClassId, to: ClassId): boolean => {
      for (let i = 0; i < 200 && !query.check(tree.classNode[to]).ok; i++) {
        const n = tree.nodes.find(
          (x) => x.kind !== 'class' && x.owner === owner && query.check(x).ok,
        );
        if (!n) break;
        ctl.execute({ type: 'buy', node: n });
      }
      return query.check(tree.classNode[to]).ok;
    };
    ctl.execute({ type: 'buy', node: tree.classNode.elementalist });
    await settle();
    ok(p.activeClass === 'mage', 'дерево: без подтверждения выбора подкласса нет');
    confirm = true;
    ctl.execute({ type: 'buy', node: tree.classNode.elementalist });
    await settle();
    ok(
      p.activeClass === 'elementalist' &&
        p.data.stats.metamorphoses === 1 &&
        log.at(-1) === `learned:${tree.classNode.elementalist.id}`,
      'дерево: выбор подкласса — с подтверждением и в счётчике',
    );
    const souls0 = p.souls;
    ctl.execute({ type: 'buy', node: tree.byId.get('perk/elementalist/fire-1')! });
    ctl.execute({ type: 'cancel-metamorphosis' });
    await settle();
    ok(
      p.activeClass === 'mage' && p.souls < souls0 && log.at(-1) === 'cancelled:mage',
      'дерево: отказ от подкласса возвращает мага и часть душ',
    );
    ctl.execute({ type: 'buy', node: tree.classNode.warlock });
    await settle();
    ok(p.activeClass === 'warlock', 'дерево: после отказа можно выбрать другой подкласс');
    ok(passBranch('warlock', 'magister'), 'дерево: пройденная ветка открывает магистра');
    ctl.execute({ type: 'buy', node: tree.classNode.magister });
    await settle();
    ok(
      p.activeClass === 'magister' && p.data.stats.metamorphoses === 3,
      'дерево: метаморфоза в магистра',
    );
    ctl.execute({ type: 'toggle-auto' });
    ok(log.includes('toggle:true') && p.autoSkillCfg().on, 'дерево: автопрокачка включается');
    ctl.execute({ type: 'toggle-auto' });
    ok(log.at(-1) === 'toggle:false' && !p.autoSkillCfg().on, 'дерево: автопрокачка выключается');
    ctl.execute({ type: 'close' });
    ctl.execute({ type: 'close' });
    ok(closes === 1, 'дерево: закрывается один раз');
    const poor = heroProfile('mage');
    const pt = treeFor(poor);
    const target = pt.query.tree.nodes.find(
      (n) => n.kind !== 'class' && pt.query.state(n) === 'available',
    )!;
    pt.ctl.execute({ type: 'buy', node: target });
    ok(log.at(-1) === 'refused:souls' && !poor.tutorial.skill, 'дерево: без душ не купить');
  }

  // выбор героя: первый запуск, открытие за золото, смена героя, кошелёк у каждого свой
  {
    const p = new Profile(Profile.freshData('ru', 0), () => 0, {
      today: () => DayKey.of(2026, 9, 25),
    });
    const log: string[] = [];
    let games = 0;
    let backs = 0;
    const { platform, calls } = fakePlatform(false);
    const selectFor = (mode: ClassSelectMode) => {
      const selection = new ClassSelection(p, mode);
      const ctl = new ClassSelectController({
        selection,
        platform,
        view: {
          started: () => void log.push('started'),
          unlocked: (c) => void log.push(`unlocked:${c}`),
          noGold: () => void log.push('gold'),
          switched: () => void log.push('switched'),
        },
        dialogs: { confirmSwitch: async () => true },
        navigator: { startGame: () => void games++, back: () => void backs++ },
      });
      return { selection, ctl };
    };
    const first = selectFor('first');
    first.ctl.start();
    ok(
      p.isFirstRun &&
        calls.includes('ready') &&
        first.selection.choices().every((c) => c.opened && c.action === 'start'),
      'выбор героя: в первый запуск доступны все герои',
    );
    first.ctl.execute({ type: 'choose', classId: 'hunter' });
    await settle();
    ok(
      p.activeClass === 'hunter' && !p.isFirstRun && games === 1 && log.at(-1) === 'started',
      'выбор героя: первый выбор открывает героя и ведёт в забег',
    );
    const sw = selectFor('switch');
    ok(
      sw.selection.choice('hunter').action === 'current' &&
        sw.selection.choice('mage').action === 'unlock',
      'выбор героя: текущий герой отмечен, закрытые — за золото',
    );
    sw.ctl.execute({ type: 'choose', classId: 'mage' });
    await settle();
    ok(
      log.at(-1) === 'gold' && !p.isLineageUnlocked('mage'),
      'выбор героя: без золота героя не открыть',
    );
    p.addGold(Gold.of(ProgressionBalance.heroUnlockCost + 100), false);
    sw.ctl.execute({ type: 'choose', classId: 'mage' });
    await settle();
    ok(
      log.at(-1) === 'unlocked:mage' &&
        p.activeClass === 'hunter' &&
        p.gold === 100 &&
        sw.selection.choice('mage').action === 'pick',
      'выбор героя: открытие стоит своё и героя не меняет',
    );
    sw.ctl.execute({ type: 'choose', classId: 'mage' });
    await settle();
    ok(
      p.activeClass === 'mage' && backs === 1 && log.at(-1) === 'switched',
      'выбор героя: смена героя — с подтверждением',
    );
    ok(
      p.gold === 0 && p.heroSaveOf('archer').gold === 100,
      'выбор героя: у каждого героя свой кошелёк',
    );
  }

  // настройки: кнопка звука, ползунок громкости, язык
  {
    const p = heroProfile('warrior');
    const out: string[] = [];
    const audio = new AudioSettings(p, {
      setVolume: (v) => void out.push(`vol:${v}`),
      setMuted: (m) => void out.push(`mute:${m}`),
    });
    const applied: Lang[] = [];
    const shown: Array<[number, boolean]> = [];
    let reloads = 0;
    const ctl = new SettingsController({
      audio,
      language: new LanguageSettings(p, { apply: (l) => void applied.push(l) }),
      view: { showVolume: (v, silent) => void shown.push([v, silent]) },
      navigator: { close: () => undefined, reload: () => void reloads++ },
    });
    ok(
      audio.toggleMuted() && p.muted && out.at(-1) === 'mute:true',
      'настройки: кнопка звука выключает звук и помнит выбор',
    );
    ctl.execute({ type: 'volume', value: 0.4 });
    ok(
      p.volume === 0.4 && !p.muted && shown.at(-1)?.[1] === false && out.includes('vol:0.4'),
      'настройки: ползунок громкости снимает «без звука»',
    );
    ctl.execute({ type: 'volume', value: 0 });
    ok(shown.at(-1)?.[1] === true, 'настройки: на нулевой громкости звука нет');
    ctl.execute({ type: 'language', lang: 'ru' });
    ok(reloads === 0 && applied.length === 0, 'настройки: тот же язык ничего не меняет');
    ctl.execute({ type: 'language', lang: 'en' });
    ok(
      reloads === 1 && p.lang === 'en' && applied.join() === 'en',
      'настройки: новый язык сохраняется, применяется и пересобирает экран',
    );
  }

  // реклама: полноэкранная — не в первых комнатах и не чаще кулдауна, видео с наградой — пауза игры
  {
    const p = heroProfile('warrior');
    const { platform, calls } = fakePlatform(true);
    let now = 1_000_000;
    const ads = new AdService(platform, p, () => now);
    const shown = (): number => calls.filter((c) => c === 'interstitial').length;
    await ads.interstitial();
    ok(shown() === 0, 'реклама: полноэкранной нет в первых комнатах');
    p.bump('roomsCleared', AD_POLICY.firstAdAfterRooms);
    await ads.interstitial();
    ok(
      shown() === 1 && p.lastInterstitial === now,
      'реклама: после нескольких комнат — показана и запомнена',
    );
    now += AD_POLICY.interstitialCooldownMs - 1;
    await ads.interstitial();
    ok(shown() === 1, 'реклама: не чаще собственного кулдауна');
    now += 1;
    await ads.interstitial();
    ok(shown() === 2, 'реклама: после кулдауна — снова');
    ok(
      (await ads.rewarded()) && calls.includes('stop'),
      'реклама: видео с наградой ставит игру на паузу',
    );
  }

  // бой: гибель → воскрешение за видео → гибель → итог забега; видео не досмотрено; побег
  {
    const gameFor = (rewarded: boolean, died: Array<'revive' | 'end'>) => {
      const p = heroProfile('warrior');
      p.markTutorial('fight');
      const { platform, calls } = fakePlatform(rewarded);
      const tower = new TowerRun(
        { profile: p, platform, storage: { flush: () => undefined }, seeds: { next: () => 7 } },
        TowerRun.start(p),
      );
      const battle = tower.enterRoom() as RoomBattle;
      const asked: Array<{ canRevive: boolean; lootLost: boolean }> = [];
      const summaries: RunSummary[] = [];
      const nav: string[] = [];
      const shown: string[] = [];
      let send: (cmd: PlayerCommand) => void = () => undefined;
      let killNext = false;
      const dialogs: IGameDialogs = {
        confirmEscape: async () => (shown.push('confirmEscape'), true),
        roomCleared: async () => 'cashout',
        died: async (d) => (asked.push(d), died.shift() ?? 'end'),
        runOver: async (sum) => (summaries.push(sum), 'hub'),
      };
      const view = new Proxy(
        {},
        { get: (_, k) => () => void shown.push(String(k)) },
      ) as IGameRenderer;
      const controller = new GameController({
        battle,
        tower,
        profile: p,
        autoUse: new AutoUseToggles(p),
        ads: new AdService(platform, p, () => 0),
        platform,
        view,
        player: {
          play: async () => {
            // ход, после которого герой погибает: исход решает бой, поток только читает `over`
            if (killNext) battle.over = 'lose';
            killNext = false;
          },
        },
        dialogs,
        navigator: {
          nextRoom: () => void nav.push('next'),
          newRun: () => void nav.push('new'),
          toHub: () => void nav.push('hub'),
        },
        clock,
        input: { onCommand: (h) => void (send = h) },
      });
      /** Ход зельем исцеления; `fatal` — после него герой погибает. */
      const drink = (fatal: boolean): void => {
        battle.hp = 1;
        battle.consumables = { potion_heal: 5, potion_regen: 0, artifact: 0 };
        killNext = fatal;
        send({ type: 'use-item', itemId: 'potion_heal' });
      };
      const settleAll = async (): Promise<void> => {
        for (let i = 0; i < 5; i++) await settle();
      };
      return { p, battle, calls, asked, summaries, nav, shown, controller, drink, send, settleAll };
    };

    const g = gameFor(true, ['revive', 'end']);
    g.controller.start();
    await g.settleAll();
    g.drink(true);
    await g.settleAll();
    ok(
      g.asked.length === 1 && g.asked[0].canRevive && g.battle.over === null && g.battle.revived,
      'бой: после гибели — окно, воскрешение за досмотренное видео',
    );
    g.drink(true);
    await g.settleAll();
    ok(
      g.asked.length === 2 && !g.asked[1].canRevive,
      'бой: второе воскрешение за видео в забеге не предлагается',
    );
    ok(
      g.summaries.length === 1 &&
        g.summaries[0].reason === 'dead' &&
        g.nav.join() === 'hub' &&
        g.p.stats.deaths === 1 &&
        g.calls.filter((c) => c === 'rewarded').length === 1,
      'бой: вторая гибель — итог забега один раз, уход в хаб',
    );
    g.send({ type: 'escape' });
    await g.settleAll();
    ok(
      g.summaries.length === 1 && g.nav.length === 1,
      'бой: после итога забега команды не действуют',
    );

    const noVideo = gameFor(false, ['revive', 'end']);
    noVideo.controller.start();
    await noVideo.settleAll();
    noVideo.drink(true);
    await noVideo.settleAll();
    ok(
      noVideo.asked.length === 2 &&
        noVideo.asked.every((a) => a.canRevive) &&
        !noVideo.battle.revived &&
        noVideo.summaries[0]?.reason === 'dead',
      'бой: видео не досмотрено — окно гибели возвращается, герой не встаёт',
    );

    const run = gameFor(true, []);
    run.controller.start();
    await run.settleAll();
    run.drink(false);
    await run.settleAll();
    ok(
      run.battle.over === null && run.asked.length === 0,
      'бой: обычный ход не заканчивает комнату',
    );
    run.battle.totals.gold = Gold.of(5);
    run.send({ type: 'escape' });
    await run.settleAll();
    ok(
      run.shown.includes('confirmEscape') &&
        run.summaries.length === 1 &&
        run.summaries[0].reason === 'escape' &&
        run.summaries[0].lootLost &&
        run.nav.join() === 'hub' &&
        run.p.stats.deaths === 0,
      'бой: побег — с подтверждением, добыча комнаты пропадает, уход в хаб',
    );
  }
}
