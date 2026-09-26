import { type CellIndex } from '../../../../shared';
import type { Card } from '../../../card/Card';
import { Grid } from '../../../engine/grid/Grid';
import { UNTIL_DEATH } from '../../../events';
import { RoomPart } from '../room-part/RoomPart';

/**
 * Статусы на врагах и их ход: горение (и его взрыв), яд, кровотечение, ослабление, хрупкая броня,
 * оглушение, клеймо, заражение, лечение врагов; ход слуг героя.
 */
export class StatusEffects extends RoomPart {
  // ------------------------------------------------------------------ статусы

  /** Поджог: тики копятся на цели. */
  applyBurn(cell: CellIndex, dmg: number, ticks: number): void {
    const c = this.enemyAt(cell);
    if (!c || dmg <= 0 || ticks <= 0) return;
    c.addBurn(dmg, ticks);
    this.state.emit({ type: 'status', cell, uid: c.uid, kind: 'burn', turns: c.burn });
  }

  /**
   * Взрыв горения: цель получает `selfMul`, соседи — `splashMul` от всего накопленного горения
   * (урон тика × оставшиеся тики); горение сгорает.
   */
  explodeBurn(cell: CellIndex, selfMul: number, splashMul: number): void {
    const c = this.enemyAt(cell);
    if (!c || c.burn <= 0) return;
    const stored = c.burnDmg * c.burn;
    c.extinguish();
    this.state.emit({ type: 'status', cell, uid: c.uid, kind: 'burn', turns: 0 });
    this.state.emit({ type: 'fx', cells: [cell], style: 'explosion' });
    const splash = Math.round(stored * splashMul);
    if (splash > 0) this.parts.hits.splashNeighbors(cell, splash);
    this.parts.hits.damageEnemy(cell, Math.max(1, Math.round(stored * selfMul)), false);
  }

  applyPoison(cell: CellIndex, dmg: number, turns: number): void {
    const c = this.enemyAt(cell);
    if (!c || dmg <= 0) return;
    c.poisonWith(dmg, turns);
    this.state.emit({ type: 'status', cell, uid: c.uid, kind: 'poison', turns: c.poison });
  }

  applyBleed(cell: CellIndex, dmg: number, turns: number): void {
    const c = this.enemyAt(cell);
    if (!c || dmg <= 0 || turns <= 0) return;
    c.bleedWith(dmg, turns);
    this.state.emit({ type: 'status', cell, uid: c.uid, kind: 'bleed', turns: c.bleed });
  }

  applyStun(cell: CellIndex, turns = 1): void {
    const c = this.enemyAt(cell);
    if (!c) return;
    c.stunFor(turns);
    this.state.emit({ type: 'status', cell, uid: c.uid, kind: 'stun', turns: c.stun });
  }

  /** Ослабление: враг бьёт слабее на долю `share` ещё `turns` ходов. */
  applyWeaken(cell: CellIndex, share: number, turns: number): void {
    const c = this.enemyAt(cell);
    if (!c || share <= 0 || turns <= 0) return;
    c.weaken(share, turns);
    this.state.emit({ type: 'status', cell, uid: c.uid, kind: 'weak', turns: c.weak });
  }

  /** Хрупкая броня: броня врага меньше на долю `share` ещё `turns` ходов. */
  applyArmorBreak(cell: CellIndex, share: number, turns: number): void {
    const c = this.enemyAt(cell);
    if (!c || share <= 0 || turns <= 0) return;
    c.breakArmor(share, turns);
    this.state.emit({ type: 'status', cell, uid: c.uid, kind: 'brittle', turns: c.brittle });
  }

  /** Заражение скверной: умирая, враг взорвётся; повторно не заражается. */
  applyInfect(cell: CellIndex, blast: number, spread: number): void {
    const c = this.enemyAt(cell);
    if (!c || c.infect) return;
    c.infect = { blast, spread };
    this.state.emit({ type: 'status', cell, uid: c.uid, kind: 'infect', turns: UNTIL_DEATH });
  }

