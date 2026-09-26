/**
 * Прогон интерфейса в headless-браузере (Chromium: Edge, Chrome) через CDP: сцены по сценарию,
 * клики по канвасу, снимки экрана, ошибки консоли. Проверяет то, чего не видит selftest, — что
 * экраны собираются, кнопки ведут куда нужно, бой и окна забега проходят без исключений.
 *
 * Запуск: npm run smoke [-- <папка снимков> [зерно обезьяньего теста]]
 * SMOKE_BROWSER — путь к браузеру (иначе ищется Edge или Chrome в стандартных местах),
 * SMOKE_VITE_CONFIG — свой конфиг Vite. Нужен Node 22+ (встроенный WebSocket).
 * Код выхода 1 — были ошибки (провал шага, исключение, console.error).
 */
import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(process.argv[2] ?? join(ROOT, 'smoke-shots'));
const MONKEY_SEED = Number(process.argv[3] ?? 7);
const VITE_PORT = 5199;
const CDP_PORT = 9333;
const WINDOWS = process.platform === 'win32';

/** Браузер на базе Chromium: из SMOKE_BROWSER или первый найденный в стандартных местах. */
const findBrowser = () => {
  if (process.env.SMOKE_BROWSER) return process.env.SMOKE_BROWSER;
  const candidates = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
  ];
  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    console.error('[smoke] браузер не найден: укажите путь в SMOKE_BROWSER');
    process.exit(1);
  }
  return found;
};
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('[smoke]', ...a);

// ---------------------------------------------------------------- процессы
const VITE_CONFIG = process.env.SMOKE_VITE_CONFIG
  ? ['--config', process.env.SMOKE_VITE_CONFIG]
  : [];
const vite = spawn('npx', ['vite', ...VITE_CONFIG, '--port', String(VITE_PORT), '--strictPort'], {
  cwd: ROOT,
  shell: true,
  detached: !WINDOWS,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let viteOut = '';
vite.stdout.on('data', (d) => (viteOut += d));
vite.stderr.on('data', (d) => (viteOut += d));
vite.on('exit', (code) => {
  if (!cleaned)
    console.error(`[smoke] Vite завершился (код ${code}):
${viteOut}`);
});

// профиль браузера — вне проекта: Vite следит за файлами корня, а файлы профиля заняты браузером
const profile = join(tmpdir(), 'evil-tower-smoke-browser-profile');
rmSync(profile, { recursive: true, force: true });
const browser = spawn(
  findBrowser(),
  [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--mute-audio',
    '--autoplay-policy=no-user-gesture-required',
    '--window-size=720,1280',
    'about:blank',
  ],
  { stdio: 'ignore', detached: !WINDOWS },
);

let cleaned = false;
/** Завершить Vite и браузер со всеми дочерними процессами. */
const cleanup = () => {
  if (cleaned) return;
  cleaned = true;
  if (WINDOWS) {
    for (const pid of [browser.pid, vite.pid]) {
      try {
        execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
      } catch {
        /* уже завершён */
      }
    }
    // headless-браузер перезапускает себя отдельным процессом — добиваем всё с нашим профилем и портами
    const ps =
      "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and ($_.CommandLine -match 'evil-tower-smoke-browser-profile|remote-debugging-port=9333|--port 5199') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }";
    try {
      execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: 'ignore' });
    } catch {
      /* нечего завершать */
    }
    return;
  }
  for (const pid of [browser.pid, vite.pid]) {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      /* уже завершён */
    }
  }
};
process.on('exit', cleanup);

const until = async (fn, ms = 20000, step = 150) => {
  const t0 = Date.now();
  for (;;) {
    try {
      const v = await fn();
      if (v) return v;
    } catch {
      /* ещё не готово */
    }
    if (Date.now() - t0 > ms) throw new Error('timeout');
    await sleep(step);
  }
};

