import type { PlayerStats } from '../player';
import type { CritRoll } from './interfaces/CritRoll';
import type { ICritRule } from './interfaces/ICritRule';
import { AbilityCrit } from './rules/AbilityCrit';
import { ChanceCrit } from './rules/ChanceCrit';
import { EveryNthCrit } from './rules/EveryNthCrit';
import { HuntersMarkCrit } from './rules/HuntersMarkCrit';
import { RoomOpeningCrit } from './rules/RoomOpeningCrit';

/**
 * Политика крита на один бой: правила по порядку, первое сработавшее решает. Порядок правил —
 * это и порядок бросков генератора случайных чисел, поэтому он часть баланса.
 */
export class CritPolicy {
  constructor(private readonly rules: readonly ICritRule[]) {}

  /** Правила героя: «первый крит комнаты», «Метка охотника», крит способностей, «каждый третий», шанс. */
  static forHero(stats: PlayerStats): CritPolicy {
    const rules: ICritRule[] = [];
    if (stats.roomCrit) rules.push(new RoomOpeningCrit());
    if (stats.passives.has('hunters_mark')) rules.push(new HuntersMarkCrit());
    if (stats.abilityCrit > 0) rules.push(new AbilityCrit(stats.abilityCrit));
    if (stats.everyThird) rules.push(new EveryNthCrit(EveryNthCrit.THIRD));
    rules.push(new ChanceCrit(stats.crit));
    return new CritPolicy(rules);
  }

  decide(roll: CritRoll): boolean {
    for (const rule of this.rules) {
      const verdict = rule.decide(roll);
      if (verdict !== undefined) return verdict;
    }
    return false;
  }
}
