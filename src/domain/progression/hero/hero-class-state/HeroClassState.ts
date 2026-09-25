import {
  CLASS_DEFINITIONS,
  type ClassDefinition,
  type ClassId,
  type LineageId,
  type PerkDef,
  type Stats,
} from '../../../catalog';
import { ATTACK_STRATEGIES, type IAttackStrategy } from '../../../combat';

/**
 * Состояние героя «играет за класс» (паттерн State). Всё, что зависит от текущего класса, герой
 * берёт у своего состояния, а метаморфоза переводит того же героя в состояние другого класса.
 *
 * Классы различаются числами и списками, а не поведением, поэтому состояние — один класс на все
 * классы игры, собранный из определения (`ClassDefinition`), а не подкласс на каждый класс.
 * Поведение, которое у линеек действительно разное (как герой атакует), — стратегия линейки
 * (`IAttackStrategy`): состояние выдаёт её по стилю линейки, а не наследует. Состояния неизменяемы
 * и общие на всю игру — по одному на класс (приспособленец).
 */
export class HeroClassState {
  private static readonly states = new Map<ClassId, HeroClassState>();

  private constructor(readonly definition: ClassDefinition) {}

  static of(id: ClassId): HeroClassState {
    let state = HeroClassState.states.get(id);
    if (!state) {
      state = new HeroClassState(CLASS_DEFINITIONS[id]);
      HeroClassState.states.set(id, state);
    }
    return state;
  }

  get id(): ClassId {
    return this.definition.id;
  }

  get lineage(): LineageId {
    return this.definition.lineage.id;
  }

  /** 0 — базовый, 1 — вторая ступень, 2 — финальный. */
  get stage(): 0 | 1 | 2 {
    return this.definition.stage;
  }

  get parent(): ClassId | null {
    return this.definition.parent;
  }

  /** Как герой атакует — стратегия стиля его линейки. */
  get attack(): IAttackStrategy {
    return ATTACK_STRATEGIES[this.definition.lineage.attack];
  }

  /** Классы, в которые ведёт метаморфоза (у финальных — никуда). */
  get next(): readonly ClassId[] {
    return this.definition.next;
  }

  /** Характеристики класса до талантов и снаряжения. */
  getStats(): Readonly<Stats> {
    return this.definition.baseStats;
  }

  /** Способности, которые открывает класс. */
  getAbilities(): readonly PerkDef[] {
    return this.definition.abilities;
  }

  /** Ведёт ли метаморфоза из этого класса в `to` (без проверки ярусов и цены). */
  canBecome(to: ClassId): boolean {
    return this.definition.next.includes(to);
  }
}
