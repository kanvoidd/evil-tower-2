import { type CellIndex } from '../../../../shared';
import type { Card } from '../../../card/Card';
import { Grid } from '../../../engine/grid/Grid';
import { RoomPart } from '../room-part/RoomPart';

/** Статусы на врагах и их ход: горение, яд, оглушение, клеймо, призраки, лечение врагов. */
export class StatusEffects extends RoomPart {
  /** Каждый призрак бьёт одного врага крестом (вверх, вниз, влево, вправо), потом тает на ход. */
  private tickGhosts(): void {
    for (const i of Grid.CELLS) {
      if (this.state.over) break;
      const g = this.state.cards[i];
      if (g?.kind !== 'ghost') continue;
      const targets = Grid.neighbors(i).filter((n) => this.state.cards[n]?.kind === 'enemy');
      if (targets.length) {
        // добиваем слабейшего — так призрак чаще превращает удар в убийство
        const t = targets.reduce((a, b) =>
          this.state.cards[a]!.hp <= this.state.cards[b]!.hp ? a : b,
        );
        this.state.emit({ type: 'fx', cells: [t], style: 'ghost', from: i });
        this.parts.hits.damageEnemy(
          t,
          this.parts.damage.spellDamage(this.state.paramsOf('ghosts').dmg),
          false,
        );
      }
      g.ttl = (g.ttl ?? 1) - 1;
      if (g.ttl <= 0 && this.state.cards[i] === g) {
        this.state.engine.discard(i);
        this.state.engine.vacate(i);
      } else {
        this.state.emit({ type: 'status', cell: i, uid: g.uid, kind: 'haunt', turns: g.ttl });
      }
    }
  }

  // ------------------------------------------------------------------ статусы

  applyBurn(cell: CellIndex, dmg: number, turns: number): void {
    const c = this.state.cards[cell];
    if (!c || c.kind !== 'enemy' || dmg <= 0) return;
    c.ignite(dmg, turns);
    this.state.emit({ type: 'status', cell, uid: c.uid, kind: 'burn', turns: c.burn });
  }

  applyPoison(cell: CellIndex, dmg: number, turns: number): void {
    const c = this.state.cards[cell];
    if (!c || c.kind !== 'enemy' || dmg <= 0) return;
    c.poisonWith(dmg, turns);
    this.state.emit({ type: 'status', cell, uid: c.uid, kind: 'poison', turns: c.poison });
  }

  applyStun(cell: CellIndex, turns = 1): void {
    const c = this.state.cards[cell];
    if (!c || c.kind !== 'enemy') return;
    c.stunFor(turns);
    this.state.emit({ type: 'status', cell, uid: c.uid, kind: 'stun', turns: c.stun });
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

  /** Эффекты со временем: горение, яд, клеймо, призраки, лечение врагов. */
  tickStatuses(): void {
    for (const i of Grid.CELLS) {
      if (this.state.over) break;
      this.tickEnemy(i);
    }
    // призраки бьют соседей крестом и тают
    this.tickGhosts();
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
    const still = this.enemyAt(i);
    if (!still || this.tickMark(i, still)) return;
    const last = this.enemyAt(i);
    if (last) this.regenerate(i, last);
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

  /** Клеймо смерти: когда истекает, забирает цель. Возвращает true, если забрало. */
  private tickMark(i: CellIndex, c: Card): boolean {
    if (c.mark <= 0) return false;
    c.mark--;
    this.state.emit({ type: 'status', cell: i, uid: c.uid, kind: 'mark', turns: c.mark });
    if (c.mark !== 0) return false;
    this.reapMarked(i, this.state.paramsOf('death_mark').bossHpShare);
    return true;
  }

  /** Лечение врага со свойством «регенерация». */
  private regenerate(i: CellIndex, c: Card): void {
    const def = this.state.enemies[c.defId];
    if (!def?.regen || c.hp >= c.maxHp) return;
    c.hp = Math.min(c.maxHp, c.hp + Math.max(1, Math.round(c.maxHp * def.regen)));
    this.state.emit({ type: 'hit', cell: i, amount: 0, crit: false, target: 'enemy', hp: c.hp });
  }
}
