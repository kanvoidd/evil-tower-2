import { type CellIndex, Gold, Percent } from '../../../../shared';
import { CombatBalance } from '../../../balance';
import type { Card } from '../../../card/Card';
import { Grid } from '../../../engine/grid/Grid';
import { RoomPart } from '../room-part/RoomPart';

/** Ответ врагов: кто бьёт, удар по герою, спасение от смерти, «Растерзание». */
export class EnemyTurn extends RoomPart {
  /** Круги «Растерзания» — предохранитель: к последнему герой давно мёртв. */
  static readonly MAX_SWEEPS = 8;

  /**
   * Ответ врагов. Бьёт не всё, что стоит рядом, а только:
   * — те, с кем герой вступил в бой за этот ход (ударил, накрыл способностью) и кто ещё рядом;
   * — те, кто достаёт до новой клетки, если герой мог ударить, но шагнул на не-врага.
   * Кто стоит в стороне и не тронут, ждёт своей очереди. Уйти от врага туда, где рядом
   * никого нет, можно безнаказанно, а вот копить ману шагами мимо чужих лап — нет.
   */
  retaliate(): void {
    if (this.state.over || this.state.madness > 0 || this.state.noCounter > 0) {
      this.state.engaged.clear();
      this.state.exposed = false;
      return;
    }
    const cells: CellIndex[] = [];
    for (const c of Grid.CELLS) {
      const card = this.state.cards[c];
      if (card?.kind !== 'enemy') continue;
      if (!Grid.neighbors(this.state.playerCell).includes(c)) continue;
      if (this.state.exposed || this.state.engaged.has(card.uid)) cells.push(c);
    }
    for (const c of cells) {
      if (this.state.over) break;
      this.enemyStrike(c);
    }
    this.state.engaged.clear();
    this.state.exposed = false;
  }

  private enemyStrike(cell: CellIndex): void {
    const enemy = this.state.cards[cell];
    if (!enemy || enemy.kind !== 'enemy' || this.state.over) return;
    if (enemy.stun > 0) {
      enemy.stun--;
      this.state.emit({ type: 'miss', cell, kind: 'stun' });
      return;
    }
    if (this.state.noCounter > 0) {
      this.state.emit({ type: 'miss', cell, kind: 'smoke' });
      return;
    }
    const atk = Math.max(1, Math.round(enemy.strikePower() * (1 - this.state.warCry)));
    this.state.emit({
      type: 'attack',
      from: cell,
      to: this.state.playerCell,
      ranged: false,
      by: 'enemy',
    });
    enemy.swings++;
    this.resolveStrike(cell, enemy, atk);
    this.iceRetort(cell);
  }

  /** Удар врага по герою: уворот, парирование, блок или урон с ядом. */
  private resolveStrike(cell: CellIndex, enemy: Card, atk: number): void {
    const s = this.state.stats;
    if (this.state.rng.chance(Percent.toRatio(s.dodge))) {
      this.state.emit({ type: 'miss', cell: this.state.playerCell, kind: 'dodge' });
      if (s.passives.has('substitution')) this.substitute(cell);
      return;
    }
    if (this.state.rng.chance(Percent.toRatio(s.parry))) {
      this.state.emit({ type: 'miss', cell: this.state.playerCell, kind: 'parry' });
      if (s.counterBuff > 0) this.state.counterReady = true;
      this.parts.hits.strike(
        cell,
        Math.round(this.parts.damage.currentDamage() * CombatBalance.parryCounter),
        false,
      );
      return;
    }
    if (s.block > 0 && this.state.rng.chance(Percent.toRatio(s.block))) {
      this.state.emit({ type: 'miss', cell: this.state.playerCell, kind: 'block' });
      return;
    }
    this.hurtPlayer(this.parts.damage.reduce(atk, enemy), cell, false);
    const def = this.state.enemies[enemy.defId];
    if (def?.venom && !this.state.over) {
      const dot = Math.max(1, Math.round(atk * def.venom * (1 - s.dotDr)));
      this.state.playerPoisonDmg = Math.max(this.state.playerPoisonDmg, dot);
      this.state.playerPoison = Math.max(this.state.playerPoison, 2);
    }
  }

  /** «Ледяной доспех»: каждый, кто замахнулся на героя, получает ответный удар. */
  private iceRetort(cell: CellIndex): void {
    if (this.state.over || this.state.wardTurns <= 0 || this.state.wardThorns <= 0) return;
    if (this.state.cards[cell]?.kind !== 'enemy') return;
    this.state.emit({ type: 'fx', cells: [cell], style: 'chain' });
    this.parts.hits.damageEnemy(cell, this.parts.damage.spellDamage(this.state.wardThorns), false);
  }

  /** «Подмена»: уворот превращается в удар из-за спины — всегда критический. */
  private substitute(cell: CellIndex): void {
    let dmg = Math.round(this.parts.damage.currentDamage());
    dmg = Math.max(dmg + 1, Math.round(dmg * this.parts.damage.rollCritMul()));
    this.state.emit({
      type: 'attack',
      from: this.state.playerCell,
      to: cell,
      ranged: true,
      by: 'player',
      style: 'backstab',
    });
    this.parts.hits.strike(cell, dmg, true);
  }