await until(
  () => viteOut.includes(`localhost:${VITE_PORT}`) || viteOut.includes(`${VITE_PORT}`),
  30000,
);
const target = await until(async () => {
  const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
  return list.find((t) => t.type === 'page');
});

// ---------------------------------------------------------------- CDP
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let seq = 0;
const pending = new Map();
const errors = [];
const consoleLines = [];
ws.addEventListener('message', (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    errors.push(`EXCEPTION: ${d.exception?.description ?? d.text}`);
  } else if (msg.method === 'Runtime.consoleAPICalled') {
    const text = msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ');
    consoleLines.push(`${msg.params.type}: ${text}`);
    if (msg.params.type === 'error') errors.push(`console.error: ${text}`);
  } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
    const e = msg.params.entry;
    if (!/favicon|sdk\.js/.test(e.url ?? '')) errors.push(`log.error: ${e.text} ${e.url ?? ''}`);
  }
});
const cdp = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, (msg) =>
      msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result),
    );
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const r = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails)
    throw new Error(
      `eval: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`,
    );
  return r.result.value;
};

await cdp('Runtime.enable');
await cdp('Log.enable');
await cdp('Page.enable');
await cdp('Emulation.setDeviceMetricsOverride', {
  width: 720,
  height: 1280,
  deviceScaleFactor: 1,
  mobile: false,
});

let shotN = 0;
const shot = async (name) => {
  const r = await cdp('Page.captureScreenshot', { format: 'png' });
  const file = join(OUT, `${String(++shotN).padStart(2, '0')}-${name}.png`);
  writeFileSync(file, Buffer.from(r.data, 'base64'));
};
const click = async (x, y) => {
  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await cdp('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x,
    y,
    button: 'left',
    clickCount: 1,
  });
  await sleep(40);
  await cdp('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x,
    y,
    button: 'left',
    clickCount: 1,
  });
};
const drag = async (x0, y0, x1, y1, steps = 8) => {
  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0, y: y0 });
  await cdp('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: x0,
    y: y0,
    button: 'left',
    clickCount: 1,
  });
  for (let i = 1; i <= steps; i++) {
    await cdp('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: x0 + ((x1 - x0) * i) / steps,
      y: y0 + ((y1 - y0) * i) / steps,
      button: 'left',
      buttons: 1,
    });
    await sleep(16);
  }
  await cdp('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: x1,
    y: y1,
    button: 'left',
    clickCount: 1,
  });
};
const key = async (k, code, vk) => {
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk });
  await sleep(30);
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
};
const scenes = () =>
  evaluate(
    'window.__game ? window.__game.scene.getScenes(true).map((s) => s.scene.key).join(",") : ""',
  );
/** Кнопки-плашки на экране (с подписью), верхние — последними. */
const buttons = () =>
  evaluate(`(() => {
  const out = [];
  for (const sc of window.__game.scene.getScenes(true)) {
    const walk = (o) => {
      if (!o || o.visible === false) return;
      if (o.labelText && o.input && o.input.enabled) {
        const b = o.getBounds();
        out.push({ text: o.labelText.text, x: b.centerX, y: b.centerY });
      }
      if (o.list) o.list.forEach(walk);
    };
    sc.children.list.forEach(walk);
  }
  return out;
})()`);
const clickButton = async (re) => {
  const list = await buttons();
  const b = list.filter((x) => re.test(x.text)).pop();
  if (!b) throw new Error(`нет кнопки ${re}: ${list.map((x) => x.text).join(' | ')}`);
  await click(Math.round(b.x), Math.round(b.y));
};
/** Бой текущей комнаты — у контроллера сцены боя. */
const RUN = `window.__game.scene.getScene('Game').controller.battle`;
const CELL_X = [146, 360, 574];
const CELL_Y = [340, 582, 824];
const clickCell = (c) => click(CELL_X[c % 3], CELL_Y[Math.floor(c / 3)]);
/** Соседняя с героем клетка, куда положить нужную карту. */
const NEIGHBOR = `const pc = run.playerCell; const n = [pc - 3, pc + 3, pc - 1, pc + 1].find((c) => c >= 0 && c < 9 && Math.abs((c % 3) - (pc % 3)) + Math.abs(Math.floor(c / 3) - Math.floor(pc / 3)) === 1);`;
/** Положить рядом с героем переход — шаг на него закрывает комнату. */
const placeExit = () =>
  evaluate(
    `(() => { const run = ${RUN}; ${NEIGHBOR} run.cards[n] = run.state.factory.createExit(); return n; })()`,
  );
