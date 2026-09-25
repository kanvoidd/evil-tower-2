import type { Profile } from '../../domain/account/profile';
import type { BuyResult } from '../../domain/progression/skill-tree/skillTree';
import type { ClassId } from '../../domain/types';

/**
 * Метаморфоза за души: тот же герой становится следующим классом своей линейки. Способности
 * и таланты остаются; метаморфоза попадает в счётчик достижений.
 */
export class Metamorphose {
  constructor(private readonly profile: Profile) {}

  execute(to: ClassId): BuyResult {
    const hero = this.profile.activeHero;
    const r = hero.canMetamorphose(to, this.profile.souls);
    if (!r.ok) return r;
    if (!this.profile.spendSouls(r.cost)) return { ok: false, reason: 'souls' };
    hero.metamorphose(to);
    this.profile.markTutorial('skill');
    this.profile.bump('metamorphoses');
    this.profile.setActiveClass(to);
    return r;
  }
}
