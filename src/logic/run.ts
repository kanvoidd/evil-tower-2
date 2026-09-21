import type { CardKind, ConsumableId, EquipmentSave } from '../types';
import { ENEMIES, type EnemyDef, type RoomDef } from '../data/levels';
import { ITEM_BY_ID } from '../data/items';
import { LINEAGES, CLASSES } from '../data/classes';
import { GAMEPLAY } from '../config';
import type { PlayerStats } from './stats';
import type { Rng } from './rng';

export interface Card {
  uid: number;
  kind: CardKind;
  defId: string;
  hp: number;
  maxHp: number;
  atk: number;
  value: number;
}

export type Loot = { kind: 'gold'; amount: number } | { kind: ConsumableId; amount: 1 };

export type GameEvent =
  | { type: 'spawn'; cell: number; card: Card }
  /** style: 'shot' — выстрел (лучник), 'backstab' — телепорт за спину и удар критом (наёмник). */
  | { type: 'attack'; from: number; to: number; ranged: boolean; by: 'player' | 'enemy'; style?: 'shot' | 'backstab' }
  | { type: 'hit'; cell: number; amount: number; crit: boolean; target: 'player' | 'enemy'; hp: number; absorbed?: boolean }
  | { type: 'miss'; cell: number; kind: 'dodge' | 'parry' }
  | { type: 'kill'; cell: number; uid: number }
  | { type: 'move'; from: number; to: number }
  | { type: 'slide'; uid: number; from: number; to: number }
  | { type: 'gold'; cell: number; amount: number }
  | { type: 'souls'; cell: number; amount: number }
  | { type: 'heal'; amount: number; hp: number; source: 'potion' | 'perk' | 'lifesteal' | 'revive' }
  | { type: 'resource'; now: number; max: number }
  | { type: 'shield'; now: number }
  | { type: 'chest'; cell: number; loot: Loot[] }
  | { type: 'pickup'; cell: number; item: ConsumableId; count: number }
  | { type: 'break'; slot: 'weapon' | 'armor'; id: string }
  | { type: 'burst' }
  | { type: 'artifact'; cells: number[] }
  | { type: 'boost'; turns: number }
  | { type: 'win' }
  | { type: 'lose' };

export interface RunInit {
  room: RoomDef;
  stats: PlayerStats;
  weapon: EquipmentSave | null;
  armor: EquipmentSave | null;
  consumables: Record<ConsumableId, number>;
  rng: Rng;
}

export type Action =
  | { kind: 'melee' }
  | { kind: 'move' }
  | { kind: 'ranged' }
  | { kind: 'none'; reason: 'invalid' | 'resource' | 'range' };

const NEIGHBORS: number[][] = Array.from({ length: 9 }, (_, i) => {
  const r = Math.floor(i / 3);
  const c = i % 3;
  const out: number[] = [];
  if (r > 0) out.push(i - 3);
  if (r < 2) out.push(i + 3);
  if (c > 0) out.push(i - 1);
  if (c < 2) out.push(i + 1);
  return out;
});

export const neighborsOf = (cell: number): number[] => NEIGHBORS[cell];
const dist = (a: number, b: number): number =>
  Math.abs(Math.floor(a / 3) - Math.floor(b / 3)) + Math.abs((a % 3) - (b % 3));

export class Run {
  cards: Array<Card | null> = Array(9).fill(null);
  playerCell = 4;
  pool: Card[] = [];
  stats: PlayerStats;
  hp: number;
  shield = 0;
  res: number;
  boost = 0;
  over: null | 'win' | 'lose' = null;
  revived = false;
  weapon: EquipmentSave | null;
  armor: EquipmentSave | null;
  consumables: Record<ConsumableId, number>;
  totals = { gold: 0, souls: 0, kills: 0, damageTaken: 0, turns: 0 };
  readonly room: RoomDef;
  private rng: Rng;
  private uid = 1;
  private vacated: number[] = [];

  constructor(init: RunInit) {
    this.room = init.room;
    this.rng = init.rng;
    this.stats = { ...init.stats };
    this.weapon = init.weapon ? { ...init.weapon } : null;
    this.armor = init.armor ? { ...init.armor } : null;
    this.consumables = { ...init.consumables };
    this.hp = this.stats.maxHp;
    this.res = Math.ceil(this.stats.resMax * 0.5);
    this.buildPool();
  }

