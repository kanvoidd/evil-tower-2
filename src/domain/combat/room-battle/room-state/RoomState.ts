import {
  type AbilityId,
  type AbilityParams,
  type ConsumableId,
  type EnemyDef,
  type EquipmentSave,
  type LineageDef,
  PERK_BY_ABILITY,
  type PerkDef,
  type RoomDef,
  type RoomModifier,
  type RoomPlan,
} from '../../../catalog';
import { CellIndex, Gold, type Rng, Souls } from '../../../shared';
import type { Card } from '../../card/Card';
import type { CardFactory } from '../../card/card-factory/CardFactory';
import type { IEngine } from '../../engine/interfaces/IEngine';
import type { GameEvent } from '../../events';
import type { PlayerStats } from '../../player';
import type { BattleDeps } from '../interfaces/BattleDeps';
import type { BattleInit } from '../interfaces/BattleInit';
import type { BattleSnapshot } from '../interfaces/BattleSnapshot';
import type { BattleTotals } from '../interfaces/BattleTotals';

/**
 * Состояние боя в одной комнате — общее для всех частей боя: герой, добыча, длящиеся эффекты,
 * способности, ход. Поле и колода — у движка, враги каталога и фабрика карт — готовые из
 * `RoomBattleFactory`. Правил здесь нет, только данные и чтение поля.
 */
export class RoomState {
  // ---- герой
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

  // ---- комната
  readonly room: RoomDef;
  readonly plan: RoomPlan;
  readonly mod: RoomModifier;
  readonly lineageDef: LineageDef;
  readonly rng: Rng;
  readonly engine: IEngine;
  readonly factory: CardFactory;
  readonly enemies: Readonly<Record<string, EnemyDef>>;
  /** Сколько врагов нужно уложить в этой комнате. */
  quota = 0;
  /** Босс комнаты ещё жив — без него выход не откроется. */
  bossLeft = false;
  /** Карта перехода уже подмешана. */
  exitQueued = false;

  // ---- способности
  /** Заряженная способность: следующее касание поля применит её. */
  armed: PerkDef | null = null;
  /** Первая из двух карт для «Перестановки». */
  swapFirst: CellIndex | null = null;
  /** Уже потраченные «один раз за комнату» способности. */
  usedOnce = new Set<string>();
  /** Оставшиеся ходы перезарядки по id способности. */
  cooldowns: Record<string, number> = {};
  /** Урон сейчас наносит способность — работают таланты-синергии. */
  inAbility = false;
  /** Цена применяемой способности (для возврата ресурса за убийство). */
  abilityCost = 0;
  freePerkLeft = 0;

  // ---- временные состояния героя
  noCounter = 0; // дымовая завеса
  madness = 0; // безумие берсерка
  reaping = 0; // жнец
  killStreak = 0; // резня
  killsRoom = 0;
  defTurn = 0; // «+защита на ход» после убийства
  perkGuard = 0; // «после перка следующий удар слабее»
  counterReady = false; // контрудар после парирования
  cheatLeft = 0;
  reviveLeft = 0;
  roomGuardLeft = 0;
  playerPoison = 0;
  playerPoisonDmg = 0;
  warCry = 0; // накопленное ослабление атаки врагов
  snapshot: BattleSnapshot | null = null;

  // ---- ход
  /** Враги, с которыми герой вступил в бой за этот ход (uid). */
  engaged = new Set<number>();
  /**
   * Герой мог ударить врага, но шагнул на клетку без врага. Тогда бьют те, до кого
   * новая клетка достаёт: он сам подставился. Ушёл туда, где рядом никого, — ход бесплатный.
   */
  exposed = false;
  /** Идёт действие героя: урон по врагу в это время — вступление в бой. */
  acting = false;
  lastKills = 0;
  /** Доспех уже снашивался на этом ходу. */
  armorWorn = false;

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
    this.freePerkLeft = this.stats.freePerk ? 1 : 0;
    const deck = this.factory.createDeck();
    this.engine.deck.push(...deck.cards);
    this.quota = deck.quota;
    this.bossLeft = deck.boss;
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

  set playerCell(cell: CellIndex) {
    this.engine.playerCell = cell;
  }

  /** Базовое действие линейки — удар в спину: всегда крит, а под «Жнецом» ещё и казнь. */
  get backstabs(): boolean {
    return this.stats.attack.guaranteedCrit;
  }

  emit(ev: GameEvent): void {
    this.engine.emit(ev);
  }

  enemyCells(): CellIndex[] {
    const out: CellIndex[] = [];
    this.cards.forEach((c, i) => c?.kind === 'enemy' && out.push(CellIndex.of(i)));
    return out;
  }

  /**
   * Числа способности по её id — для пассивок и состояний, которые действуют дольше хода
   * («Безумие», клеймо, призраки). У каждой способности одна запись в каталоге.
   */
  paramsOf<A extends AbilityId>(ability: A): Readonly<AbilityParams[A]> {
    return PERK_BY_ABILITY[ability].params;
  }
}
