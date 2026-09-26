import { type AbilityDef, type AbilityDefOf, type AbilityId, FULL_BAR } from '../../../../catalog';
import { type CellIndex, Gold } from '../../../../shared';
import { ABILITY_BEHAVIORS, type AbilityContext, type IAbility } from '../../../abilities';
import type { Card } from '../../../card/Card';
import { Grid } from '../../../engine/grid/Grid';
import type { GameEvent } from '../../../events';
import type { PerkReadiness } from '../../interfaces/PerkReadiness';
import type { TurnResult } from '../../interfaces/TurnResult';
import type { RoomState } from '../../room-state/RoomState';
import { BattleAbilityContext } from '../ability-context/BattleAbilityContext';
import type { RoomParts } from '../interfaces/RoomParts';
import { RoomPart } from '../room-part/RoomPart';

/**
 * Способности в бою: готовность, цена, заряд и наведение, применение через реестр механик.
 * «Перк» в именах методов — кнопка способности на поле; способность адресуется по её id.
 */
export class PerkActions extends RoomPart {
  /** Потолок «защиты после способности»: ослабляет удар, но никогда не гасит его целиком. */
  static readonly PERK_GUARD_CAP = 0.5;
  /** Ниже этой цены талант-скидка способность не удешевляет. */
  static readonly PERK_COST_FLOOR = 2;

  /** Бой глазами способностей. */
  private readonly abilities: AbilityContext;

  constructor(state: RoomState, parts: RoomParts) {
    super(state, parts);
    this.abilities = new BattleAbilityContext(state, parts);
  }

  // ------------------------------------------------------------------ готовность и цена

  /** Доступна ли способность прямо сейчас. */
  perkReady(p: AbilityDef): PerkReadiness {
    if (this.state.over) return { ok: false, reason: 'once' };
    if (p.once && this.state.usedOnce.has(p.id)) return { ok: false, reason: 'once' };
    if (p.behavior === 'armed_trap' && this.state.armedTrapsUsed >= p.params.charges)
      return { ok: false, reason: 'once' };
    if (this.cooldownOf(p) > 0) return { ok: false, reason: 'cooldown' };
    if (p.goldCost !== undefined) {
      return this.state.totals.gold >= p.goldCost.min
        ? { ok: true }
        : { ok: false, reason: 'gold' };
    }
    // Уже действующее усиление нельзя навесить второй раз — кнопка гаснет,
    // иначе ход и ресурс уходят впустую.
    if (this.buffActive(p)) return { ok: false, reason: 'active' };
    const cost = this.perkCostOf(p);
    if (cost > this.state.res) return { ok: false, reason: 'resource' };
    return { ok: true };
  }

  /** Сколько ходов осталось до готовности способности. */
  cooldownOf(p: AbilityDef): number {
    return this.state.cooldowns[p.id] ?? 0;
  }

  /** Держится ли уже эффект этой способности. */
  private buffActive(p: AbilityDef): boolean {
    return (
      (ABILITY_BEHAVIORS[p.behavior] as IAbility | undefined)?.active?.(this.abilities, p) ?? false
    );
  }

  /** Цена способности с учётом «первый перк в комнате бесплатен». */
  perkCostOf(p: AbilityDef): number {
    if (this.state.freePerkLeft > 0) return 0;
    if (p.cost === FULL_BAR) return this.state.stats.resMax;
    // скидка не опускает цену ниже двух: иначе способность за единицу окупалась бы
    // восстановлением каждого хода, и ресурс перестал бы что-то значить
    const base = p.cost ?? 0;
    return Math.max(
      Math.min(base, PerkActions.PERK_COST_FLOOR),
      base - this.state.stats.perkCostDown,
    );
  }

  // ------------------------------------------------------------------ кнопка и наведение

