import {
  type ConsumableId,
  ELITE,
  type EnemyDef,
  type EquipmentSave,
  FULL_BAR,
  isHolyTarget,
  ITEM_BY_ID,
  type LineageDef,
  PERK_BY_ID,
  type PerkDef,
  type RoomDef,
  type RoomModifier,
  type RoomPlan,
} from '../../catalog';
import { CellIndex, Gold, Percent, Ratio, type Rng, Souls } from '../../shared';
import { CombatBalance, ConsumableBalance, LootBalance } from '../balance';
import type { Card } from '../card/Card';
import type { CardFactory } from '../card/card-factory/CardFactory';
import { Grid } from '../engine/grid/Grid';
import type { IEngine } from '../engine/interfaces/IEngine';
import type { GameEvent, Loot } from '../events';
import type { PlayerStats } from '../player';
import type { Action } from './interfaces/Action';
import type { BattleCarryStats } from './interfaces/BattleCarryStats';
import type { BattleDeps } from './interfaces/BattleDeps';
import type { BattleInit } from './interfaces/BattleInit';
import type { BattleSnapshot } from './interfaces/BattleSnapshot';
import type { BattleTotals } from './interfaces/BattleTotals';
import type { IBattleSession } from './interfaces/IBattleSession';
import type { PerkReadiness } from './interfaces/PerkReadiness';
import type { TurnResult } from './interfaces/TurnResult';

/**
 * Правила боя в одной комнате: ход героя, способности, ответ врагов, статусы, добыча.
 *
 * Правила не трогают поле напрямую — карты ставит, снимает и двигает движок (`IEngine`),
 * а создаёт фабрика карт (`CardFactory`). Оба приходят готовыми от `RoomBattleFactory`.
 * Наружу правила открывают только действия игрока и чтение состояния (`IBattleSession`).
 */
export class RoomBattle implements IBattleSession {
  /** Потолок «защиты после способности»: ослабляет удар, но никогда не гасит его целиком. */
  private static readonly PERK_GUARD_CAP = 0.5;
  /** Ниже этой цены талант-скидка способность не удешевляет. */
  private static readonly PERK_COST_FLOOR = 2;

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
  totals: BattleTotals = {
    gold: Gold.of(0),
    souls: Souls.of(0),
    kills: 0,
    damageTaken: 0,
    turns: 0,
  };
  readonly room: RoomDef;
  readonly plan: RoomPlan;
  readonly mod: RoomModifier;
  readonly lineageDef: LineageDef;

  /** Заряженная способность: следующее касание поля применит её. */
  armed: PerkDef | null = null;
  /** Первая из двух карт для «Перестановки». */
  private swapFirst: CellIndex | null = null;
  /** Уже потраченные «один раз за комнату» способности. */
  private usedOnce = new Set<string>();

  // ---- временные состояния героя
  private noCounter = 0; // дымовая завеса
  private madness = 0; // безумие берсерка
  private reaping = 0; // жнец
  private killStreak = 0; // резня
  private killsRoom = 0;
  private defTurn = 0; // «+защита на ход» после убийства
  private perkGuard = 0; // «после перка следующий удар слабее»
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
  private hitCounter = 0; // для «Суда» (каждый третий удар)
  private playerPoison = 0;
  private playerPoisonDmg = 0;
  private warCry = 0; // накопленное ослабление атаки врагов
  private snapshot: BattleSnapshot | null = null;

  private readonly rng: Rng;
  private readonly engine: IEngine;
  private readonly factory: CardFactory;
  private readonly enemies: Readonly<Record<string, EnemyDef>>;

  constructor(init: BattleInit, deps: BattleDeps) {
    this.room = init.room;
    this.rng = init.rng;
    this.engine = deps.engine;
    this.factory = deps.cards;
    this.enemies = deps.enemies;
    this.lineageDef = deps.lineage;
    this.stats = { ...init.stats };
    this.weapon = init.weapon ? { ...init.weapon } : null;
    this.armor = init.armor ? { ...init.armor } : null;
    this.consumables = { ...init.consumables };
    this.plan = deps.plan;
    this.mod = this.plan.mod;
    const carry = init.carry;
    this.hp = carry
      ? Math.max(1, Math.min(this.stats.maxHp, Math.round(carry.hp)))
      : this.stats.maxHp;
    // в забег герой выходит отдохнувшим — с полной шкалой; дальше её несёт из комнаты в комнату
    this.res = carry ? Math.max(0, Math.min(this.stats.resMax, carry.res)) : this.stats.resMax;
    this.revived = carry?.revived ?? false;
    this.selfRevived = carry?.selfRevived ?? false;
    this.cheatLeft = this.stats.cheatDeath;
    this.reviveLeft = this.stats.reviveHp > 0 && !this.selfRevived ? 1 : 0;
    this.roomGuardLeft = this.stats.roomGuard > 0 ? 1 : 0;
    this.roomCritLeft = this.stats.roomCrit ? 1 : 0;
    this.freePerkLeft = this.stats.freePerk ? 1 : 0;
    const deck = this.factory.createDeck();
    this.engine.deck.push(...deck.cards);
    this.quota = deck.quota;
    this.bossLeft = deck.boss;
  }

  get lineage() {
    return this.stats.lineage;
  }

  /** Поле боя — у движка; правила его только читают, а меняют командами движка. */
  get cards(): Array<Card | null> {
    return this.engine.board;
  }

  /** Колода — тоже у движка. */
  get pool(): Card[] {
    return this.engine.deck;
  }

  get playerCell(): CellIndex {
    return this.engine.playerCell;
  }

  /** Только для тестов и отладки: поставить героя на клетку без хода. */
  set playerCell(cell: CellIndex) {
    this.engine.playerCell = cell;
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

  private emit(ev: GameEvent): void {
    this.engine.emit(ev);
  }

  // ------------------------------------------------------------------ подготовка

  /** Сколько врагов нужно уложить в этой комнате. */
  private quota = 0;
  /** Босс комнаты ещё жив — без него выход не откроется. */
  private bossLeft = false;
  /** Карта перехода уже подмешана. */
  private exitQueued = false;

  /**
   * Норма выполнена — в ближайшие карты колоды замешивается переход на следующий этаж.
   * Комната закончится только когда герой сам шагнёт на эту карту.
   */
  private queueExit(): void {
    if (this.exitQueued || this.bossLeft || this.killsRoom < this.quota) return;
    this.exitQueued = true;
    const deck = this.engine.deck;
    deck.splice(this.rng.int(0, Math.min(3, deck.length)), 0, this.factory.createExit());
  }

  start(): GameEvent[] {
    this.shield = Math.round(
      this.stats.maxHp * (this.stats.startShieldPct + (this.mod.shieldPct ?? 0)),
    );
    for (const i of Grid.CELLS) {
      if (i === this.playerCell) continue;
      const card = this.engine.draw();
      if (!card) break;
      this.engine.put(i, card);
    }
    if (this.shield > 0) this.emit({ type: 'shield', now: this.shield });
    return this.engine.flush();
  }

  // ------------------------------------------------------------------ действия

  /** Что произойдёт при нажатии на клетку (для подсветки и подсказок). */
  actionFor(cell: CellIndex): Action {
    if (this.over || cell === this.playerCell) return { kind: 'none', reason: 'invalid' };
    if (this.armed)
      return this.perkTargetOk(this.armed, cell)
        ? { kind: 'perk' }
        : { kind: 'none', reason: 'range' };
    const card = this.cards[cell];
    const d = Grid.dist(this.playerCell, cell);
    // По пустой соседней клетке теперь тоже можно ходить — это полноценный ход.
    if (!card) return d === 1 ? { kind: 'move' } : { kind: 'none', reason: 'invalid' };
    if (d === 1) {
      if (card.kind !== 'enemy') return { kind: 'move' };
      // Маг вообще не бьёт рукой: только способностью по кнопке.
      return this.stats.attack.melee ? { kind: 'melee' } : { kind: 'none', reason: 'melee' };
    }
    if (card.kind !== 'enemy') return { kind: 'none', reason: 'range' };
    const s = this.stats;
    if (!s.attack.reaches(this.playerCell, cell, s.passives))
      return { kind: 'none', reason: 'range' };
    if (this.res < s.rangedCost) return { kind: 'none', reason: 'resource' };
    return { kind: 'ranged' };
  }

  /** Базовое действие линейки — удар в спину: всегда крит, а под «Жнецом» ещё и казнь. */
  private get backstabs(): boolean {
    return this.stats.attack.guaranteedCrit;
  }

  /** Убьёт ли ближайшая атака врага — для подсветки карточки. */
  wouldKill(cell: CellIndex): boolean {
    const card = this.cards[cell];
    if (!card || card.kind !== 'enemy') return false;
    const a = this.actionFor(cell);
    if (a.kind !== 'melee' && a.kind !== 'ranged') return false;
    let dmg = this.currentDamage();
    if (a.kind === 'ranged') {
      dmg = Math.round(dmg * this.stats.attack.mul);
      if (this.backstabs || this.reaping > 0)
        dmg = Math.max(dmg + 1, Math.round(dmg * this.stats.critMin));
    }
    dmg = this.contextDamage(dmg, card);
    return this.afterArmor(dmg, card) >= card.hp;
  }

  tap(cell: CellIndex): TurnResult {
    if (this.armed) return this.aimPerk(cell);
    const action = this.actionFor(cell);
    if (action.kind === 'none')
      return { ok: false, reason: action.reason, events: this.engine.flush() };
    this.beginTurn();
    if (action.kind === 'melee') this.melee(cell);
    else if (action.kind === 'ranged') this.basicRanged(cell);
    else this.collect(cell);
    this.finishTurn();
    return { ok: true, events: this.engine.flush() };
  }

  // ------------------------------------------------------------------ способности

  /** Доступна ли способность прямо сейчас. */
  perkReady(p: PerkDef): PerkReadiness {
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
      case 'madness':
        return this.madness > 0;
      case 'reaper':
        return this.reaping > 0;
      case 'smoke_screen':
        return this.noCounter > 0;
      default:
        return false;
    }
  }

