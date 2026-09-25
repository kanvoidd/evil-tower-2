import { DAILY_REWARDS, type DailyReward } from '../../../rewards';
import { DayKey, Gold, Souls } from '../../../shared';
import type { DailyStatus } from '../interfaces/DailyStatus';
import { ProfilePart } from '../profile-part/ProfilePart';

/** Награда дня: раз в календарный день игрока, серия подряд идущих дней ведёт по неделе наград. */
export class DailyRewards extends ProfilePart {
  status(): DailyStatus {
    const today = this.state.calendar.today();
    const { lastClaim, streak } = this.doc.daily;
    const week = DAILY_REWARDS.length;
    if (lastClaim === today) return { available: false, dayIndex: streak % week, streak };
    const cont = !!lastClaim && DayKey.daysBetween(lastClaim, today) === 1;
    const eff = cont ? streak : 0;
    return { available: true, dayIndex: eff % week, streak: eff };
  }

  claim(multiplier = 1): DailyReward | null {
    const st = this.status();
    if (!st.available) return null;
    const r = DAILY_REWARDS[st.dayIndex];
    const wallets = this.parts.wallets;
    if (r.gold) wallets.addGold(Gold.of(r.gold * multiplier));
    if (r.souls) wallets.addSouls(Souls.of(r.souls * multiplier));
    if (r.heal) wallets.heroSave.consumables.potion_heal += r.heal * multiplier;
    if (r.regen) wallets.heroSave.consumables.potion_regen += r.regen * multiplier;
    this.doc.daily = { lastClaim: this.state.calendar.today(), streak: st.streak + 1 };
    this.state.touch();
    return r;
  }
}
