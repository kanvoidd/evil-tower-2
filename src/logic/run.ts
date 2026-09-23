import type { CardKind, ConsumableId, EquipmentSave, StatusKind } from '../types';
import { ENEMIES, isHolyTarget, type EnemyDef } from '../data/enemies';
import { ELITE, rollRoom, type RoomDef, type RoomModifier, type RoomPlan } from '../data/levels';
import { ITEM_BY_ID } from '../data/items';
import { FULL_BAR, PERK_BY_ID, type AbilityId, type PerkDef, type VfxStyle } from '../data/perks';
import { LINEAGES } from '../data/classes';
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
  baseAtk: number;
  value: number;
  elite: boolean;
  /** Не отвечает на следующий удар. */
  stun: number;
  /** Ходы горения и урон за ход. */
  burn: number;
  burnDmg: number;
  /** Ходы яда и урон за ход. */
  poison: number;
  poisonDmg: number;
  /** Клеймо смерти: ходов до гибели. */
  mark: number;
  /** Кукла вуду: половина полученного урона расходится по остальным. */
  link: boolean;
  /** Приговор: получает больше урона. */
  vuln: number;
  /** Сколько раз герой по нему попал. */
  hits: number;
  /** Сколько раз он ударил героя. */
  swings: number;
  /** «Взрыв трупа»: взорвётся, когда умрёт. */
  corpse?: boolean;
  /** «Призрачные слуги»: на месте его смерти встанет призрак. */
  haunt?: boolean;
  /** Горение наложено в этот ход — первый тик будет со следующего. */
  burnNew?: boolean;
  /** Призрак: сколько ходов ему осталось. */
  ttl?: number;
}

export type Loot = { kind: 'gold'; amount: number } | { kind: ConsumableId; amount: 1 };

/** Визуальный почерк эффекта — тот же словарь, что у способностей. */
export type FxStyle = VfxStyle;

/** Потолок «защиты после способности»: ослабляет удар, но никогда не гасит его целиком. */
const PERK_GUARD_CAP = 0.5;
/** Ниже этой цены талант-скидка способность не удешевляет. */
const PERK_COST_FLOOR = 2;

export type GameEvent =
  | { type: 'spawn'; cell: number; card: Card }
  /** style: 'shot' — выстрел, 'backstab' — телепорт за спину, 'bolt' — молния мага. */
  | { type: 'attack'; from: number; to: number; ranged: boolean; by: 'player' | 'enemy'; style?: 'shot' | 'backstab' | 'bolt' }
  | { type: 'hit'; cell: number; amount: number; crit: boolean; target: 'player' | 'enemy'; hp: number; absorbed?: boolean }
  | { type: 'miss'; cell: number; kind: 'dodge' | 'parry' | 'evade' | 'block' | 'stun' | 'smoke' }
  | { type: 'kill'; cell: number; uid: number }
  | { type: 'move'; from: number; to: number }
  | { type: 'slide'; uid: number; from: number; to: number }
  | { type: 'swap'; a: number; b: number }
  | { type: 'gold'; cell: number; amount: number }
  | { type: 'souls'; cell: number; amount: number }
  | { type: 'spend'; amount: number }
  | { type: 'heal'; amount: number; hp: number; source: 'potion' | 'perk' | 'lifesteal' | 'revive' }
  | { type: 'resource'; now: number; max: number }
  | { type: 'shield'; now: number }
  | { type: 'chest'; cell: number; loot: Loot[]; empty?: boolean }
  | { type: 'pickup'; cell: number; item: ConsumableId; count: number }
  | { type: 'break'; slot: 'weapon' | 'armor'; id: string }
  | { type: 'status'; cell: number; uid: number; kind: StatusKind; turns: number }
  | { type: 'fx'; cells: number[]; style: FxStyle; from?: number }
  /** Карта ушла с поля не боем и не подбором под ноги — вид нужно убрать. */
  | { type: 'remove'; cell: number; uid: number }
  /** Героя зажали со всех сторон и ему нечем ответить: карты рвут его по очереди. */
  | { type: 'swarm'; cells: number[] }
  /** Способность применена (для всплывающей подписи и звука). */
  | { type: 'perk'; id: string; ability: AbilityId }
  /** Способность «заряжена» или снята с зарядки (null). */
  | { type: 'armed'; id: string | null }
  | { type: 'rewind' }
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
  /** Готовый расклад (для повторов и тестов); иначе набирается случайно. */
  plan?: RoomPlan;
  /** Забег продолжается из прошлой комнаты: здоровье, ресурс и уже истраченные «раз за забег». */
  carry?: RunCarryStats;
}

/** Что герой уносит из комнаты в следующую внутри одного забега. */
export interface RunCarryStats {
  hp: number;
  res: number;
  /** Реклама-воскрешение уже была в этом забеге. */
  revived: boolean;
  /** Талант «Возвращение» уже сработал в этом забеге. */
  selfRevived: boolean;
}

export type Action =
  | { kind: 'melee' }
  | { kind: 'move' }
  | { kind: 'ranged' }
  | { kind: 'perk' }
  | { kind: 'none'; reason: 'invalid' | 'resource' | 'range' | 'melee' };

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

const DIAGONALS: number[][] = Array.from({ length: 9 }, (_, i) => {
  const r = Math.floor(i / 3);
  const c = i % 3;
  const out: number[] = [];
  for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) out.push(nr * 3 + nc);
  }
  return out;
});

export const neighborsOf = (cell: number): number[] => NEIGHBORS[cell];
const rowOf = (c: number): number => Math.floor(c / 3);
const colOf = (c: number): number => c % 3;
const dist = (a: number, b: number): number => Math.abs(rowOf(a) - rowOf(b)) + Math.abs(colOf(a) - colOf(b));
const sameLine = (a: number, b: number): boolean => rowOf(a) === rowOf(b) || colOf(a) === colOf(b);

