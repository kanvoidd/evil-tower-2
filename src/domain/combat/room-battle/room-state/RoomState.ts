import {
  ABILITY_LIST,
  type AbilityBehaviorId,
  type AbilityBehaviorParams,
  type AbilityDef,
  type AbilityDefOf,
  type ConsumableId,
  type EnemyDef,
  type EquipmentSave,
  type LineageDef,
  type RoomDef,
  type RoomModifier,
  type RoomPlan,
  withBehavior,
} from '../../../catalog';
import { CellIndex, Gold, type Rng, Souls } from '../../../shared';
import type { Card } from '../../card/Card';
import type { CardFactory } from '../../card/card-factory/CardFactory';
import type { IEngine } from '../../engine/interfaces/IEngine';
import type { GameEvent } from '../../events';
import type { PlayerStats } from '../../player';
import type { BattleDeps } from '../interfaces/BattleDeps';
import type { BattleInit } from '../interfaces/BattleInit';
import type { BattleTotals } from '../interfaces/BattleTotals';
import type { TrapState } from '../interfaces/TrapState';

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
  armed: AbilityDef | null = null;
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
  /** Ресурс героя в момент применения способности — до оплаты («Перегрузка», сила «Молнии»). */
  castRes = 0;
  freePerkLeft = 0;
  /** Накопленный заряд способностей по id («Заряд» магического выстрела). */
  charges: Record<string, number> = {};
  /** Способности, применённые в этом ходу, — у них заряд не копится. */
  usedThisTurn = new Set<string>();
  /** Ловушки на поле. */
  traps: TrapState[] = [];
  /** «Взведённая ловушка»: способность, выбранная для неё, и задержка в ходах. */
  trapSkill: AbilityDef | null = null;
  trapDelay = 0;
  /** Сколько «Взведённых ловушек» уже поставлено в комнате. */
  armedTrapsUsed = 0;

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
  /** Ходов подряд герой простоял на месте («Затаившийся стрелок»). */
  stillTurns = 0;
  /** Клетка героя в начале хода — ушёл ли он с неё. */
  turnStartCell: CellIndex;
  /** «Ледяной доспех»: сколько ходов ещё держится, прибавка к защите, ответный удар. */
  wardTurns = 0;
  wardDefense = 0;
  wardThorns = 0;

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
  /** Удар сейчас не замечает брони врага («Залп болтом» вплотную). */
  ignoreArmor = false;
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
    this.turnStartCell = this.engine.playerCell;
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

  /** Способность героя с механикой `b` (с числами его уровня и правками талантов), если она есть. */
  ability<B extends AbilityBehaviorId>(b: B): AbilityDefOf<B> | undefined {
    return withBehavior(this.stats.allAbilities, b);
  }

  /**
   * Числа механики — для пассивок и состояний, которые действуют дольше хода («Безумие»,
   * клеймо, слуги): из способности самого героя, которую исполняет эта механика. Если такой
   * у героя нет (проверки собирают бой без неё), — из первой такой способности каталога.
   */
  paramsOf<B extends AbilityBehaviorId>(b: B): Readonly<AbilityBehaviorParams[B]> {
    return (withBehavior(this.stats.allAbilities, b) ?? withBehavior(ABILITY_LIST, b)!).params;
  }
}