  /** Цена способности с учётом «первый перк в комнате бесплатен» и «Жнеца». */
  perkCostOf(p: PerkDef): number {
    if (this.freePerkLeft > 0) return 0;
    if (p.cost === FULL_BAR) return this.stats.resMax;
    // скидка не опускает цену ниже двух: иначе молния за единицу окупалась бы
    // восстановлением каждого хода, и мана перестала бы что-то значить
    const base = p.cost ?? 0;
    return Math.max(Math.min(base, RoomBattle.PERK_COST_FLOOR), base - this.stats.perkCostDown);
  }

  /**
   * Нажатие на кнопку способности: несфокусированные применяются сразу,
   * остальные «заряжаются» — следующее касание поля наводит их на цель.
   */
  usePerk(id: string): TurnResult {
    const p = PERK_BY_ID[id];
    if (!p || p.passive || p.basic)
      return { ok: false, reason: 'invalid', events: this.engine.flush() };
    if (!this.stats.perks.includes(id))
      return { ok: false, reason: 'invalid', events: this.engine.flush() };
    if (this.armed?.id === id) {
      this.armed = null;
      this.swapFirst = null;
      this.emit({ type: 'armed', id: null });
      return { ok: true, events: this.engine.flush() };
    }
    const ready = this.perkReady(p);
    if (!ready.ok) return { ok: false, reason: ready.reason, events: this.engine.flush() };
    if (p.target === 'self') {
      this.beginTurn();
      this.payPerk(p);
      this.emit({ type: 'perk', id: p.id, ability: p.ability });
      this.runAbility(p, Grid.NO_CELL);
      this.afterPerk();
      this.finishTurn();
      return { ok: true, events: this.engine.flush() };
    }
    this.armed = p;
    this.swapFirst = null;
    this.emit({ type: 'armed', id: p.id });
    return { ok: true, events: this.engine.flush() };
  }

  cancelPerk(): GameEvent[] {
    if (!this.armed) return [];
    this.armed = null;
    this.swapFirst = null;
    return [{ type: 'armed', id: null }];
  }

