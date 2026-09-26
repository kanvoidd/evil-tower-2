import { ELITE, type EnemyDef } from '../../../../catalog';
import { type CellIndex, Gold, Souls } from '../../../../shared';
import { LootBalance } from '../../../balance';
import type { Card } from '../../../card/Card';
import { Grid } from '../../../engine/grid/Grid';
import { RoomPart } from '../room-part/RoomPart';

/** Гибель врага: добыча, таланты «за убийство», взрыв заражённого, слуга, переход клейма. */
export class EnemyDeath extends RoomPart {
  /** Талант «здоровье за убийства» срабатывает на каждое такое по счёту убийство… */
  static readonly KILL_HP_EVERY = 10;
  /** …и прибавляет не больше этой доли максимума здоровья. */
  static readonly KILL_HP_CAP = 0.3;

  killEnemy(cell: CellIndex): void {
    const enemy = this.state.cards[cell];
    if (!enemy || enemy.kind !== 'enemy') return;
    const def = this.state.enemies[enemy.defId];
    this.state.emit({ type: 'kill', cell, uid: enemy.uid });
    this.state.engine.clear(cell);
    // «Мёртвый слуга»: на месте заражённого встаёт его мёртвая версия
    if (enemy.infect && this.state.ability('dead_servant')) this.raiseServant(cell, enemy);
    else this.state.engine.vacate(cell);
    this.state.totals.kills++;
    this.state.killsRoom++;
    if (this.state.enemies[enemy.defId]?.boss) this.state.bossLeft = false;
    this.parts.flow.queueExit();
    this.state.killStreak++;
    this.payout(cell, enemy, def);
    this.killGrowth(def);
    this.state.defTurn = Math.max(this.state.defTurn, 1);
    this.killEchoes(cell, enemy);
  }

  /** Золото и души за убитого: элита, свойство комнаты, удача и бонусы героя. */
  private payout(cell: CellIndex, enemy: Card, def: EnemyDef): void {
    const s = this.state.stats;
    const eliteMul = enemy.elite ? ELITE.value : 1;
    const gold = Math.round(
      def.gold *
        eliteMul *
        (this.state.mod.goldMul ?? 1) *
        (1 + s.goldBonus + s.luck * LootBalance.goldPerLuck),
    );
    const souls = Math.round(
      def.souls * eliteMul * (this.state.mod.soulMul ?? 1) * (1 + s.soulBonus),
    );
    if (gold > 0) {
      this.state.totals.gold = Gold.of(this.state.totals.gold + gold);
      this.state.emit({ type: 'gold', cell, amount: gold });
    }
    if (souls > 0) {
      this.state.totals.souls = Souls.of(this.state.totals.souls + souls);
      this.state.emit({ type: 'souls', cell, amount: souls });
    }
  }

  /** Таланты, растящие здоровье за убийства: каждое десятое и каждый босс. */
  private killGrowth(def: EnemyDef): void {
    const s = this.state.stats;
    if (s.killHp > 0 && this.state.totals.kills % EnemyDeath.KILL_HP_EVERY === 0)
      this.growMaxHp(Math.round(s.maxHp * Math.min(EnemyDeath.KILL_HP_CAP, s.killHp)));
    if (s.bossHp > 0 && def.boss) this.growMaxHp(Math.round(s.maxHp * s.bossHp));
  }

  private growMaxHp(add: number): void {
    this.state.stats.maxHp += add;
    this.state.hp += add;
    this.state.emit({ type: 'heal', amount: add, hp: this.state.hp, source: 'perk' });
  }

  /** Что убийство вызывает вокруг: возврат цены, переход клейма, взрыв заражённого. */
  private killEchoes(cell: CellIndex, enemy: Card): void {
    const s = this.state.stats;
    // «Отработанный удар»: убийство способностью возвращает часть её цены
    if (this.state.inAbility && s.abilityRefund > 0 && this.state.abilityCost > 0) {
      this.parts.upkeep.gain(Math.max(1, Math.round(this.state.abilityCost * s.abilityRefund)));
    }
    if (s.passives.has('chain_mark') && enemy.mark > 0) this.parts.status.jumpMark(cell);
    if (enemy.infect) this.blightBlast(cell, enemy, enemy.infect);
  }

  /**
   * «Выстрел скверны»: заражённый, умирая, взрывается на долю своего здоровья по соседям;
   * «Распространение» с шансом заражает выживших соседей тем же.
   */
  private blightBlast(cell: CellIndex, enemy: Card, infect: NonNullable<Card['infect']>): void {
    const blast = Math.max(1, Math.round(enemy.maxHp * this.parts.damage.pp(infect.blast)));
    this.state.emit({ type: 'fx', cells: [cell], style: 'corpse' });
    this.parts.hits.splashNeighbors(cell, blast);
    if (infect.spread <= 0) return;
    for (const n of Grid.neighbors(cell)) {
      if (this.state.cards[n]?.kind !== 'enemy') continue;
      if (this.state.rng.chance(infect.spread))
        this.parts.status.applyInfect(n, infect.blast, infect.spread);
    }
  }

  /** Слуга встаёт на месте заражённого врага: доля его здоровья и удара, живёт несколько ходов. */
  private raiseServant(cell: CellIndex, enemy: Card): void {
    const p = this.state.paramsOf('dead_servant');
    this.state.engine.put(
      cell,
      this.state.factory.createServant(
        enemy.defId,
        Math.round(enemy.maxHp * p.hp),
        Math.round(enemy.atk * p.dmg),
        p.turns,
      ),
    );
  }
}