  get lineage() {
    return CLASSES[this.stats.classId].lineage;
  }

  get enemiesLeft(): number {
    return this.pool.filter((c) => c.kind === 'enemy').length + this.cards.filter((c) => c?.kind === 'enemy').length;
  }

  get totalEnemies(): number {
    return Object.values(this.room.enemies).reduce((a, b) => a + b, 0);
  }

  private mkEnemy(def: EnemyDef): Card {
    return { uid: this.uid++, kind: 'enemy', defId: def.id, hp: def.hp, maxHp: def.hp, atk: def.atk, value: 0 };
  }

  private mkCard(kind: CardKind, value = 0): Card {
    return { uid: this.uid++, kind, defId: kind, hp: 0, maxHp: 0, atk: 0, value };
  }

  private goldAmount(lo: number, hi: number): number {
    const s = this.stats;
    return Math.max(1, Math.round(this.rng.int(lo, hi) * this.room.goldScale * (1 + s.luck * 0.05 + s.goldBonus)));
  }

  private buildPool(): void {
    const { room, rng } = this;
    const list: Card[] = [];
    const bosses: Card[] = [];
    for (const [id, n] of Object.entries(room.enemies)) {
      const def = ENEMIES[id];
      for (let i = 0; i < n; i++) (def.boss ? bosses : list).push(this.mkEnemy(def));
    }
    for (let i = 0; i < room.gold; i++) list.push(this.mkCard('gold', this.goldAmount(5, 12)));
    for (let i = 0; i < room.chests; i++) list.push(this.mkCard('chest'));
    for (let i = 0; i < room.healPotions; i++) list.push(this.mkCard('potion_heal'));
    for (let i = 0; i < room.regenPotions; i++) list.push(this.mkCard('potion_regen'));
    if (this.lineage === 'mage' && rng.chance(0.7)) list.push(this.mkCard('artifact'));
    rng.shuffle(list);
    for (const b of bosses) {
      const from = Math.floor(list.length * 0.7);
      list.splice(rng.int(from, list.length), 0, b);
    }
    this.pool = list;
  }

  start(): GameEvent[] {
    const events: GameEvent[] = [];
    this.shield = this.stats.startShield;
    for (let i = 0; i < 9; i++) {
      if (i === this.playerCell) continue;
      const card = this.pool.shift();
      if (!card) break;
      this.cards[i] = card;
      events.push({ type: 'spawn', cell: i, card });
    }
    if (this.shield > 0) events.push({ type: 'shield', now: this.shield });
    return events;
  }

  /** Что произойдёт при нажатии на клетку (для подсветки и подсказок). */
  actionFor(cell: number): Action {
    if (this.over || cell === this.playerCell) return { kind: 'none', reason: 'invalid' };
    const card = this.cards[cell];
    if (!card) return { kind: 'none', reason: 'invalid' };
    const d = dist(this.playerCell, cell);
    if (d === 1) return card.kind === 'enemy' ? { kind: 'melee' } : { kind: 'move' };
    if (card.kind !== 'enemy') return { kind: 'none', reason: 'range' };
    const s = this.stats;
    if (s.ranged === 'none') return { kind: 'none', reason: 'range' };
    if (s.ranged === 'skip') {
      const sameLine = Math.floor(cell / 3) === Math.floor(this.playerCell / 3) || cell % 3 === this.playerCell % 3;
      if (!(d === 2 && sameLine)) return { kind: 'none', reason: 'range' };
    }
    if (this.res < s.rangedCost) return { kind: 'none', reason: 'resource' };
    return { kind: 'ranged' };
  }

  /** Наёмник бьёт из-за спины и всегда критом — у остальных дальняя атака обычная. */
  get backstabs(): boolean {
    return this.stats.ranged === 'any';
  }