/** Поставить рядом неубиваемого сильного врага и оставить герою одно очко здоровья. */
const doomHero = () =>
  evaluate(`(() => {
  const run = ${RUN}; ${NEIGHBOR}
  let e = run.cards.find((c) => c && c.kind === 'enemy');
  if (!e) throw new Error('на поле нет врагов');
  run.cards[run.cards.indexOf(e)] = null;
  run.cards[n] = e;
  Object.assign(e, { hp: 99999, maxHp: 99999, atk: 500, stun: 0 });
  // прокачанный герой переживает удар пассивками и талантами защиты — снимаем их все
  Object.assign(run.stats, { dodge: 0, parry: 0, block: 0, cheatDeath: 0, reviveHp: 0, thorns: 0, roomGuard: 0, manaShield: 0 });
  run.stats.reductions = []; run.stats.defenseMods = [];
  run.stats.passives = new Set();
  const st = run.state;
  run.hp = 1; run.shield = 0; st.cheatLeft = 0; st.reviveLeft = 0; st.roomGuardLeft = 0;
  return n;
})()`);
const waitScene = async (k, ms = 8000) => {
  await until(async () => (await scenes()) === k, ms);
  await sleep(700);
};
const step = async (label, fn) => {
  const before = errors.length;
  try {
    await fn();
    log(`ok   ${label}${errors.length > before ? `  (+${errors.length - before} ошибок)` : ''}`);
  } catch (e) {
    errors.push(`STEP FAILED ${label}: ${e.message} [сцены: ${await scenes().catch(() => '?')}]`);
    log(`FAIL ${label}: ${e.message}`);
  }
};

// ---------------------------------------------------------------- сценарий
const base = `http://localhost:${VITE_PORT}/`;
const today = new Date();
const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

await step('boot + dev params', async () => {
  await cdp('Page.navigate', {
    url: `${base}?reset=1&class=warrior&gold=9000&souls=30000&tut=1&weapon=3&armor=3&autoskill=12`,
  });
  await waitScene('Hub', 30000);
  // без всплывающих наград при входе в хаб — сценарий кликает по фиксированным точкам
  await evaluate(
    `(() => { const s = window.__store; const p = s.profile; s.data.daily = { lastClaim: '${dayKey}', streak: 1 }; s.data.gift.readyAt = Date.now() + 1e9; p.heroSave.consumables = { potion_heal: 3, potion_regen: 2, artifact: 0 }; s.flush(); return true; })()`,
  );
  await cdp('Page.navigate', { url: base });
  await waitScene('Hub', 30000);
});
await step('hub', async () => shot('hub'));
await step('звук: кнопка в хабе выключает и включает звук', async () => {
  const muted = () => evaluate('window.__store.data.muted');
  const before = await muted();
  await click(476, 64);
  await sleep(300);
  if ((await muted()) === before) throw new Error('кнопка звука не переключила muted');
  await click(476, 64);
  await sleep(300);
  if ((await muted()) !== before) throw new Error('второе нажатие не вернуло звук');
});

const P = 'window.__store.profile';
await step('хаб: ежедневная награда', async () => {
  const gold0 = await evaluate(`${P}.gold`);
  await evaluate(
    "(() => { window.__store.data.daily = { lastClaim: '', streak: 0 }; return true; })()",
  );
  await sleep(1200); // кнопки подарков обновляются раз в секунду
  await click(504, 763);
  await sleep(700);
  await shot('daily-dialog');
  await clickButton(/^Забрать$/);
  await sleep(700);
  if (await evaluate(`${P}.dailyStatus().available`)) throw new Error('награда дня не забрана');
  const gold1 = await evaluate(`${P}.gold`);
  if (gold1 - gold0 !== 120)
    throw new Error(`награда первого дня дала ${gold1 - gold0} золота, ожидалось 120`);
});

