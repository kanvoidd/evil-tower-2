import { CellIndex, Percent } from '../../../../shared';
import type { Card } from '../../../card/Card';
import { Grid } from '../../../engine/grid/Grid';
import type { Action } from '../../interfaces/Action';
import { RoomPart } from '../room-part/RoomPart';

/** Действия героя по карте: что значит касание, удар рукой, базовое действие линейки, шаг. */
export class PlayerActions extends RoomPart {
  // ------------------------------------------------------------------ действия

  /** Что произойдёт при нажатии на клетку (для подсветки и подсказок). */
  actionFor(cell: CellIndex): Action {
    if (this.state.over || cell === this.state.playerCell)
      return { kind: 'none', reason: 'invalid' };
    if (this.state.armed)
      return this.parts.perks.perkTargetOk(this.state.armed, cell)
        ? { kind: 'perk' }
        : { kind: 'none', reason: 'range' };
    const card = this.state.cards[cell];
    const d = Grid.dist(this.state.playerCell, cell);
    // По пустой соседней клетке теперь тоже можно ходить — это полноценный ход.
    if (!card) return d === 1 ? { kind: 'move' } : { kind: 'none', reason: 'invalid' };
    if (d === 1) {
      if (card.kind !== 'enemy') return { kind: 'move' };
      // Маг вообще не бьёт рукой: только способностью по кнопке.
      return this.state.stats.attack.melee ? { kind: 'melee' } : { kind: 'none', reason: 'melee' };
    }
    if (card.kind !== 'enemy') return { kind: 'none', reason: 'range' };
    const s = this.state.stats;
    if (!s.attack.reaches(this.state.playerCell, cell, s.passives))
      return { kind: 'none', reason: 'range' };
    if (this.state.res < s.rangedCost) return { kind: 'none', reason: 'resource' };
    return { kind: 'ranged' };
  }

  /** Убьёт ли ближайшая атака врага — для подсветки карточки. */
  wouldKill(cell: CellIndex): boolean {
    const card = this.state.cards[cell];
    if (!card || card.kind !== 'enemy') return false;
    const a = this.actionFor(cell);
    if (a.kind !== 'melee' && a.kind !== 'ranged') return false;
    let dmg = this.parts.damage.currentDamage();
    if (a.kind === 'ranged') {
      dmg = Math.round(dmg * this.state.stats.attack.mul);
      if (this.state.backstabs || this.state.reaping > 0)
        dmg = Math.max(dmg + 1, Math.round(dmg * this.state.stats.critMin));
    }
    dmg = this.parts.damage.contextDamage(dmg, card);
    return this.parts.damage.afterArmor(dmg, card) >= card.hp;
  }

