/**
 * Проверка архитектуры: npm run archtest
 *
 * 1. Правила зависимостей между слоями (PROJECT-DECISIONS.md, «Правила зависимостей между слоями»):
 *    слой файла — первая папка после `src/`, импорт разрешён только в перечисленные слои и пакеты.
 * 2. Домен и приложение не трогают браузер (window, document, localStorage…) — время и платформа
 *    приходят через порты.
 * 3. Доменные области (docs/DOMAIN.md): область зависит только от областей из своей строки карты
 *    `CONTEXTS`; чужую область видно только через её `index.ts` (и из других слоёв тоже), а свой
 *    `index.ts` область не импортирует; файлов вне областей в домене нет. Инструменты (`tools`)
 *    могут смотреть внутрь областей.
 * 4. Внутри боя поле и колода (`domain/combat/engine`) не знают правил боя (`room-battle`, `attack`,
 *    `auto-use`) и прогресса героя.
 * 5. Все относительные импорты в `src` и `tools` ведут в существующие файлы (tools не проверяет tsc).
 * 6. Нет циклов среди импортов, которые остаются после сборки (`import type` не считается).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

type Layer =
  | 'domain'
  | 'application'
  | 'presentation'
  | 'infrastructure'
  | 'composition'
  | 'i18n'
  | 'entry'
  | 'tools';

interface ImportRef {
  spec: string;
  line: number;
  /** Импорт стирается при сборке (только типы). */
  typeOnly: boolean;
}

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

/** Куда слою можно импортировать (слои) и какие внешние пакеты ему разрешены. */
const ALLOWED: Record<Exclude<Layer, 'tools'>, { layers: Layer[]; packages: RegExp | null }> = {
  domain: { layers: ['domain'], packages: null },
  application: { layers: ['domain', 'application'], packages: null },
  presentation: { layers: ['domain', 'application', 'presentation', 'i18n'], packages: /^phaser$/ },
  infrastructure: { layers: ['domain', 'application', 'infrastructure'], packages: null },
  composition: {
    layers: ['domain', 'application', 'presentation', 'infrastructure', 'composition', 'i18n'],
    packages: /^phaser$/,
  },
  i18n: { layers: ['domain', 'i18n'], packages: null },
  entry: { layers: ['composition'], packages: /^@fontsource\// },
};

/**
 * Карта доменных областей (docs/DOMAIN.md): от каких областей может зависеть область. Каждая
 * строка ссылается только на области выше себя, поэтому циклов между областями нет.
 */
const CONTEXTS: Record<string, readonly string[]> = {
  shared: [],
  catalog: ['shared'],
  combat: ['catalog', 'shared'],
  progression: ['combat', 'catalog', 'shared'],
  economy: ['catalog', 'shared'],
  rewards: ['economy', 'catalog', 'shared'],
  expedition: ['progression', 'combat', 'economy', 'catalog', 'shared'],
  account: ['progression', 'combat', 'economy', 'rewards', 'catalog', 'shared'],
};

/**
 * Браузерные API, которых не должно быть в домене и приложении. Считается только обращение
 * к глобальному имени: `this.d.navigator.close()` — это порт, а не `window.navigator`.
 */
const BROWSER =
  /(?<![.\w$])(window|document|localStorage|sessionStorage|navigator)\s*\.|(?<![.\w$])(setTimeout|setInterval|requestAnimationFrame)\s*\(/;

const walk = (dir: string, ext: RegExp): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p, ext) : ext.test(name) ? [p] : [];
  });

const rel = (p: string): string => relative(ROOT, p).split(sep).join('/');

const layerOf = (file: string): Layer => {
  const r = relative(SRC, file).split(sep);
  if (r[0] === '..') return 'tools';
  if (r.length === 1) return 'entry';
  return r[0] as Layer;
};

/** Область файла домена — папка после `src/domain/`; `root` — файл в корне домена; null — не домен. */
const contextOf = (file: string): string | null => {
  const r = rel(file);
  if (!r.startsWith('src/domain/')) return null;
  const parts = r.split('/');
  return parts.length === 3 ? 'root' : parts[2];
};

