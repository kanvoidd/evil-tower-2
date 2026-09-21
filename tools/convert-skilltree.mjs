// Конвертер: tower_class_trees.drawio -> src/data/skillTree.json
// Запуск: npm run skilltree [путь к .drawio]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const srcPath = resolve(process.argv[2] ?? resolve(here, 'tower_class_trees.drawio'));
const outPath = resolve(here, '../src/data/skillTree.json');

const LINEAGE_BY_PAGE = { Воин: 'warrior', Маг: 'mage', Лучник: 'archer', Наемник: 'mercenary' };
const CLASS_BY_NAME = {
  Воин: 'warrior', Рыцарь: 'knight', Берсерк: 'berserk', Паладин: 'paladin',
  Маг: 'mage', Магистр: 'magister', Некромант: 'necromancer', Пиромант: 'pyromancer',
  Лучник: 'archer', 'Соколиный глаз': 'hawkeye', 'Бог стрел': 'arrowgod', Снайпер: 'sniper',
  Наемник: 'mercenary', Ассасин: 'assassin', 'Темный ассасин': 'darkassassin', Ниндзя: 'ninja',
};
const STAT_BY_WORD = {
  'Урон': 'damage', 'Крит. урон': 'crit', 'Здоровье': 'health',
  'Уворот': 'dodge', 'Защита': 'defense', 'Парирование': 'parry',
};
const CHAIN_BY_COLOR = { '#7b241c': 'damage', '#1e8449': 'health', '#1b4f72': 'defense' };

