import type { AttackStyleId } from '../../catalog';
import { BackstabAttack } from './backstab-attack/BackstabAttack';
import { HandAttack } from './hand-attack/HandAttack';
import type { IAttackStrategy } from './interfaces/IAttackStrategy';
import { ShotAttack } from './shot-attack/ShotAttack';

/**
 * Стратегии атаки по id стиля, который выбрала линейка (`LineageDef.attack`) или базовый перк
 * (`AbilityDef.attack`). Стратегии без состояния, поэтому каждая — одна на всю игру.
 */
export const ATTACK_STRATEGIES: Readonly<Record<AttackStyleId, IAttackStrategy>> = {
  hand: new HandAttack(),
  shot: new ShotAttack(),
  backstab: new BackstabAttack(),
};