await step('хаб: дар башни ×2 за видео', async () => {
  const gold0 = await evaluate(`${P}.gold`);
  await evaluate('(() => { window.__store.data.gift.readyAt = 0; return true; })()');
  await sleep(1200);
  await click(504, 629);
  await sleep(700);
  await shot('gift-dialog');
  await clickButton(/Забрать ×2/);
  await sleep(3300); // заглушка видео — 2 с
  const gold1 = await evaluate(`${P}.gold`);
  if (gold1 - gold0 !== 140) throw new Error(`дар ×2 дал ${gold1 - gold0} золота, ожидалось 140`);
  if (await evaluate(`${P}.giftReady()`)) throw new Error('дар всё ещё готов');
});

await step('хаб: награда дня сама открывается при возвращении из боя', async () => {
  await evaluate(
    "(() => { window.__store.data.daily = { lastClaim: '', streak: 0 }; const m = window.__game.scene; m.getScenes(true).forEach((sc) => m.stop(sc.scene.key)); m.start('Hub', { from: 'game' }); return true; })()",
  );
  await waitScene('Hub');
  await sleep(900);
  await clickButton(/^Забрать$/);
  await sleep(700);
  if (await evaluate(`${P}.dailyStatus().available`)) throw new Error('окно награды не открылось');
  await evaluate(
    "(() => { const m = window.__game.scene; m.getScenes(true).forEach((sc) => m.stop(sc.scene.key)); m.start('Hub', {}); return true; })()",
  );
  await waitScene('Hub');
  await sleep(600);
});

await step('shop', async () => {
  await click(504, 228);
  await waitScene('Shop');
  await shot('shop-weapons');
  await click(214 + 140 + 7 + 70, 170); // вкладка «Броня»
  await sleep(900);
  await shot('shop-armor');
  await click(214 + 140 + 7 + 140 + 7 + 98, 170); // «Расходники»
  await sleep(900);
  await shot('shop-consumables');
  await click(459, 218 + 89 + 58); // купить зелье исцеления (первая строка)
  await sleep(500);
  await drag(459, 900, 459, 500); // прокрутка списка
  await sleep(400);
  await click(654, 62); // крестик
  await waitScene('Hub');
});

await step('лавка: починка, покупка, отказ и зелье', async () => {
  const eq = () => evaluate(`JSON.stringify(${P}.equipped('weapon'))`).then(JSON.parse);
  const gold = () => evaluate(`${P}.gold`);
  await click(504, 228);
  await waitScene('Shop');
  await sleep(1200);
  const rowBtnY = (i) => 218 + 38 + i * 190 + 89 + 58; // кнопка i-й строки оружия
  // ступень 1 слабее надетой 3-й: кнопка заблокирована, ничего не меняется
  let g0 = await gold();
  await click(459, rowBtnY(0));
  await sleep(400);
  if ((await gold()) !== g0) throw new Error('заблокированная кнопка списала золото');
  // надетая 3-я ступень изношена (dev-параметр даёт прочность 40): починка
  const worn = await eq();
  await click(459, rowBtnY(2));
  await sleep(500);
  const repaired = await eq();
  if (repaired.id !== worn.id || repaired.durability <= worn.durability)
    throw new Error('починка не прошла: ' + JSON.stringify([worn, repaired]));
  if ((await gold()) >= g0) throw new Error('починка ничего не стоила');
  // 4-я ступень: покупка
  g0 = await gold();
  await click(459, rowBtnY(3));
  await sleep(700);
  await shot('shop-bought');
  const bought = await eq();
  if (bought.id !== 'w_warrior_4')
    throw new Error('не куплено оружие 4-й ступени: ' + JSON.stringify(bought));
  if ((await gold()) >= g0) throw new Error('покупка ничего не стоила');
  // расходники: зелье исцеления
  await click(214 + 140 + 7 + 140 + 7 + 98, 170);
  await sleep(900);
  const pot0 = await evaluate(`${P}.heroSave.consumables.potion_heal`);
  await click(459, 218 + 89 + 58);
  await sleep(500);
  const pot1 = await evaluate(`${P}.heroSave.consumables.potion_heal`);
  if (pot1 !== pot0 + 1) throw new Error(`зелье не куплено: ${pot0} → ${pot1}`);
  await click(654, 62);
  await waitScene('Hub');
});