/** Снимок состояния для «Отката времени». */
interface Snapshot {
  cards: string;
  playerCell: number;
  hp: number;
  shield: number;
  res: number;
  pool: string;
  totals: string;
  consumables: string;
  flags: string;
}

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
  /** Талант «Возвращение» уже поднял героя в этом забеге. */
  selfRevived = false;
  weapon: EquipmentSave | null;
  armor: EquipmentSave | null;
  consumables: Record<ConsumableId, number>;
  totals = { gold: 0, souls: 0, kills: 0, damageTaken: 0, turns: 0 };
  readonly room: RoomDef;
  readonly plan: RoomPlan;
  readonly mod: RoomModifier;

  /** Заряженная способность: следующее касание поля применит её. */
  armed: PerkDef | null = null;
  /** Первая из двух карт для «Перестановки». */
  private swapFirst: number | null = null;
  /** Уже потраченные «один раз за комнату» способности. */
  private usedOnce = new Set<string>();

  // ---- временные состояния героя
  private noCounter = 0;      // дымовая завеса
  private madness = 0;        // безумие берсерка
  private reaping = 0;        // жнец
  private killStreak = 0;     // резня
  private killsRoom = 0;
  private defTurn = 0;        // «+защита на ход» после убийства
  private perkGuard = 0;      // «после перка следующий удар слабее»
  private counterReady = false; // контрудар после парирования
  private cheatLeft = 0;
  private reviveLeft = 0;
  private roomGuardLeft = 0;
  private roomCritLeft = 0;
  private freePerkLeft = 0;
  /** Урон сейчас наносит способность — работают таланты-синергии. */
  private inAbility = false;
  /** Цена применяемой способности (для возврата ресурса за убийство). */
  private abilityCost = 0;
  private hitCounter = 0;     // для «Суда» (каждый третий удар)
  private playerPoison = 0;
  private playerPoisonDmg = 0;
  private warCry = 0;         // накопленное ослабление атаки врагов
  private snapshot: Snapshot | null = null;

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
    this.plan = init.plan ?? rollRoom(init.room, init.rng);
    this.mod = this.plan.mod;
    const carry = init.carry;
    this.hp = carry ? Math.max(1, Math.min(this.stats.maxHp, Math.round(carry.hp))) : this.stats.maxHp;
    // в забег герой выходит отдохнувшим — с полной шкалой; дальше её несёт из комнаты в комнату
    this.res = carry ? Math.max(0, Math.min(this.stats.resMax, carry.res)) : this.stats.resMax;
    this.revived = carry?.revived ?? false;
    this.selfRevived = carry?.selfRevived ?? false;
    this.cheatLeft = this.stats.cheatDeath;
    this.reviveLeft = this.stats.reviveHp > 0 && !this.selfRevived ? 1 : 0;
    this.roomGuardLeft = this.stats.roomGuard > 0 ? 1 : 0;
    this.roomCritLeft = this.stats.roomCrit ? 1 : 0;
    this.freePerkLeft = this.stats.freePerk ? 1 : 0;
    this.buildPool();
  }

  get lineage() {
    return this.stats.lineage;
  }

  get lineageDef() {
    return LINEAGES[this.lineage];
  }

  /** Враги, которые прямо сейчас на поле. Колода бесконечна, поэтому «сколько осталось» — не про неё. */
  get enemiesLeft(): number {
    return this.cards.filter((c) => c?.kind === 'enemy').length;
  }

  /** Сколько врагов нужно уложить, чтобы открылся выход с этажа. */
  get totalEnemies(): number {
    return this.quota;
  }

  /** Сколько ещё нужно уложить. */
  get killsLeft(): number {
    return Math.max(0, this.quota - this.killsRoom) + (this.bossLeft ? 1 : 0);
  }

  /** Карта перехода уже подмешана в колоду. */
  get exitOpen(): boolean {
    return this.exitQueued;
  }

  // ------------------------------------------------------------------ подготовка

  private mkEnemy(def: EnemyDef, elite: boolean): Card {
    const m = this.mod;
    const hpMul = (m.hpMul ?? 1) * (elite ? ELITE.hp : 1);
    const atkMul = (m.atkMul ?? 1) * (elite ? ELITE.atk : 1);
    const hp = Math.max(1, Math.round(def.hp * hpMul));
    const atk = Math.max(1, Math.round(def.atk * atkMul));
    return {
      uid: this.uid++, kind: 'enemy', defId: def.id, hp, maxHp: hp, atk, baseAtk: atk, value: 0, elite,
      stun: 0, burn: 0, burnDmg: 0, poison: 0, poisonDmg: 0, mark: 0, link: false, vuln: 0, hits: 0, swings: 0,
    };
  }

  /** Пустой сундук: выглядит как обычный, внутри ничего. */
  private emptyChest(): Card {
    const c = this.mkCard('chest');
    c.defId = 'chest_empty';
    return c;
  }

  private mkCard(kind: CardKind, value = 0): Card {
    return {
      uid: this.uid++, kind, defId: kind, hp: 0, maxHp: 0, atk: 0, baseAtk: 0, value, elite: false,
      stun: 0, burn: 0, burnDmg: 0, poison: 0, poisonDmg: 0, mark: 0, link: false, vuln: 0, hits: 0, swings: 0,
    };
  }

  private goldAmount(lo: number, hi: number): number {
    const s = this.stats;
    const mul = this.room.goldScale * (this.mod.goldMul ?? 1) * (1 + s.luck * 0.05 + s.goldBonus);
    return Math.max(1, Math.round(this.rng.int(lo, hi) * mul));
  }

  /** Сколько врагов нужно уложить в этой комнате. */
  private quota = 0;
  /** Босс комнаты ещё жив — без него выход не откроется. */
  private bossLeft = false;
  /** Карта перехода уже подмешана. */
  private exitQueued = false;

  /**
   * Колода бесконечна: пока выход не открыт, карты подсыпаются, и поле никогда не пустеет.
   * Состав тот же, что и в начальной колоде — враги этажа и добыча в тех же долях.
   */
  private replenish(): void {
    if (this.pool.length >= 9) return;
    const { rng, room } = this;
    const add: Card[] = [];
    for (let i = this.pool.length; i < 14; i++) {
      const r = rng.next();
      if (r < 0.62) {
        const def = ENEMIES[rng.pick(room.pool)];
        if (def) add.push(this.mkEnemy(def, false));
      } else if (r < 0.78) add.push(this.mkCard('gold', this.goldAmount(4, 9)));
      else if (r < 0.84) add.push(this.mkCard('chest'));
      else if (r < 0.94) add.push(this.emptyChest());
      else if (r < 0.98) add.push(this.mkCard('potion_heal'));
      else add.push(this.mkCard('potion_regen'));
    }
    rng.shuffle(add);
    this.pool.push(...add);
  }

  /**
   * Норма выполнена — в ближайшие карты колоды замешивается переход на следующий этаж.
   * Комната закончится только когда герой сам шагнёт на эту карту.
   */
  private queueExit(): void {
    if (this.exitQueued || this.bossLeft || this.killsRoom < this.quota) return;
    this.exitQueued = true;
    this.pool.splice(this.rng.int(0, Math.min(3, this.pool.length)), 0, this.mkCard('exit'));
  }

  private buildPool(): void {
    const { plan, rng } = this;
    const list: Card[] = [];
    const bosses: Card[] = [];
    for (const e of plan.enemies) {
      const def = ENEMIES[e.id];
      if (!def) continue;
      const card = this.mkEnemy(def, e.elite);
      (def.boss ? bosses : list).push(card);
    }
    for (let i = 0; i < plan.gold; i++) list.push(this.mkCard('gold', this.goldAmount(4, 9)));
    for (let i = 0; i < plan.chests; i++) list.push(this.mkCard('chest'));
    // пустые сундуки растягивают комнату: каждый — лишний шаг, а рядом с врагом ещё и удар вдогонку
    for (let i = 0; i < plan.chests + 1; i++) list.push(this.emptyChest());
    for (let i = 0; i < plan.heal; i++) list.push(this.mkCard('potion_heal'));
    for (let i = 0; i < plan.regen; i++) list.push(this.mkCard('potion_regen'));
    if (this.lineageDef.artifacts && rng.chance(0.7)) list.push(this.mkCard('artifact'));
    rng.shuffle(list);
    for (const b of bosses) {
      const from = Math.floor(list.length * 0.7);
      list.splice(rng.int(from, list.length), 0, b);
    }
    this.pool = list;
    this.quota = plan.enemies.length;
    this.bossLeft = bosses.length > 0;
  }

  start(): GameEvent[] {
    const events: GameEvent[] = [];
    this.shield = Math.round(this.stats.maxHp * (this.stats.startShieldPct + (this.mod.shieldPct ?? 0)));
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

  // ------------------------------------------------------------------ действия

  /** Что произойдёт при нажатии на клетку (для подсветки и подсказок). */
  actionFor(cell: number): Action {
    if (this.over || cell === this.playerCell) return { kind: 'none', reason: 'invalid' };
    if (this.armed) return this.perkTargetOk(this.armed, cell) ? { kind: 'perk' } : { kind: 'none', reason: 'range' };
    const card = this.cards[cell];
    const d = dist(this.playerCell, cell);
    // По пустой соседней клетке теперь тоже можно ходить — это полноценный ход.
    if (!card) return d === 1 ? { kind: 'move' } : { kind: 'none', reason: 'invalid' };
    if (d === 1) {
      if (card.kind !== 'enemy') return { kind: 'move' };
      // Маг вообще не бьёт рукой: только способностью по кнопке.
      return this.stats.melee ? { kind: 'melee' } : { kind: 'none', reason: 'melee' };
    }
    if (card.kind !== 'enemy') return { kind: 'none', reason: 'range' };
    const s = this.stats;
    if (s.ranged === 'none') return { kind: 'none', reason: 'range' };
    if (s.ranged === 'skip' && !this.archerReach(cell)) return { kind: 'none', reason: 'range' };
    if (this.res < s.rangedCost) return { kind: 'none', reason: 'resource' };
    return { kind: 'ranged' };
  }

  /** Досягаемость выстрела лучника: через карту по прямой, а с «Косым прицелом» — ещё и по диагонали. */
  private archerReach(cell: number): boolean {
    const p = this.playerCell;
    if (dist(p, cell) === 2 && sameLine(p, cell)) return true;
    if (this.stats.passives.has('diagonal') && DIAGONALS[p].includes(cell)) return true;
    if (this.stats.passives.has('eagle_eye') && NEIGHBORS[p].includes(cell)) return true;
    return false;
  }

  get backstabs(): boolean {
    return this.stats.rangedCrit;
  }

  /** Убьёт ли ближайшая атака врага — для подсветки карточки. */
  wouldKill(cell: number): boolean {
    const card = this.cards[cell];
    if (!card || card.kind !== 'enemy') return false;
    const a = this.actionFor(cell);
    if (a.kind !== 'melee' && a.kind !== 'ranged') return false;
    let dmg = this.currentDamage();
    if (a.kind === 'ranged') {
      dmg = Math.round(dmg * this.stats.rangedMul);
      if (this.backstabs || this.reaping > 0) dmg = Math.max(dmg + 1, Math.round(dmg * this.stats.critMin));
    }
    dmg = this.contextDamage(dmg, card);
    return this.afterArmor(dmg, card) >= card.hp;
  }

  tap(cell: number): { ok: boolean; reason?: string; events: GameEvent[] } {
    const events: GameEvent[] = [];
    if (this.armed) return this.aimPerk(cell);
    const action = this.actionFor(cell);
    if (action.kind === 'none') return { ok: false, reason: action.reason, events };
    this.beginTurn();
    if (action.kind === 'melee') this.melee(cell, events);
    else if (action.kind === 'ranged') this.basicRanged(cell, events);
    else this.collect(cell, events);
    this.finishTurn(events);
    return { ok: true, events };
  }

  // ------------------------------------------------------------------ способности

  /** Доступна ли способность прямо сейчас. */
  perkReady(p: PerkDef): { ok: boolean; reason?: 'resource' | 'once' | 'gold' | 'targets' | 'active' | 'cooldown' } {
    if (this.over) return { ok: false, reason: 'once' };
    if (p.once && this.usedOnce.has(p.id)) return { ok: false, reason: 'once' };
    if (this.cooldownOf(p) > 0) return { ok: false, reason: 'cooldown' };
    if (p.goldCost !== undefined) {
      return this.totals.gold >= 5 ? { ok: true } : { ok: false, reason: 'gold' };
    }
    // Уже действующее усиление нельзя навесить второй раз — кнопка гаснет,
    // иначе ход и ресурс уходят впустую.
    if (this.buffActive(p)) return { ok: false, reason: 'active' };
    const cost = this.perkCostOf(p);
    if (cost > this.res) return { ok: false, reason: 'resource' };
    return { ok: true };
  }

  /** Сколько ходов осталось до готовности способности. */
  cooldownOf(p: PerkDef): number {
    return this.cooldowns[p.id] ?? 0;
  }

  /** Держится ли уже эффект этой способности. */
  private buffActive(p: PerkDef): boolean {
    switch (p.ability) {
      case 'madness': return this.madness > 0;
      case 'reaper': return this.reaping > 0;
      case 'smoke_screen': return this.noCounter > 0;
      default: return false;
    }
  }

  /** Цена способности с учётом «первый перк в комнате бесплатен» и «Жнеца». */
  perkCostOf(p: PerkDef): number {
    if (this.freePerkLeft > 0) return 0;
    if (p.cost === FULL_BAR) return this.stats.resMax;
    // скидка не опускает цену ниже двух: иначе молния за единицу окупалась бы
    // восстановлением каждого хода, и мана перестала бы что-то значить
    const base = p.cost ?? 0;
    return Math.max(Math.min(base, PERK_COST_FLOOR), base - this.stats.perkCostDown);
  }

  /**
   * Нажатие на кнопку способности: несфокусированные применяются сразу,
   * остальные «заряжаются» — следующее касание поля наводит их на цель.
   */
  usePerk(id: string): { ok: boolean; reason?: string; events: GameEvent[] } {
    const events: GameEvent[] = [];
    const p = PERK_BY_ID[id];
    if (!p || p.passive || p.basic) return { ok: false, reason: 'invalid', events };
    if (!this.stats.perks.includes(id)) return { ok: false, reason: 'invalid', events };
    if (this.armed?.id === id) {
      this.armed = null;
      this.swapFirst = null;
      events.push({ type: 'armed', id: null });
      return { ok: true, events };
    }
    const ready = this.perkReady(p);
    if (!ready.ok) return { ok: false, reason: ready.reason, events };
    if (p.target === 'self') {
      this.beginTurn();
      this.payPerk(p, events);
      events.push({ type: 'perk', id: p.id, ability: p.ability });
      this.runAbility(p, -1, events);
      this.afterPerk(events);
      this.finishTurn(events);
      return { ok: true, events };
    }
    this.armed = p;
    this.swapFirst = null;
    events.push({ type: 'armed', id: p.id });
    return { ok: true, events };
  }

  cancelPerk(): GameEvent[] {
    if (!this.armed) return [];
    this.armed = null;
    this.swapFirst = null;
    return [{ type: 'armed', id: null }];
  }

  /** Подходит ли клетка под заряженную способность. */
  perkTargetOk(p: PerkDef, cell: number): boolean {
    if (cell === this.playerCell) return false;
    const card = this.cards[cell];
    if (!card) return false;
    // Клеймо, приговор и кукла вуду держатся до смерти цели — вешать их второй раз
    // значит выбросить ход, поэтому такая цель просто не подсвечивается.
    if (card.kind === 'exit' || card.kind === 'ghost') return false;
    if (p.ability === 'corpse_blast' && card.corpse) return false;
    if (p.ability === 'ghosts' && card.haunt) return false;
    if (p.ability === 'sentence' && card.vuln > 0) return false;
    if (p.ability === 'voodoo' && card.link) return false;
    if (p.ability === 'death_mark' && card.mark > 0) return false;
    switch (p.target) {
      case 'enemy': return card.kind === 'enemy';
      case 'adjacent': return card.kind === 'enemy' && NEIGHBORS[this.playerCell].includes(cell);
      // выстрел идёт ЧЕРЕЗ карту: вплотную из него не бьют
      case 'line': return card.kind === 'enemy' && sameLine(this.playerCell, cell) && dist(this.playerCell, cell) > 1;
      case 'card': return card.kind !== 'enemy';
      case 'any_card': return true;
      case 'two': return true;
      default: return false;
    }
  }

  private aimPerk(cell: number): { ok: boolean; reason?: string; events: GameEvent[] } {
    const events: GameEvent[] = [];
    const p = this.armed!;
    if (!this.perkTargetOk(p, cell)) return { ok: false, reason: 'range', events };
    if (p.target === 'two' && this.swapFirst === null) {
      this.swapFirst = cell;
      events.push({ type: 'armed', id: p.id });
      return { ok: true, events };
    }
    this.armed = null;
    this.beginTurn();
    this.payPerk(p, events);
    events.push({ type: 'perk', id: p.id, ability: p.ability });
    this.runAbility(p, cell, events);
    this.swapFirst = null;
    this.afterPerk(events);
    this.finishTurn(events);
    return { ok: true, events };
  }

  private payPerk(p: PerkDef, events: GameEvent[]): void {
    if (p.once) this.usedOnce.add(p.id);
    // +1: перезарядка тикает в конце того же хода, поэтому «кулдаун 1» = пропуск одного хода
    if (p.cooldown) this.cooldowns[p.id] = p.cooldown + 1;
    if (p.goldCost !== undefined) {
      const pay = Math.max(5, Math.round(this.totals.gold * p.goldCost));
      this.totals.gold = Math.max(0, this.totals.gold - pay);
      events.push({ type: 'spend', amount: pay });
      return;
    }
    const cost = this.perkCostOf(p);
    if (this.freePerkLeft > 0) this.freePerkLeft--;
    if (cost > 0) this.spend(cost, events);
  }

  /**
   * «Кровавая пелена», «Дымовая шашка», «Абсолютная защита»: после способности следующий удар слабее.
   * Не больше чем вдвое: раньше «Абсолютная защита» гасила удар целиком, и маг, который кастует
   * каждый ход, становился неуязвим.
   */
  private afterPerk(events: GameEvent[]): void {
    const s = this.stats;
    if (s.perkDef > 0) this.perkGuard = Math.max(this.perkGuard, Math.min(PERK_GUARD_CAP, s.perkDef));
    if (s.abilityShield > 0 && !this.over) {
      this.shield += Math.max(1, Math.round(s.maxHp * s.abilityShield));
      events.push({ type: 'shield', now: this.shield });
    }
  }

  // ------------------------------------------------------------------ расчёт урона

  /** Урон героя с учётом временных надбавок (резня, ярость, золото, удар щитом). */
  currentDamage(): number {
    const s = this.stats;
    let d = s.damage;
    let mul = 1;
    if (s.rageDmg > 0 && this.hp <= this.stats.maxHp * 0.5) mul += s.rageDmg;
    if (s.killDmg > 0) mul += Math.min(0.3, s.killDmg * this.killsRoom);
    if (s.goldDmg > 0) mul += Math.min(0.3, s.goldDmg * Math.floor(this.totals.gold / 100));
    if (this.stats.passives.has('carnage')) mul += Math.min(0.8, 0.2 * this.killStreak);
    if (s.defDmg > 0) d += Math.round(this.defenseNow() * s.defDmg);
    return Math.max(1, Math.round(d * mul));
  }

  /** Надбавки, зависящие от цели. */
  private contextDamage(dmg: number, enemy: Card): number {
    const s = this.stats;
    const def = ENEMIES[enemy.defId];
    let mul = 1;
    if (s.fullHpDmg > 0 && enemy.hp >= enemy.maxHp) mul += s.fullHpDmg;
    if (s.lowHpDmg > 0 && enemy.hp <= enemy.maxHp * 0.3) mul += s.lowHpDmg;
    if (s.bossDmg > 0 && def?.boss) mul += s.bossDmg;
    return Math.max(1, Math.round(dmg * mul));
  }

  /** Броня врага и «Приговор». */
  private afterArmor(dmg: number, enemy: Card): number {
    const def = ENEMIES[enemy.defId];
    const armor = Math.max(0, Math.round((def?.armor ?? 0) * (1 - this.stats.pierce)));
    let out = Math.max(1, dmg - armor);
    if (enemy.vuln > 0) out = Math.round(out * (1 + enemy.vuln));
    return Math.max(1, out);
  }

  private rollCritMul(): number {
    const { critMin, critMax } = this.stats;
    return critMin + this.rng.next() * (critMax - critMin);
  }

  /** Множитель силы способностей. */
  private pp(value: number, cap = Infinity): number {
    return Math.min(cap, value * this.stats.perkPower);
  }

  /** Урон способности: доля от базового урона героя, усиленная талантом «перк класса сильнее». */
  private spellDamage(ratio: number): number {
    return Math.max(1, Math.round(this.currentDamage() * ratio * this.stats.perkPower));
  }

  private rollCrit(enemy: Card | null, ranged: boolean): boolean {
    const s = this.stats;
    if (this.roomCritLeft > 0) {
      this.roomCritLeft--;
      return true;
    }
    if (s.passives.has('hunters_mark') && ranged && enemy && enemy.hits === 0) return true;
    if (this.inAbility && s.abilityCrit > 0 && this.rng.chance(s.abilityCrit / 100)) return true;
    if (s.everyThird) {
      this.hitCounter++;
      if (this.hitCounter % 3 === 0) return true;
    }
    return this.rng.chance(s.crit / 100);
  }

  // ------------------------------------------------------------------ удары героя

  private spend(cost: number, events: GameEvent[]): void {
    this.res = Math.max(0, this.res - cost);
    events.push({ type: 'resource', now: this.res, max: this.stats.resMax });
  }

  private gain(amount: number, events: GameEvent[]): void {
    if (amount <= 0) return;
    this.res = Math.min(this.stats.resMax, this.res + amount);
    events.push({ type: 'resource', now: this.res, max: this.stats.resMax });
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

  /**
   * Доспех снашивается не больше одного раза за ход. Ход врагов бьёт сразу всеми соседями,
   * и снос за каждый удар сжигал бы броню втрое быстрее, чем на неё зарабатывают.
   */
  private wearArmor(events: GameEvent[]): void {
    const a = this.armor;
    if (!a || a.durability <= 0 || this.armorWorn) return;
    this.armorWorn = true;
    a.durability--;
    if (a.durability <= 0) {
      const it = ITEM_BY_ID[a.id];
      this.stats.defense = Math.max(0, this.stats.defense - it.defense);
      this.stats.maxHp = Math.max(1, this.stats.maxHp - it.health);
      this.hp = Math.min(this.hp, this.stats.maxHp);
      events.push({ type: 'break', slot: 'armor', id: a.id });
    }
  }

  private melee(cell: number, events: GameEvent[]): void {
    const enemy = this.cards[cell]!;
    const s = this.stats;
    let dmg = this.currentDamage();
    if (this.counterReady) {
      dmg = Math.round(dmg * (1 + s.counterBuff));
      this.counterReady = false;
    }
    const crit = this.rollCrit(enemy, false);
    if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * this.rollCritMul()));
    events.push({ type: 'attack', from: this.playerCell, to: cell, ranged: false, by: 'player' });
    this.wearWeapon(events);
    let killed = this.strike(cell, dmg, crit, events);
    // «Двойной удар» / «Град стрел»
    if (!killed && s.doubleStrike > 0 && this.rng.chance(s.doubleStrike / 100)) {
      killed = this.strike(cell, dmg, this.rollCrit(this.cards[cell], false), events);
    }
    if (this.madness > 0) this.splashNeighbors(cell, Math.round(dmg * 0.6), events);
    // ответный удар больше не привязан к конкретной цели — его даёт общий ход врагов
    if (killed) this.stepInto(cell, events);
  }

  /** Базовое действие линейки: выстрел через карту, удар молнии, удар в спину. */
  private basicRanged(cell: number, events: GameEvent[]): void {
    const s = this.stats;
    const free = this.reaping > 0 && this.backstabs;
    if (!free) this.spend(s.rangedCost, events);
    const forceCrit = this.backstabs || this.reaping > 0;
    let dmg = Math.round(this.currentDamage() * s.rangedMul);
    const crit = forceCrit || this.rollCrit(this.cards[cell], true);
    if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * this.rollCritMul()));
    const style = this.backstabs ? 'backstab' : s.ranged === 'any' ? 'bolt' : 'shot';
    events.push({ type: 'attack', from: this.playerCell, to: cell, ranged: true, by: 'player', style });
    this.wearWeapon(events);
    // «Жнец»: удар в спину убивает любого не-босса
    const target = this.cards[cell];
    if (this.reaping > 0 && this.backstabs && target && !ENEMIES[target.defId]?.boss) {
      this.reaping++;
      this.killEnemy(cell, events);
      return;
    }
    const killed = this.strike(cell, dmg, crit, events);
    this.splitStrike(cell, dmg, events);
    if (crit && s.passives.has('hunter_thrill')) this.gain(s.rangedCost, events);
    if (killed) {
      if (s.passives.has('cold_blood')) this.gain(3, events);
      if (s.passives.has('shadow_dance')) this.shadowChain(events);
    } else if (target && s.passives.has('lethal_dose')) {
      const boss = !!ENEMIES[target.defId]?.boss;
      this.applyPoison(cell, Math.max(1, Math.round(target.maxHp * (boss ? 0.05 : 0.1))), 3, events);
    }
  }

  /** «Раздвоение молнии» / «Двойной наконечник»: основной удар с шансом цепляет ещё одного врага. */
  private splitStrike(cell: number, dmg: number, events: GameEvent[]): void {
    const { splitChance, splitDmg } = this.stats;
    if (splitChance <= 0 || splitDmg <= 0) return;
    if (!this.rng.chance(splitChance)) return;
    const extra = this.enemyCells().filter((c) => c !== cell);
    if (!extra.length) return;
    const c2 = extra[this.rng.int(0, extra.length - 1)];
    events.push({ type: 'fx', cells: [c2], style: 'chain' });
    this.damageEnemy(c2, Math.max(1, Math.round(dmg * splitDmg)), false, events);
  }

  /** «Танец теней»: убийство ударом в спину переносит героя к слабейшему врагу, цепь до трёх ударов. */
  private shadowChain(events: GameEvent[]): void {
    for (let i = 0; i < 2; i++) {
      let best = -1;
      let bestHp = Infinity;
      this.cards.forEach((c, idx) => {
        if (c?.kind === 'enemy' && c.hp < bestHp) {
          bestHp = c.hp;
          best = idx;
        }
      });
      if (best < 0) return;
      let dmg = Math.round(this.currentDamage() * this.stats.rangedMul);
      dmg = Math.max(dmg + 1, Math.round(dmg * this.rollCritMul()));
      events.push({ type: 'attack', from: this.playerCell, to: best, ranged: true, by: 'player', style: 'backstab' });
      if (!this.strike(best, dmg, true, events)) return;
    }
  }

  /** Один удар по врагу. Возвращает true, если враг погиб. */
  private strike(cell: number, raw: number, crit: boolean, events: GameEvent[]): boolean {
    const enemy = this.cards[cell];
    if (!enemy || enemy.kind !== 'enemy') return false;
    if (this.acting) this.engaged.add(enemy.uid);
    const def = ENEMIES[enemy.defId];
    if (def?.evade && this.rng.chance(def.evade / 100)) {
      events.push({ type: 'miss', cell, kind: 'evade' });
      return false;
    }
    enemy.hits++;
    const dmg = this.afterArmor(this.contextDamage(raw, enemy), enemy);
    if (this.inAbility) this.abilityRiders(cell, enemy, dmg, events);
    return this.damageEnemy(cell, dmg, crit, events, true);
  }

  /**
   * Таланты-синергии: они меняют уже полученные способности, поэтому «Живое пламя» пироманта
   * заставляет поджигать даже цепную молнию, взятую ещё магом.
   */
  private abilityRiders(cell: number, enemy: Card, dmg: number, events: GameEvent[]): void {
    const s = this.stats;
    if (s.abilityIgnite > 0 && this.rng.chance(s.abilityIgnite / 100)) {
      this.applyBurn(cell, Math.max(1, Math.round(dmg * 0.3)), 3, events);
    }
    if (s.abilityStun > 0 && this.rng.chance(s.abilityStun / 100)) this.applyStun(cell, events);
    if (s.abilityPoison > 0) {
      this.applyPoison(cell, Math.max(1, Math.round(enemy.maxHp * s.abilityPoison)), 3, events);
    }
    if (s.abilityVuln > 0 && enemy.vuln < s.abilityVuln) {
      enemy.vuln = s.abilityVuln;
      events.push({ type: 'status', cell, uid: enemy.uid, kind: 'vuln', turns: 99 });
    }
    if (s.abilityLifesteal > 0) this.heal(Math.max(1, Math.round(dmg * s.abilityLifesteal)), 'lifesteal', events);
    if (s.abilitySplash > 0) {
      const share = Math.max(1, Math.round(dmg * s.abilitySplash));
      for (const n of NEIGHBORS[cell]) {
        if (this.cards[n]?.kind === 'enemy') this.damageEnemy(n, share, false, events);
      }
    }
  }

  /**
   * Наносит врагу уже посчитанный урон. `direct` — удар героя (работают вампиризм, шипы врага, ярость врага).
   * Возвращает true, если враг погиб.
   */
  private damageEnemy(cell: number, dmg: number, crit: boolean, events: GameEvent[], direct = false): boolean {
    const enemy = this.cards[cell];
    if (!enemy || enemy.kind !== 'enemy' || this.over) return false;
    if (this.acting) this.engaged.add(enemy.uid);
    const s = this.stats;
    const def = ENEMIES[enemy.defId];
    const dealt = Math.min(dmg, enemy.hp);
    enemy.hp -= dmg;
    const executed = enemy.hp > 0 && s.execute > 0 && !def?.boss && enemy.hp / enemy.maxHp <= s.execute;
    events.push({ type: 'hit', cell, amount: dealt, crit, target: 'enemy', hp: Math.max(0, executed ? 0 : enemy.hp) });

    if (direct) {
      if (s.lifesteal > 0 && dealt > 0) this.heal(Math.max(1, Math.round(dealt * s.lifesteal)), 'lifesteal', events);
      if (s.ignite > 0) this.applyBurn(cell, this.spellDamage(s.ignite), 3, events);
      if (def?.enrage && enemy.hp > 0) {
        enemy.atk = Math.round(enemy.atk + enemy.baseAtk * def.enrage);
      }
      if (def?.thorns && enemy.hp > 0) this.hurtPlayer(Math.max(1, Math.round(dealt * def.thorns)), events, cell, true);
    }
    // кукла вуду: половина урона расходится по остальным врагам
    if (enemy.link && dealt > 0) {
      const share = Math.max(1, Math.round(dealt * 0.5));
      for (let i = 0; i < 9; i++) {
        const other = this.cards[i];
        if (i !== cell && other?.kind === 'enemy') this.damageEnemy(i, share, false, events);
      }
    }
    if (enemy.hp <= 0 || executed) {
      this.killEnemy(cell, events);
      return true;
    }
    return false;
  }

  private killEnemy(cell: number, events: GameEvent[]): void {
    const enemy = this.cards[cell];
    if (!enemy || enemy.kind !== 'enemy') return;
    const def = ENEMIES[enemy.defId];
    const s = this.stats;
    events.push({ type: 'kill', cell, uid: enemy.uid });
    this.cards[cell] = null;
    // «Призрачные слуги»: на месте заражённого встаёт призрак (не больше двух на поле)
    if (enemy.haunt && this.ghostCount() < 2) this.raiseGhost(cell, events);
    else this.vacated.push(cell);
    this.totals.kills++;
    this.killsRoom++;
    if (ENEMIES[enemy.defId]?.boss) this.bossLeft = false;
    this.queueExit();
    this.killStreak++;
    const eliteMul = enemy.elite ? ELITE.value : 1;
    const gold = Math.round(def.gold * eliteMul * (this.mod.goldMul ?? 1) * (1 + s.goldBonus + s.luck * 0.05));
    const souls = Math.round(def.souls * eliteMul * (this.mod.soulMul ?? 1) * (1 + s.soulBonus));
    if (gold > 0) {
      this.totals.gold += gold;
      events.push({ type: 'gold', cell, amount: gold });
    }
    if (souls > 0) {
      this.totals.souls += souls;
      events.push({ type: 'souls', cell, amount: souls });
    }
    if (s.killHp > 0 && this.totals.kills % 10 === 0) {
      const add = Math.round(this.stats.maxHp * Math.min(0.3, s.killHp));
      this.stats.maxHp += add;
      this.hp += add;
      events.push({ type: 'heal', amount: add, hp: this.hp, source: 'perk' });
    }
    if (s.bossHp > 0 && def.boss) {
      const add = Math.round(this.stats.maxHp * s.bossHp);
      this.stats.maxHp += add;
      this.hp += add;
      events.push({ type: 'heal', amount: add, hp: this.hp, source: 'perk' });
    }
    if (s.killDefTurn > 0) this.defTurn = Math.max(this.defTurn, 1);
    // «Взрыв плоти»: любое убийство разлетается осколками по соседям
    if (s.killBlast > 0) {
      const blast = Math.max(1, Math.round(enemy.maxHp * s.killBlast));
      this.splashNeighbors(cell, blast, events);
    }
    // «Отработанный удар»: убийство способностью возвращает часть её цены
    if (this.inAbility && s.abilityRefund > 0 && this.abilityCost > 0) {
      this.gain(Math.max(1, Math.round(this.abilityCost * s.abilityRefund)), events);
    }
    if (s.passives.has('chain_mark') && enemy.mark > 0) this.jumpMark(cell, events);
    // взрыв трупа: взрывается тот, кого пометили; соседи, помеченные тоже, рвутся цепью
    if (enemy.corpse) {
      const blast = Math.max(1, Math.round(enemy.maxHp * this.pp(0.5)));
      events.push({ type: 'fx', cells: [cell], style: 'corpse' });
      this.splashNeighbors(cell, blast, events);
    }
    if (enemy.burn > 0) {
      for (const n of NEIGHBORS[cell]) {
        if (this.cards[n]?.kind === 'enemy') this.applyBurn(n, enemy.burnDmg, 2, events);
      }
    }
  }

  private ghostCount(): number {
    return this.cards.filter((c) => c?.kind === 'ghost').length;
  }

  /** Призрак встаёт на месте заражённого врага и три хода бьёт соседей. */
  private raiseGhost(cell: number, events: GameEvent[]): void {
    const g = this.mkCard('ghost');
    g.ttl = 3;
    this.cards[cell] = g;
    events.push({ type: 'spawn', cell, card: g });
  }

  /** Каждый призрак бьёт одного врага крестом (вверх, вниз, влево, вправо), потом тает на ход. */
  private tickGhosts(events: GameEvent[]): void {
    for (let i = 0; i < 9 && !this.over; i++) {
      const g = this.cards[i];
      if (g?.kind !== 'ghost') continue;
      const targets = NEIGHBORS[i].filter((n) => this.cards[n]?.kind === 'enemy');
      if (targets.length) {
        // добиваем слабейшего — так призрак чаще превращает удар в убийство
        const t = targets.reduce((a, b) => (this.cards[a]!.hp <= this.cards[b]!.hp ? a : b));
        events.push({ type: 'fx', cells: [t], style: 'ghost', from: i });
        this.damageEnemy(t, this.spellDamage(0.6), false, events);
      }
      g.ttl = (g.ttl ?? 1) - 1;
      if (g.ttl <= 0 && this.cards[i] === g) {
        this.cards[i] = null;
        events.push({ type: 'remove', cell: i, uid: g.uid });
        this.vacated.push(i);
      } else {
        events.push({ type: 'status', cell: i, uid: g.uid, kind: 'haunt', turns: g.ttl });
      }
    }
  }

  private splashNeighbors(cell: number, dmg: number, events: GameEvent[]): void {
    for (const n of NEIGHBORS[cell]) {
      if (this.cards[n]?.kind === 'enemy') this.damageEnemy(n, dmg, false, events);
    }
  }

  private stepInto(cell: number, events: GameEvent[]): void {
    if (this.cards[cell]) return;
    this.vacated = this.vacated.filter((c) => c !== cell);
    const from = this.playerCell;
    events.push({ type: 'move', from, to: cell });
    this.playerCell = cell;
    this.vacated.push(from);
  }

  // ------------------------------------------------------------------ статусы

  private applyBurn(cell: number, dmg: number, turns: number, events: GameEvent[]): void {
    const c = this.cards[cell];
    if (!c || c.kind !== 'enemy' || dmg <= 0) return;
    c.burnDmg = Math.max(c.burnDmg, Math.max(1, dmg));
    c.burn = Math.max(c.burn, turns);
    // число на значке — это ровно столько тиков, сколько впереди
    c.burnNew = true;
    events.push({ type: 'status', cell, uid: c.uid, kind: 'burn', turns: c.burn });
  }

  private applyPoison(cell: number, dmg: number, turns: number, events: GameEvent[]): void {
    const c = this.cards[cell];
    if (!c || c.kind !== 'enemy' || dmg <= 0) return;
    c.poisonDmg = Math.max(c.poisonDmg, Math.max(1, dmg));
    c.poison = Math.max(c.poison, turns);
    events.push({ type: 'status', cell, uid: c.uid, kind: 'poison', turns: c.poison });
  }

  private applyStun(cell: number, events: GameEvent[], turns = 1): void {
    const c = this.cards[cell];
    if (!c || c.kind !== 'enemy') return;
    c.stun = Math.max(c.stun, turns);
    events.push({ type: 'status', cell, uid: c.uid, kind: 'stun', turns: c.stun });
  }

  private jumpMark(from: number, events: GameEvent[]): void {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < 9; i++) {
      const c = this.cards[i];
      if (c?.kind !== 'enemy' || c.mark > 0) continue;
      const d = dist(from, i);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best < 0) return;
    const c = this.cards[best]!;
    c.mark = 3;
    events.push({ type: 'status', cell: best, uid: c.uid, kind: 'mark', turns: c.mark });
  }

  private enemyCells(): number[] {
    const out: number[] = [];
    this.cards.forEach((c, i) => c?.kind === 'enemy' && out.push(i));
    return out;
  }

  // ------------------------------------------------------------------ ответный удар врага

  private defenseNow(): number {
    const s = this.stats;
    let def = s.defense;
    if (s.highHpDef > 0 && this.hp > this.stats.maxHp * 0.7) def = Math.round(def * (1 + s.highHpDef));
    if (s.resDef > 0 && this.res > this.stats.resMax * 0.5) def = Math.round(def * (1 + s.resDef));
    if (s.scarDef > 0) {
      const lost = Math.floor((1 - this.hp / this.stats.maxHp) / 0.2);
      def = Math.round(def * (1 + s.scarDef * lost));
    }
    if (s.killDefStack > 0) def = Math.round(def * (1 + Math.min(0.2, s.killDefStack * this.killsRoom)));
    if (this.defTurn > 0) def = Math.round(def * (1 + s.killDefTurn));
    return def;
  }

  /** Урон по герою от удара силой atk (для подсказок и автоприменения). */
  strikeDamage(atk: number): number {
    return this.reduce(atk, null);
  }

  private reduce(atk: number, enemy: Card | null): number {
    const s = this.stats;
    const def = enemy ? ENEMIES[enemy.defId] : null;
    let dmg = atk;
    if (enemy && enemy.swings === 0 && s.firstHitDown > 0) dmg *= 1 - s.firstHitDown;
    if (enemy && enemy.hits > 0 && s.weaken > 0) dmg *= 1 - s.weaken;
    if (def?.magic && s.magicDr > 0) dmg *= 1 - s.magicDr;
    if (def?.boss && s.bossDr > 0) dmg *= 1 - s.bossDr;
    if (s.lowHpDr > 0 && this.hp <= this.stats.maxHp * 0.4) dmg *= 1 - s.lowHpDr;
    if (s.bigHitCut > 0 && dmg > this.stats.maxHp * 0.4) dmg *= 1 - s.bigHitCut;
    const armor = this.defenseNow();
    const floor = Math.ceil(dmg * (1 - GAMEPLAY.maxDefenseReduction));
    return Math.max(1, Math.round(Math.max(floor, dmg - armor)));
  }

  private heal(amount: number, source: 'perk' | 'lifesteal', events: GameEvent[]): void {
    if (amount <= 0 || this.hp >= this.stats.maxHp) return;
    const h = Math.min(amount, this.stats.maxHp - this.hp);
    this.hp += h;
    events.push({ type: 'heal', amount: h, hp: this.hp, source });
  }

  /** Враги, с которыми герой вступил в бой за этот ход (uid). */
  private engaged = new Set<number>();
  /**
   * Герой мог ударить врага, но шагнул на клетку без врага. Тогда бьют те, до кого
   * новая клетка достаёт: он сам подставился. Ушёл туда, где рядом никого, — ход бесплатный.
   */
  private exposed = false;
  /** Идёт действие героя: урон по врагу в это время — вступление в бой. */
  private acting = false;

  private beginTurn(): void {
    this.takeSnapshot();
    this.vacated = [];
    this.engaged.clear();
    this.exposed = false;
    this.acting = true;
  }

  /**
   * Ответ врагов. Бьёт не всё, что стоит рядом, а только:
   * — те, с кем герой вступил в бой за этот ход (ударил, накрыл способностью) и кто ещё рядом;
   * — те, кто достаёт до новой клетки, если герой мог ударить, но шагнул на не-врага.
   * Кто стоит в стороне и не тронут, ждёт своей очереди. Уйти от врага туда, где рядом
   * никого нет, можно безнаказанно, а вот копить ману шагами мимо чужих лап — нет.
   */
  private retaliate(events: GameEvent[]): void {
    if (this.over || this.madness > 0 || this.noCounter > 0) {
      this.engaged.clear();
      this.exposed = false;
      return;
    }
    const cells: number[] = [];
    for (let c = 0; c < 9; c++) {
      const card = this.cards[c];
      if (card?.kind !== 'enemy') continue;
      if (!NEIGHBORS[this.playerCell].includes(c)) continue;
      if (this.exposed || this.engaged.has(card.uid)) cells.push(c);
    }
    for (const c of cells) {
      if (this.over) break;
      this.enemyStrike(c, events);
    }
    this.engaged.clear();
    this.exposed = false;
  }

  private enemyStrike(cell: number, events: GameEvent[]): void {
    const enemy = this.cards[cell];
    if (!enemy || enemy.kind !== 'enemy' || this.over) return;
    const s = this.stats;
    if (enemy.stun > 0) {
      enemy.stun--;
      events.push({ type: 'miss', cell, kind: 'stun' });
      return;
    }
    if (this.noCounter > 0) {
      events.push({ type: 'miss', cell, kind: 'smoke' });
      return;
    }
    const atk = Math.max(1, Math.round(enemy.atk * (1 - this.warCry)));
    events.push({ type: 'attack', from: cell, to: this.playerCell, ranged: false, by: 'enemy' });
    enemy.swings++;
    if (this.rng.chance(s.dodge / 100)) {
      events.push({ type: 'miss', cell: this.playerCell, kind: 'dodge' });
      // «Подмена»: уворот превращается в удар из-за спины
      if (s.passives.has('substitution')) {
        let dmg = Math.round(this.currentDamage());
        dmg = Math.max(dmg + 1, Math.round(dmg * this.rollCritMul()));
        events.push({ type: 'attack', from: this.playerCell, to: cell, ranged: true, by: 'player', style: 'backstab' });
        this.strike(cell, dmg, true, events);
      }
      return;
    }
    if (this.rng.chance(s.parry / 100)) {
      events.push({ type: 'miss', cell: this.playerCell, kind: 'parry' });
      if (s.counterBuff > 0) this.counterReady = true;
      this.strike(cell, Math.round(this.currentDamage() * 0.5), false, events);
      return;
    }
    if (s.block > 0 && this.rng.chance(s.block / 100)) {
      events.push({ type: 'miss', cell: this.playerCell, kind: 'block' });
      return;
    }
    this.hurtPlayer(this.reduce(atk, enemy), events, cell, false);
    const def = ENEMIES[enemy.defId];
    if (def?.venom && !this.over) {
      const dot = Math.max(1, Math.round(atk * def.venom * (1 - s.dotDr)));
      this.playerPoisonDmg = Math.max(this.playerPoisonDmg, dot);
      this.playerPoison = Math.max(this.playerPoison, 2);
    }
  }

  /** Урон по герою: щит, «первый удар комнаты», мана-щит, обман смерти, шипы. */
  private hurtPlayer(raw: number, events: GameEvent[], fromCell: number, reflected: boolean): void {
    if (this.over) return;
    const s = this.stats;
    let dmg = raw;
    if (this.roomGuardLeft > 0) {
      this.roomGuardLeft--;
      dmg = Math.round(dmg * (1 - Math.min(1, s.roomGuard)));
    }
    if (this.perkGuard > 0) {
      dmg = Math.round(dmg * (1 - this.perkGuard));
      this.perkGuard = 0;
    }
    if (s.manaShield > 0 && this.res > 0 && dmg > 0) {
      const want = Math.ceil(dmg * s.manaShield);
      const paid = Math.min(this.res, want);
      if (paid > 0) {
        this.res -= paid;
        dmg -= paid;
        events.push({ type: 'resource', now: this.res, max: this.stats.resMax });
      }
    }
    if (this.shield > 0 && dmg > 0) {
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
    // «Ярость» берсерка: боль превращается в выносливость
    if (s.passives.has('rage')) this.gain(Math.floor(dmg / 2), events);
    events.push({ type: 'hit', cell: this.playerCell, amount: dmg, crit: false, target: 'player', hp: Math.max(0, this.hp) });
    this.wearArmor(events);
    if (this.hp <= 0 && !this.tryCheatDeath(dmg, events)) {
      this.over = 'lose';
      events.push({ type: 'lose' });
      return;
    }
    if (!reflected && s.thorns > 0 && fromCell >= 0) {
      this.damageEnemy(fromCell, Math.max(1, Math.round(dmg * s.thorns)), false, events);
    }
  }

  /** «Несокрушимый», «Аварийный барьер», «Откупиться», «Не сдамся». */
  private tryCheatDeath(dmg: number, events: GameEvent[]): boolean {
    const s = this.stats;
    const shock = s.passives.has('never_give_up') && !this.usedOnce.has('shock');
    if (this.cheatLeft <= 0 && !shock) return false;
    if (shock) this.usedOnce.add('shock');
    else this.cheatLeft--;
    this.hp = 1;
    events.push({ type: 'heal', amount: 1, hp: 1, source: 'perk' });
    if (s.lineage === 'mage') {
      this.res = 0;
      events.push({ type: 'resource', now: 0, max: this.stats.resMax });
    }
    if (s.lineage === 'mercenary') this.totals.gold = Math.round(this.totals.gold * 0.8);
    if (shock) {
      events.push({ type: 'fx', cells: this.enemyCells(), style: 'quake' });
      const blast = Math.max(1, dmg * 2);
      for (const c of this.enemyCells()) this.damageEnemy(c, blast, false, events);
    }
    return true;
  }

  // ------------------------------------------------------------------ способности: реализация

  /** Применяет способность, пометив урон как «от способности» — тогда работают таланты-синергии. */
  private runAbility(p: PerkDef, cell: number, events: GameEvent[]): void {
    const target = cell >= 0 ? this.cards[cell] : null;
    if (target?.kind === 'enemy') this.engaged.add(target.uid);
    this.inAbility = true;
    this.abilityCost = this.perkCostOf(p);
    const mark = events.length;
    try {
      this.applyAbility(p, cell, events);
    } finally {
      this.inAbility = false;
      this.abilityCost = 0;
    }
    // У каждой способности есть своя вспышка. Если реализация не нарисовала ничего сама
    // (усиления, лечение, щиты), показываем эффект перка на герое или на цели.
    const drew = events.slice(mark).some((e) => e.type === 'fx' || (e.type === 'attack' && e.by === 'player'));
    if (!drew) events.splice(mark, 0, { type: 'fx', cells: [cell >= 0 ? cell : this.playerCell], style: p.vfx });
  }

  private applyAbility(p: PerkDef, cell: number, events: GameEvent[]): void {
    const enemies = this.enemyCells();
    const target = cell >= 0 ? this.cards[cell] : null;

    switch (p.ability) {
      // ---------------- воин
      case 'power_strike': {
        const enemy = target!;
        let dmg = this.spellDamage(2);
        const crit = this.rollCrit(enemy, false);
        if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * this.rollCritMul()));
        events.push({ type: 'attack', from: this.playerCell, to: cell, ranged: false, by: 'player' });
        const before = enemy.hp;
        const killed = this.strike(cell, dmg, crit, events);
        // излишек проламывает цель и бьёт врага за ней по той же линии
        const over = dmg - before;
        if (killed && over > 0) {
          const behind = this.behindCell(this.playerCell, cell);
          if (behind >= 0 && this.cards[behind]?.kind === 'enemy') this.damageEnemy(behind, over, false, events);
        }
        if (killed) this.stepInto(cell, events);
        break;
      }
      case 'earthquake': {
        const hit = enemies.filter((c) => rowOf(c) === rowOf(this.playerCell) || colOf(c) === colOf(this.playerCell));
        events.push({ type: 'fx', cells: hit, style: 'quake' });
        const dmg = this.spellDamage(0.6);
        for (const c of hit) {
          this.applyStun(c, events);
          this.damageEnemy(c, dmg, false, events);
        }
        break;
      }
      // ---------------- рыцарь
      case 'shield_bash': {
        const behind = this.behindCell(this.playerCell, cell);
        const dmg = this.spellDamage(0.9);
        events.push({ type: 'fx', cells: [cell], style: 'quake' });
        this.applyStun(cell, events);
        if (behind < 0) {
          // у края поля удар о стену вдвое сильнее
          this.damageEnemy(cell, dmg * 2, false, events);
        } else {
          this.damageEnemy(cell, dmg, false, events);
          if (this.cards[behind]?.kind === 'enemy') this.damageEnemy(behind, dmg, false, events);
          if (this.cards[cell] && this.cards[behind]) {
            const t = this.cards[cell]!;
            this.cards[cell] = this.cards[behind]!;
            this.cards[behind] = t;
            events.push({ type: 'swap', a: cell, b: behind });
          }
        }
        break;
      }
      case 'war_cry': {
        this.warCry = Math.min(0.75, this.warCry + this.pp(0.4, 0.75));
        events.push({ type: 'fx', cells: enemies, style: 'banner' });
        for (const c of enemies) {
          const e = this.cards[c]!;
          events.push({ type: 'status', cell: c, uid: e.uid, kind: 'weak', turns: 99 });
        }
        break;
      }
      case 'duel': {
        let best = -1;
        let bestAtk = -1;
        for (const c of enemies) {
          if (this.cards[c]!.atk > bestAtk) {
            bestAtk = this.cards[c]!.atk;
            best = c;
          }
        }
        if (best < 0) break;
        events.push({ type: 'fx', cells: [best], style: 'swap' });
        const free = NEIGHBORS[this.playerCell].find((n) => !this.cards[n]) ?? NEIGHBORS[this.playerCell][0];
        if (free !== best) {
          const t = this.cards[free] ?? null;
          this.cards[free] = this.cards[best];
          this.cards[best] = t;
          events.push({ type: 'swap', a: best, b: free });
        }
        this.applyStun(free, events, 2);
        break;
      }
      // ---------------- берсерк
      case 'whirlwind': {
        const near = NEIGHBORS[this.playerCell].filter((c) => this.cards[c]?.kind === 'enemy');
        events.push({ type: 'fx', cells: near, style: 'blades' });
        const dmg = this.spellDamage(0.7);
        for (const c of near) this.damageEnemy(c, dmg, this.rollCrit(this.cards[c], false), events, true);
        break;
      }
      case 'madness': {
        this.madness = 3;
        events.push({ type: 'fx', cells: enemies, style: 'blades' });
        break;
      }
      // ---------------- паладин
      case 'holy_wrath': {
        const enemy = target!;
        const holy = isHolyTarget(ENEMIES[enemy.defId].tag);
        let dmg = this.spellDamage(holy ? 3 : 1.5);
        const crit = this.rollCrit(enemy, false);
        if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * this.rollCritMul()));
        events.push({ type: 'fx', cells: [cell], style: 'holy' });
        const killed = this.strike(cell, dmg, crit, events);
        if (killed) this.stepInto(cell, events);
        break;
      }
      case 'justice_beam': {
        const col = colOf(cell);
        const hit = enemies.filter((c) => colOf(c) === col);
        events.push({ type: 'fx', cells: hit, style: 'beam' });
        for (const c of hit) {
          const e = this.cards[c]!;
          const holy = isHolyTarget(ENEMIES[e.defId].tag);
          this.damageEnemy(c, this.spellDamage(holy ? 2 : 1), false, events);
        }
        break;
      }
      case 'verdict': {
        const limit = this.spellDamage(1.2);
        events.push({ type: 'fx', cells: enemies, style: 'holy' });
        for (const c of enemies) {
          const e = this.cards[c];
          if (e && !ENEMIES[e.defId].boss && e.hp <= limit) this.killEnemy(c, events);
        }
        break;
      }
      case 'heavens_wrath': {
        events.push({ type: 'fx', cells: enemies, style: 'holy' });
        for (const c of enemies) {
          const e = this.cards[c];
          if (!e) continue;
          const holy = isHolyTarget(ENEMIES[e.defId].tag);
          this.applyStun(c, events, 2);
          this.damageEnemy(c, this.spellDamage(holy ? 4 : 2), false, events);
        }
        break;
      }
      // ---------------- маг
      // Удар молнии — единственный удар мага, и он стоит маны. Пустая шкала в окружении
      // врагов — не тупик, а приговор: см. `cornered()` и «Растерзание» в finishTurn.
      case 'lightning': {
        events.push({ type: 'attack', from: this.playerCell, to: cell, ranged: true, by: 'player', style: 'bolt' });
        const crit = this.rollCrit(target, true);
        let dmg = this.spellDamage(2.5 * (1 + this.stats.lightningPower));
        if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * this.rollCritMul()));
        const killed = this.strike(cell, dmg, crit, events);
        // «Раздвоение молнии»: второй разряд бьёт ту же цель, а не соседа
        const { echoChance, echoDmg } = this.stats;
        if (!killed && echoChance > 0 && this.rng.chance(echoChance)) {
          events.push({ type: 'fx', cells: [cell], style: 'bolt' });
          this.strike(cell, Math.max(1, Math.round(dmg * echoDmg)), false, events);
        }
        break;
      }
      case 'magic_shot': {
        events.push({ type: 'fx', cells: [cell], style: 'arcane' });
        const crit = this.rollCrit(target, true);
        let dmg = this.spellDamage(1.5 * (1 + this.stats.shotPower));
        if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * this.rollCritMul()));
        this.strike(cell, dmg, crit, events);
        break;
      }
      case 'chain_lightning': {
        const chain: number[] = [cell];
        const seen = new Set<number>([cell]);
        for (const n of NEIGHBORS[cell]) {
          if (this.cards[n]?.kind === 'enemy' && !seen.has(n) && chain.length < 3) {
            chain.push(n);
            seen.add(n);
          }
        }
        events.push({ type: 'fx', cells: chain, style: 'chain' });
        const power = 1 + this.stats.chainPower;
        const mul = [1, 0.75, 0.5];
        chain.forEach((c, i) => this.strike(c, this.spellDamage(mul[i] * power), false, events));
        break;
      }
      // ---------------- магистр
      case 'swap': {
        const a = this.swapFirst!;
        const b = cell;
        if (a === b) break;
        events.push({ type: 'fx', cells: [a, b], style: 'swap' });
        const t = this.cards[a];
        this.cards[a] = this.cards[b];
        this.cards[b] = t;
        events.push({ type: 'swap', a, b });
        break;
      }
      case 'deck_draw': {
        const c = this.cards[cell];
        if (!c) break;
        if (c.kind === 'enemy' && ENEMIES[c.defId].boss) break;
        events.push({ type: 'fx', cells: [cell], style: 'arcane' });
        this.cards[cell] = null;
        events.push({ type: 'remove', cell, uid: c.uid });
        this.pool.push(c);
        const next = this.pool.shift();
        if (next) {
          this.cards[cell] = next;
          events.push({ type: 'spawn', cell, card: next });
        } else {
          this.vacated.push(cell);
        }
        break;
      }
      case 'rewind': {
        this.restoreSnapshot();
        events.push({ type: 'rewind' });
        break;
      }
      // ---------------- некромант
      case 'corpse_blast': {
        const e = target!;
        e.corpse = true;
        events.push({ type: 'fx', cells: [cell], style: 'corpse' });
        events.push({ type: 'status', cell, uid: e.uid, kind: 'corpse', turns: 99 });
        break;
      }
      case 'ghosts': {
        const e = target!;
        e.haunt = true;
        events.push({ type: 'fx', cells: [cell], style: 'ghost' });
        events.push({ type: 'status', cell, uid: e.uid, kind: 'haunt', turns: 99 });
        break;
      }
      case 'voodoo': {
        const e = target!;
        e.link = true;
        events.push({ type: 'status', cell, uid: e.uid, kind: 'link', turns: 99 });
        break;
      }
      case 'dead_harvest': {
        events.push({ type: 'fx', cells: enemies, style: 'soul' });
        const bonus = this.stats.soulBonus;
        this.stats.soulBonus = bonus + 1;
        for (const c of enemies) {
          const e = this.cards[c];
          if (!e) continue;
          const boss = ENEMIES[e.defId].boss;
          this.damageEnemy(c, Math.max(1, Math.round(e.hp * this.pp(boss ? 0.25 : 0.5, 0.9))), false, events);
        }
        this.stats.soulBonus = bonus;
        break;
      }
      // ---------------- пиромант
      case 'ignite': {
        events.push({ type: 'fx', cells: [cell], style: 'fire' });
        this.applyBurn(cell, this.spellDamage(0.3), 3, events);
        break;
      }
      case 'fireball': {
        const near = NEIGHBORS[cell].filter((c) => this.cards[c]?.kind === 'enemy');
        events.push({ type: 'fx', cells: [cell, ...near], style: 'explosion' });
        const burn = this.spellDamage(0.25);
        this.applyBurn(cell, burn, 3, events);
        for (const c of near) this.applyBurn(c, burn, 3, events);
        this.strike(cell, this.spellDamage(1.2), false, events);
        for (const c of near) this.damageEnemy(c, this.spellDamage(0.7), false, events);
        break;
      }
      case 'detonate': {
        const burning = enemies.filter((c) => (this.cards[c]?.burn ?? 0) > 0);
        events.push({ type: 'fx', cells: burning, style: 'explosion' });
        for (const c of burning) {
          const e = this.cards[c];
          if (!e) continue;
          const blast = Math.max(1, e.burnDmg * 2);
          this.splashNeighbors(c, Math.max(1, e.burnDmg), events);
          this.damageEnemy(c, blast, false, events);
        }
        break;
      }
      case 'inferno': {
        events.push({ type: 'fx', cells: enemies, style: 'fire' });
        const burn = this.spellDamage(0.4);
        for (const c of enemies) this.applyBurn(c, burn, 5, events);
        break;
      }
      // ---------------- лучник
      case 'ricochet': {
        const chain = [cell];
        for (const n of NEIGHBORS[cell]) {
          if (this.cards[n]?.kind === 'enemy' && chain.length < 3) chain.push(n);
        }
        events.push({ type: 'attack', from: this.playerCell, to: cell, ranged: true, by: 'player', style: 'shot' });
        const mul = [1, 0.5, 0.25];
        chain.forEach((c, i) => this.strike(c, this.spellDamage(mul[i]), i === 0 && this.rollCrit(this.cards[c], true), events));
        break;
      }
      case 'falcon_hunt': {
        events.push({ type: 'fx', cells: [cell], style: 'arrows' });
        this.applyStun(cell, events);
        this.strike(cell, this.spellDamage(1.2), this.rollCrit(target, true), events);
        break;
      }
      case 'falcon_courier': {
        this.take(cell, events);
        this.vacated.push(cell);
        break;
      }
      case 'double_shot': {
        events.push({ type: 'attack', from: this.playerCell, to: cell, ranged: true, by: 'player', style: 'shot' });
        const killed = this.strike(cell, this.spellDamage(1), this.rollCrit(target, true), events);
        let second = cell;
        if (killed) {
          second = this.nearestEnemy(this.playerCell);
          if (second < 0) break;
        }
        this.strike(second, this.spellDamage(1), this.rollCrit(this.cards[second], true), events);
        break;
      }
      case 'arrow_rain': {
        if (!enemies.length) break;
        events.push({ type: 'fx', cells: enemies, style: 'arrows' });
        for (let i = 0; i < 5; i++) {
          const live = this.enemyCells();
          if (!live.length) break;
          const c = live[this.rng.int(0, live.length - 1)];
          this.strike(c, this.spellDamage(0.6), this.rollCrit(this.cards[c], true), events);
        }
        break;
      }
      case 'starfall': {
        events.push({ type: 'fx', cells: enemies, style: 'arrows' });
        for (let i = 0; i < 3; i++) {
          for (const c of this.enemyCells()) {
            this.strike(c, this.spellDamage(0.6), this.rollCrit(this.cards[c], true), events);
          }
        }
        break;
      }
      // ---------------- снайпер
      case 'rail_shot': {
        const line = enemies.filter((c) => rowOf(c) === rowOf(cell) || colOf(c) === colOf(cell));
        line.sort((a, b) => dist(this.playerCell, a) - dist(this.playerCell, b));
        events.push({ type: 'attack', from: this.playerCell, to: cell, ranged: true, by: 'player', style: 'shot' });
        line.forEach((c, i) => this.strike(c, this.spellDamage(Math.pow(0.8, i)), i === 0, events));
        break;
      }
      case 'armor_piercing': {
        const e = target!;
        events.push({ type: 'attack', from: this.playerCell, to: cell, ranged: true, by: 'player', style: 'shot' });
        const bonus = Math.round(e.maxHp * this.pp(0.25, 0.6));
        this.strike(cell, this.spellDamage(1) + bonus, this.rollCrit(e, true), events);
        break;
      }
      case 'one_shot': {
        events.push({ type: 'fx', cells: [cell], style: 'beam' });
        const line = [cell, ...enemies.filter((c) => c !== cell && (rowOf(c) === rowOf(cell) || colOf(c) === colOf(cell)))];
        let kills = 0;
        for (const c of line) {
          const e = this.cards[c];
          if (!e) continue;
          if (ENEMIES[e.defId].boss) {
            this.damageEnemy(c, Math.max(1, Math.round(e.maxHp * this.pp(0.4, 0.8))), true, events);
          } else if (kills < 3) {
            this.killEnemy(c, events);
            kills++;
          }
        }
        break;
      }
      // ---------------- наёмник
      case 'bribe': {
        const e = target!;
        if (ENEMIES[e.defId].boss) break;
        events.push({ type: 'fx', cells: [cell], style: 'smoke' });
        events.push({ type: 'kill', cell, uid: e.uid });
        this.cards[cell] = null;
        this.vacated.push(cell);
        break;
      }
      case 'sentence': {
        const e = target!;
        e.vuln = Math.max(e.vuln, this.pp(0.5, 1.5));
        events.push({ type: 'status', cell, uid: e.uid, kind: 'vuln', turns: 99 });
        break;
      }
      // ---------------- тёмный ассасин
      case 'death_mark': {
        const e = target!;
        e.mark = 3;
        events.push({ type: 'status', cell, uid: e.uid, kind: 'mark', turns: e.mark });
        break;
      }
      case 'shadow_reap': {
        const marked = enemies.filter((c) => (this.cards[c]?.mark ?? 0) > 0);
        events.push({ type: 'fx', cells: marked, style: 'dark' });
        for (const c of marked) this.reapMarked(c, events);
        break;
      }
      case 'reaper': {
        this.reaping = 3;
        events.push({ type: 'fx', cells: enemies, style: 'dark' });
        break;
      }
      // ---------------- ниндзя
      case 'shuriken_fan': {
        const list = [...enemies].sort((a, b) => dist(this.playerCell, a) - dist(this.playerCell, b)).slice(0, 4);
        events.push({ type: 'fx', cells: list, style: 'blades' });
        for (const c of list) this.strike(c, this.spellDamage(0.6), this.rollCrit(this.cards[c], true), events);
        break;
      }
      case 'smoke_screen': {
        this.noCounter = 2;
        events.push({ type: 'fx', cells: [this.playerCell], style: 'smoke' });
        break;
      }
      case 'wind_shadow': {
        events.push({ type: 'fx', cells: enemies, style: 'blades' });
        for (const c of this.enemyCells()) {
          if (this.strike(c, this.spellDamage(0.8), false, events)) continue;
          let dmg = this.spellDamage(0.8);
          dmg = Math.max(dmg + 1, Math.round(dmg * this.rollCritMul()));
          this.strike(c, dmg, true, events);
        }
        break;
      }
      default:
        break;
    }
  }

  /** Клетка «за» целью по линии от героя. */
  private behindCell(from: number, to: number): number {
    const dr = Math.sign(rowOf(to) - rowOf(from));
    const dc = Math.sign(colOf(to) - colOf(from));
    const r = rowOf(to) + dr;
    const c = colOf(to) + dc;
    if (r < 0 || r > 2 || c < 0 || c > 2) return -1;
    const cell = r * 3 + c;
    return cell === this.playerCell ? -1 : cell;
  }

  private nearestEnemy(from: number): number {
    let best = -1;
    let bestD = Infinity;
    for (const c of this.enemyCells()) {
      const d = dist(from, c);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  private reapMarked(cell: number, events: GameEvent[]): void {
    const e = this.cards[cell];
    if (!e || e.kind !== 'enemy') return;
    if (ENEMIES[e.defId].boss) this.damageEnemy(cell, Math.max(1, Math.round(e.maxHp * 0.3)), true, events);
    else this.killEnemy(cell, events);
  }

  // ------------------------------------------------------------------ расходники

  useItem(id: ConsumableId): { ok: boolean; events: GameEvent[] } {
    const events: GameEvent[] = [];
    if (this.over || this.consumables[id] <= 0) return { ok: false, events };
    if (id === 'potion_heal') {
      if (this.hp >= this.stats.maxHp) return { ok: false, events };
      this.consumables[id]--;
      const heal = Math.min(this.healPotionAmount(), this.stats.maxHp - this.hp);
      this.hp += heal;
      events.push({ type: 'heal', amount: heal, hp: this.hp, source: 'potion' });
      if (this.stats.healShield > 0) {
        this.shield += Math.round(this.stats.maxHp * this.stats.healShield);
        events.push({ type: 'shield', now: this.shield });
      }
    } else if (id === 'potion_regen') {
      if (this.res >= this.stats.resMax && this.boost > 0) return { ok: false, events };
      this.consumables[id]--;
      this.res = this.stats.resMax;
      this.boost = GAMEPLAY.regenBoostTurns;
      events.push({ type: 'resource', now: this.res, max: this.stats.resMax });
      events.push({ type: 'boost', turns: this.boost });
    } else {
      if (!this.lineageDef.artifacts) return { ok: false, events };
      const targets = this.enemyCells();
      if (!targets.length) return { ok: false, events };
      this.consumables[id]--;
      this.vacated = [];
      const dmg = this.artifactDamage();
      events.push({ type: 'artifact', cells: targets });
      for (const t of targets) this.damageEnemy(t, dmg, false, events);
      this.refill(events);
    }
    return { ok: true, events };
  }

  /** Зелье лечит долю максимального здоровья — иначе на десятом этаже оно бесполезно. */
  healPotionAmount(): number {
    return Math.max(1, Math.round(this.stats.maxHp * GAMEPLAY.healPotionPct * (1 + this.stats.potionPct)));
  }

  artifactDamage(): number {
    return Math.max(1, Math.round(this.stats.damage * 2.5 * (1 + this.stats.artifactMul)));
  }

  /** Что уходит в следующую комнату забега. */
  carryOut(): RunCarryStats {
    return { hp: this.hp, res: this.res, revived: this.revived, selfRevived: this.selfRevived };
  }

  revive(): GameEvent[] {
    this.over = null;
    this.revived = true;
    this.hp = Math.max(1, Math.ceil(this.stats.maxHp * GAMEPLAY.reviveHpRatio));
    return [{ type: 'heal', amount: this.hp, hp: this.hp, source: 'revive' }, ...this.breakFree()];
  }

  /** Талант «Возвращение» / «Последний шанс»: раз за забег встаём сами. */
  autoRevive(): GameEvent[] | null {
    if (this.reviveLeft <= 0 || this.stats.reviveHp <= 0) return null;
    this.reviveLeft--;
    this.selfRevived = true;
    this.over = null;
    this.hp = Math.max(1, Math.round(this.stats.maxHp * this.stats.reviveHp));
    return [{ type: 'heal', amount: this.hp, hp: this.hp, source: 'revive' }, ...this.breakFree()];
  }

  /**
   * Поднявшись после растерзания, герой получает полную шкалу: иначе он встаёт в то же
   * окружение без единого хода, и «Растерзание» срабатывает второй раз в том же кадре.
   */
  private breakFree(): GameEvent[] {
    if (this.hasMove()) return [];
    const events: GameEvent[] = [];
    this.res = this.stats.resMax;
    events.push({ type: 'resource', now: this.res, max: this.stats.resMax });
    return events;
  }

  // ------------------------------------------------------------------ подбор карт

  private collect(cell: number, events: GameEvent[]): void {
    const from = this.playerCell;
    // мог ударить — но пошёл мимо: если новая клетка у кого-то под рукой, тот бьёт
    this.exposed = this.canStrike();
    const exit = this.cards[cell]?.kind === 'exit';
    events.push({ type: 'move', from, to: cell });
    this.playerCell = cell;
    this.vacated.push(from);
    if (exit) {
      this.cards[cell] = null;
      this.finishRoom(events);
      return;
    }
    this.take(cell, events);
    // «Шаг сквозь эфир»: передышка за любой шаг на клетку без врага — пустую или с добычей
    if (this.stats.stepHeal > 0) {
      this.heal(Math.max(1, Math.round(this.stats.maxHp * this.stats.stepHeal)), 'perk', events);
    }
  }

  private take(cell: number, events: GameEvent[]): void {
    const card = this.cards[cell];
    if (!card) return;
    this.cards[cell] = null;
    events.push({ type: 'remove', cell, uid: card.uid });
    if (card.kind === 'gold') {
      this.totals.gold += card.value;
      events.push({ type: 'gold', cell, amount: card.value });
    } else if (card.kind === 'chest') {
      this.openChest(cell, events, card.defId === 'chest_empty');
    } else if (card.kind === 'potion_heal' || card.kind === 'potion_regen' || card.kind === 'artifact') {
      this.consumables[card.kind]++;
      events.push({ type: 'pickup', cell, item: card.kind, count: this.consumables[card.kind] });
    }
  }

  private rollConsumable(): ConsumableId {
    const r = this.rng.next();
    if (this.lineageDef.artifacts) return r < 0.4 ? 'potion_heal' : r < 0.7 ? 'potion_regen' : 'artifact';
    return r < 0.55 ? 'potion_heal' : 'potion_regen';
  }

  private openChest(cell: number, events: GameEvent[], empty = false): void {
    const { rng, stats: s } = this;
    const loot: Loot[] = [];
    // пустой сундук снаружи не отличить: открыл — а там паутина
    if (empty) {
      events.push({ type: 'chest', cell, loot, empty: true });
      return;
    }
    const gold = this.goldAmount(10, 24);
    loot.push({ kind: 'gold', amount: gold });
    this.totals.gold += gold;
    events.push({ type: 'gold', cell, amount: gold });
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

  // ------------------------------------------------------------------ конец хода

  private refill(events: GameEvent[]): void {
    const cells = [...new Set(this.vacated)].sort((a, b) => a - b);
    this.vacated = [];
    for (const c of cells) {
      if (c === this.playerCell || this.cards[c]) continue;
      this.replenish();
      const card = this.pool.shift();
      if (!card) continue;
      this.cards[c] = card;
      events.push({ type: 'spawn', cell: c, card });
    }
  }


  /**
   * Комната закончена: герой шагнул на карту перехода. Всё, что осталось на поле, остаётся
   * на поле — в этом и выбор: уйти сейчас или рискнуть и добрать добычу, пока лезут новые враги.
   */
  private finishRoom(events: GameEvent[]): void {
    if (this.over) return;
    this.over = 'win';
    events.push({ type: 'win' });
  }

  /** Эффекты со временем: горение, яд, клеймо, призраки, лечение врагов. */
  private tickStatuses(events: GameEvent[]): void {
    for (let i = 0; i < 9 && !this.over; i++) {
      const c = this.cards[i];
      if (!c || c.kind !== 'enemy') continue;
      if (c.burn > 0 && c.burnNew) c.burnNew = false;
      else if (c.burn > 0) {
        c.burn--;
        events.push({ type: 'status', cell: i, uid: c.uid, kind: 'burn', turns: c.burn });
        if (this.damageEnemy(i, c.burnDmg, false, events)) continue;
      }
      const alive = this.cards[i];
      if (!alive || alive.kind !== 'enemy') continue;
      if (alive.poison > 0) {
        alive.poison--;
        events.push({ type: 'status', cell: i, uid: alive.uid, kind: 'poison', turns: alive.poison });
        if (this.damageEnemy(i, alive.poisonDmg, false, events)) continue;
      }
      const still = this.cards[i];
      if (!still || still.kind !== 'enemy') continue;
      if (still.mark > 0) {
        still.mark--;
        events.push({ type: 'status', cell: i, uid: still.uid, kind: 'mark', turns: still.mark });
        if (still.mark === 0) {
          this.reapMarked(i, events);
          continue;
        }
      }
      const last = this.cards[i];
      if (last?.kind === 'enemy') {
        const def = ENEMIES[last.defId];
        if (def?.regen && last.hp < last.maxHp) {
          last.hp = Math.min(last.maxHp, last.hp + Math.max(1, Math.round(last.maxHp * def.regen)));
          events.push({ type: 'hit', cell: i, amount: 0, crit: false, target: 'enemy', hp: last.hp });
        }
      }
    }
    // призраки бьют соседей крестом и тают
    this.tickGhosts(events);
    // яд на герое
    if (this.playerPoison > 0 && !this.over) {
      this.playerPoison--;
      this.hurtPlayer(this.playerPoisonDmg, events, -1, true);
    }
  }

  /**
   * Может ли герой вообще хоть что-то сделать. Считаем и способности, и расходники:
   * зелье восстановления вернёт ману, артефакт мага разнесёт окружение.
   */
  private hasMove(): boolean {
    for (let c = 0; c < 9; c++) if (this.actionFor(c).kind !== 'none') return true;
    const usable = (p: PerkDef): boolean => {
      if (p.target === 'self' || p.target === undefined) return true;
      for (let c = 0; c < 9; c++) if (this.perkTargetOk(p, c)) return true;
      return false;
    };
    for (const p of this.stats.abilities) if (this.perkReady(p).ok && usable(p)) return true;
    // расходники: зелье восстановления оживит способность, артефакт расчистит поле
    const canRefill = this.consumables.potion_regen > 0 && this.stats.abilities.some(usable);
    if (canRefill) return true;
    if (this.consumables.artifact > 0 && this.lineageDef.artifacts) return true;
    return false;
  }

  /**
   * Может ли герой прямо сейчас ударить врага: рукой, выстрелом, ударом в спину,
   * а маг — молнией, если на неё хватает маны и она не на перезарядке.
   */
  private canStrike(): boolean {
    for (let c = 0; c < 9; c++) {
      if (this.cards[c]?.kind !== 'enemy') continue;
      const k = this.actionFor(c).kind;
      if (k === 'melee' || k === 'ranged') return true;
    }
    for (const p of this.stats.abilities) {
      if (p.ability !== 'lightning' || !this.perkReady(p).ok) continue;
      for (let c = 0; c < 9; c++) if (this.perkTargetOk(p, c)) return true;
    }
    return false;
  }

  /** Зажат ли герой: жив, бой идёт, а хода нет ни одного. */
  cornered(): boolean {
    return !this.over && !this.armed && !this.hasMove();
  }

  /**
   * «Растерзание». Ходить нечем — и карты вокруг больше не ждут: бьют по очереди,
   * пока герой не падёт. Это не тупик, а расплата за пустую шкалу в окружении.
   */
  private swarm(events: GameEvent[]): void {
    const order = (): number[] => {
      const cells: number[] = [];
      for (let c = 0; c < 9; c++) if (this.cards[c]?.kind === 'enemy') cells.push(c);
      return cells.sort((a, b) => dist(a, this.playerCell) - dist(b, this.playerCell) || a - b);
    };
    const cells = order();
    if (!cells.length) return;
    events.push({ type: 'swarm', cells });
    for (let sweep = 0; sweep < 8 && this.hp > 0; sweep++) {
      for (const c of order()) {
        if (this.hp <= 0) break;
        const card = this.cards[c];
        if (!card || card.kind !== 'enemy') continue;
        events.push({ type: 'attack', from: c, to: this.playerCell, ranged: dist(c, this.playerCell) > 1, by: 'enemy' });
        // Обычная защита работает, но уклонений и парирований тут нет: деваться некуда.
        const dmg = Math.max(1, this.strikeDamage(card.atk));
        this.hp = Math.max(0, this.hp - dmg);
        this.totals.damageTaken += dmg;
        events.push({ type: 'hit', cell: this.playerCell, amount: dmg, crit: false, target: 'player', hp: this.hp });
      }
    }
    this.hp = 0;
    this.over = 'lose';
    events.push({ type: 'lose' });
  }

  private finishTurn(events: GameEvent[]): void {
    this.acting = false;
    this.armorWorn = false;
    this.retaliate(events);
    if (this.over) return;
    this.tickStatuses(events);
    this.refill(events);
    if (this.over) return;
    this.totals.turns++;
    if (this.killsRoom === this.lastKills) this.killStreak = 0;
    this.lastKills = this.killsRoom;
    if (this.defTurn > 0) this.defTurn--;
    if (this.noCounter > 0) this.noCounter--;
    if (this.reaping > 0) this.reaping--;
    if (this.madness > 0) {
      this.madness--;
      if (this.madness === 0) {
        const loss = Math.max(1, Math.round(this.hp * 0.2));
        this.hp = Math.max(1, this.hp - loss);
        events.push({ type: 'hit', cell: this.playerCell, amount: loss, crit: false, target: 'player', hp: this.hp });
      }
    }
    for (const id of Object.keys(this.cooldowns)) {
      if (--this.cooldowns[id] <= 0) delete this.cooldowns[id];
    }
    const mul = this.boost > 0 ? GAMEPLAY.regenBoostMul : 1;
    if (this.boost > 0) this.boost--;
    if (this.res < this.stats.resMax) this.gain(this.stats.regen * mul, events);
    // Шкала уже восполнилась — только теперь решаем, что ходить нечем.
    if (this.cornered()) this.swarm(events);
  }

  private lastKills = 0;
  /** Доспех уже снашивался на этом ходу. */
  private armorWorn = false;
  /** Оставшиеся ходы перезарядки по id способности. */
  private cooldowns: Record<string, number> = {};

  resourceMax(): number {
    return this.stats.resMax;
  }

  // ------------------------------------------------------------------ откат времени

  private takeSnapshot(): void {
    if (!this.stats.perks.includes('magister_p3')) return;
    this.snapshot = {
      cards: JSON.stringify(this.cards),
      playerCell: this.playerCell,
      hp: this.hp,
      shield: this.shield,
      res: this.res,
      pool: JSON.stringify(this.pool),
      totals: JSON.stringify(this.totals),
      consumables: JSON.stringify(this.consumables),
      flags: JSON.stringify([this.killsRoom, this.killStreak, this.noCounter, this.madness, this.reaping, this.warCry]),
    };
  }

  private restoreSnapshot(): void {
    const s = this.snapshot;
    if (!s) return;
    this.cards = JSON.parse(s.cards) as Array<Card | null>;
    this.playerCell = s.playerCell;
    this.hp = s.hp;
    this.shield = s.shield;
    this.res = s.res;
    this.pool = JSON.parse(s.pool) as Card[];
    this.totals = JSON.parse(s.totals) as Run['totals'];
    this.consumables = JSON.parse(s.consumables) as Record<ConsumableId, number>;
    const f = JSON.parse(s.flags) as number[];
    [this.killsRoom, this.killStreak, this.noCounter, this.madness, this.reaping, this.warCry] = f;
    this.snapshot = null;
    this.over = null;
  }
}