  /** Убьёт ли ближайшая атака врага (обычный крит не учитывается, гарантированный крит наёмника — учитывается) — для подсветки. */
  wouldKill(cell: number): boolean {
    const card = this.cards[cell];
    if (!card || card.kind !== 'enemy') return false;
    const a = this.actionFor(cell);
    if (a.kind !== 'melee' && a.kind !== 'ranged') return false;
    let dmg = this.stats.damage;
    if (a.kind === 'ranged') {
      dmg = Math.round(dmg * this.stats.rangedMul);
      if (this.backstabs) dmg = Math.max(dmg + 1, Math.round(dmg * this.stats.critMin));
    } else if (this.stats.attackCost > 0) {
      dmg = this.res >= this.stats.attackCost
        ? Math.round(dmg * this.stats.spellMul)
        : Math.max(1, Math.round(dmg * GAMEPLAY.weakAttackRatio));
    }
    return dmg >= card.hp;
  }

  tap(cell: number): { ok: boolean; reason?: string; events: GameEvent[] } {
    const events: GameEvent[] = [];
    const action = this.actionFor(cell);
    if (action.kind === 'none') return { ok: false, reason: action.reason, events };
    this.vacated = [];
    if (action.kind === 'melee') this.melee(cell, events);
    else if (action.kind === 'ranged') this.ranged(cell, events);
    else this.collect(cell, events);
    this.finishTurn(events);
    return { ok: true, events };
  }

  useItem(id: ConsumableId): { ok: boolean; events: GameEvent[] } {
    const events: GameEvent[] = [];
    if (this.over || this.consumables[id] <= 0) return { ok: false, events };
    if (id === 'potion_heal') {
      if (this.hp >= this.stats.maxHp) return { ok: false, events };
      this.consumables[id]--;
      const heal = Math.min(GAMEPLAY.healPotionHp, this.stats.maxHp - this.hp);
      this.hp += heal;
      events.push({ type: 'heal', amount: heal, hp: this.hp, source: 'potion' });
    } else if (id === 'potion_regen') {
      if (this.res >= this.stats.resMax && this.boost > 0) return { ok: false, events };
      this.consumables[id]--;
      this.res = this.stats.resMax;
      this.boost = GAMEPLAY.regenBoostTurns;
      events.push({ type: 'resource', now: this.res, max: this.stats.resMax });
      events.push({ type: 'boost', turns: this.boost });
    } else {
      if (this.lineage !== 'mage') return { ok: false, events };
      const targets: number[] = [];
      this.cards.forEach((c, i) => c?.kind === 'enemy' && targets.push(i));
      if (!targets.length) return { ok: false, events };
      this.consumables[id]--;
      this.vacated = [];
      const dmg = this.artifactDamage();
      events.push({ type: 'artifact', cells: targets });
      for (const t of targets) this.damageEnemy(t, dmg, false, events);
      this.refill(events);
      this.checkWin(events);
    }
    return { ok: true, events };
  }

  /** Сила удара артефакта по каждому врагу на поле. */
  artifactDamage(): number {
    return Math.max(1, Math.round(this.stats.damage * 2 * (1 + this.stats.artifactMul)));
  }

  /** Урон по герою от удара силой atk (без учёта уклонения, парирования и щита) — для подсказок и автоприменения. */
  strikeDamage(atk: number): number {
    return this.reduce(atk);
  }

  revive(): GameEvent[] {
    this.over = null;
    this.revived = true;
    this.hp = Math.max(1, Math.ceil(this.stats.maxHp * GAMEPLAY.reviveHpRatio));
    return [{ type: 'heal', amount: this.hp, hp: this.hp, source: 'revive' }];
  }

  // ---------------------------------------------------------------- боевка

  private spend(cost: number, events: GameEvent[]): void {
    this.res = Math.max(0, this.res - cost);
    events.push({ type: 'resource', now: this.res, max: this.stats.resMax });
  }

  private gain(amount: number, events: GameEvent[]): void {
    this.res = Math.min(this.stats.resMax, this.res + amount);
    events.push({ type: 'resource', now: this.res, max: this.stats.resMax });
  }

  /** Множитель крита плавающий: от «среднего» до «высокого» значения, каждый раз новый. */
  private rollCritMul(): number {
    const { critMin, critMax } = this.stats;
    return critMin + this.rng.next() * (critMax - critMin);
  }

