import {
  branchTier,
  CLASSES,
  type ClassId,
  isBranched,
  type PerkDef,
  type TalentPlace,
  type TieredPerkSlot,
} from '../../../catalog';
import { type Ratio, Souls } from '../../../shared';
import type { ISoulPricing } from '../interfaces/ISoulPricing';
import type { SoulPriceTable } from '../interfaces/SoulPriceTable';

/**
 * Цены по таблице ступеней: цена ранга растёт со ступенью цены и ярусом таланта, каждый
 * следующий ранг дороже на долю базы, способность стоит кратно базе своего яруса, каждый
 * следующий уровень перка — дороже первого на долю его цены.
 */
export class StageTablePricing implements ISoulPricing {
  /** После какого яруса талантов открывается способность класса с ярусами — столбец базы. */
  private static readonly PERK_TIER: Readonly<Record<TieredPerkSlot, number>> = {
    start: 0,
    p2: 0,
    p3: 1,
    legend: 2,
  };
  /** Ярусов «Основы» на одну строку цен. */
  private static readonly BASE_TIERS_PER_ROW = 3;

  constructor(
    private readonly table: SoulPriceTable,
    private readonly refundShare: Ratio,
  ) {}

  talentRank(place: TalentPlace, rank: number): Souls {
    const base = this.talentBase(place);
    return Souls.of(Math.round(base * (1 + this.table.rankStep * (rank - 1))));
  }

  talentTotal(place: TalentPlace, rank: number): Souls {
    let sum = 0;
    for (let r = 1; r <= rank; r++) sum += this.talentRank(place, r);
    return Souls.of(sum);
  }

  perk(perk: PerkDef, level: number): Souls {
    if (perk.step === undefined) return this.tieredPerk(perk);
    const col = branchTier(perk.step) - 1;
    const first = this.table.talentBase[this.row(perk.classId)][col] * this.table.branchPerkMul;
    return Souls.of(Math.round(first * (1 + this.table.perkLevelStep * (level - 1))));
  }

  perkTotal(perk: PerkDef, level: number): Souls {
    let sum = 0;
    for (let l = 1; l <= level; l++) sum += this.perk(perk, l);
    return Souls.of(sum);
  }

  metamorphosis(classId: ClassId): Souls {
    const cls = CLASSES[classId];
    const m = this.table.metamorphosis;
    if (isBranched(cls)) return Souls.of(cls.stage === 1 ? m.subclass : m.transitional);
    return Souls.of(cls.stage === 1 ? m.second : m.final);
  }

  refund(spent: number): Souls {
    return Souls.of(Math.floor(spent * this.refundShare));
  }

  /** Перк класса с ярусами: стартовый бесплатен, остальные — кратно базе своего яруса. */
  private tieredPerk(perk: PerkDef): Souls {
    const slot = perk.slot as TieredPerkSlot;
    if (slot === 'start') return Souls.of(0);
    const base = this.table.talentBase[this.row(perk.classId)][StageTablePricing.PERK_TIER[slot]];
    return Souls.of(Math.round(base * this.table.perkMul[slot]));
  }

  /** Базовая цена ранга таланта на его месте. */
  private talentBase(place: TalentPlace): number {
    if (place.tab === 'base') {
      const i = place.tier - 1;
      const per = StageTablePricing.BASE_TIERS_PER_ROW;
      return this.table.talentBase[Math.floor(i / per)][i % per];
    }
    return this.table.talentBase[this.row(place.classId)][place.tier - 1];
  }

  /** Ступень цены класса: у класса с ярусами — его ступень, у классов с ветками — на одну ниже. */
  private row(classId: ClassId): number {
    const cls = CLASSES[classId];
    return isBranched(cls) ? Math.max(0, cls.stage - 1) : cls.stage;
  }
}