  /**
   * Нажатие на кнопку способности: несфокусированные применяются сразу,
   * остальные «заряжаются» — следующее касание поля наводит их на цель. Пока заряжена
   * «Взведённая ловушка», кнопки других способностей выбирают, чем она сработает.
   */
  usePerk(id: AbilityId): TurnResult {
    // только кнопки самого героя: пассивки и базовое действие нажатием не применяются
    const p = this.state.stats.abilities.find((a) => a.id === id);
    if (!p) return { ok: false, reason: 'invalid', events: this.state.engine.flush() };
    const armed = this.state.armed;
    if (armed?.id === id) {
      this.disarm();
      this.state.emit({ type: 'armed', ability: null });
      return { ok: true, events: this.state.engine.flush() };
    }
    if (armed?.behavior === 'armed_trap') return this.pickTrapSkill(armed, p);
    const ready = this.perkReady(p);
    if (!ready.ok) return { ok: false, reason: ready.reason, events: this.state.engine.flush() };
    if (p.target === 'self') {
      this.parts.flow.beginTurn();
      this.beginCast(p);
      this.payPerk(p);
      this.state.emit({ type: 'perk', ability: p.id });
      this.cast(p, Grid.NO_CELL);
      this.afterPerk();
      this.parts.flow.finishTurn();
      return { ok: true, events: this.state.engine.flush() };
    }
    this.disarm();
    this.state.armed = p;
    this.state.emit({ type: 'armed', ability: p.id });
    return { ok: true, events: this.state.engine.flush() };
  }

  cancelPerk(): GameEvent[] {
    if (!this.state.armed) return [];
    this.disarm();
    return [{ type: 'armed', ability: null }];
  }

  private disarm(): void {
    this.state.armed = null;
    this.state.swapFirst = null;
    this.state.trapSkill = null;
    this.state.trapDelay = 0;
  }

  /**
   * «Взведённая ловушка»: нажатие на кнопку способности выбирает её, повторные нажатия той же
   * кнопки переключают задержку (1 → 2 → … → предел → 1).
   */
  private pickTrapSkill(trap: AbilityDefOf<'armed_trap'>, p: AbilityDef): TurnResult {
    if (!this.canArmWith(trap, p))
      return { ok: false, reason: 'invalid', events: this.state.engine.flush() };
    if (this.state.trapSkill?.id === p.id)
      this.state.trapDelay = (this.state.trapDelay % trap.params.maxDelay) + 1;
    else {
      this.state.trapSkill = p;
      this.state.trapDelay = 1;
    }
    this.state.emit({
      type: 'armed',
      ability: trap.id,
      skill: p.id,
      delay: this.state.trapDelay,
    });
    return { ok: true, events: this.state.engine.flush() };
  }

  /** Подходит ли способность для «Взведённой ловушки»: кнопка с целью на клетке, готова, по карману. */
  canArmWith(trap: AbilityDef, p: AbilityDef): boolean {
    if (p.id === trap.id || p.behavior === 'armed_trap') return false;
    if (p.target === 'self' || p.target === 'two' || p.target === undefined) return false;
    if (!this.perkReady(p).ok) return false;
    return this.perkCostOf(trap) + this.perkCostOf(p) <= this.state.res;
  }

  /** Подходит ли клетка под заряженную способность. */
  perkTargetOk(p: AbilityDef, cell: CellIndex): boolean {
    if (cell === this.state.playerCell) return false;
    const card = this.state.cards[cell];
    if (p.behavior === 'armed_trap') return !!this.state.trapSkill && this.cellOk(card, cell);
    if (p.target === 'cell') return this.cellOk(card, cell) && this.behaviorOk(p, card, cell);
    if (!card) return false;
    // Приговор и заражение держатся до смерти цели — вешать их второй раз значит выбросить
    // ход, поэтому такая цель просто не подсвечивается.
    if (card.kind === 'exit' || card.kind === 'ghost') return false;
    return this.inReach(p, card, cell) && this.behaviorOk(p, card, cell);
  }

