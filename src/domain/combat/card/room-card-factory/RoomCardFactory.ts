import type { EnemyDef } from '../../../catalog/enemies';
import { ELITE } from '../../../catalog/levels';
import type { Card } from '../Card';
import { CardFactory } from '../card-factory/CardFactory';
import type { DeckPlan } from '../card-factory/interfaces/DeckPlan';
import type { RoomCardFactoryInit } from './interfaces/RoomCardFactoryInit';

/** Карты обычной комнаты башни: враги этажа с модификатором захода, добыча и пустые сундуки. */
export class RoomCardFactory extends CardFactory {
  constructor(private readonly init: RoomCardFactoryInit) {
    super();
  }

  createEnemy(def: EnemyDef, elite: boolean): Card {
    const m = this.init.plan.mod;
    const hpMul = (m.hpMul ?? 1) * (elite ? ELITE.hp : 1);
    const atkMul = (m.atkMul ?? 1) * (elite ? ELITE.atk : 1);
    const hp = Math.max(1, Math.round(def.hp * hpMul));
    const atk = Math.max(1, Math.round(def.atk * atkMul));
    return this.make({ kind: 'enemy', defId: def.id, hp, atk, elite });
  }

  createGold(): Card {
    return this.make({ kind: 'gold', value: this.rollGold(4, 9) });
  }

  rollGold(lo: number, hi: number): number {
    const { room, plan, stats: s, rng } = this.init;
    const mul = room.goldScale * (plan.mod.goldMul ?? 1) * (1 + s.luck * 0.05 + s.goldBonus);
    return Math.max(1, Math.round(rng.int(lo, hi) * mul));
  }

  createDeck(): DeckPlan {
    const { plan, rng, enemies, lineage } = this.init;
    const list: Card[] = [];
    const bosses: Card[] = [];
    for (const e of plan.enemies) {
      const def = enemies[e.id];
      if (!def) continue;
      const card = this.createEnemy(def, e.elite);
      (def.boss ? bosses : list).push(card);
    }
    for (let i = 0; i < plan.gold; i++) list.push(this.createGold());
    for (let i = 0; i < plan.chests; i++) list.push(this.createChest());
    // пустые сундуки растягивают комнату: каждый — лишний шаг, а рядом с врагом ещё и удар вдогонку
    for (let i = 0; i < plan.chests + 1; i++) list.push(this.createEmptyChest());
    for (let i = 0; i < plan.heal; i++) list.push(this.createPotion('potion_heal'));
    for (let i = 0; i < plan.regen; i++) list.push(this.createPotion('potion_regen'));
    if (lineage.artifacts && rng.chance(0.7)) list.push(this.createArtifact());
    rng.shuffle(list);
    for (const b of bosses) {
      const from = Math.floor(list.length * 0.7);
      list.splice(rng.int(from, list.length), 0, b);
    }
    return { cards: list, quota: plan.enemies.length, boss: bosses.length > 0 };
  }

  /**
   * Колода бесконечна: пока выход не открыт, карты подсыпаются, и поле никогда не пустеет.
   * Состав тот же, что и в начальной колоде — враги этажа и добыча в тех же долях.
   */
  topUp(deck: Card[]): void {
    if (deck.length >= 9) return;
    const { rng, room, enemies } = this.init;
    const add: Card[] = [];
    for (let i = deck.length; i < 14; i++) {
      const r = rng.next();
      if (r < 0.62) {
        const def = enemies[rng.pick(room.pool)];
        if (def) add.push(this.createEnemy(def, false));
      } else if (r < 0.78) add.push(this.createGold());
      else if (r < 0.84) add.push(this.createChest());
      else if (r < 0.94) add.push(this.createEmptyChest());
      else if (r < 0.98) add.push(this.createPotion('potion_heal'));
      else add.push(this.createPotion('potion_regen'));
    }
    rng.shuffle(add);
    deck.push(...add);
  }
}