/** Файл домена лежит в описанной области. */
const placementProblem = (file: string): string | null => {
  const ctx = contextOf(file);
  if (ctx === 'root') return 'файл в корне домена вне доменной области';
  if (ctx && !CONTEXTS[ctx]) return `папка домена «${ctx}» не описана в карте областей`;
  return null;
};

/** Нарушения границ доменных областей для импорта `file` → `target`. */
const contextProblems = (file: string, target: string): string[] => {
  const from = contextOf(file);
  const to = contextOf(target);
  if (!to || !CONTEXTS[to]) return [];
  const index = `src/domain/${to}/index.ts`;
  if (from === to) {
    return rel(target) === index
      ? [`область «${to}» импортирует свой index.ts (внутри области — напрямую)`]
      : [];
  }
  const out: string[] = [];
  if (from && CONTEXTS[from] && !CONTEXTS[from].includes(to)) {
    out.push(`область «${from}» не может зависеть от «${to}» (${rel(target)})`);
  }
  if (rel(target) !== index) {
    out.push(`импорт в глубину области «${to}» — только через её index.ts (${rel(target)})`);
  }
  return out;
};

/** Импорты файла: статические, реэкспорты, импорты ради побочного эффекта и динамические. */
const importsOf = (src: string): ImportRef[] => {
  const out: ImportRef[] = [];
  const lineAt = (i: number): number => src.slice(0, i).split('\n').length;
  const stat = /(?:^|\n)\s*(import|export)\s+(type\s+)?([^'"]*?)\s+from\s+['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = stat.exec(src))) {
    const clause = m[3];
    const named = /^\{([\s\S]*)\}$/.exec(clause.trim());
    // `import { type A, type B }` без значений тоже стирается при сборке
    const allTypes =
      !!named &&
      named[1]
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .every((x) => x.startsWith('type '));
    out.push({
      spec: m[4],
      line: lineAt(m.index + m[0].indexOf(m[1])),
      typeOnly: !!m[2] || allTypes,
    });
  }
  const bare = /(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g;
  while ((m = bare.exec(src)))
    out.push({ spec: m[1], line: lineAt(m.index + m[0].indexOf('import')), typeOnly: false });
  const dyn = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = dyn.exec(src))) out.push({ spec: m[1], line: lineAt(m.index), typeOnly: false });
  return out;
};

const resolveImport = (from: string, spec: string): string | null => {
  const base = resolve(dirname(from), spec);
  for (const cand of [base, `${base}.ts`, join(base, 'index.ts'), `${base}.mjs`, `${base}.js`]) {
    try {
      if (statSync(cand).isFile()) return cand;
    } catch {
      /* нет такого файла */
    }
  }
  return null;
};

const problems: string[] = [];
const graph = new Map<string, Set<string>>();
/** Сколько импортов идёт из слоя в слой и из области в область (для `--graph`). */
const matrix = new Map<string, number>();
const contextMatrix = new Map<string, number>();
const srcFiles = walk(SRC, /\.ts$/);
const toolFiles = walk(join(ROOT, 'tools'), /\.(ts|mjs)$/);