  /** Подходит ли клетка под заряженную способность. */
  perkTargetOk(p: PerkDef, cell: CellIndex): boolean {
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
      case 'enemy':
        return card.kind === 'enemy';
      case 'adjacent':
        return card.kind === 'enemy' && Grid.neighbors(this.playerCell).includes(cell);
      // выстрел идёт ЧЕРЕЗ карту: вплотную из него не бьют
      case 'line':
        return (
          card.kind === 'enemy' &&
          Grid.sameLine(this.playerCell, cell) &&
          Grid.dist(this.playerCell, cell) > 1
        );
      case 'card':
        return card.kind !== 'enemy';
      case 'any_card':
        return true;
      case 'two':
        return true;
      default:
        return false;
    }
  }

  private aimPerk(cell: CellIndex): TurnResult {
    const p = this.armed!;
    if (!this.perkTargetOk(p, cell))
      return { ok: false, reason: 'range', events: this.engine.flush() };
    if (p.target === 'two' && this.swapFirst === null) {
      this.swapFirst = cell;
      this.emit({ type: 'armed', id: p.id });
      return { ok: true, events: this.engine.flush() };
    }
    this.armed = null;
    this.beginTurn();
    this.payPerk(p);
    this.emit({ type: 'perk', id: p.id, ability: p.ability });
    this.runAbility(p, cell);
    this.swapFirst = null;
    this.afterPerk();
    this.finishTurn();
    return { ok: true, events: this.engine.flush() };
  }

  private payPerk(p: PerkDef): void {
    if (p.once) this.usedOnce.add(p.id);
    // +1: перезарядка тикает в конце того же хода, поэтому «кулдаун 1» = пропуск одного хода
    if (p.cooldown) this.cooldowns[p.id] = p.cooldown + 1;
    if (p.goldCost !== undefined) {
      const pay = Math.max(5, Math.round(this.totals.gold * p.goldCost));
      this.totals.gold = Gold.of(Math.max(0, this.totals.gold - pay));
      this.emit({ type: 'spend', amount: pay });
      return;
    }
    const cost = this.perkCostOf(p);
    if (this.freePerkLeft > 0) this.freePerkLeft--;
    if (cost > 0) this.spend(cost);
  }

  /**
   * «Кровавая пелена», «Дымовая шашка», «Абсолютная защита»: после способности следующий удар слабее.
   * Не больше чем вдвое: раньше «Абсолютная защита» гасила удар целиком, и маг, который кастует
   * каждый ход, становился неуязвим.
   */
  private afterPerk(): void {
    const s = this.stats;
    if (s.perkDef > 0)
      this.perkGuard = Math.max(this.perkGuard, Math.min(RoomBattle.PERK_GUARD_CAP, s.perkDef));
    if (s.abilityShield > 0 && !this.over) {
      this.shield += Math.max(1, Math.round(s.maxHp * s.abilityShield));
      this.emit({ type: 'shield', now: this.shield });
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
    const def = this.enemies[enemy.defId];
    let mul = 1;
    if (s.fullHpDmg > 0 && enemy.hp >= enemy.maxHp) mul += s.fullHpDmg;
    if (s.lowHpDmg > 0 && enemy.hp <= enemy.maxHp * 0.3) mul += s.lowHpDmg;
    if (s.bossDmg > 0 && def?.boss) mul += s.bossDmg;
    return Math.max(1, Math.round(dmg * mul));
  }

  /** Броня врага и «Приговор». */
  private afterArmor(dmg: number, enemy: Card): number {
    const def = this.enemies[enemy.defId];
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
    if (this.inAbility && s.abilityCrit > 0 && this.rng.chance(Percent.toRatio(s.abilityCrit)))
      return true;
    if (s.everyThird) {
      this.hitCounter++;
      if (this.hitCounter % 3 === 0) return true;
    }
    return this.rng.chance(Percent.toRatio(s.crit));
  }

  // ------------------------------------------------------------------ удары героя

  private spend(cost: number): void {
    this.res = Math.max(0, this.res - cost);
    this.emit({ type: 'resource', now: this.res, max: this.stats.resMax });
  }

  private gain(amount: number): void {
    if (amount <= 0) return;
    this.res = Math.min(this.stats.resMax, this.res + amount);
    this.emit({ type: 'resource', now: this.res, max: this.stats.resMax });
  }

  private wearWeapon(): void {
    const w = this.weapon;
    if (!w || w.durability <= 0) return;
    w.durability--;
    if (w.durability <= 0) {
      this.stats.damage = Math.max(1, this.stats.damage - ITEM_BY_ID[w.id].damage);
      this.emit({ type: 'break', slot: 'weapon', id: w.id });
    }
  }

  /**
   * Доспех снашивается не больше одного раза за ход. Ход врагов бьёт сразу всеми соседями,
   * и снос за каждый удар сжигал бы броню втрое быстрее, чем на неё зарабатывают.
   */
  private wearArmor(): void {
    const a = this.armor;
    if (!a || a.durability <= 0 || this.armorWorn) return;
    this.armorWorn = true;
    a.durability--;
    if (a.durability <= 0) {
      const it = ITEM_BY_ID[a.id];
      this.stats.defense = Math.max(0, this.stats.defense - it.defense);
      this.stats.maxHp = Math.max(1, this.stats.maxHp - it.health);
      this.hp = Math.min(this.hp, this.stats.maxHp);
      this.emit({ type: 'break', slot: 'armor', id: a.id });
    }
  }

  private melee(cell: CellIndex): void {
    const enemy = this.cards[cell]!;
    const s = this.stats;
    let dmg = this.currentDamage();
    if (this.counterReady) {
      dmg = Math.round(dmg * (1 + s.counterBuff));
      this.counterReady = false;
    }
    const crit = this.rollCrit(enemy, false);
    if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * this.rollCritMul()));
    this.emit({ type: 'attack', from: this.playerCell, to: cell, ranged: false, by: 'player' });
    this.wearWeapon();
    let killed = this.strike(cell, dmg, crit);
    // «Двойной удар» / «Град стрел»
    if (!killed && s.doubleStrike > 0 && this.rng.chance(Percent.toRatio(s.doubleStrike))) {
      killed = this.strike(cell, dmg, this.rollCrit(this.cards[cell], false));
    }
    if (this.madness > 0) this.splashNeighbors(cell, Math.round(dmg * 0.6));
    // ответный удар больше не привязан к конкретной цели — его даёт общий ход врагов
    if (killed) this.stepInto(cell);
  }

  /** Базовое действие линейки: выстрел через карту, удар молнии, удар в спину. */
  private basicRanged(cell: CellIndex): void {
    const s = this.stats;
    const free = this.reaping > 0 && this.backstabs;
    if (!free) this.spend(s.rangedCost);
    const forceCrit = this.backstabs || this.reaping > 0;
    let dmg = Math.round(this.currentDamage() * s.attack.mul);
    const crit = forceCrit || this.rollCrit(this.cards[cell], true);
    if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * this.rollCritMul()));
    this.emit({
      type: 'attack',
      from: this.playerCell,
      to: cell,
      ranged: true,
      by: 'player',
      style: s.attack.style,
    });
    this.wearWeapon();
    // «Жнец»: удар в спину убивает любого не-босса
    const target = this.cards[cell];
    if (this.reaping > 0 && this.backstabs && target && !this.enemies[target.defId]?.boss) {
      this.reaping++;
      this.killEnemy(cell);
      return;
    }
    const killed = this.strike(cell, dmg, crit);
    this.splitStrike(cell, dmg);
    if (crit && s.passives.has('hunter_thrill')) this.gain(s.rangedCost);
    if (killed) {
      if (s.passives.has('cold_blood')) this.gain(3);
      if (s.passives.has('shadow_dance')) this.shadowChain();
    } else if (target && s.passives.has('lethal_dose')) {
      const boss = !!this.enemies[target.defId]?.boss;
      this.applyPoison(cell, Math.max(1, Math.round(target.maxHp * (boss ? 0.05 : 0.1))), 3);
    }
  }

  /** «Раздвоение молнии» / «Двойной наконечник»: основной удар с шансом цепляет ещё одного врага. */
  private splitStrike(cell: CellIndex, dmg: number): void {
    const { splitChance, splitDmg } = this.stats;
    if (splitChance <= 0 || splitDmg <= 0) return;
    if (!this.rng.chance(splitChance)) return;
    const extra = this.enemyCells().filter((c) => c !== cell);
    if (!extra.length) return;
    const c2 = extra[this.rng.int(0, extra.length - 1)];
    this.emit({ type: 'fx', cells: [c2], style: 'chain' });
    this.damageEnemy(c2, Math.max(1, Math.round(dmg * splitDmg)), false);
  }

  /** «Танец теней»: убийство ударом в спину переносит героя к слабейшему врагу, цепь до трёх ударов. */
  private shadowChain(): void {
    for (let i = 0; i < 2; i++) {
      let best = Grid.NO_CELL;
      let bestHp = Infinity;
      this.cards.forEach((c, idx) => {
        if (c?.kind === 'enemy' && c.hp < bestHp) {
          bestHp = c.hp;
          best = CellIndex.of(idx);
        }
      });
      if (best < 0) return;
      let dmg = Math.round(this.currentDamage() * this.stats.attack.mul);
      dmg = Math.max(dmg + 1, Math.round(dmg * this.rollCritMul()));
      this.emit({
        type: 'attack',
        from: this.playerCell,
        to: best,
        ranged: true,
        by: 'player',
        style: 'backstab',
      });
      if (!this.strike(best, dmg, true)) return;
    }
  }

  /** Один удар по врагу. Возвращает true, если враг погиб. */
  private strike(cell: CellIndex, raw: number, crit: boolean): boolean {
    const enemy = this.cards[cell];
    if (!enemy || enemy.kind !== 'enemy') return false;
    if (this.acting) this.engaged.add(enemy.uid);
    const def = this.enemies[enemy.defId];
    if (def?.evade && this.rng.chance(Percent.toRatio(def.evade))) {
      this.emit({ type: 'miss', cell, kind: 'evade' });
      return false;
    }
    enemy.hits++;
    const dmg = this.afterArmor(this.contextDamage(raw, enemy), enemy);
    if (this.inAbility) this.abilityRiders(cell, enemy, dmg);
    return this.damageEnemy(cell, dmg, crit, true);
  }

  /**
   * Таланты-синергии: они меняют уже полученные способности, поэтому «Живое пламя» пироманта
   * заставляет поджигать даже цепную молнию, взятую ещё магом.
   */
  private abilityRiders(cell: CellIndex, enemy: Card, dmg: number): void {
    const s = this.stats;
    if (s.abilityIgnite > 0 && this.rng.chance(Percent.toRatio(s.abilityIgnite))) {
      this.applyBurn(cell, Math.max(1, Math.round(dmg * 0.3)), 3);
    }
    if (s.abilityStun > 0 && this.rng.chance(Percent.toRatio(s.abilityStun))) this.applyStun(cell);
    if (s.abilityPoison > 0) {
      this.applyPoison(cell, Math.max(1, Math.round(enemy.maxHp * s.abilityPoison)), 3);
    }
    if (s.abilityVuln > 0 && enemy.vuln < s.abilityVuln) {
      enemy.vuln = s.abilityVuln;
      this.emit({ type: 'status', cell, uid: enemy.uid, kind: 'vuln', turns: 99 });
    }
    if (s.abilityLifesteal > 0)
      this.heal(Math.max(1, Math.round(dmg * s.abilityLifesteal)), 'lifesteal');
    if (s.abilitySplash > 0) {
      const share = Math.max(1, Math.round(dmg * s.abilitySplash));
      for (const n of Grid.neighbors(cell)) {
        if (this.cards[n]?.kind === 'enemy') this.damageEnemy(n, share, false);
      }
    }
  }

  /**
   * Наносит врагу уже посчитанный урон. `direct` — удар героя (работают вампиризм, шипы врага, ярость врага).
   * Возвращает true, если враг погиб.
   */
  private damageEnemy(cell: CellIndex, dmg: number, crit: boolean, direct = false): boolean {
    const enemy = this.cards[cell];
    if (!enemy || enemy.kind !== 'enemy' || this.over) return false;
    if (this.acting) this.engaged.add(enemy.uid);
    const s = this.stats;
    const def = this.enemies[enemy.defId];
    const dealt = Math.min(dmg, enemy.hp);
    enemy.hp -= dmg;
    const executed =
      enemy.hp > 0 && s.execute > 0 && !def?.boss && enemy.hp / enemy.maxHp <= s.execute;
    this.emit({
      type: 'hit',
      cell,
      amount: dealt,
      crit,
      target: 'enemy',
      hp: Math.max(0, executed ? 0 : enemy.hp),
    });

    if (direct) {
      if (s.lifesteal > 0 && dealt > 0)
        this.heal(Math.max(1, Math.round(dealt * s.lifesteal)), 'lifesteal');
      if (s.ignite > 0) this.applyBurn(cell, this.spellDamage(s.ignite), 3);
      if (def?.enrage && enemy.hp > 0) {
        enemy.atk = Math.round(enemy.atk + enemy.baseAtk * def.enrage);
      }
      if (def?.thorns && enemy.hp > 0)
        this.hurtPlayer(Math.max(1, Math.round(dealt * def.thorns)), cell, true);
    }
    // кукла вуду: половина урона расходится по остальным врагам
    if (enemy.link && dealt > 0) {
      const share = Math.max(1, Math.round(dealt * 0.5));
      for (const i of Grid.CELLS) {
        const other = this.cards[i];
        if (i !== cell && other?.kind === 'enemy') this.damageEnemy(i, share, false);
      }
    }
    if (enemy.hp <= 0 || executed) {
      this.killEnemy(cell);
      return true;
    }
    return false;
  }

  private killEnemy(cell: CellIndex): void {
    const enemy = this.cards[cell];
    if (!enemy || enemy.kind !== 'enemy') return;
    const def = this.enemies[enemy.defId];
    const s = this.stats;
    this.emit({ type: 'kill', cell, uid: enemy.uid });
    this.engine.clear(cell);
    // «Призрачные слуги»: на месте заражённого встаёт призрак (не больше двух на поле)
    if (enemy.haunt && this.ghostCount() < 2) this.raiseGhost(cell);
    else this.engine.vacate(cell);
    this.totals.kills++;
    this.killsRoom++;
    if (this.enemies[enemy.defId]?.boss) this.bossLeft = false;
    this.queueExit();
    this.killStreak++;
    const eliteMul = enemy.elite ? ELITE.value : 1;
    const gold = Math.round(
      def.gold * eliteMul * (this.mod.goldMul ?? 1) * (1 + s.goldBonus + s.luck * 0.05),
    );
    const souls = Math.round(def.souls * eliteMul * (this.mod.soulMul ?? 1) * (1 + s.soulBonus));
    if (gold > 0) {
      this.totals.gold = Gold.of(this.totals.gold + gold);
      this.emit({ type: 'gold', cell, amount: gold });
    }
    if (souls > 0) {
      this.totals.souls = Souls.of(this.totals.souls + souls);
      this.emit({ type: 'souls', cell, amount: souls });
    }
    if (s.killHp > 0 && this.totals.kills % 10 === 0) {
      const add = Math.round(this.stats.maxHp * Math.min(0.3, s.killHp));
      this.stats.maxHp += add;
      this.hp += add;
      this.emit({ type: 'heal', amount: add, hp: this.hp, source: 'perk' });
    }
    if (s.bossHp > 0 && def.boss) {
      const add = Math.round(this.stats.maxHp * s.bossHp);
      this.stats.maxHp += add;
      this.hp += add;
      this.emit({ type: 'heal', amount: add, hp: this.hp, source: 'perk' });
    }
    if (s.killDefTurn > 0) this.defTurn = Math.max(this.defTurn, 1);
    // «Взрыв плоти»: любое убийство разлетается осколками по соседям
    if (s.killBlast > 0) {
      const blast = Math.max(1, Math.round(enemy.maxHp * s.killBlast));
      this.splashNeighbors(cell, blast);
    }
    // «Отработанный удар»: убийство способностью возвращает часть её цены
    if (this.inAbility && s.abilityRefund > 0 && this.abilityCost > 0) {
      this.gain(Math.max(1, Math.round(this.abilityCost * s.abilityRefund)));
    }
    if (s.passives.has('chain_mark') && enemy.mark > 0) this.jumpMark(cell);
    // взрыв трупа: взрывается тот, кого пометили; соседи, помеченные тоже, рвутся цепью
    if (enemy.corpse) {
      const blast = Math.max(1, Math.round(enemy.maxHp * this.pp(0.5)));
      this.emit({ type: 'fx', cells: [cell], style: 'corpse' });
      this.splashNeighbors(cell, blast);
    }
    if (enemy.burn > 0) {
      for (const n of Grid.neighbors(cell)) {
        if (this.cards[n]?.kind === 'enemy') this.applyBurn(n, enemy.burnDmg, 2);
      }
    }
  }

  private ghostCount(): number {
    return this.cards.filter((c) => c?.kind === 'ghost').length;
  }

  /** Призрак встаёт на месте заражённого врага и три хода бьёт соседей. */
  private raiseGhost(cell: CellIndex): void {
    this.engine.put(cell, this.factory.createGhost(3));
  }

  /** Каждый призрак бьёт одного врага крестом (вверх, вниз, влево, вправо), потом тает на ход. */
  private tickGhosts(): void {
    for (const i of Grid.CELLS) {
      if (this.over) break;
      const g = this.cards[i];
      if (g?.kind !== 'ghost') continue;
      const targets = Grid.neighbors(i).filter((n) => this.cards[n]?.kind === 'enemy');
      if (targets.length) {
        // добиваем слабейшего — так призрак чаще превращает удар в убийство
        const t = targets.reduce((a, b) => (this.cards[a]!.hp <= this.cards[b]!.hp ? a : b));
        this.emit({ type: 'fx', cells: [t], style: 'ghost', from: i });
        this.damageEnemy(t, this.spellDamage(0.6), false);
      }
      g.ttl = (g.ttl ?? 1) - 1;
      if (g.ttl <= 0 && this.cards[i] === g) {
        this.engine.discard(i);
        this.engine.vacate(i);
      } else {
        this.emit({ type: 'status', cell: i, uid: g.uid, kind: 'haunt', turns: g.ttl });
      }
    }
  }

  private splashNeighbors(cell: CellIndex, dmg: number): void {
    for (const n of Grid.neighbors(cell)) {
      if (this.cards[n]?.kind === 'enemy') this.damageEnemy(n, dmg, false);
    }
  }

  private stepInto(cell: CellIndex): void {
    if (this.cards[cell]) return;
    this.engine.moveHero(cell);
  }

  // ------------------------------------------------------------------ статусы

  private applyBurn(cell: CellIndex, dmg: number, turns: number): void {
    const c = this.cards[cell];
    if (!c || c.kind !== 'enemy' || dmg <= 0) return;
    c.ignite(dmg, turns);
    this.emit({ type: 'status', cell, uid: c.uid, kind: 'burn', turns: c.burn });
  }

  private applyPoison(cell: CellIndex, dmg: number, turns: number): void {
    const c = this.cards[cell];
    if (!c || c.kind !== 'enemy' || dmg <= 0) return;
    c.poisonWith(dmg, turns);
    this.emit({ type: 'status', cell, uid: c.uid, kind: 'poison', turns: c.poison });
  }

  private applyStun(cell: CellIndex, turns = 1): void {
    const c = this.cards[cell];
    if (!c || c.kind !== 'enemy') return;
    c.stunFor(turns);
    this.emit({ type: 'status', cell, uid: c.uid, kind: 'stun', turns: c.stun });
  }

  private jumpMark(from: CellIndex): void {
    let best = Grid.NO_CELL;
    let bestD = Infinity;
    for (const i of Grid.CELLS) {
      const c = this.cards[i];
      if (c?.kind !== 'enemy' || c.mark > 0) continue;
      const d = Grid.dist(from, i);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best < 0) return;
    const c = this.cards[best]!;
    c.mark = 3;
    this.emit({ type: 'status', cell: best, uid: c.uid, kind: 'mark', turns: c.mark });
  }

  private enemyCells(): CellIndex[] {
    const out: CellIndex[] = [];
    this.cards.forEach((c, i) => c?.kind === 'enemy' && out.push(CellIndex.of(i)));
    return out;
  }

  // ------------------------------------------------------------------ ответный удар врага

  private defenseNow(): number {
    const s = this.stats;
    let def = s.defense;
    if (s.highHpDef > 0 && this.hp > this.stats.maxHp * 0.7)
      def = Math.round(def * (1 + s.highHpDef));
    if (s.resDef > 0 && this.res > this.stats.resMax * 0.5) def = Math.round(def * (1 + s.resDef));
    if (s.scarDef > 0) {
      const lost = Math.floor((1 - this.hp / this.stats.maxHp) / 0.2);
      def = Math.round(def * (1 + s.scarDef * lost));
    }
    if (s.killDefStack > 0)
      def = Math.round(def * (1 + Math.min(0.2, s.killDefStack * this.killsRoom)));
    if (this.defTurn > 0) def = Math.round(def * (1 + s.killDefTurn));
    return def;
  }

  /** Урон по герою от удара силой atk (для подсказок и автоприменения). */
  strikeDamage(atk: number): number {
    return this.reduce(atk, null);
  }

  private reduce(atk: number, enemy: Card | null): number {
    const s = this.stats;
    const def = enemy ? this.enemies[enemy.defId] : null;
    let dmg = atk;
    if (enemy && enemy.swings === 0 && s.firstHitDown > 0) dmg *= 1 - s.firstHitDown;
    if (enemy && enemy.hits > 0 && s.weaken > 0) dmg *= 1 - s.weaken;
    if (def?.magic && s.magicDr > 0) dmg *= 1 - s.magicDr;
    if (def?.boss && s.bossDr > 0) dmg *= 1 - s.bossDr;
    if (s.lowHpDr > 0 && this.hp <= this.stats.maxHp * 0.4) dmg *= 1 - s.lowHpDr;
    if (s.bigHitCut > 0 && dmg > this.stats.maxHp * 0.4) dmg *= 1 - s.bigHitCut;
    const armor = this.defenseNow();
    const floor = Math.ceil(dmg * (1 - CombatBalance.maxDefenseReduction));
    return Math.max(1, Math.round(Math.max(floor, dmg - armor)));
  }

  private heal(amount: number, source: 'perk' | 'lifesteal'): void {
    if (amount <= 0 || this.hp >= this.stats.maxHp) return;
    const h = Math.min(amount, this.stats.maxHp - this.hp);
    this.hp += h;
    this.emit({ type: 'heal', amount: h, hp: this.hp, source });
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
    this.engine.resetVacated();
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
  private retaliate(): void {
    if (this.over || this.madness > 0 || this.noCounter > 0) {
      this.engaged.clear();
      this.exposed = false;
      return;
    }
    const cells: CellIndex[] = [];
    for (const c of Grid.CELLS) {
      const card = this.cards[c];
      if (card?.kind !== 'enemy') continue;
      if (!Grid.neighbors(this.playerCell).includes(c)) continue;
      if (this.exposed || this.engaged.has(card.uid)) cells.push(c);
    }
    for (const c of cells) {
      if (this.over) break;
      this.enemyStrike(c);
    }
    this.engaged.clear();
    this.exposed = false;
  }

  private enemyStrike(cell: CellIndex): void {
    const enemy = this.cards[cell];
    if (!enemy || enemy.kind !== 'enemy' || this.over) return;
    const s = this.stats;
    if (enemy.stun > 0) {
      enemy.stun--;
      this.emit({ type: 'miss', cell, kind: 'stun' });
      return;
    }
    if (this.noCounter > 0) {
      this.emit({ type: 'miss', cell, kind: 'smoke' });
      return;
    }
    const atk = Math.max(1, Math.round(enemy.atk * (1 - this.warCry)));
    this.emit({ type: 'attack', from: cell, to: this.playerCell, ranged: false, by: 'enemy' });
    enemy.swings++;
    if (this.rng.chance(Percent.toRatio(s.dodge))) {
      this.emit({ type: 'miss', cell: this.playerCell, kind: 'dodge' });
      // «Подмена»: уворот превращается в удар из-за спины
      if (s.passives.has('substitution')) {
        let dmg = Math.round(this.currentDamage());
        dmg = Math.max(dmg + 1, Math.round(dmg * this.rollCritMul()));
        this.emit({
          type: 'attack',
          from: this.playerCell,
          to: cell,
          ranged: true,
          by: 'player',
          style: 'backstab',
        });
        this.strike(cell, dmg, true);
      }
      return;
    }
    if (this.rng.chance(Percent.toRatio(s.parry))) {
      this.emit({ type: 'miss', cell: this.playerCell, kind: 'parry' });
      if (s.counterBuff > 0) this.counterReady = true;
      this.strike(cell, Math.round(this.currentDamage() * 0.5), false);
      return;
    }
    if (s.block > 0 && this.rng.chance(Percent.toRatio(s.block))) {
      this.emit({ type: 'miss', cell: this.playerCell, kind: 'block' });
      return;
    }
    this.hurtPlayer(this.reduce(atk, enemy), cell, false);
    const def = this.enemies[enemy.defId];
    if (def?.venom && !this.over) {
      const dot = Math.max(1, Math.round(atk * def.venom * (1 - s.dotDr)));
      this.playerPoisonDmg = Math.max(this.playerPoisonDmg, dot);
      this.playerPoison = Math.max(this.playerPoison, 2);
    }
  }

  /** Урон по герою: щит, «первый удар комнаты», мана-щит, обман смерти, шипы. */
  private hurtPlayer(raw: number, fromCell: CellIndex, reflected: boolean): void {
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
        this.emit({ type: 'resource', now: this.res, max: this.stats.resMax });
      }
    }
    if (this.shield > 0 && dmg > 0) {
      const abs = Math.min(this.shield, dmg);
      this.shield -= abs;
      dmg -= abs;
      this.emit({ type: 'shield', now: this.shield });
    }
    if (dmg <= 0) {
      this.emit({
        type: 'hit',
        cell: this.playerCell,
        amount: 0,
        crit: false,
        target: 'player',
        hp: this.hp,
        absorbed: true,
      });
      return;
    }
    this.hp -= dmg;
    this.totals.damageTaken += dmg;
    // «Ярость» берсерка: боль превращается в выносливость
    if (s.passives.has('rage')) this.gain(Math.floor(dmg / 2));
    this.emit({
      type: 'hit',
      cell: this.playerCell,
      amount: dmg,
      crit: false,
      target: 'player',
      hp: Math.max(0, this.hp),
    });
    this.wearArmor();
    if (this.hp <= 0 && !this.tryCheatDeath(dmg)) {
      this.over = 'lose';
      this.emit({ type: 'lose' });
      return;
    }
    if (!reflected && s.thorns > 0 && fromCell >= 0) {
      this.damageEnemy(fromCell, Math.max(1, Math.round(dmg * s.thorns)), false);
    }
  }

  /** «Несокрушимый», «Аварийный барьер», «Откупиться», «Не сдамся». */
  private tryCheatDeath(dmg: number): boolean {
    const s = this.stats;
    const shock = s.passives.has('never_give_up') && !this.usedOnce.has('shock');
    if (this.cheatLeft <= 0 && !shock) return false;
    if (shock) this.usedOnce.add('shock');
    else this.cheatLeft--;
    this.hp = 1;
    this.emit({ type: 'heal', amount: 1, hp: 1, source: 'perk' });
    const price = this.lineageDef.cheatDeathPrice;
    if (price.drainsResource) {
      this.res = 0;
      this.emit({ type: 'resource', now: 0, max: this.stats.resMax });
    }
    if (price.goldShare > 0)
      this.totals.gold = Gold.of(Math.round(this.totals.gold * (1 - price.goldShare)));
    if (shock) {
      this.emit({ type: 'fx', cells: this.enemyCells(), style: 'quake' });
      const blast = Math.max(1, dmg * 2);
      for (const c of this.enemyCells()) this.damageEnemy(c, blast, false);
    }
    return true;
  }

  // ------------------------------------------------------------------ способности: реализация

  /** Применяет способность, пометив урон как «от способности» — тогда работают таланты-синергии. */
  private runAbility(p: PerkDef, cell: CellIndex): void {
    const target = cell >= 0 ? this.cards[cell] : null;
    if (target?.kind === 'enemy') this.engaged.add(target.uid);
    this.inAbility = true;
    this.abilityCost = this.perkCostOf(p);
    const mark = this.engine.mark();
    try {
      this.applyAbility(p, cell);
    } finally {
      this.inAbility = false;
      this.abilityCost = 0;
    }
    // У каждой способности есть своя вспышка. Если реализация не нарисовала ничего сама
    // (усиления, лечение, щиты), показываем эффект перка на герое или на цели.
    const drew = this.engine
      .since(mark)
      .some((e) => e.type === 'fx' || (e.type === 'attack' && e.by === 'player'));
    if (!drew)
      this.engine.insert(mark, {
        type: 'fx',
        cells: [cell >= 0 ? cell : this.playerCell],
        style: p.vfx,
      });
  }

  private applyAbility(p: PerkDef, cell: CellIndex): void {
    const enemies = this.enemyCells();
    const target = cell >= 0 ? this.cards[cell] : null;

    switch (p.ability) {
      // ---------------- воин
      case 'power_strike': {
        const enemy = target!;
        let dmg = this.spellDamage(2);
        const crit = this.rollCrit(enemy, false);
        if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * this.rollCritMul()));
        this.emit({ type: 'attack', from: this.playerCell, to: cell, ranged: false, by: 'player' });
        const before = enemy.hp;
        const killed = this.strike(cell, dmg, crit);
        // излишек проламывает цель и бьёт врага за ней по той же линии
        const over = dmg - before;
        if (killed && over > 0) {
          const behind = this.behindCell(this.playerCell, cell);
          if (behind >= 0 && this.cards[behind]?.kind === 'enemy')
            this.damageEnemy(behind, over, false);
        }
        if (killed) this.stepInto(cell);
        break;
      }
      case 'earthquake': {
        const hit = enemies.filter(
          (c) =>
            Grid.row(c) === Grid.row(this.playerCell) || Grid.col(c) === Grid.col(this.playerCell),
        );
        this.emit({ type: 'fx', cells: hit, style: 'quake' });
        const dmg = this.spellDamage(0.6);
        for (const c of hit) {
          this.applyStun(c);
          this.damageEnemy(c, dmg, false);
        }
        break;
      }
      // ---------------- рыцарь
      case 'shield_bash': {
        const behind = this.behindCell(this.playerCell, cell);
        const dmg = this.spellDamage(0.9);
        this.emit({ type: 'fx', cells: [cell], style: 'quake' });
        this.applyStun(cell);
        if (behind < 0) {
          // у края поля удар о стену вдвое сильнее
          this.damageEnemy(cell, dmg * 2, false);
        } else {
          this.damageEnemy(cell, dmg, false);
          if (this.cards[behind]?.kind === 'enemy') this.damageEnemy(behind, dmg, false);
          if (this.cards[cell] && this.cards[behind]) this.engine.swap(cell, behind);
        }
        break;
      }
      case 'war_cry': {
        this.warCry = Math.min(0.75, this.warCry + this.pp(0.4, 0.75));
        this.emit({ type: 'fx', cells: enemies, style: 'banner' });
        for (const c of enemies) {
          const e = this.cards[c]!;
          this.emit({ type: 'status', cell: c, uid: e.uid, kind: 'weak', turns: 99 });
        }
        break;
      }
      case 'duel': {
        let best = Grid.NO_CELL;
        let bestAtk = -1;
        for (const c of enemies) {
          if (this.cards[c]!.atk > bestAtk) {
            bestAtk = this.cards[c]!.atk;
            best = c;
          }
        }
        if (best < 0) break;
        this.emit({ type: 'fx', cells: [best], style: 'swap' });
        const free =
          Grid.neighbors(this.playerCell).find((n) => !this.cards[n]) ??
          Grid.neighbors(this.playerCell)[0];
        if (free !== best) this.engine.swap(best, free);
        this.applyStun(free, 2);
        break;
      }
      // ---------------- берсерк
      case 'whirlwind': {
        const near = Grid.neighbors(this.playerCell).filter((c) => this.cards[c]?.kind === 'enemy');
        this.emit({ type: 'fx', cells: near, style: 'blades' });
        const dmg = this.spellDamage(0.7);
        for (const c of near) this.damageEnemy(c, dmg, this.rollCrit(this.cards[c], false), true);
        break;
      }
      case 'madness': {
        this.madness = 3;
        this.emit({ type: 'fx', cells: enemies, style: 'blades' });
        break;
      }
      // ---------------- паладин
      case 'holy_wrath': {
        const enemy = target!;
        const holy = isHolyTarget(this.enemies[enemy.defId].tag);
        let dmg = this.spellDamage(holy ? 3 : 1.5);
        const crit = this.rollCrit(enemy, false);
        if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * this.rollCritMul()));
        this.emit({ type: 'fx', cells: [cell], style: 'holy' });
        const killed = this.strike(cell, dmg, crit);
        if (killed) this.stepInto(cell);
        break;
      }
      case 'justice_beam': {
        const col = Grid.col(cell);
        const hit = enemies.filter((c) => Grid.col(c) === col);
        this.emit({ type: 'fx', cells: hit, style: 'beam' });
        for (const c of hit) {
          const e = this.cards[c]!;
          const holy = isHolyTarget(this.enemies[e.defId].tag);
          this.damageEnemy(c, this.spellDamage(holy ? 2 : 1), false);
        }
        break;
      }
      case 'verdict': {
        const limit = this.spellDamage(1.2);
        this.emit({ type: 'fx', cells: enemies, style: 'holy' });
        for (const c of enemies) {
          const e = this.cards[c];
          if (e && !this.enemies[e.defId].boss && e.hp <= limit) this.killEnemy(c);
        }
        break;
      }
      case 'heavens_wrath': {
        this.emit({ type: 'fx', cells: enemies, style: 'holy' });
        for (const c of enemies) {
          const e = this.cards[c];
          if (!e) continue;
          const holy = isHolyTarget(this.enemies[e.defId].tag);
          this.applyStun(c, 2);
          this.damageEnemy(c, this.spellDamage(holy ? 4 : 2), false);
        }
        break;
      }
      // ---------------- маг
      // Удар молнии — единственный удар мага, и он стоит маны. Пустая шкала в окружении
      // врагов — не тупик, а приговор: см. `cornered()` и «Растерзание» в finishTurn.
      case 'lightning': {
        this.emit({
          type: 'attack',
          from: this.playerCell,
          to: cell,
          ranged: true,
          by: 'player',
          style: 'bolt',
        });
        const crit = this.rollCrit(target, true);
        let dmg = this.spellDamage(2.5 * (1 + this.stats.lightningPower));
        if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * this.rollCritMul()));
        const killed = this.strike(cell, dmg, crit);
        // «Раздвоение молнии»: второй разряд бьёт ту же цель, а не соседа
        const { echoChance, echoDmg } = this.stats;
        if (!killed && echoChance > 0 && this.rng.chance(echoChance)) {
          this.emit({ type: 'fx', cells: [cell], style: 'bolt' });
          this.strike(cell, Math.max(1, Math.round(dmg * echoDmg)), false);
        }
        break;
      }
      case 'magic_shot': {
        this.emit({ type: 'fx', cells: [cell], style: 'arcane' });
        const crit = this.rollCrit(target, true);
        let dmg = this.spellDamage(1.5 * (1 + this.stats.shotPower));
        if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * this.rollCritMul()));
        this.strike(cell, dmg, crit);
        break;
      }
      case 'chain_lightning': {
        const chain: CellIndex[] = [cell];
        const seen = new Set<CellIndex>([cell]);
        for (const n of Grid.neighbors(cell)) {
          if (this.cards[n]?.kind === 'enemy' && !seen.has(n) && chain.length < 3) {
            chain.push(n);
            seen.add(n);
          }
        }
        this.emit({ type: 'fx', cells: chain, style: 'chain' });
        const power = 1 + this.stats.chainPower;
        const mul = [1, 0.75, 0.5];
        chain.forEach((c, i) => this.strike(c, this.spellDamage(mul[i] * power), false));
        break;
      }
      // ---------------- магистр
      case 'swap': {
        const a = this.swapFirst!;
        const b = cell;
        if (a === b) break;
        this.emit({ type: 'fx', cells: [a, b], style: 'swap' });
        this.engine.swap(a, b);
        break;
      }
      case 'deck_draw': {
        const c = this.cards[cell];
        if (!c) break;
        if (c.kind === 'enemy' && this.enemies[c.defId].boss) break;
        this.emit({ type: 'fx', cells: [cell], style: 'arcane' });
        this.engine.discard(cell);
        this.engine.deck.push(c);
        const next = this.engine.draw();
        if (next) this.engine.put(cell, next);
        else this.engine.vacate(cell);
        break;
      }
      case 'rewind': {
        this.restoreSnapshot();
        this.emit({ type: 'rewind' });
        break;
      }
      // ---------------- некромант
      case 'corpse_blast': {
        const e = target!;
        e.corpse = true;
        this.emit({ type: 'fx', cells: [cell], style: 'corpse' });
        this.emit({ type: 'status', cell, uid: e.uid, kind: 'corpse', turns: 99 });
        break;
      }
      case 'ghosts': {
        const e = target!;
        e.haunt = true;
        this.emit({ type: 'fx', cells: [cell], style: 'ghost' });
        this.emit({ type: 'status', cell, uid: e.uid, kind: 'haunt', turns: 99 });
        break;
      }
      case 'voodoo': {
        const e = target!;
        e.link = true;
        this.emit({ type: 'status', cell, uid: e.uid, kind: 'link', turns: 99 });
        break;
      }
      case 'dead_harvest': {
        this.emit({ type: 'fx', cells: enemies, style: 'soul' });
        const bonus = this.stats.soulBonus;
        this.stats.soulBonus = Ratio.of(bonus + 1);
        for (const c of enemies) {
          const e = this.cards[c];
          if (!e) continue;
          const boss = this.enemies[e.defId].boss;
          this.damageEnemy(
            c,
            Math.max(1, Math.round(e.hp * this.pp(boss ? 0.25 : 0.5, 0.9))),
            false,
          );
        }
        this.stats.soulBonus = bonus;
        break;
      }
      // ---------------- пиромант
      case 'ignite': {
        this.emit({ type: 'fx', cells: [cell], style: 'fire' });
        this.applyBurn(cell, this.spellDamage(0.3), 3);
        break;
      }
      case 'fireball': {
        const near = Grid.neighbors(cell).filter((c) => this.cards[c]?.kind === 'enemy');
        this.emit({ type: 'fx', cells: [cell, ...near], style: 'explosion' });
        const burn = this.spellDamage(0.25);
        this.applyBurn(cell, burn, 3);
        for (const c of near) this.applyBurn(c, burn, 3);
        this.strike(cell, this.spellDamage(1.2), false);
        for (const c of near) this.damageEnemy(c, this.spellDamage(0.7), false);
        break;
      }
      case 'detonate': {
        const burning = enemies.filter((c) => (this.cards[c]?.burn ?? 0) > 0);
        this.emit({ type: 'fx', cells: burning, style: 'explosion' });
        for (const c of burning) {
          const e = this.cards[c];
          if (!e) continue;
          const blast = Math.max(1, e.burnDmg * 2);
          this.splashNeighbors(c, Math.max(1, e.burnDmg));
          this.damageEnemy(c, blast, false);
        }
        break;
      }
      case 'inferno': {
        this.emit({ type: 'fx', cells: enemies, style: 'fire' });
        const burn = this.spellDamage(0.4);
        for (const c of enemies) this.applyBurn(c, burn, 5);
        break;
      }
      // ---------------- лучник
      case 'ricochet': {
        const chain = [cell];
        for (const n of Grid.neighbors(cell)) {
          if (this.cards[n]?.kind === 'enemy' && chain.length < 3) chain.push(n);
        }
        this.emit({
          type: 'attack',
          from: this.playerCell,
          to: cell,
          ranged: true,
          by: 'player',
          style: 'shot',
        });
        const mul = [1, 0.5, 0.25];
        chain.forEach((c, i) =>
          this.strike(c, this.spellDamage(mul[i]), i === 0 && this.rollCrit(this.cards[c], true)),
        );
        break;
      }
      case 'falcon_hunt': {
        this.emit({ type: 'fx', cells: [cell], style: 'arrows' });
        this.applyStun(cell);
        this.strike(cell, this.spellDamage(1.2), this.rollCrit(target, true));
        break;
      }
      case 'falcon_courier': {
        this.take(cell);
        this.engine.vacate(cell);
        break;
      }
      case 'double_shot': {
        this.emit({
          type: 'attack',
          from: this.playerCell,
          to: cell,
          ranged: true,
          by: 'player',
          style: 'shot',
        });
        const killed = this.strike(cell, this.spellDamage(1), this.rollCrit(target, true));
        let second = cell;
        if (killed) {
          second = this.nearestEnemy(this.playerCell);
          if (second < 0) break;
        }
        this.strike(second, this.spellDamage(1), this.rollCrit(this.cards[second], true));
        break;
      }
      case 'arrow_rain': {
        if (!enemies.length) break;
        this.emit({ type: 'fx', cells: enemies, style: 'arrows' });
        for (let i = 0; i < 5; i++) {
          const live = this.enemyCells();
          if (!live.length) break;
          const c = live[this.rng.int(0, live.length - 1)];
          this.strike(c, this.spellDamage(0.6), this.rollCrit(this.cards[c], true));
        }
        break;
      }
      case 'starfall': {
        this.emit({ type: 'fx', cells: enemies, style: 'arrows' });
        for (let i = 0; i < 3; i++) {
          for (const c of this.enemyCells()) {
            this.strike(c, this.spellDamage(0.6), this.rollCrit(this.cards[c], true));
          }
        }
        break;
      }
      // ---------------- снайпер
      case 'rail_shot': {
        const line = enemies.filter(
          (c) => Grid.row(c) === Grid.row(cell) || Grid.col(c) === Grid.col(cell),
        );
        line.sort((a, b) => Grid.dist(this.playerCell, a) - Grid.dist(this.playerCell, b));
        this.emit({
          type: 'attack',
          from: this.playerCell,
          to: cell,
          ranged: true,
          by: 'player',
          style: 'shot',
        });
        line.forEach((c, i) => this.strike(c, this.spellDamage(Math.pow(0.8, i)), i === 0));
        break;
      }
      case 'armor_piercing': {
        const e = target!;
        this.emit({
          type: 'attack',
          from: this.playerCell,
          to: cell,
          ranged: true,
          by: 'player',
          style: 'shot',
        });
        const bonus = Math.round(e.maxHp * this.pp(0.25, 0.6));
        this.strike(cell, this.spellDamage(1) + bonus, this.rollCrit(e, true));
        break;
      }
      case 'one_shot': {
        this.emit({ type: 'fx', cells: [cell], style: 'beam' });
        const line = [
          cell,
          ...enemies.filter(
            (c) => c !== cell && (Grid.row(c) === Grid.row(cell) || Grid.col(c) === Grid.col(cell)),
          ),
        ];
        let kills = 0;
        for (const c of line) {
          const e = this.cards[c];
          if (!e) continue;
          if (this.enemies[e.defId].boss) {
            this.damageEnemy(c, Math.max(1, Math.round(e.maxHp * this.pp(0.4, 0.8))), true);
          } else if (kills < 3) {
            this.killEnemy(c);
            kills++;
          }
        }
        break;
      }
      // ---------------- наёмник
      case 'bribe': {
        const e = target!;
        if (this.enemies[e.defId].boss) break;
        this.emit({ type: 'fx', cells: [cell], style: 'smoke' });
        this.emit({ type: 'kill', cell, uid: e.uid });
        this.engine.clear(cell);
        this.engine.vacate(cell);
        break;
      }
      case 'sentence': {
        const e = target!;
        e.vuln = Math.max(e.vuln, this.pp(0.5, 1.5));
        this.emit({ type: 'status', cell, uid: e.uid, kind: 'vuln', turns: 99 });
        break;
      }
      // ---------------- тёмный ассасин
      case 'death_mark': {
        const e = target!;
        e.mark = 3;
        this.emit({ type: 'status', cell, uid: e.uid, kind: 'mark', turns: e.mark });
        break;
      }
      case 'shadow_reap': {
        const marked = enemies.filter((c) => (this.cards[c]?.mark ?? 0) > 0);
        this.emit({ type: 'fx', cells: marked, style: 'dark' });
        for (const c of marked) this.reapMarked(c);
        break;
      }
      case 'reaper': {
        this.reaping = 3;
        this.emit({ type: 'fx', cells: enemies, style: 'dark' });
        break;
      }
      // ---------------- ниндзя
      case 'shuriken_fan': {
        const list = [...enemies]
          .sort((a, b) => Grid.dist(this.playerCell, a) - Grid.dist(this.playerCell, b))
          .slice(0, 4);
        this.emit({ type: 'fx', cells: list, style: 'blades' });
        for (const c of list)
          this.strike(c, this.spellDamage(0.6), this.rollCrit(this.cards[c], true));
        break;
      }
      case 'smoke_screen': {
        this.noCounter = 2;
        this.emit({ type: 'fx', cells: [this.playerCell], style: 'smoke' });
        break;
      }
      case 'wind_shadow': {
        this.emit({ type: 'fx', cells: enemies, style: 'blades' });
        for (const c of this.enemyCells()) {
          if (this.strike(c, this.spellDamage(0.8), false)) continue;
          let dmg = this.spellDamage(0.8);
          dmg = Math.max(dmg + 1, Math.round(dmg * this.rollCritMul()));
          this.strike(c, dmg, true);
        }
        break;
      }
      default:
        break;
    }
  }

  /** Клетка «за» целью по линии от героя. */
  private behindCell(from: CellIndex, to: CellIndex): CellIndex {
    const cell = Grid.behind(from, to);
    return cell === this.playerCell ? Grid.NO_CELL : cell;
  }

  private nearestEnemy(from: CellIndex): CellIndex {
    let best = Grid.NO_CELL;
    let bestD = Infinity;
    for (const c of this.enemyCells()) {
      const d = Grid.dist(from, c);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  private reapMarked(cell: CellIndex): void {
    const e = this.cards[cell];
    if (!e || e.kind !== 'enemy') return;
    if (this.enemies[e.defId].boss)
      this.damageEnemy(cell, Math.max(1, Math.round(e.maxHp * 0.3)), true);
    else this.killEnemy(cell);
  }

  // ------------------------------------------------------------------ расходники

  useItem(id: ConsumableId): TurnResult {
    if (this.over || this.consumables[id] <= 0) return { ok: false, events: this.engine.flush() };
    if (id === 'potion_heal') {
      if (this.hp >= this.stats.maxHp) return { ok: false, events: this.engine.flush() };
      this.consumables[id]--;
      const heal = Math.min(this.healPotionAmount(), this.stats.maxHp - this.hp);
      this.hp += heal;
      this.emit({ type: 'heal', amount: heal, hp: this.hp, source: 'potion' });
      if (this.stats.healShield > 0) {
        this.shield += Math.round(this.stats.maxHp * this.stats.healShield);
        this.emit({ type: 'shield', now: this.shield });
      }
    } else if (id === 'potion_regen') {
      if (this.res >= this.stats.resMax && this.boost > 0)
        return { ok: false, events: this.engine.flush() };
      this.consumables[id]--;
      this.res = this.stats.resMax;
      this.boost = ConsumableBalance.regenBoostTurns;
      this.emit({ type: 'resource', now: this.res, max: this.stats.resMax });
      this.emit({ type: 'boost', turns: this.boost });
    } else {
      if (!this.lineageDef.artifacts) return { ok: false, events: this.engine.flush() };
      const targets = this.enemyCells();
      if (!targets.length) return { ok: false, events: this.engine.flush() };
      this.consumables[id]--;
      this.engine.resetVacated();
      const dmg = this.artifactDamage();
      this.emit({ type: 'artifact', cells: targets });
      for (const t of targets) this.damageEnemy(t, dmg, false);
      this.engine.refill();
    }
    return { ok: true, events: this.engine.flush() };
  }

  /** Зелье лечит долю максимального здоровья — иначе на десятом этаже оно бесполезно. */
  healPotionAmount(): number {
    return Math.max(
      1,
      Math.round(this.stats.maxHp * ConsumableBalance.healPotionPct * (1 + this.stats.potionPct)),
    );
  }

  artifactDamage(): number {
    return Math.max(1, Math.round(this.stats.damage * 2.5 * (1 + this.stats.artifactMul)));
  }

  /** Что уходит в следующую комнату забега. */
  carryOut(): BattleCarryStats {
    return { hp: this.hp, res: this.res, revived: this.revived, selfRevived: this.selfRevived };
  }

  revive(): GameEvent[] {
    this.over = null;
    this.revived = true;
    this.hp = Math.max(1, Math.ceil(this.stats.maxHp * CombatBalance.reviveHpRatio));
    this.emit({ type: 'heal', amount: this.hp, hp: this.hp, source: 'revive' });
    this.breakFree();
    return this.engine.flush();
  }

  /** Талант «Возвращение» / «Последний шанс»: раз за забег встаём сами. */
  autoRevive(): GameEvent[] | null {
    if (this.reviveLeft <= 0 || this.stats.reviveHp <= 0) return null;
    this.reviveLeft--;
    this.selfRevived = true;
    this.over = null;
    this.hp = Math.max(1, Math.round(this.stats.maxHp * this.stats.reviveHp));
    this.emit({ type: 'heal', amount: this.hp, hp: this.hp, source: 'revive' });
    this.breakFree();
    return this.engine.flush();
  }

  /**
   * Поднявшись после растерзания, герой получает полную шкалу: иначе он встаёт в то же
   * окружение без единого хода, и «Растерзание» срабатывает второй раз в том же кадре.
   */
  private breakFree(): void {
    if (this.hasMove()) return;
    this.res = this.stats.resMax;
    this.emit({ type: 'resource', now: this.res, max: this.stats.resMax });
  }

  // ------------------------------------------------------------------ подбор карт

  private collect(cell: CellIndex): void {
    // мог ударить — но пошёл мимо: если новая клетка у кого-то под рукой, тот бьёт
    this.exposed = this.canStrike();
    const exit = this.cards[cell]?.kind === 'exit';
    this.engine.moveHero(cell);
    if (exit) {
      this.engine.clear(cell);
      this.finishRoom();
      return;
    }
    this.take(cell);
    // «Шаг сквозь эфир»: передышка за любой шаг на клетку без врага — пустую или с добычей
    if (this.stats.stepHeal > 0) {
      this.heal(Math.max(1, Math.round(this.stats.maxHp * this.stats.stepHeal)), 'perk');
    }
  }

  private take(cell: CellIndex): void {
    const card = this.cards[cell];
    if (!card) return;
    this.engine.discard(cell);
    if (card.kind === 'gold') {
      this.totals.gold = Gold.of(this.totals.gold + card.value);
      this.emit({ type: 'gold', cell, amount: card.value });
    } else if (card.kind === 'chest') {
      this.openChest(cell, card.defId === 'chest_empty');
    } else if (
      card.kind === 'potion_heal' ||
      card.kind === 'potion_regen' ||
      card.kind === 'artifact'
    ) {
      this.consumables[card.kind]++;
      this.emit({ type: 'pickup', cell, item: card.kind, count: this.consumables[card.kind] });
    }
  }

  private rollConsumable(): ConsumableId {
    const r = this.rng.next();
    if (this.lineageDef.artifacts)
      return r < 0.4 ? 'potion_heal' : r < 0.7 ? 'potion_regen' : 'artifact';
    return r < 0.55 ? 'potion_heal' : 'potion_regen';
  }

  private openChest(cell: CellIndex, empty = false): void {
    const { rng, stats: s } = this;
    const loot: Loot[] = [];
    // пустой сундук снаружи не отличить: открыл — а там паутина
    if (empty) {
      this.emit({ type: 'chest', cell, loot, empty: true });
      return;
    }
    const gold = this.factory.rollGold(10, 24);
    loot.push({ kind: 'gold', amount: gold });
    this.totals.gold = Gold.of(this.totals.gold + gold);
    this.emit({ type: 'gold', cell, amount: gold });
    let chance = LootBalance.chestItemChance + s.luck * 0.02;
    for (let i = 0; i < 2 && rng.chance(chance); i++) {
      const item = this.rollConsumable();
      this.consumables[item]++;
      loot.push({ kind: item, amount: 1 });
      this.emit({ type: 'pickup', cell, item, count: this.consumables[item] });
      chance = LootBalance.chestBonusItemChance;
    }
    this.emit({ type: 'chest', cell, loot });
  }

  // ------------------------------------------------------------------ конец хода

  /**
   * Комната закончена: герой шагнул на карту перехода. Всё, что осталось на поле, остаётся
   * на поле — в этом и выбор: уйти сейчас или рискнуть и добрать добычу, пока лезут новые враги.
   */
  private finishRoom(): void {
    if (this.over) return;
    this.over = 'win';
    this.emit({ type: 'win' });
  }

  /** Эффекты со временем: горение, яд, клеймо, призраки, лечение врагов. */
  private tickStatuses(): void {
    for (const i of Grid.CELLS) {
      if (this.over) break;
      const c = this.cards[i];
      if (!c || c.kind !== 'enemy') continue;
      if (c.burn > 0 && c.burnNew) c.burnNew = false;
      else if (c.burn > 0) {
        c.burn--;
        this.emit({ type: 'status', cell: i, uid: c.uid, kind: 'burn', turns: c.burn });
        if (this.damageEnemy(i, c.burnDmg, false)) continue;
      }
      const alive = this.cards[i];
      if (!alive || alive.kind !== 'enemy') continue;
      if (alive.poison > 0) {
        alive.poison--;
        this.emit({ type: 'status', cell: i, uid: alive.uid, kind: 'poison', turns: alive.poison });
        if (this.damageEnemy(i, alive.poisonDmg, false)) continue;
      }
      const still = this.cards[i];
      if (!still || still.kind !== 'enemy') continue;
      if (still.mark > 0) {
        still.mark--;
        this.emit({ type: 'status', cell: i, uid: still.uid, kind: 'mark', turns: still.mark });
        if (still.mark === 0) {
          this.reapMarked(i);
          continue;
        }
      }
      const last = this.cards[i];
      if (last?.kind === 'enemy') {
        const def = this.enemies[last.defId];
        if (def?.regen && last.hp < last.maxHp) {
          last.hp = Math.min(last.maxHp, last.hp + Math.max(1, Math.round(last.maxHp * def.regen)));
          this.emit({ type: 'hit', cell: i, amount: 0, crit: false, target: 'enemy', hp: last.hp });
        }
      }
    }
    // призраки бьют соседей крестом и тают
    this.tickGhosts();
    // яд на герое
    if (this.playerPoison > 0 && !this.over) {
      this.playerPoison--;
      this.hurtPlayer(this.playerPoisonDmg, Grid.NO_CELL, true);
    }
  }

  /**
   * Может ли герой вообще хоть что-то сделать. Считаем и способности, и расходники:
   * зелье восстановления вернёт ману, артефакт мага разнесёт окружение.
   */
  private hasMove(): boolean {
    for (const c of Grid.CELLS) if (this.actionFor(c).kind !== 'none') return true;
    const usable = (p: PerkDef): boolean => {
      if (p.target === 'self' || p.target === undefined) return true;
      for (const c of Grid.CELLS) if (this.perkTargetOk(p, c)) return true;
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
    for (const c of Grid.CELLS) {
      if (this.cards[c]?.kind !== 'enemy') continue;
      const k = this.actionFor(c).kind;
      if (k === 'melee' || k === 'ranged') return true;
    }
    for (const p of this.stats.abilities) {
      if (p.ability !== 'lightning' || !this.perkReady(p).ok) continue;
      for (const c of Grid.CELLS) if (this.perkTargetOk(p, c)) return true;
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
  private swarm(): void {
    const order = (): CellIndex[] => {
      const cells: CellIndex[] = [];
      for (const c of Grid.CELLS) if (this.cards[c]?.kind === 'enemy') cells.push(c);
      return cells.sort(
        (a, b) => Grid.dist(a, this.playerCell) - Grid.dist(b, this.playerCell) || a - b,
      );
    };
    const cells = order();
    if (!cells.length) return;
    this.emit({ type: 'swarm', cells });
    for (let sweep = 0; sweep < 8 && this.hp > 0; sweep++) {
      for (const c of order()) {
        if (this.hp <= 0) break;
        const card = this.cards[c];
        if (!card || card.kind !== 'enemy') continue;
        this.emit({
          type: 'attack',
          from: c,
          to: this.playerCell,
          ranged: Grid.dist(c, this.playerCell) > 1,
          by: 'enemy',
        });
        // Обычная защита работает, но уклонений и парирований тут нет: деваться некуда.
        const dmg = Math.max(1, this.strikeDamage(card.atk));
        this.hp = Math.max(0, this.hp - dmg);
        this.totals.damageTaken += dmg;
        this.emit({
          type: 'hit',
          cell: this.playerCell,
          amount: dmg,
          crit: false,
          target: 'player',
          hp: this.hp,
        });
      }
    }
    this.hp = 0;
    this.over = 'lose';
    this.emit({ type: 'lose' });
  }

  private finishTurn(): void {
    this.acting = false;
    this.armorWorn = false;
    this.retaliate();
    if (this.over) return;
    this.tickStatuses();
    this.engine.refill();
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
        this.emit({
          type: 'hit',
          cell: this.playerCell,
          amount: loss,
          crit: false,
          target: 'player',
          hp: this.hp,
        });
      }
    }
    for (const id of Object.keys(this.cooldowns)) {
      if (--this.cooldowns[id] <= 0) delete this.cooldowns[id];
    }
    const mul = this.boost > 0 ? ConsumableBalance.regenBoostMul : 1;
    if (this.boost > 0) this.boost--;
    if (this.res < this.stats.resMax) this.gain(this.stats.regen * mul);
    // Шкала уже восполнилась — только теперь решаем, что ходить нечем.
    if (this.cornered()) this.swarm();
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
      engine: this.engine.capture(),
      hp: this.hp,
      shield: this.shield,
      res: this.res,
      totals: JSON.stringify(this.totals),
      consumables: JSON.stringify(this.consumables),
      flags: JSON.stringify([
        this.killsRoom,
        this.killStreak,
        this.noCounter,
        this.madness,
        this.reaping,
        this.warCry,
      ]),
    };
  }

  private restoreSnapshot(): void {
    const s = this.snapshot;
    if (!s) return;
    this.engine.restore(s.engine);
    this.hp = s.hp;
    this.shield = s.shield;
    this.res = s.res;
    this.totals = JSON.parse(s.totals) as BattleTotals;
    this.consumables = JSON.parse(s.consumables) as Record<ConsumableId, number>;
    const f = JSON.parse(s.flags) as number[];
    [this.killsRoom, this.killStreak, this.noCounter, this.madness, this.reaping, this.warCry] = f;
    this.snapshot = null;
    this.over = null;
  }
}
