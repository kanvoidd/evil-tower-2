import { CLASSES, type ClassId, type PerkSlot } from '../../../catalog';
import { type Ratio, Souls } from '../../../shared';
import type { ISoulPricing } from '../interfaces/ISoulPricing';
import type { SoulPriceTable } from '../interfaces/SoulPriceTable';

/**
 * Цены по таблице ступеней: цена ранга растёт со ступенью класса и ярусом таланта, каждый
 * следующий ранг дороже на долю базы, способность стоит кратно базе своего яруса.
 */
export class StageTablePricing implements ISoulPricing {
  /** После какого яруса талантов открывается способность — столбец базы для её цены. */
  private static readonly PERK_TIER: Readonly<Record<PerkSlot, number>> = {
    start: 0,
    p2: 0,
    p3: 1,
    legend: 2,
  };

  constructor(
    private readonly table: SoulPriceTable,
    private readonly refundShare: Ratio,
  ) {}

  talentRank(owner: ClassId, tier: number, rank: number): Souls {
    const base = this.base(owner, tier - 1);
    return Souls.of(Math.round(base * (1 + this.table.rankStep * (rank - 1))));
  }

  talentTotal(owner: ClassId, tier: number, rank: number): Souls {
    let sum = 0;
    for (let r = 1; r <= rank; r++) sum += this.talentRank(owner, tier, r);
    return Souls.of(sum);
  }

  perk(owner: ClassId, slot: PerkSlot): Souls {
    if (slot === 'start') return Souls.of(0);
    const base = this.base(owner, StageTablePricing.PERK_TIER[slot]);
    return Souls.of(Math.round(base * this.table.perkMul[slot]));
  }

  metamorphosis(classId: ClassId): Souls {
    const { second, final } = this.table.metamorphosis;
    return Souls.of(CLASSES[classId].stage === 1 ? second : final);
  }

  refund(spent: number): Souls {
    return Souls.of(Math.floor(spent * this.refundShare));
  }

  private base(owner: ClassId, tierIndex: number): number {
    return this.table.talentBase[CLASSES[owner].stage][tierIndex];
  }
}