  jumpMark(from: CellIndex): void {
    let best = Grid.NO_CELL;
    let bestD = Infinity;
    for (const i of Grid.CELLS) {
      const c = this.state.cards[i];
      if (c?.kind !== 'enemy' || c.mark > 0) continue;
      const d = Grid.dist(from, i);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best < 0) return;
    const c = this.state.cards[best]!;
    c.mark = this.state.paramsOf('chain_mark').turns;
    this.state.emit({ type: 'status', cell: best, uid: c.uid, kind: 'mark', turns: c.mark });
  }

  /** Клеймо сработало: не-босс гибнет, босс теряет `bossHpShare` максимального здоровья. */
  reapMarked(cell: CellIndex, bossHpShare: number): void {
    const e = this.state.cards[cell];
    if (!e || e.kind !== 'enemy') return;
    if (this.state.enemies[e.defId].boss)
      this.parts.hits.damageEnemy(cell, Math.max(1, Math.round(e.maxHp * bossHpShare)), true);
    else this.parts.deaths.killEnemy(cell);
  }

  /** Эффекты со временем: горение, яд, кровотечение, клеймо, ослабления, лечение врагов, слуги. */
  tickStatuses(): void {
    for (const i of Grid.CELLS) {
      if (this.state.over) break;
      this.tickEnemy(i);
    }
    // слуги бьют соседей крестом и тают
    this.tickServants();
    // яд на герое
    if (this.state.playerPoison > 0 && !this.state.over) {
      this.state.playerPoison--;
      this.parts.enemyTurn.hurtPlayer(this.state.playerPoisonDmg, Grid.NO_CELL, true);
    }
  }

  /** Ход статусов одного врага. Каждый шаг заново смотрит на клетку: враг мог погибнуть. */
  private tickEnemy(i: CellIndex): void {
    const c = this.enemyAt(i);
    if (!c || this.tickBurn(i, c)) return;
    const alive = this.enemyAt(i);
    if (!alive || this.tickPoison(i, alive)) return;
    const bleeding = this.enemyAt(i);
    if (!bleeding || this.tickBleed(i, bleeding)) return;
    const still = this.enemyAt(i);
    if (!still || this.tickMark(i, still)) return;
    const last = this.enemyAt(i);
    if (!last) return;
    this.tickDebuffs(i, last);
    this.regenerate(i, last);
  }

  private enemyAt(i: CellIndex): Card | null {
    const c = this.state.cards[i];
    return c?.kind === 'enemy' ? c : null;
  }

  /** Горение: в ход поджога не жжёт. Возвращает true, если враг сгорел. */
  private tickBurn(i: CellIndex, c: Card): boolean {
    if (c.burn > 0 && c.burnNew) c.burnNew = false;
    else if (c.burn > 0) {
      c.burn--;
      this.state.emit({ type: 'status', cell: i, uid: c.uid, kind: 'burn', turns: c.burn });
      return this.parts.hits.damageEnemy(i, c.burnDmg, false);
    }
    return false;
  }

  /** Яд. Возвращает true, если враг погиб. */
  private tickPoison(i: CellIndex, c: Card): boolean {
    if (c.poison <= 0) return false;
    c.poison--;
    this.state.emit({ type: 'status', cell: i, uid: c.uid, kind: 'poison', turns: c.poison });
    return this.parts.hits.damageEnemy(i, c.poisonDmg, false);
  }

  /** Кровотечение. Возвращает true, если враг погиб. */
  private tickBleed(i: CellIndex, c: Card): boolean {
    if (c.bleed <= 0) return false;
    c.bleed--;
    this.state.emit({ type: 'status', cell: i, uid: c.uid, kind: 'bleed', turns: c.bleed });
    return this.parts.hits.damageEnemy(i, c.bleedDmg, false);
  }