for (const file of [...srcFiles, ...toolFiles]) {
  const text = readFileSync(file, 'utf8');
  const layer = layerOf(file);
  const edges = new Set<string>();
  graph.set(file, edges);

  const misplaced = placementProblem(file);
  if (misplaced) problems.push(`${rel(file)} — ${misplaced}`);

  if (layer === 'domain' || layer === 'application') {
    text.split('\n').forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, '');
      if (!/^\s*(\*|\/\*)/.test(line) && BROWSER.test(code)) {
        problems.push(`${rel(file)}:${i + 1} — ${layer} обращается к API браузера: ${line.trim()}`);
      }
    });
  }

  for (const imp of importsOf(text)) {
    const where = `${rel(file)}:${imp.line}`;
    if (!imp.spec.startsWith('.')) {
      if (layer === 'tools' || imp.spec.startsWith('node:')) continue;
      const rule = ALLOWED[layer];
      if (!rule.packages || !rule.packages.test(imp.spec))
        problems.push(`${where} — ${layer} не может импортировать пакет «${imp.spec}»`);
      continue;
    }
    const target = resolveImport(file, imp.spec);
    if (!target) {
      problems.push(`${where} — импорт «${imp.spec}» никуда не ведёт`);
      continue;
    }
    if (!imp.typeOnly) edges.add(target);
    if (layer === 'tools') continue;
    const to = layerOf(target);
    matrix.set(`${layer}>${to}`, (matrix.get(`${layer}>${to}`) ?? 0) + 1);
    const rule = ALLOWED[layer];
    if (!rule.layers.includes(to)) {
      problems.push(`${where} — ${layer} не может зависеть от ${to} (${rel(target)})`);
      continue;
    }
    for (const p of contextProblems(file, target)) problems.push(`${where} — ${p}`);
    const fromCtx = contextOf(file);
    const toCtx = contextOf(target);
    if (fromCtx && toCtx && fromCtx !== toCtx) {
      contextMatrix.set(`${fromCtx}>${toCtx}`, (contextMatrix.get(`${fromCtx}>${toCtx}`) ?? 0) + 1);
    }
    // инфраструктура знает о приложении только его порты
    if (
      layer === 'infrastructure' &&
      to === 'application' &&
      !rel(target).startsWith('src/application/ports/')
    ) {
      problems.push(
        `${where} — infrastructure может брать из application только порты (${rel(target)})`,
      );
    }
    if (
      rel(file).startsWith('src/domain/combat/engine/') &&
      /^src\/domain\/(combat\/(room-battle|attack|auto-use)|progression|account)\//.test(
        rel(target),
      )
    ) {
      problems.push(`${where} — движок не должен знать правил боя (${rel(target)})`);
    }
  }
}

// --- циклы среди импортов, которые остаются после сборки (Тарьян)
{
  let index = 0;
  const idx = new Map<string, number>();
  const low = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const strong = (v: string): void => {
    idx.set(v, index);
    low.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);
    for (const w of graph.get(v) ?? []) {
      if (!graph.has(w)) continue;
      if (!idx.has(w)) {
        strong(w);
        low.set(v, Math.min(low.get(v)!, low.get(w)!));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v)!, idx.get(w)!));
      }
    }
    if (low.get(v) === idx.get(v)) {
      const comp: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        comp.push(w);
      } while (w !== v);
      if (comp.length > 1 || graph.get(v)?.has(v)) {
        problems.push(`цикл импортов (${comp.length}): ${comp.map(rel).sort().join(' → ')}`);
      }
    }
  };
  for (const v of graph.keys()) if (!idx.has(v)) strong(v);
}

const counts = new Map<Layer, number>();
for (const f of srcFiles) counts.set(layerOf(f), (counts.get(layerOf(f)) ?? 0) + 1);
const summary = [...counts].map(([l, n]) => `${l} ${n}`).join(', ');

// --graph: сколько импортов идёт из слоя (строка) в слой (столбец)
if (process.argv.includes('--graph')) {
  const order: Layer[] = [
    'entry',
    'composition',
    'presentation',
    'infrastructure',
    'application',
    'domain',
    'i18n',
  ];
  const w = 16;
  console.log(['из \\ в'.padEnd(w), ...order.map((l) => l.padStart(w))].join(''));
  for (const from of order) {
    console.log(
      [
        from.padEnd(w),
        ...order.map((to) => String(matrix.get(`${from}>${to}`) ?? '·').padStart(w)),
      ].join(''),
    );
  }
  // из области (строка) в область (столбец)
  const contexts = Object.keys(CONTEXTS);
  console.log();
  console.log(['из \\ в'.padEnd(w), ...contexts.map((c) => c.padStart(12))].join(''));
  for (const from of contexts) {
    const row = contexts.map((to) => String(contextMatrix.get(`${from}>${to}`) ?? '·'));
    console.log([from.padEnd(w), ...row.map((n) => n.padStart(12))].join(''));
  }
}
if (problems.length) {
  for (const p of problems) console.error('FAIL:', p);
  console.error(`Архитектура: нарушений ${problems.length} (файлов: ${summary}).`);
  process.exit(1);
}
console.log(
  `Архитектура в порядке: слои, импорты и циклы проверены (файлов: ${summary}; tools ${toolFiles.length}).`,
);
