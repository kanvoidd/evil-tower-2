import type { AttackStyleId } from '../../heroes/interfaces/AttackStyleId';
import type { AbilityBehaviorId } from './AbilityBehaviorId';
import type { AbilityBehaviorParams } from './AbilityBehaviorParams';
import type { AbilityId } from './AbilityId';
import type { AbilityKind } from './AbilityKind';
import type { AbilityTarget } from './AbilityTarget';
import type { GoldCost } from './GoldCost';

/**
 * Способность — что она делает: механика, её числа, цена, цель, перезарядка. Где способность
 * стоит в дереве прокачки, решает класс (`ClassDef.perks` или ветки класса), а не она сама.
 * Название и описание — в словарях по id способности (`ability.<id>.name`, `ability.<id>.desc`).
 */
export interface AbilityDefOf<B extends AbilityBehaviorId> {
  readonly id: AbilityId;
  /** Механика боя, которая исполняет способность. */
  readonly behavior: B;
  readonly kind: AbilityKind;
  /**
   * Числа механики: урон, длительности, доли (см. `AbilityBehaviorParams`). В каталоге — первого
   * уровня; у героя — его уровня с правками талантов (`abilityAtLevel`, `withPatch`).
   */
  readonly params: Readonly<AbilityBehaviorParams[B]>;
  /** Числа по уровням перка — по порядку; длина списка — сколько уровней у перка. */
  readonly levels: readonly Readonly<AbilityBehaviorParams[B]>[];
  /** Цена в ресурсе класса. `FULL_BAR` — вся шкала. */
  readonly cost?: number;
  /** Цена золотом из кошеля комнаты (для «Подкупа») — вместо ресурса. */
  readonly goldCost?: GoldCost;
  readonly target?: AbilityTarget;
  /** Один раз за комнату. */
  readonly once?: boolean;
  /** Перезарядка в ходах после применения. */
  readonly cooldown?: number;
  /** Базовое действие (`kind: 'basic'`): каким стилем атаки оно даёт бить дальнего врага. */
  readonly attack?: AttackStyleId;
}

/** Любая способность: объединение по механике, поэтому `switch (a.behavior)` знает вид `a.params`. */
export type AbilityDef = { [B in AbilityBehaviorId]: AbilityDefOf<B> }[AbilityBehaviorId];