  /** Урон по герою: щит, «первый удар комнаты», мана-щит, обман смерти, шипы. */
  hurtPlayer(raw: number, fromCell: CellIndex, reflected: boolean): void {
    if (this.state.over) return;
    const s = this.state.stats;
    const dmg = this.absorb(raw);
    if (dmg <= 0) {
      this.state.emit({
        type: 'hit',
        cell: this.state.playerCell,
        amount: 0,
        crit: false,
        target: 'player',
        hp: this.state.hp,
        absorbed: true,
      });
      return;
    }
    this.state.hp -= dmg;
    this.state.totals.damageTaken += dmg;
    // «Ярость» берсерка: боль превращается в выносливость
    if (s.passives.has('rage')) {
      const rage = this.state.paramsOf('rage');
      this.parts.upkeep.gain(Math.floor(dmg / rage.hpPerResource) * rage.resource);
    }
    this.state.emit({
      type: 'hit',
      cell: this.state.playerCell,
      amount: dmg,
      crit: false,
      target: 'player',
      hp: Math.max(0, this.state.hp),
    });
    this.parts.upkeep.wearArmor();
    if (this.state.hp <= 0 && !this.tryCheatDeath(dmg)) {
      this.state.over = 'lose';
      this.state.emit({ type: 'lose' });
      return;
    }
    if (!reflected && s.thorns > 0 && fromCell >= 0) {
      this.parts.hits.damageEnemy(fromCell, Math.max(1, Math.round(dmg * s.thorns)), false);
    }
  }

  /** Что гасится до здоровья: «первый удар комнаты», защита способности, мана-щит, щит. */
  private absorb(raw: number): number {
    const s = this.state.stats;
    let dmg = raw;
    if (this.state.roomGuardLeft > 0) {
      this.state.roomGuardLeft--;
      dmg = Math.round(dmg * (1 - Math.min(1, s.roomGuard)));
    }
    if (this.state.perkGuard > 0) {
      dmg = Math.round(dmg * (1 - this.state.perkGuard));
      this.state.perkGuard = 0;
    }
    if (s.manaShield > 0 && this.state.res > 0 && dmg > 0) dmg -= this.payWithMana(dmg);
    if (this.state.shield > 0 && dmg > 0) {
      const abs = Math.min(this.state.shield, dmg);
      this.state.shield -= abs;
      dmg -= abs;
      this.state.emit({ type: 'shield', now: this.state.shield });
    }
    return dmg;
  }

  /** Мана-щит: часть удара оплачивается ресурсом. Возвращает, сколько погашено. */
  private payWithMana(dmg: number): number {
    const want = Math.ceil(dmg * this.state.stats.manaShield);
    const paid = Math.min(this.state.res, want);
    if (paid > 0) {
      this.state.res -= paid;
      this.state.emit({ type: 'resource', now: this.state.res, max: this.state.stats.resMax });
    }
    return paid;
  }

  /** «Несокрушимый», «Аварийный барьер», «Откупиться», «Не сдамся». */
  private tryCheatDeath(dmg: number): boolean {
    const s = this.state.stats;
    const shock = s.passives.has('never_give_up') && !this.state.usedOnce.has('shock');
    if (this.state.cheatLeft <= 0 && !shock) return false;
    if (shock) this.state.usedOnce.add('shock');
    else this.state.cheatLeft--;
    const hpLeft = shock ? this.state.paramsOf('never_give_up').hpLeft : 1;
    this.state.hp = hpLeft;
    this.state.emit({ type: 'heal', amount: hpLeft, hp: hpLeft, source: 'perk' });
    const price = this.state.lineageDef.cheatDeathPrice;
    if (price.drainsResource) {
      this.state.res = 0;
      this.state.emit({ type: 'resource', now: 0, max: this.state.stats.resMax });
    }
    if (price.goldShare > 0)
      this.state.totals.gold = Gold.of(Math.round(this.state.totals.gold * (1 - price.goldShare)));
    if (shock) {
      this.state.emit({ type: 'fx', cells: this.state.enemyCells(), style: 'quake' });
      const blast = Math.max(1, dmg * this.state.paramsOf('never_give_up').shockMul);
      for (const c of this.state.enemyCells()) this.parts.hits.damageEnemy(c, blast, false);
    }
    return true;
  }

  /**
   * «Растерзание». Ходить нечем — и карты вокруг больше не ждут: бьют по очереди,
   * пока герой не падёт. Это не тупик, а расплата за пустую шкалу в окружении.
   */
  swarm(): void {
    const order = (): CellIndex[] => {
      const cells: CellIndex[] = [];
      for (const c of Grid.CELLS) if (this.state.cards[c]?.kind === 'enemy') cells.push(c);
      return cells.sort(
        (a, b) =>
          Grid.dist(a, this.state.playerCell) - Grid.dist(b, this.state.playerCell) || a - b,
      );
    };
    const cells = order();
    if (!cells.length) return;
    this.state.emit({ type: 'swarm', cells });
    for (let sweep = 0; sweep < EnemyTurn.MAX_SWEEPS && this.state.hp > 0; sweep++) {
      for (const c of order()) {
        if (this.state.hp <= 0) break;
        const card = this.state.cards[c];
        if (!card || card.kind !== 'enemy') continue;
        this.state.emit({
          type: 'attack',
          from: c,
          to: this.state.playerCell,
          ranged: Grid.dist(c, this.state.playerCell) > 1,
          by: 'enemy',
        });
        // Обычная защита работает, но уклонений и парирований тут нет: деваться некуда.
        const dmg = Math.max(1, this.parts.damage.strikeDamage(Math.round(card.strikePower())));
        this.state.hp = Math.max(0, this.state.hp - dmg);
        this.state.totals.damageTaken += dmg;
        this.state.emit({
          type: 'hit',
          cell: this.state.playerCell,
          amount: dmg,
          crit: false,
          target: 'player',
          hp: this.state.hp,
        });
      }
    }
    this.state.hp = 0;
    this.state.over = 'lose';
    this.state.emit({ type: 'lose' });
  }
}