  /** Клетка для ловушки или пробежки: не переход и без ловушки. */
  private cellOk(card: Card | null, cell: CellIndex): boolean {
    return card?.kind !== 'exit' && !this.parts.traps.hasTrap(cell);
  }

  /** Свои правила цели у механики (например, заражение не вешают дважды). */
  private behaviorOk(p: AbilityDef, card: Card | null, cell: CellIndex): boolean {
    const b = ABILITY_BEHAVIORS[p.behavior] as IAbility | undefined;
    if (card && b?.targetable?.(card, p) === false) return false;
    return b?.targetOk?.(this.abilities, p, cell) ?? true;
  }

  /** Подходит ли карта под вид цели способности (`AbilityDef.target`). */
  private inReach(p: AbilityDef, card: Card, cell: CellIndex): boolean {
    const hero = this.state.playerCell;
    switch (p.target) {
      case 'enemy':
        return card.kind === 'enemy';
      case 'adjacent':
        return card.kind === 'enemy' && Grid.neighbors(hero).includes(cell);
      // выстрел идёт ЧЕРЕЗ карту: вплотную из него не бьют
      case 'line':
        return card.kind === 'enemy' && Grid.sameLine(hero, cell) && Grid.dist(hero, cell) > 1;
      case 'ray':
        return card.kind === 'enemy' && Grid.sameLine(hero, cell);
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

  aimPerk(cell: CellIndex): TurnResult {
    const p = this.state.armed!;
    if (!this.perkTargetOk(p, cell))
      return { ok: false, reason: 'range', events: this.state.engine.flush() };
    if (p.target === 'two' && this.state.swapFirst === null) {
      this.state.swapFirst = cell;
      this.state.emit({ type: 'armed', ability: p.id });
      return { ok: true, events: this.state.engine.flush() };
    }
    if (p.behavior === 'armed_trap') return this.setArmedTrap(p, cell);
    this.state.armed = null;
    this.parts.flow.beginTurn();
    this.beginCast(p);
    this.payPerk(p);
    this.state.emit({ type: 'perk', ability: p.id });
    this.cast(p, cell);
    this.state.swapFirst = null;
    this.afterPerk();
    this.parts.flow.finishTurn();
    return { ok: true, events: this.state.engine.flush() };
  }

  /** «Взведённая ловушка» встаёт на клетку: платятся её цена и цена выбранной способности. */
  private setArmedTrap(trap: AbilityDefOf<'armed_trap'>, cell: CellIndex): TurnResult {
    const skill = this.state.trapSkill!;
    const delay = this.state.trapDelay;
    this.disarm();
    this.parts.flow.beginTurn();
    this.beginCast(trap);
    this.payPerk(trap);
    this.payPerk(skill);
    this.state.armedTrapsUsed++;
    this.state.emit({ type: 'perk', ability: trap.id });
    this.state.emit({ type: 'cast', ability: trap.id, cells: [cell] });
    this.parts.traps.placeArmed(cell, skill, delay);
    this.afterPerk();
    this.parts.flow.finishTurn();
    return { ok: true, events: this.state.engine.flush() };
  }

  /** Перед оплатой: ресурс в момент применения и отметка «способность применена в этом ходу». */
  private beginCast(p: AbilityDef): void {
    this.state.castRes = this.state.res;
    this.state.usedThisTurn.add(p.id);
  }

  private payPerk(p: AbilityDef): void {
    if (p.once) this.state.usedOnce.add(p.id);
    // +1: перезарядка тикает в конце того же хода, поэтому «кулдаун 1» = пропуск одного хода
    if (p.cooldown) this.state.cooldowns[p.id] = p.cooldown + 1;
    if (p.goldCost !== undefined) {
      const pay = Math.max(p.goldCost.min, Math.round(this.state.totals.gold * p.goldCost.share));
      this.state.totals.gold = Gold.of(Math.max(0, this.state.totals.gold - pay));
      this.state.emit({ type: 'spend', amount: pay });
      return;
    }
    const cost = this.perkCostOf(p);
    if (this.state.freePerkLeft > 0) this.state.freePerkLeft--;
    if (cost > 0) this.parts.upkeep.spend(cost);
  }

  /**
   * «Кровавая пелена», «Дымовая шашка», «Абсолютная защита»: после способности следующий удар слабее.
   * Не больше чем вдвое: раньше «Абсолютная защита» гасила удар целиком, и маг, который кастует
   * каждый ход, становился неуязвим.
   */
  afterPerk(): void {
    const s = this.state.stats;
    if (s.perkDef > 0)
      this.state.perkGuard = Math.max(
        this.state.perkGuard,
        Math.min(PerkActions.PERK_GUARD_CAP, s.perkDef),
      );
    if (s.abilityShield > 0 && !this.state.over) {
      this.state.shield += Math.max(1, Math.round(s.maxHp * s.abilityShield));
      this.state.emit({ type: 'shield', now: this.state.shield });
    }
  }

  // ------------------------------------------------------------------ применение

  /**
   * «Взведённая ловушка» сработала: способность применяется к своей клетке без хода героя и без
   * оплаты (её заплатили, когда ставили ловушку). Цель не подходит — ловушка сработала впустую.
   */
  castDelayed(p: AbilityDef, cell: CellIndex): void {
    if (!this.fitsCell(p, cell)) {
      this.state.emit({ type: 'cast', ability: p.id, cells: [cell] });
      return;
    }
    this.state.castRes = this.state.res;
    this.cast(p, cell);
  }

  /** Подходит ли клетка под способность без учёта досягаемости героя (для отложенного применения). */
  private fitsCell(p: AbilityDef, cell: CellIndex): boolean {
    if (cell === this.state.playerCell) return false;
    const card = this.state.cards[cell];
    if (p.target === 'cell') return this.cellOk(card, cell);
    if (!card || card.kind === 'exit' || card.kind === 'ghost') return false;
    if (p.target === 'card') return card.kind !== 'enemy';
    if (p.target === 'any_card') return true;
    return card.kind === 'enemy' && this.behaviorOk(p, card, cell);
  }

  /** Применяет способность, пометив урон как «от способности» — тогда работают таланты-синергии. */
  private cast(p: AbilityDef, cell: CellIndex): void {
    const target = cell >= 0 ? this.state.cards[cell] : null;
    if (target?.kind === 'enemy' && this.state.acting) this.state.engaged.add(target.uid);
    this.state.inAbility = true;
    this.state.abilityCost = this.perkCostOf(p);
    const mark = this.state.engine.mark();
    try {
      this.applyAbility(p, cell);
    } finally {
      this.state.inAbility = false;
      this.state.abilityCost = 0;
    }
    // У каждой способности есть своя вспышка. Если реализация не нарисовала ничего сама
    // (усиления, лечение, щиты), показываем её вспышку на герое или на цели — стиль выбирает показ.
    const drew = this.state.engine
      .since(mark)
      .some(
        (e) => e.type === 'fx' || e.type === 'cast' || (e.type === 'attack' && e.by === 'player'),
      );
    if (!drew)
      this.state.engine.insert(mark, {
        type: 'cast',
        ability: p.id,
        cells: [cell >= 0 ? cell : this.state.playerCell],
      });
  }

  /** Способность делает своё дело — реестр механик; цель и поле — на момент применения. */
  private applyAbility(p: AbilityDef, cell: CellIndex): void {
    const behavior = ABILITY_BEHAVIORS[p.behavior] as IAbility | undefined;
    behavior?.apply(this.abilities, {
      ability: p,
      cell,
      target: cell >= 0 ? this.state.cards[cell] : null,
      enemies: this.state.enemyCells(),
    });
  }
}
