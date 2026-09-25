import { type ConsumableId } from '../../../../catalog';
import { type CellIndex, Gold } from '../../../../shared';
import { ConsumableBalance, LootBalance } from '../../../balance';
import type { Loot } from '../../../events';
import type { TurnResult } from '../../interfaces/TurnResult';
import { RoomPart } from '../room-part/RoomPart';

/** Добыча и расходники: подбор карт, сундуки, зелья и артефакт. */
export class RoomLoot extends RoomPart {
  // ------------------------------------------------------------------ расходники

  useItem(id: ConsumableId): TurnResult {
    if (this.state.over || this.state.consumables[id] <= 0)
      return { ok: false, events: this.state.engine.flush() };
    if (id === 'potion_heal') {
      if (this.state.hp >= this.state.stats.maxHp)
        return { ok: false, events: this.state.engine.flush() };
      this.state.consumables[id]--;
      const heal = Math.min(this.healPotionAmount(), this.state.stats.maxHp - this.state.hp);
      this.state.hp += heal;
      this.state.emit({ type: 'heal', amount: heal, hp: this.state.hp, source: 'potion' });
      if (this.state.stats.healShield > 0) {
        this.state.shield += Math.round(this.state.stats.maxHp * this.state.stats.healShield);
        this.state.emit({ type: 'shield', now: this.state.shield });
      }
    } else if (id === 'potion_regen') {
      if (this.state.res >= this.state.stats.resMax && this.state.boost > 0)
        return { ok: false, events: this.state.engine.flush() };
      this.state.consumables[id]--;
      this.state.res = this.state.stats.resMax;
      this.state.boost = ConsumableBalance.regenBoostTurns;
      this.state.emit({ type: 'resource', now: this.state.res, max: this.state.stats.resMax });
      this.state.emit({ type: 'boost', turns: this.state.boost });
    } else {
      if (!this.state.lineageDef.artifacts) return { ok: false, events: this.state.engine.flush() };
      const targets = this.state.enemyCells();
      if (!targets.length) return { ok: false, events: this.state.engine.flush() };
      this.state.consumables[id]--;
      this.state.engine.resetVacated();
      const dmg = this.artifactDamage();
      this.state.emit({ type: 'artifact', cells: targets });
      for (const t of targets) this.parts.hits.damageEnemy(t, dmg, false);
      this.state.engine.refill();
    }
    return { ok: true, events: this.state.engine.flush() };
  }

  /** Зелье лечит долю максимального здоровья — иначе на десятом этаже оно бесполезно. */
  healPotionAmount(): number {
    return Math.max(
      1,
      Math.round(
        this.state.stats.maxHp * ConsumableBalance.healPotionPct * (1 + this.state.stats.potionPct),
      ),
    );
  }

  artifactDamage(): number {
    return Math.max(
      1,
      Math.round(this.state.stats.damage * 2.5 * (1 + this.state.stats.artifactMul)),
    );
  }

  take(cell: CellIndex): void {
    const card = this.state.cards[cell];
    if (!card) return;
    this.state.engine.discard(cell);
    if (card.kind === 'gold') {
      this.state.totals.gold = Gold.of(this.state.totals.gold + card.value);
      this.state.emit({ type: 'gold', cell, amount: card.value });
    } else if (card.kind === 'chest') {
      this.openChest(cell, card.defId === 'chest_empty');
    } else if (
      card.kind === 'potion_heal' ||
      card.kind === 'potion_regen' ||
      card.kind === 'artifact'
    ) {
      this.state.consumables[card.kind]++;
      this.state.emit({
        type: 'pickup',
        cell,
        item: card.kind,
        count: this.state.consumables[card.kind],
      });
    }
  }

  private rollConsumable(): ConsumableId {
    const r = this.state.rng.next();
    if (this.state.lineageDef.artifacts)
      return r < 0.4 ? 'potion_heal' : r < 0.7 ? 'potion_regen' : 'artifact';
    return r < 0.55 ? 'potion_heal' : 'potion_regen';
  }

  private openChest(cell: CellIndex, empty = false): void {
    const { rng, stats: s } = this.state;
    const loot: Loot[] = [];
    // пустой сундук снаружи не отличить: открыл — а там паутина
    if (empty) {
      this.state.emit({ type: 'chest', cell, loot, empty: true });
      return;
    }
    const gold = this.state.factory.rollGold(10, 24);
    loot.push({ kind: 'gold', amount: gold });
    this.state.totals.gold = Gold.of(this.state.totals.gold + gold);
    this.state.emit({ type: 'gold', cell, amount: gold });
    let chance = LootBalance.chestItemChance + s.luck * 0.02;
    for (let i = 0; i < 2 && rng.chance(chance); i++) {
      const item = this.rollConsumable();
      this.state.consumables[item]++;
      loot.push({ kind: item, amount: 1 });
      this.state.emit({ type: 'pickup', cell, item, count: this.state.consumables[item] });
      chance = LootBalance.chestBonusItemChance;
    }
    this.state.emit({ type: 'chest', cell, loot });
  }
}