  melee(cell: CellIndex): void {
    const enemy = this.state.cards[cell]!;
    const s = this.state.stats;
    let dmg = this.parts.damage.currentDamage();
    if (this.state.counterReady) {
      dmg = Math.round(dmg * (1 + s.counterBuff));
      this.state.counterReady = false;
    }
    const crit = this.parts.damage.rollCrit(enemy, false);
    if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * this.parts.damage.rollCritMul()));
    this.state.emit({
      type: 'attack',
      from: this.state.playerCell,
      to: cell,
      ranged: false,
      by: 'player',
    });
    this.parts.upkeep.wearWeapon();
    let killed = this.parts.hits.strike(cell, dmg, crit);
    // «Двойной удар» / «Град стрел»
    if (!killed && s.doubleStrike > 0 && this.state.rng.chance(Percent.toRatio(s.doubleStrike))) {
      killed = this.parts.hits.strike(
        cell,
        dmg,
        this.parts.damage.rollCrit(this.state.cards[cell], false),
      );
    }
    if (this.state.madness > 0)
      this.parts.hits.splashNeighbors(
        cell,
        Math.round(dmg * this.state.paramsOf('madness').splash),
      );
    // ответный удар больше не привязан к конкретной цели — его даёт общий ход врагов
    if (killed) this.stepInto(cell);
  }

  /** Базовое действие линейки: выстрел через карту, удар молнии, удар в спину. */
  basicRanged(cell: CellIndex): void {
    const s = this.state.stats;
    const free = this.state.reaping > 0 && this.state.backstabs;
    if (!free) this.parts.upkeep.spend(s.rangedCost);
    const forceCrit = this.state.backstabs || this.state.reaping > 0;
    let dmg = Math.round(this.parts.damage.currentDamage() * s.attack.mul);
    const crit = forceCrit || this.parts.damage.rollCrit(this.state.cards[cell], true);
    if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * this.parts.damage.rollCritMul()));
    this.state.emit({
      type: 'attack',
      from: this.state.playerCell,
      to: cell,
      ranged: true,
      by: 'player',
      style: s.attack.style,
    });
    this.parts.upkeep.wearWeapon();
    const target = this.state.cards[cell];
    if (this.reaps(target)) {
      this.state.reaping++;
      this.parts.deaths.killEnemy(cell);
      return;
    }
    const killed = this.parts.hits.strike(cell, dmg, crit);
    this.splitStrike(cell, dmg);
    if (crit && s.passives.has('hunter_thrill')) this.parts.upkeep.gain(s.rangedCost);
    this.afterBasic(cell, target, killed);
  }

  /** «Жнец»: удар в спину убивает любого не-босса. */
  private reaps(target: Card | null): boolean {
    return (
      this.state.reaping > 0 &&
      this.state.backstabs &&
      !!target &&
      !this.state.enemies[target.defId]?.boss
    );
  }

  /** После базового удара: «Хладнокровие» и «Танец теней» за убийство, «Смертельная доза» — иначе. */
  private afterBasic(cell: CellIndex, target: Card | null, killed: boolean): void {
    const s = this.state.stats;
    if (killed) {
      if (s.passives.has('cold_blood'))
        this.parts.upkeep.gain(this.state.paramsOf('cold_blood').resource);
      if (s.passives.has('shadow_dance')) this.shadowChain();
    } else if (target && s.passives.has('lethal_dose')) {
      const boss = !!this.state.enemies[target.defId]?.boss;
      const dose = this.state.paramsOf('lethal_dose');
      const share = boss ? dose.bossPoison : dose.poison;
      this.parts.status.applyPoison(
        cell,
        Math.max(1, Math.round(target.maxHp * share)),
        dose.turns,
      );
    }
  }

  /** «Раздвоение молнии» / «Двойной наконечник»: основной удар с шансом цепляет ещё одного врага. */
  private splitStrike(cell: CellIndex, dmg: number): void {
    const { splitChance, splitDmg } = this.state.stats;
    if (splitChance <= 0 || splitDmg <= 0) return;
    if (!this.state.rng.chance(splitChance)) return;
    const extra = this.state.enemyCells().filter((c) => c !== cell);
    if (!extra.length) return;
    const c2 = extra[this.state.rng.int(0, extra.length - 1)];
    this.state.emit({ type: 'fx', cells: [c2], style: 'chain' });
    this.parts.hits.damageEnemy(c2, Math.max(1, Math.round(dmg * splitDmg)), false);
  }

  /** «Танец теней»: убийство ударом в спину переносит героя к слабейшему врагу, цепь до трёх ударов. */
  private shadowChain(): void {
    const { extraStrikes } = this.state.paramsOf('shadow_dance');
    for (let i = 0; i < extraStrikes; i++) {
      let best = Grid.NO_CELL;
      let bestHp = Infinity;
      this.state.cards.forEach((c, idx) => {
        if (c?.kind === 'enemy' && c.hp < bestHp) {
          bestHp = c.hp;
          best = CellIndex.of(idx);
        }
      });
      if (best < 0) return;
      let dmg = Math.round(this.parts.damage.currentDamage() * this.state.stats.attack.mul);
      dmg = Math.max(dmg + 1, Math.round(dmg * this.parts.damage.rollCritMul()));
      this.state.emit({
        type: 'attack',
        from: this.state.playerCell,
        to: best,
        ranged: true,
        by: 'player',
        style: 'backstab',
      });
      if (!this.parts.hits.strike(best, dmg, true)) return;
    }
  }

  stepInto(cell: CellIndex): void {
    if (this.state.cards[cell]) return;
    this.state.engine.moveHero(cell);
  }

  /** Клетка «за» целью по линии от героя. */
  behindCell(from: CellIndex, to: CellIndex): CellIndex {
    const cell = Grid.behind(from, to);
    return cell === this.state.playerCell ? Grid.NO_CELL : cell;
  }

  nearestEnemy(from: CellIndex): CellIndex {
    let best = Grid.NO_CELL;
    let bestD = Infinity;
    for (const c of this.state.enemyCells()) {
      const d = Grid.dist(from, c);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  // ------------------------------------------------------------------ подбор карт

  collect(cell: CellIndex): void {
    // мог ударить — но пошёл мимо: если новая клетка у кого-то под рукой, тот бьёт
    this.state.exposed = this.canStrike();
    const exit = this.state.cards[cell]?.kind === 'exit';
    this.state.engine.moveHero(cell);
    if (exit) {
      this.state.engine.clear(cell);
      this.parts.flow.finishRoom();
      return;
    }
    this.parts.loot.take(cell);
    // «Шаг сквозь эфир»: передышка за любой шаг на клетку без врага — пустую или с добычей
    if (this.state.stats.stepHeal > 0) {
      this.parts.upkeep.heal(
        Math.max(1, Math.round(this.state.stats.maxHp * this.state.stats.stepHeal)),
        'perk',
      );
    }
  }

  /**
   * Может ли герой прямо сейчас ударить врага: рукой, выстрелом, ударом в спину,
   * а маг — молнией, если на неё хватает маны и она не на перезарядке.
   */
  private canStrike(): boolean {
    for (const c of Grid.CELLS) {
      if (this.state.cards[c]?.kind !== 'enemy') continue;
      const k = this.actionFor(c).kind;
      if (k === 'melee' || k === 'ranged') return true;
    }
    for (const p of this.state.stats.abilities) {
      if (p.behavior !== 'lightning' || !this.parts.perks.perkReady(p).ok) continue;
      for (const c of Grid.CELLS) if (this.parts.perks.perkTargetOk(p, c)) return true;
    }
    return false;
  }
}