// BUG-001: список лавки прокручен до конца — скрытая маской кнопка строки не должна перехватывать крестик
await step('BUG-001: крестик лавки после прокрутки до конца', async () => {
  await click(504, 228);
  await waitScene('Shop');
  await sleep(900);
  for (let i = 0; i < 8; i++) {
    await cdp('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x: 459,
      y: 800,
      deltaX: 0,
      deltaY: 300,
    });
    await sleep(50);
  }
  await sleep(600);
  await shot('shop-scrolled-bottom');
  await click(654, 62); // крестик
  await waitScene('Hub', 4000);
});

await step('levels', async () => {
  await click(504, 372);
  await waitScene('Levels');
  await shot('levels');
  await click(654, 62);
  await waitScene('Hub');
});

await step('settings', async () => {
  await click(504, 488);
  await waitScene('Settings');
  await shot('settings');
  await click(216 + 288, 588); // English
  await sleep(900);
  await shot('settings-en');
  await click(216, 588); // обратно русский
  await sleep(900);
  await click(654, 62);
  await waitScene('Hub');
});

await step('настройки: ползунок громкости', async () => {
  await click(504, 488);
  await waitScene('Settings');
  await sleep(900);
  const vol0 = await evaluate('window.__store.data.volume');
  await click(156 + (566 - 156) * 0.25, 292); // четверть
  await sleep(300);
  const vol1 = await evaluate('window.__store.data.volume');
  if (Math.abs(vol1 - 0.25) > 0.02) throw new Error(`громкость ${vol1}, ожидалось 0.25`);
  await click(156 + (566 - 156) * vol0, 292); // вернуть как было
  await sleep(300);
  await click(654, 62);
  await waitScene('Hub');
});

await step('achievements', async () => {
  await click(396, 64);
  await waitScene('Achievements');
  await shot('achievements');
  await click(654, 62);
  await waitScene('Hub');
});

await step('skilltree', async () => {
  await click(164, 486);
  await waitScene('SkillTree');
  await shot('skilltree');
  await drag(360, 700, 300, 450);
  await sleep(500);
  await click(360, 640);
  await sleep(500);
  await shot('skilltree-panned');
  await click(66, 66); // выбор класса
  await waitScene('ClassSelect');
  await shot('classselect');
  await click(720 - 34, 510); // стрелка вправо
  await sleep(700);
  await shot('classselect-next');
  await key('Escape', 'Escape', 27);
  await waitScene('SkillTree');
  await click(654, 62);
  await waitScene('Hub');
});
const TREE = "window.__game.scene.getScene('SkillTree')";
await step('дерево: покупка кнопкой панели', async () => {
  await click(164, 486);
  await waitScene('SkillTree');
  await sleep(1000);
  // выбранный узел должен быть доступен; иначе выбираем любой доступный талант
  await evaluate(`(() => { const v = ${TREE}.view; const st = v.states.get(v.selected.id);
    if (st !== 'available' && st !== 'partial') v.select(v.tree.nodes.find((n) => n.kind === 'talent' && ['available', 'partial'].includes(v.states.get(n.id))));
    return true; })()`);
  await sleep(300);
  const before = await evaluate(
    `(() => { const v = ${TREE}.view; return { kind: v.selected.kind, souls: ${P}.souls, cls: ${P}.activeClass }; })()`,
  );
  await click(530, 1226); // «Купить» / «Улучшить» в панели
  await sleep(700);
  if (before.kind === 'class') {
    await clickButton(/Продолжить/);
    await sleep(800);
  }
  const souls1 = await evaluate(`${P}.souls`);
  if (souls1 >= before.souls) throw new Error('души не списаны: ' + JSON.stringify(before));
  await shot('skilltree-bought');
  await click(654, 62);
  await waitScene('Hub');
});