const decode = (s) =>
  s
    .replace(/&#xa;/gi, '\n')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

const plain = (html) =>
  decode(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

const attrsOf = (s) => {
  const out = {};
  for (const m of s.matchAll(/([\w:-]+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
};

const xml = readFileSync(srcPath, 'utf8');
const result = {};

for (const dm of xml.matchAll(/<diagram\b([^>]*)>([\s\S]*?)<\/diagram>/g)) {
  const dAttrs = attrsOf(dm[1]);
  const lineage = LINEAGE_BY_PAGE[decode(dAttrs.name)];
  if (!lineage) throw new Error('Неизвестная страница: ' + dAttrs.name);

  const verts = new Map();
  const edges = [];
  for (const cm of dm[2].matchAll(/<mxCell\b([^>]*?)(?:\/>|>([\s\S]*?)<\/mxCell>)/g)) {
    const a = attrsOf(cm[1]);
    const inner = cm[2] ?? '';
    if (a.vertex === '1') {
      const g = attrsOf((inner.match(/<mxGeometry\b([^>]*)/) ?? [, ''])[1]);
      verts.set(a.id, {
        id: a.id,
        lines: plain(a.value ?? ''),
        style: a.style ?? '',
        x: parseFloat(g.x ?? '0'),
        y: parseFloat(g.y ?? '0'),
        w: parseFloat(g.width ?? '0'),
        h: parseFloat(g.height ?? '0'),
      });
    } else if (a.edge === '1' && a.source && a.target) {
      const color = (a.style?.match(/strokeColor=(#[0-9a-fA-F]+)/) ?? [])[1]?.toLowerCase();
      edges.push({ from: a.source, to: a.target, color });
    }
  }

  const num = (id) => parseInt(id.slice(1), 10);
  const nodes = new Map();

  for (const v of verts.values()) {
    const [l1, l2] = v.lines;
    if (!l1 || v.id === 'legend') continue;
    const cx = Math.round(v.x + v.w / 2);
    const cy = Math.round(v.y + v.h / 2);
    let node;
    const statM = l1.match(/^\S+\s+(\d+)$/);
    if (statM && STAT_BY_WORD[l2]) {
      node = { kind: 'stat', stat: STAT_BY_WORD[l2], tier: parseInt(statM[1], 10) };
    } else if (l1 === 'Стартовый перк') node = { kind: 'perk', seg: 0, owner: CLASS_BY_NAME[l2] };
    else if (l1 === 'Перк 2') node = { kind: 'perk', seg: 1, owner: CLASS_BY_NAME[l2] };
    else if (l1 === 'Перк 3') node = { kind: 'perk', seg: 2, owner: CLASS_BY_NAME[l2] };
    else if (l1 === 'Легендарный перк') node = { kind: 'perk', seg: 3, owner: CLASS_BY_NAME[l2] };
    else if (l1 === 'Выбор эволюции') node = { kind: 'evo', owner: CLASS_BY_NAME[l2] };
    else if (CLASS_BY_NAME[l1]) node = { kind: 'class', classId: CLASS_BY_NAME[l1] };
    else throw new Error(`Неопознанный узел ${v.id}: ${v.lines.join(' | ')}`);
    nodes.set(v.id, { id: num(v.id), ...node, x: cx, y: cy });
  }

  const children = new Map();
  const parents = new Map();
  for (const e of edges) {
    if (!nodes.has(e.from) || !nodes.has(e.to)) continue;
    (children.get(e.from) ?? children.set(e.from, []).get(e.from)).push(e.to);
    (parents.get(e.to) ?? parents.set(e.to, []).get(e.to)).push(e.from);
  }

  // Цепочка (damage/health/defense) берётся из цвета ребра, выходящего из узла перка/класса.
  const chainOf = new Map();
  const ownerOfStat = new Map();
  const segOfStat = new Map();
  for (const [id, n] of nodes) {
    if (n.kind !== 'perk' || n.seg === 3) continue;
    for (const first of children.get(id) ?? []) {
      const edge = edges.find((e) => e.from === id && e.to === first);
      const chain = CHAIN_BY_COLOR[edge?.color];
      if (!chain) continue;
      const stack = [first];
      const seen = new Set();
      while (stack.length) {
        const cur = stack.pop();
        if (seen.has(cur)) continue;
        seen.add(cur);
        const cn = nodes.get(cur);
        if (cn.kind !== 'stat') continue;
        chainOf.set(cur, chain);
        ownerOfStat.set(cur, n.owner);
        segOfStat.set(cur, n.seg);
        stack.push(...(children.get(cur) ?? []));
      }
    }
  }

  // Порядок классов и структура эволюции.
  const classNodes = [...nodes.values()].filter((n) => n.kind === 'class');
  const evo = [...nodes.entries()].find(([, n]) => n.kind === 'evo');
  if (!evo) throw new Error('Нет узла выбора эволюции: ' + lineage);
  const [evoId, evoNode] = evo;
  const terminals = (children.get(evoId) ?? []).map((id) => nodes.get(id).classId);
  const baseNode = classNodes.find((c) => !(parents.get('n' + c.id) ?? []).length);
  const secondNode = classNodes.find((c) => c.classId === evoNode.owner);

  const out = { id: lineage, base: baseNode.classId, second: secondNode.classId, terminals, nodes: [], edges: [] };
  const idSet = new Set();
  const exclusive = new Map();

  // Развилки: два узла с общим родителем и общим ребёнком.
  for (const [id, n] of nodes) {
    if (n.kind !== 'stat') continue;
    const kids = children.get(id) ?? [];
    if (kids.length === 2) {
      const [a, b] = kids;
      const ca = children.get(a) ?? [];
      const cb = children.get(b) ?? [];
      if (ca.length === 1 && cb.length === 1 && ca[0] === cb[0]) {
        exclusive.set(a, b);
        exclusive.set(b, a);
      }
    }
  }
  // Развилка также может начинаться прямо от перка (первый узел цепи) — обрабатываем и её.
  for (const [id, n] of nodes) {
    if (n.kind !== 'perk') continue;
    const byChain = new Map();
    for (const k of children.get(id) ?? []) {
      const c = chainOf.get(k);
      if (!byChain.has(c)) byChain.set(c, []);
      byChain.get(c).push(k);
    }
    for (const list of byChain.values()) {
      if (list.length === 2) {
        exclusive.set(list[0], list[1]);
        exclusive.set(list[1], list[0]);
      }
    }
  }

  for (const [id, n] of nodes) {
    const o = { id: n.id, kind: n.kind, x: n.x, y: n.y };
    if (n.kind === 'stat') {
      o.stat = n.stat;
      o.tier = n.tier;
      o.chain = chainOf.get(id);
      o.owner = ownerOfStat.get(id);
      o.seg = segOfStat.get(id);
      o.alt = ['crit', 'dodge', 'parry'].includes(n.stat);
      if (exclusive.has(id)) o.excl = num(exclusive.get(id));
      if (!o.chain || !o.owner || o.seg === undefined) throw new Error(`Узел без владельца ${lineage}:${id}`);
    } else if (n.kind === 'perk') {
      o.owner = n.owner;
      o.seg = n.seg;
    } else if (n.kind === 'class') {
      o.classId = n.classId;
    } else if (n.kind === 'evo') {
      o.owner = n.owner;
    }
    o.parents = (parents.get(id) ?? []).map(num);
    out.nodes.push(o);
    idSet.add(n.id);
  }
  for (const e of edges) {
    if (nodes.has(e.from) && nodes.has(e.to)) out.edges.push([num(e.from), num(e.to)]);
  }
  out.nodes.sort((a, b) => a.id - b.id);

  const xs = out.nodes.map((n) => n.x);
  const ys = out.nodes.map((n) => n.y);
  out.bounds = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  result[lineage] = out;

  const counts = {};
  for (const n of out.nodes) counts[n.kind] = (counts[n.kind] ?? 0) + 1;
  console.log(lineage, counts, 'edges', out.edges.length, 'terminals', terminals.join('/'), out.bounds);
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(result));
console.log('OK ->', outPath);