  private rollDamage(ranged: boolean, events: GameEvent[], forceCrit = false): { dmg: number; crit: boolean } {
    const s = this.stats;
    let dmg = s.damage;
    if (ranged) {
      dmg = Math.round(dmg * s.rangedMul);
    } else {
      if (s.attackCost > 0) {
        if (this.res >= s.attackCost) {
          this.spend(s.attackCost, events);
          dmg = Math.round(dmg * s.spellMul);
        } else {
          dmg = Math.max(1, Math.round(dmg * GAMEPLAY.weakAttackRatio));
        }
      }
      if (s.burst && this.res >= s.burst.cost) {
        this.spend(s.burst.cost, events);
        dmg += Math.ceil(dmg * s.burst.mul);
        events.push({ type: 'burst' });
      }
    }
    const crit = forceCrit || this.rng.chance(s.crit / 100);
    if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * this.rollCritMul()));
    return { dmg: Math.max(1, dmg), crit };
  }

  private wearWeapon(events: GameEvent[]): void {
    const w = this.weapon;
    if (!w || w.durability <= 0) return;
    w.durability--;
    if (w.durability <= 0) {
      this.stats.damage = Math.max(1, this.stats.damage - ITEM_BY_ID[w.id].damage);
      events.push({ type: 'break', slot: 'weapon', id: w.id });
    }
  }

  private wearArmor(events: GameEvent[]): void {
    const a = this.armor;
    if (!a || a.durability <= 0) return;
    a.durability--;
    if (a.durability <= 0) {
      const it = ITEM_BY_ID[a.id];
      this.stats.defense = Math.max(0, this.stats.defense - it.defense);
      this.stats.maxHp = Math.max(1, this.stats.maxHp - it.health);
      this.hp = Math.min(this.hp, this.stats.maxHp);
      events.push({ type: 'break', slot: 'armor', id: a.id });
    }
  }

  private reduce(atk: number): number {
    const floor = Math.ceil(atk * (1 - GAMEPLAY.maxDefenseReduction));
    return Math.max(1, floor, atk - this.stats.defense);
  }

  private heal(amount: number, source: 'perk' | 'lifesteal', events: GameEvent[]): void {
    if (amount <= 0 || this.hp >= this.stats.maxHp) return;
    const h = Math.min(amount, this.stats.maxHp - this.hp);
    this.hp += h;
    events.push({ type: 'heal', amount: h, hp: this.hp, source });
  }

  /** Возвращает true, если враг погиб. */
  private damageEnemy(cell: number, dmg: number, crit: boolean, events: GameEvent[]): boolean {
    const enemy = this.cards[cell];
    if (!enemy || enemy.kind !== 'enemy') return false;
    const dealt = Math.min(dmg, enemy.hp);
    enemy.hp -= dmg;
    const s = this.stats;
    const executed = enemy.hp > 0 && s.execute > 0 && enemy.hp / enemy.maxHp <= s.execute;
    events.push({ type: 'hit', cell, amount: dealt, crit, target: 'enemy', hp: Math.max(0, executed ? 0 : enemy.hp) });
    if (s.lifesteal > 0 && dealt > 0) this.heal(Math.max(1, Math.round(dealt * s.lifesteal)), 'lifesteal', events);
    if (enemy.hp <= 0 || executed) {
      this.killEnemy(cell, events);
      return true;
    }
    return false;
  }

  private killEnemy(cell: number, events: GameEvent[]): void {
    const enemy = this.cards[cell]!;
    const def = ENEMIES[enemy.defId];
    const s = this.stats;
    events.push({ type: 'kill', cell, uid: enemy.uid });
    this.cards[cell] = null;
    this.vacated.push(cell);
    this.totals.kills++;
    const gold = Math.round(def.gold * (1 + s.goldBonus + s.luck * 0.05));
    const souls = Math.round(def.souls * (1 + s.soulBonus));
    if (gold > 0) {
      this.totals.gold += gold;
      events.push({ type: 'gold', cell, amount: gold });
    }
    if (souls > 0) {
      this.totals.souls += souls;
      events.push({ type: 'souls', cell, amount: souls });
    }
    if (s.onKillHeal) this.heal(s.onKillHeal, 'perk', events);
    if (s.onKillResource) this.gain(s.onKillResource, events);
  }

  private melee(cell: number, events: GameEvent[]): void {
    const enemy = this.cards[cell]!;
    const { dmg, crit } = this.rollDamage(false, events);
    events.push({ type: 'attack', from: this.playerCell, to: cell, ranged: false, by: 'player' });
    this.wearWeapon(events);
    const killed = this.damageEnemy(cell, dmg, crit, events);
    this.applySplash(cell, dmg, events);
    if (killed) {
      this.vacated = this.vacated.filter((c) => c !== cell);
      const from = this.playerCell;
      events.push({ type: 'move', from, to: cell });
      this.playerCell = cell;
      this.vacated.push(from);
      return;
    }
    if (this.cards[cell] === enemy) this.enemyStrike(cell, events);
  }

  private ranged(cell: number, events: GameEvent[]): void {
    this.spend(this.stats.rangedCost, events);
    // Наёмник: телепорт за спину и удар со 100% шансом крита; лучник просто стреляет.
    const backstab = this.backstabs;
    const { dmg, crit } = this.rollDamage(true, events, backstab);
    events.push({ type: 'attack', from: this.playerCell, to: cell, ranged: true, by: 'player', style: backstab ? 'backstab' : 'shot' });
    this.wearWeapon(events);
    this.damageEnemy(cell, dmg, crit, events);
    this.applySplash(cell, dmg, events);
  }

  private applySplash(cell: number, dmg: number, events: GameEvent[]): void {
    const ratio = this.stats.splash;
    if (ratio <= 0) return;
    const d = Math.max(1, Math.round(dmg * ratio));
    for (const n of NEIGHBORS[cell]) {
      if (this.cards[n]?.kind === 'enemy') this.damageEnemy(n, d, false, events);
    }
  }

  private enemyStrike(cell: number, events: GameEvent[]): void {
    const enemy = this.cards[cell]!;
    const s = this.stats;
    events.push({ type: 'attack', from: cell, to: this.playerCell, ranged: false, by: 'enemy' });
    if (this.rng.chance(s.dodge / 100)) {
      events.push({ type: 'miss', cell: this.playerCell, kind: 'dodge' });
      return;
    }
    if (this.rng.chance(s.parry / 100)) {
      events.push({ type: 'miss', cell: this.playerCell, kind: 'parry' });
      this.damageEnemy(cell, enemy.atk, false, events);
      return;
    }
    let dmg = this.reduce(enemy.atk);
    if (this.shield > 0) {
      const abs = Math.min(this.shield, dmg);
      this.shield -= abs;
      dmg -= abs;
      events.push({ type: 'shield', now: this.shield });
    }
    if (dmg <= 0) {
      events.push({ type: 'hit', cell: this.playerCell, amount: 0, crit: false, target: 'player', hp: this.hp, absorbed: true });
      return;
    }
    this.hp -= dmg;
    this.totals.damageTaken += dmg;
    events.push({ type: 'hit', cell: this.playerCell, amount: dmg, crit: false, target: 'player', hp: Math.max(0, this.hp) });
    this.wearArmor(events);
    if (this.hp <= 0) {
      this.over = 'lose';
      events.push({ type: 'lose' });
      return;
    }
    if (s.thorns > 0) this.damageEnemy(cell, Math.max(1, Math.round(dmg * s.thorns)), false, events);
  }

  // ---------------------------------------------------------------- подбор карт

  private collect(cell: number, events: GameEvent[]): void {
    const from = this.playerCell;
    events.push({ type: 'move', from, to: cell });
    this.playerCell = cell;
    this.vacated.push(from);
    this.take(cell, events);
  }

  private take(cell: number, events: GameEvent[]): void {
    const card = this.cards[cell];
    if (!card) return;
    this.cards[cell] = null;
    if (card.kind === 'gold') {
      this.totals.gold += card.value;
      events.push({ type: 'gold', cell, amount: card.value });
    } else if (card.kind === 'chest') {
      this.openChest(cell, events);
    } else if (card.kind === 'potion_heal' || card.kind === 'potion_regen' || card.kind === 'artifact') {
      this.consumables[card.kind]++;
      events.push({ type: 'pickup', cell, item: card.kind, count: this.consumables[card.kind] });
    }
  }

  private rollConsumable(): ConsumableId {
    const r = this.rng.next();
    if (this.lineage === 'mage') return r < 0.4 ? 'potion_heal' : r < 0.7 ? 'potion_regen' : 'artifact';
    return r < 0.55 ? 'potion_heal' : 'potion_regen';
  }

  private openChest(cell: number, events: GameEvent[]): void {
    const { rng, stats: s } = this;
    const loot: Loot[] = [];
    const gold = this.goldAmount(12, 30);
    loot.push({ kind: 'gold', amount: gold });
    this.totals.gold += gold;
    events.push({ type: 'gold', cell, amount: gold });
    // Помимо золота из сундука часто выпадает расходник, иногда сразу два.
    let chance = GAMEPLAY.chestItemChance + s.luck * 0.02;
    for (let i = 0; i < 2 && rng.chance(chance); i++) {
      const item = this.rollConsumable();
      this.consumables[item]++;
      loot.push({ kind: item, amount: 1 });
      events.push({ type: 'pickup', cell, item, count: this.consumables[item] });
      chance = GAMEPLAY.chestBonusItemChance;
    }
    events.push({ type: 'chest', cell, loot });
  }

  // ---------------------------------------------------------------- конец хода

  private refill(events: GameEvent[]): void {
    const cells = [...new Set(this.vacated)].sort((a, b) => a - b);
    this.vacated = [];
    for (const c of cells) {
      if (c === this.playerCell || this.cards[c]) continue;
      const card = this.pool.shift();
      if (!card) continue;
      this.cards[c] = card;
      events.push({ type: 'spawn', cell: c, card });
    }
    if (this.pool.length === 0) this.compact(events);
  }

  /** Когда колода закончилась, карты «складываются» к игроку — пустые клетки не разделяют их. */
  private compact(events: GameEvent[]): void {
    for (let guard = 0; guard < 16; guard++) {
      const connected = new Set<number>([this.playerCell]);
      const queue = [this.playerCell];
      while (queue.length) {
        const c = queue.shift()!;
        for (const n of NEIGHBORS[c]) {
          if (this.cards[n] && !connected.has(n)) {
            connected.add(n);
            queue.push(n);
          }
        }
      }
      const loose: number[] = [];
      for (let i = 0; i < 9; i++) if (this.cards[i] && !connected.has(i)) loose.push(i);
      if (!loose.length) return;
      loose.sort((a, b) => dist(a, this.playerCell) - dist(b, this.playerCell));
      const from = loose[0];
      let best = -1;
      let bestD = 99;
      for (const n of NEIGHBORS[from]) {
        if (this.cards[n] || n === this.playerCell) continue;
        const d = dist(n, this.playerCell);
        if (d < bestD) {
          bestD = d;
          best = n;
        }
      }
      if (best < 0) return;
      const card = this.cards[from]!;
      this.cards[best] = card;
      this.cards[from] = null;
      events.push({ type: 'slide', uid: card.uid, from, to: best });
    }
  }

  private checkWin(events: GameEvent[]): void {
    if (this.over) return;
    if (this.pool.length > 0 || this.cards.some((c) => c?.kind === 'enemy')) return;
    // Комната зачищена: остатки золота/расходников/сундуков подбираются автоматически.
    for (let i = 0; i < 9; i++) {
      if (this.cards[i]) this.take(i, events);
    }
    this.over = 'win';
    events.push({ type: 'win' });
  }

  private finishTurn(events: GameEvent[]): void {
    this.refill(events);
    this.checkWin(events);
    if (this.over) return;
    this.totals.turns++;
    const mul = this.boost > 0 ? GAMEPLAY.regenBoostMul : 1;
    if (this.boost > 0) this.boost--;
    if (this.res < this.stats.resMax) this.gain(this.stats.regen * mul, events);
  }

  resourceMax(): number {
    return this.stats.resMax;
  }

  get lineageDef() {
    return LINEAGES[this.lineage];
  }
}