await step('game', async () => {
  await click(360, 1078); // «Играть»
  await waitScene('Game');
  await sleep(600);
  await shot('game-start');
  // обезьяний тест: касания клеток, способностей и расходников
  let s = MONKEY_SEED;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const cellX = [146, 360, 574];
  const cellY = [340, 582, 824];
  for (let i = 0; i < 70; i++) {
    const cur = await scenes();
    if (cur !== 'Game') break;
    const r = rnd();
    if (r < 0.7) await click(cellX[Math.floor(rnd() * 3)], cellY[Math.floor(rnd() * 3)]);
    else if (r < 0.9) await click(120 + Math.floor(rnd() * 480), 1158);
    else await click(62 + Math.floor(rnd() * 3) * 84, 58);
    await sleep(450);
    if (i === 20) await shot('game-mid');
  }
  await shot('game-late');
});

const freshGame = async () => {
  await evaluate(
    `(() => { const m = window.__game.scene; m.getScenes(true).forEach((sc) => m.stop(sc.scene.key)); m.start('Game', {}); return true; })()`,
  );
  await waitScene('Game');
  await sleep(900);
};

await step('game escape', async () => {
  await freshGame();
  await key('Escape', 'Escape', 27);
  await sleep(700);
  await shot('game-escape-dialog');
  await clickButton(/Продолжить/);
  await sleep(500);
});

// ---------------------------------------------------------------- ветки забега: комната, гибель, итог
await step('room clear → next room', async () => {
  await freshGame();
  await clickCell(await placeExit());
  await sleep(2200);
  await shot('room-clear-dialog');
  await clickButton(/Дальше/);
  await sleep(1500);
  await waitScene('Game');
  await sleep(900);
  await shot('next-room');
});

await step('death → revive → death → summary → double → hub', async () => {
  await clickCell(await doomHero());
  await sleep(1800);
  await shot('death-dialog');
  await clickButton(/Воскреснуть/);
  await sleep(3500);
  await shot('revived');
  await clickCell(await doomHero());
  await sleep(1800);
  await shot('death-dialog-no-revive');
  await clickButton(/Завершить забег/);
  await sleep(900);
  await shot('run-summary');
  await clickButton(/Удвоить/);
  await sleep(3500);
  await shot('run-summary-doubled');
  await clickButton(/В лобби/);
  await waitScene('Hub', 12000);
});

await step('escape → new run → escape → hub', async () => {
  await click(360, 1078);
  await waitScene('Game');
  await sleep(900);
  await key('Escape', 'Escape', 27);
  await sleep(700);
  await clickButton(/^Уйти$/);
  await sleep(900);
  await shot('escape-summary');
  await clickButton(/Новый забег/);
  await sleep(1500);
  await waitScene('Game', 12000);
  await sleep(900);
  await key('Escape', 'Escape', 27);
  await sleep(700);
  await clickButton(/^Уйти$/);
  await sleep(900);
  await clickButton(/В лобби/);
  await waitScene('Hub', 12000);
  await shot('hub-after-runs');
});

