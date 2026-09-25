import type { CritRoll } from './CritRoll';

/**
 * Правило крита: `true` — крит, `undefined` — решать следующему правилу. Последнее правило
 * политики решает всегда. Правило может хранить своё состояние на один бой (счётчик, «первый крит»).
 */
export interface ICritRule {
  decide(roll: CritRoll): boolean | undefined;
}
