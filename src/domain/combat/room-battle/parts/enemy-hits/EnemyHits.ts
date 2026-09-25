import type { EnemyDef } from '../../../../catalog';
import { type CellIndex, Percent } from '../../../../shared';
import type { Card } from '../../../card/Card';
import { Grid } from '../../../engine/grid/Grid';
import { UNTIL_DEATH } from '../../../events';
import { RoomPart } from '../room-part/RoomPart';

/** Удары по врагам: уворот, броня, синергии способностей, урон и его последствия. */
export class EnemyHits extends RoomPart {
  /** «Живое пламя»: поджог от способности жжёт этой долей её удара… */
  static readonly ABILITY_BURN_SHARE = 0.3;
  /** …столько ходов. Столько же держатся яд от способностей и поджог от талантов удара. */
  static readonly DOT_TURNS = 3;

  /** Один удар по врагу. Возвращает true, если враг погиб. */
  strike(cell: CellIndex, raw: number, crit: boolean): boolean {
    const enemy = this.state.cards[cell];
    if (!enemy || enemy.kind !== 'enemy') return false;
    if (this.state.acting) this.state.engaged.add(enemy.uid);
    const def = this.state.enemies[enemy.defId];
    if (def?.evade && this.state.rng.chance(Percent.toRatio(def.evade))) {
      this.state.emit({ type: 'miss', cell, kind: 'evade' });
      return false;
    }
    enemy.hits++;
    const dmg = this.parts.damage.afterArmor(this.parts.damage.contextDamage(raw, enemy), enemy);
    if (this.state.inAbility) this.abilityRiders(cell, enemy, dmg);
    return this.damageEnemy(cell, dmg, crit, true);
  }

  /**
   * Таланты-синергии: они меняют уже полученные способности, поэтому «Живое пламя» пироманта
   * заставляет поджигать даже цепную молнию, взятую ещё магом.
   */
  private abilityRiders(cell: CellIndex, enemy: Card, dmg: number): void {
    const s = this.state.stats;
    if (s.abilityIgnite > 0 && this.state.rng.chance(Percent.toRatio(s.abilityIgnite))) {
      this.parts.status.applyBurn(
        cell,
        Math.max(1, Math.round(dmg * EnemyHits.ABILITY_BURN_SHARE)),
        EnemyHits.DOT_TURNS,
      );
    }
    if (s.abilityStun > 0 && this.state.rng.chance(Percent.toRatio(s.abilityStun)))
      this.parts.status.applyStun(cell);
    if (s.abilityPoison > 0) {
      this.parts.status.applyPoison(
        cell,
        Math.max(1, Math.round(enemy.maxHp * s.abilityPoison)),
        EnemyHits.DOT_TURNS,
      );
    }
    if (s.abilityVuln > 0 && enemy.vuln < s.abilityVuln) {
      enemy.vuln = s.abilityVuln;
      this.state.emit({ type: 'status', cell, uid: enemy.uid, kind: 'vuln', turns: UNTIL_DEATH });
    }
    if (s.abilityLifesteal > 0)
      this.parts.upkeep.heal(Math.max(1, Math.round(dmg * s.abilityLifesteal)), 'lifesteal');
    if (s.abilitySplash > 0) {
      const share = Math.max(1, Math.round(dmg * s.abilitySplash));
      for (const n of Grid.neighbors(cell)) {
        if (this.state.cards[n]?.kind === 'enemy') this.damageEnemy(n, share, false);
      }
    }
  }

  /**
   * Наносит врагу уже посчитанный урон. `direct` — удар героя (работают вампиризм, шипы врага, ярость врага).
   * Возвращает true, если враг погиб.
   */
  damageEnemy(cell: CellIndex, dmg: number, crit: boolean, direct = false): boolean {
    const enemy = this.state.cards[cell];
    if (!enemy || enemy.kind !== 'enemy' || this.state.over) return false;
    if (this.state.acting) this.state.engaged.add(enemy.uid);
    const def = this.state.enemies[enemy.defId];
    const dealt = Math.min(dmg, enemy.hp);
    enemy.hp -= dmg;
    const executed = this.executes(enemy, def);
    this.state.emit({
      type: 'hit',
      cell,
      amount: dealt,
      crit,
      target: 'enemy',
      hp: Math.max(0, executed ? 0 : enemy.hp),
    });
    if (direct) this.directRiders(cell, enemy, def, dealt);
    // кукла вуду: половина урона расходится по остальным врагам
    if (enemy.link && dealt > 0) this.voodooShare(cell, dealt);
    if (enemy.hp <= 0 || executed) {
      this.parts.deaths.killEnemy(cell);
      return true;
    }
    return false;
  }

  /** «Казнь»: раненый не-босс ниже порога гибнет сразу. */
  private executes(enemy: Card, def: EnemyDef | undefined): boolean {
    const { execute } = this.state.stats;
    return enemy.hp > 0 && execute > 0 && !def?.boss && enemy.hp / enemy.maxHp <= execute;
  }

  /** Последствия удара героя: вампиризм, поджог, ярость и шипы врага. */
  private directRiders(
    cell: CellIndex,
    enemy: Card,
    def: EnemyDef | undefined,
    dealt: number,
  ): void {
    const s = this.state.stats;
    if (s.lifesteal > 0 && dealt > 0)
      this.parts.upkeep.heal(Math.max(1, Math.round(dealt * s.lifesteal)), 'lifesteal');
    if (s.ignite > 0)
      this.parts.status.applyBurn(
        cell,
        this.parts.damage.spellDamage(s.ignite),
        EnemyHits.DOT_TURNS,
      );
    if (def?.enrage && enemy.hp > 0) {
      enemy.atk = Math.round(enemy.atk + enemy.baseAtk * def.enrage);
    }
    if (def?.thorns && enemy.hp > 0)
      this.parts.enemyTurn.hurtPlayer(Math.max(1, Math.round(dealt * def.thorns)), cell, true);
  }

  private voodooShare(cell: CellIndex, dealt: number): void {
    const share = Math.max(1, Math.round(dealt * this.state.paramsOf('voodoo').share));
    for (const i of Grid.CELLS) {
      const other = this.state.cards[i];
      if (i !== cell && other?.kind === 'enemy') this.damageEnemy(i, share, false);
    }
  }

  splashNeighbors(cell: CellIndex, dmg: number): void {
    for (const n of Grid.neighbors(cell)) {
      if (this.state.cards[n]?.kind === 'enemy') this.damageEnemy(n, dmg, false);
    }
  }
}