// бой каждой линейкой: удар рукой у всех, выстрел лучника, удар в спину наёмника, заклинания мага,
// ловушки ловчего
for (const [cls, lin] of [
  ['bowman', 'archer'],
  ['mercenary', 'mercenary'],
  ['elementalist', 'mage'],
  ['huntsman', 'archer'],
]) {
  await step(`бой: ${cls}`, async () => {
    await cdp('Page.navigate', { url: `${base}?class=${cls}&souls=30000&tut=1&autoskill=12` });
    await waitScene('Hub', 30000);
    await evaluate(
      `(() => { const s = window.__store; s.data.daily = { lastClaim: '${dayKey}', streak: 1 }; s.data.gift.readyAt = Date.now() + 1e9; s.flush(); return true; })()`,
    );
    await cdp('Page.navigate', { url: base });
    await waitScene('Hub');
    await freshGame();
    const lineage = await evaluate(`${RUN}.stats.lineage`);
    if (lineage !== lin) throw new Error(`в бою линейка ${lineage}, ожидалась ${lin}`);
    let r = MONKEY_SEED + cls.length;
    const rnd = () => (r = (r * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let i = 0; i < 40; i++) {
      if ((await scenes()) !== 'Game') break;
      const x = rnd();
      if (x < 0.8) await clickCell(Math.floor(rnd() * 9));
      else await click(120 + Math.floor(rnd() * 480), 1158);
      await sleep(450);
    }
    await shot(`battle-${cls}`);
  });
}

await step('дерево: вкладки, отказ от подкласса, другой подкласс и магистр', async () => {
  await cdp('Page.navigate', { url: `${base}?reset=1&class=elementalist&souls=200000&tut=1` });
  await waitScene('Hub', 30000);
  await evaluate(
    `(() => { const s = window.__store; s.data.daily = { lastClaim: '${dayKey}', streak: 1 }; s.data.gift.readyAt = Date.now() + 1e9; s.flush(); return true; })()`,
  );
  await cdp('Page.navigate', { url: base });
  await waitScene('Hub');
  await click(164, 486);
  await waitScene('SkillTree');
  await sleep(1000);
  const tab = () => evaluate(`${TREE}.view.tab`);
  await click(220, 178); // «Основа»
  await sleep(500);
  if ((await tab()) !== 'base') throw new Error('вкладка «Основа» не открылась');
  await shot('skilltree-base-tab');
  await click(500, 178); // «Профессия»
  await sleep(500);
  if ((await tab()) !== 'profession') throw new Error('вкладка «Профессия» не открылась');
  // перк подкласса — чтобы отказу было что вернуть
  await evaluate(`(() => { const sc = ${TREE}; const n = sc.view.tree.byId.get('perk/elementalist/fire-1');
    sc.controller.execute({ type: 'buy', node: n }); return true; })()`);
  await sleep(500);
  await evaluate(
    `(() => { const v = ${TREE}.view; v.select(v.tree.classNode.elementalist); return true; })()`,
  );
  await sleep(300);
  const souls0 = await evaluate(`${P}.souls`);
  await click(520, 1226); // «Отказаться от класса»
  await sleep(700);
  await shot('skilltree-cancel-dialog');
  await clickButton(/^Да$/);
  await sleep(800);
  if ((await evaluate(`${P}.activeClass`)) !== 'mage') throw new Error('герой не вернулся в маги');
  const headerName = () => evaluate(`${TREE}.view.header.name.text`);
  if ((await headerName()) !== 'Маг')
    throw new Error(`в шапке «${await headerName()}» после отказа от подкласса (BUG-003)`);
  if ((await evaluate(`${P}.souls`)) <= souls0) throw new Error('души за отказ не вернулись');
  // выбираем другой подкласс кнопкой панели
  await evaluate(
    `(() => { const v = ${TREE}.view; v.select(v.tree.classNode.warlock); return true; })()`,
  );
  await sleep(300);
  await click(530, 1226);
  await sleep(700);
  await shot('skilltree-meta-dialog');
  await clickButton(/Продолжить/);
  await sleep(900);
  if ((await evaluate(`${P}.activeClass`)) !== 'warlock')
    throw new Error('подкласс чернокнижника не выбран');
  if ((await headerName()) !== 'Чернокнижник')
    throw new Error(`в шапке «${await headerName()}» после выбора подкласса (BUG-003)`);
  // проходим ветку чернокнижника командами дерева, пока не откроется магистр
  const opened =
    await evaluate(`(() => { const sc = ${TREE}; const v = sc.view; const q = v.d.query;
    for (let i = 0; i < 80; i++) {
      if (q.check(v.tree.classNode.magister).ok) return true;
      const n = v.tree.nodes.find((x) => x.kind !== 'class' && x.owner === 'warlock' && q.check(x).ok);
      if (!n) return false;
      sc.controller.execute({ type: 'buy', node: n });
    }
    return q.check(v.tree.classNode.magister).ok; })()`);
  if (!opened) throw new Error('магистр не открылся');
  await sleep(600);
  await evaluate(
    `(() => { const v = ${TREE}.view; v.select(v.tree.classNode.magister); return true; })()`,
  );
  await sleep(300);
  await click(530, 1226);
  await sleep(700);
  await clickButton(/Продолжить/);
  await sleep(900);
  if ((await evaluate(`${P}.activeClass`)) !== 'magister')
    throw new Error('метаморфоза в магистра не прошла');
  if ((await headerName()) !== 'Магистр')
    throw new Error(`в шапке «${await headerName()}» после метаморфозы (BUG-003)`);
  if ((await evaluate(`${P}.data.stats.metamorphoses`)) < 2)
    throw new Error('метаморфозы не посчитаны');
  await shot('skilltree-meta-done');
  await click(654, 62);
  await waitScene('Hub');
});

await step('первый запуск: выбор героя ведёт в бой', async () => {
  await cdp('Page.navigate', { url: `${base}?reset=1` });
  await waitScene('ClassSelect', 30000);
  await sleep(900);
  await shot('classselect-first');
  await click(360, 950 + 152); // «Начать»
  await waitScene('Game', 12000);
  if ((await evaluate(`${P}.activeClass`)) !== 'warrior')
    throw new Error('стартовый герой не воин');
  if (!(await evaluate(`${P}.isLineageUnlocked('warrior')`)))
    throw new Error('линейка воина не открыта');
});

await step('выбор героя: открыть за золото и сменить', async () => {
  await evaluate(
    `(() => { ${P}.addGold(1000, false); const m = window.__game.scene; m.getScenes(true).forEach((sc) => m.stop(sc.scene.key)); m.start('ClassSelect', { mode: 'switch', from: 'Hub' }); return true; })()`,
  );
  await waitScene('ClassSelect');
  await sleep(900);
  await click(686, 510); // стрелка вправо — маг, закрыт
  await sleep(900);
  const gold0 = await evaluate(`${P}.gold`);
  await click(360, 950 + 152); // «Открыть за 600»
  await sleep(700);
  if (!(await evaluate(`${P}.isLineageUnlocked('mage')`))) throw new Error('маг не открылся');
  if ((await evaluate(`${P}.gold`)) !== gold0 - 600)
    throw new Error('открытие стоило не 600 золота');
  await click(360, 950 + 152); // «Выбрать»
  await sleep(700);
  await shot('classselect-switch-dialog');
  await clickButton(/Продолжить/);
  await waitScene('Hub', 12000);
  if ((await evaluate(`${P}.activeClass`)) !== 'mage') throw new Error('герой не сменился на мага');
});

const state = await evaluate(
  `JSON.stringify({ scenes: window.__game.scene.getScenes(true).map((s) => s.scene.key), best: window.__store.profile.best, kills: window.__store.data.stats.kills })`,
).catch((e) => e.message);
log('state', state);
writeFileSync(join(OUT, 'errors.txt'), errors.join('\n') + '\n');
writeFileSync(join(OUT, 'console.txt'), consoleLines.join('\n') + '\n');
log(`ошибок: ${errors.length}`);
for (const e of errors.slice(0, 30)) log('  ', e);
await cdp('Browser.close').catch(() => undefined);
ws.close();
cleanup();
await sleep(300);
process.exit(errors.length ? 1 : 0);
