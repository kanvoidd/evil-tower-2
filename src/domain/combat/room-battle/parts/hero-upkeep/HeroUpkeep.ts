import { ITEM_BY_ID } from '../../../../catalog';
import { RoomPart } from '../room-part/RoomPart';

/** Содержание героя: ресурс, лечение, износ оружия и доспеха. */
export class HeroUpkeep extends RoomPart {
  // ------------------------------------------------------------------ удары героя

  spend(cost: number): void {
    this.state.res = Math.max(0, this.state.res - cost);
    this.state.emit({ type: 'resource', now: this.state.res, max: this.state.stats.resMax });
  }

  gain(amount: number): void {
    if (amount <= 0) return;
    this.state.res = Math.min(this.state.stats.resMax, this.state.res + amount);
    this.state.emit({ type: 'resource', now: this.state.res, max: this.state.stats.resMax });
  }

  wearWeapon(): void {
    const w = this.state.weapon;
    if (!w || w.durability <= 0) return;
    w.durability--;
    if (w.durability <= 0) {
      this.state.stats.damage = Math.max(1, this.state.stats.damage - ITEM_BY_ID[w.id].damage);
      this.state.emit({ type: 'break', slot: 'weapon', id: w.id });
    }
  }

  /**
   * Доспех снашивается не больше одного раза за ход. Ход врагов бьёт сразу всеми соседями,
   * и снос за каждый удар сжигал бы броню втрое быстрее, чем на неё зарабатывают.
   */
  wearArmor(): void {
    const a = this.state.armor;
    if (!a || a.durability <= 0 || this.state.armorWorn) return;
    this.state.armorWorn = true;
    a.durability--;
    if (a.durability <= 0) {
      const it = ITEM_BY_ID[a.id];
      this.state.stats.defense = Math.max(0, this.state.stats.defense - it.defense);
      this.state.stats.maxHp = Math.max(1, this.state.stats.maxHp - it.health);
      this.state.hp = Math.min(this.state.hp, this.state.stats.maxHp);
      this.state.emit({ type: 'break', slot: 'armor', id: a.id });
    }
  }

  heal(amount: number, source: 'perk' | 'lifesteal'): void {
    if (amount <= 0 || this.state.hp >= this.state.stats.maxHp) return;
    const h = Math.min(amount, this.state.stats.maxHp - this.state.hp);
    this.state.hp += h;
    this.state.emit({ type: 'heal', amount: h, hp: this.state.hp, source });
  }
}
