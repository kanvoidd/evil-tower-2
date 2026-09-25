import { type AbilityDef, type AbilityId, FULL_BAR } from '../../../../catalog';
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

  // ------------------------------------------------------------------ способности

  /** Доступна ли способность прямо сейчас. */
  perkReady(p: AbilityDef): PerkReadiness {
    if (this.state.over) return { ok: false, reason: 'once' };
    if (p.once && this.state.usedOnce.has(p.id)) return { ok: false, reason: 'once' };
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
      (ABILITY_BEHAVIORS[p.behavior] as IAbility | undefined)?.active?.(this.abilities) ?? false
    );
  }

  /** Цена способности с учётом «первый перк в комнате бесплатен» и «Жнеца». */
  perkCostOf(p: AbilityDef): number {
    if (this.state.freePerkLeft > 0) return 0;
    if (p.cost === FULL_BAR) return this.state.stats.resMax;
    // скидка не опускает цену ниже двух: иначе молния за единицу окупалась бы
    // восстановлением каждого хода, и мана перестала бы что-то значить
    const base = p.cost ?? 0;
    return Math.max(
      Math.min(base, PerkActions.PERK_COST_FLOOR),
      base - this.state.stats.perkCostDown,
    );
  }

  /**
   * Нажатие на кнопку способности: несфокусированные применяются сразу,
   * остальные «заряжаются» — следующее касание поля наводит их на цель.
   */
  usePerk(id: AbilityId): TurnResult {
    // только кнопки самого героя: пассивки и базовое действие нажатием не применяются
    const p = this.state.stats.abilities.find((a) => a.id === id);
    if (!p) return { ok: false, reason: 'invalid', events: this.state.engine.flush() };
    if (this.state.armed?.id === id) {
      this.state.armed = null;
      this.state.swapFirst = null;
      this.state.emit({ type: 'armed', ability: null });
      return { ok: true, events: this.state.engine.flush() };
    }
    const ready = this.perkReady(p);
    if (!ready.ok) return { ok: false, reason: ready.reason, events: this.state.engine.flush() };
    if (p.target === 'self') {
      // «Откат времени» возвращает к началу прошлого хода: снимок своего хода его бы затёр.
      // Если отматывать нечего (первый ход комнаты), снимок берётся — откат вернёт и свою цену.
      this.parts.flow.beginTurn(p.behavior !== 'rewind' || !this.state.snapshot);
      this.payPerk(p);
      this.state.emit({ type: 'perk', ability: p.id });
      this.runAbility(p, Grid.NO_CELL);
      this.afterPerk();
      this.parts.flow.finishTurn();
      return { ok: true, events: this.state.engine.flush() };
    }
    this.state.armed = p;
    this.state.swapFirst = null;
    this.state.emit({ type: 'armed', ability: p.id });
    return { ok: true, events: this.state.engine.flush() };
  }

  cancelPerk(): GameEvent[] {
    if (!this.state.armed) return [];
    this.state.armed = null;
    this.state.swapFirst = null;
    return [{ type: 'armed', ability: null }];
  }

  /** Подходит ли клетка под заряженную способность. */
  perkTargetOk(p: AbilityDef, cell: CellIndex): boolean {
    if (cell === this.state.playerCell) return false;
    const card = this.state.cards[cell];
    if (!card) return false;
    // Клеймо, приговор и кукла вуду держатся до смерти цели — вешать их второй раз
    // значит выбросить ход, поэтому такая цель просто не подсвечивается.
    if (card.kind === 'exit' || card.kind === 'ghost') return false;
    if ((ABILITY_BEHAVIORS[p.behavior] as IAbility | undefined)?.targetable?.(card) === false)
      return false;
    return this.inReach(p, card, cell);
  }

  /** Подходит ли карта под вид цели способности (`AbilityDef.target`). */
  private inReach(p: AbilityDef, card: Card, cell: CellIndex): boolean {
    switch (p.target) {
      case 'enemy':
        return card.kind === 'enemy';
      case 'adjacent':
        return card.kind === 'enemy' && Grid.neighbors(this.state.playerCell).includes(cell);
      // выстрел идёт ЧЕРЕЗ карту: вплотную из него не бьют
      case 'line':
        return (
          card.kind === 'enemy' &&
          Grid.sameLine(this.state.playerCell, cell) &&
          Grid.dist(this.state.playerCell, cell) > 1
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

  aimPerk(cell: CellIndex): TurnResult {
    const p = this.state.armed!;
    if (!this.perkTargetOk(p, cell))
      return { ok: false, reason: 'range', events: this.state.engine.flush() };
    if (p.target === 'two' && this.state.swapFirst === null) {
      this.state.swapFirst = cell;
      this.state.emit({ type: 'armed', ability: p.id });
      return { ok: true, events: this.state.engine.flush() };
    }
    this.state.armed = null;
    this.parts.flow.beginTurn();
    this.payPerk(p);
    this.state.emit({ type: 'perk', ability: p.id });
    this.runAbility(p, cell);
    this.state.swapFirst = null;
    this.afterPerk();
    this.parts.flow.finishTurn();
    return { ok: true, events: this.state.engine.flush() };
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

  // ------------------------------------------------------------------ способности: реализация

  /** Применяет способность, пометив урон как «от способности» — тогда работают таланты-синергии. */
  private runAbility(p: AbilityDef, cell: CellIndex): void {
    const target = cell >= 0 ? this.state.cards[cell] : null;
    if (target?.kind === 'enemy') this.state.engaged.add(target.uid);
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
      .some((e) => e.type === 'fx' || (e.type === 'attack' && e.by === 'player'));
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