  /** Клеймо смерти: когда истекает, забирает цель. Возвращает true, если забрало. */
  private tickMark(i: CellIndex, c: Card): boolean {
    if (c.mark <= 0) return false;
    c.mark--;
    this.state.emit({ type: 'status', cell: i, uid: c.uid, kind: 'mark', turns: c.mark });
    if (c.mark !== 0) return false;
    this.reapMarked(i, this.state.paramsOf('death_mark').bossHpShare);
    return true;
  }

  /** Ослабление и хрупкая броня отсчитывают ходы. */
  private tickDebuffs(i: CellIndex, c: Card): void {
    if (c.weak > 0) {
      c.weak--;
      if (c.weak === 0) c.weakShare = 0;
      this.state.emit({ type: 'status', cell: i, uid: c.uid, kind: 'weak', turns: c.weak });
    }
    if (c.brittle > 0) {
      c.brittle--;
      if (c.brittle === 0) c.brittleShare = 0;
      this.state.emit({ type: 'status', cell: i, uid: c.uid, kind: 'brittle', turns: c.brittle });
    }
  }

  /** Лечение врага со свойством «регенерация». */
  private regenerate(i: CellIndex, c: Card): void {
    const def = this.state.enemies[c.defId];
    if (!def?.regen || c.hp >= c.maxHp) return;
    c.hp = Math.min(c.maxHp, c.hp + Math.max(1, Math.round(c.maxHp * def.regen)));
    this.state.emit({ type: 'hit', cell: i, amount: 0, crit: false, target: 'enemy', hp: c.hp });
  }

  // ------------------------------------------------------------------ слуги

  /**
   * Каждый слуга бьёт соседнего врага крестом (вверх, вниз, влево, вправо) — как базовая атака
   * героя, — и тот отвечает слуге, как ответил бы герою. Потом слуга тает на ход.
   */
  private tickServants(): void {
    for (const i of Grid.CELLS) {
      if (this.state.over) break;
      const g = this.state.cards[i];
      if (g?.kind !== 'ghost') continue;
      const target = this.servantTarget(i);
      if (target >= 0) this.servantStrike(i, g, target);
      if (this.state.cards[i] !== g) continue;
      g.ttl = (g.ttl ?? 1) - 1;
      if (g.ttl <= 0) this.dropServant(i);
      else this.state.emit({ type: 'status', cell: i, uid: g.uid, kind: 'servant', turns: g.ttl });
    }
  }

  /** Цель слуги: соседний враг, у которого меньше всего здоровья, — так удар чаще добивает. */
  private servantTarget(i: CellIndex): CellIndex {
    const targets = Grid.neighbors(i).filter((n) => this.state.cards[n]?.kind === 'enemy');
    if (!targets.length) return Grid.NO_CELL;
    return targets.reduce((a, b) => (this.state.cards[a]!.hp <= this.state.cards[b]!.hp ? a : b));
  }

  private servantStrike(i: CellIndex, g: Card, t: CellIndex): void {
    this.state.emit({ type: 'attack', from: i, to: t, ranged: false, by: 'player' });
    const killed = this.parts.hits.strike(t, g.atk, false);
    const enemy = this.state.cards[t];
    if (killed || !enemy || enemy.kind !== 'enemy') return;
    // ответ врага — по тем же правилам, что и герою: оглушённый пропускает удар
    if (enemy.stun > 0) {
      enemy.stun--;
      this.state.emit({ type: 'miss', cell: t, kind: 'stun' });
      return;
    }
    this.state.emit({ type: 'attack', from: t, to: i, ranged: false, by: 'enemy' });
    const dmg = Math.max(1, Math.round(enemy.strikePower()));
    g.hp = Math.max(0, g.hp - dmg);
    this.state.emit({ type: 'hit', cell: i, amount: dmg, crit: false, target: 'enemy', hp: g.hp });
    if (g.hp <= 0) this.dropServant(i);
  }

  private dropServant(i: CellIndex): void {
    this.state.engine.discard(i);
    this.state.engine.vacate(i);
  }
}
