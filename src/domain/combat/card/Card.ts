import type { CardKind } from '../../catalog';
import type { CardInit } from './interfaces/CardInit';
import type { CardStatus } from './interfaces/CardStatus';

/**
 * Карта на поле боя: враг, добыча, выход или слуга героя (`ghost`).
 *
 * Карта знает только себя: своё здоровье, атаку и наложенные состояния. Как она попадает
 * на поле и уходит с него, решает движок (`Engine`), а что с ней происходит в бою — правила
 * (`RoomBattle`). Создают карты фабрики (`CardFactory`).
 */
export class Card {
  uid: number;
  kind: CardKind;
  defId: string;
  hp: number;
  maxHp: number;
  atk: number;
  baseAtk: number;
  value: number;
  elite: boolean;
  /** Не отвечает на следующий удар. */
  stun = 0;
  /** Ходы горения и урон за ход. */
  burn = 0;
  burnDmg = 0;
  /** Ходы яда и урон за ход. */
  poison = 0;
  poisonDmg = 0;
  /** Клеймо смерти: ходов до гибели. */
  mark = 0;
  /** Приговор: получает больше урона. */
  vuln = 0;
  /** Ослабление: ходов и доля, на которую враг бьёт слабее. */
  weak = 0;
  weakShare = 0;
  /** Хрупкая броня: ходов и доля, на которую броня врага меньше. */
  brittle = 0;
  brittleShare = 0;
  /** Кровотечение: ходов и урон за ход. */
  bleed = 0;
  bleedDmg = 0;
  /** Сколько раз герой по нему попал. */
  hits = 0;
  /** Сколько раз он ударил героя. */
  swings = 0;
  /** Заражение скверной: умирая, взрывается на `blast` своего здоровья, соседей заражает с шансом `spread`. */
  infect?: { readonly blast: number; readonly spread: number };
  /** Горение наложено в этот ход — первый тик будет со следующего. */
  burnNew?: boolean;
  /** Слуга: сколько ходов ему осталось. */
  ttl?: number;

  constructor(init: CardInit) {
    this.uid = init.uid;
    this.kind = init.kind;
    this.defId = init.defId ?? init.kind;
    this.hp = init.hp ?? 0;
    this.maxHp = this.hp;
    this.atk = init.atk ?? 0;
    this.baseAtk = this.atk;
    this.value = init.value ?? 0;
    this.elite = init.elite ?? false;
    if (init.ttl !== undefined) this.ttl = init.ttl;
  }

  /**
   * Поджечь: тики горения копятся (повторный поджог добавляет свои к оставшимся), урон за тик
   * берётся сильнейший.
   */
  addBurn(dmg: number, ticks: number): void {
    this.burnDmg = Math.max(this.burnDmg, Math.max(1, dmg));
    this.burn += ticks;
    // число на значке — это ровно столько тиков, сколько впереди
    this.burnNew = true;
  }

  /** Погасить горение (взрыв сжёг накопленное). */
  extinguish(): void {
    this.burn = 0;
    this.burnDmg = 0;
    this.burnNew = false;
  }

  poisonWith(dmg: number, turns: number): void {
    this.poisonDmg = Math.max(this.poisonDmg, Math.max(1, dmg));
    this.poison = Math.max(this.poison, turns);
  }

  stunFor(turns: number): void {
    this.stun = Math.max(this.stun, turns);
  }

  weaken(share: number, turns: number): void {
    this.weakShare = Math.max(this.weakShare, share);
    this.weak = Math.max(this.weak, turns);
  }

  breakArmor(share: number, turns: number): void {
    this.brittleShare = Math.max(this.brittleShare, share);
    this.brittle = Math.max(this.brittle, turns);
  }

  bleedWith(dmg: number, turns: number): void {
    this.bleedDmg = Math.max(this.bleedDmg, Math.max(1, dmg));
    this.bleed = Math.max(this.bleed, turns);
  }

  /** Сила удара с ослаблением. */
  strikePower(): number {
    return this.weak > 0 ? this.atk * (1 - this.weakShare) : this.atk;
  }

  /** Значки состояний над карточкой — в том порядке, в котором их рисует сцена. */
  statuses(): CardStatus[] {
    const list: CardStatus[] = [];
    if (this.stun > 0) list.push({ kind: 'stun', turns: this.stun });
    if (this.burn > 0) list.push({ kind: 'burn', turns: this.burn });
    if (this.poison > 0) list.push({ kind: 'poison', turns: this.poison });
    if (this.bleed > 0) list.push({ kind: 'bleed', turns: this.bleed });
    if (this.weak > 0) list.push({ kind: 'weak', turns: this.weak });
    if (this.brittle > 0) list.push({ kind: 'brittle', turns: this.brittle });
    if (this.mark > 0) list.push({ kind: 'mark', turns: this.mark });
    if (this.vuln > 0) list.push({ kind: 'vuln', turns: 0 });
    if (this.infect) list.push({ kind: 'infect', turns: 0 });
    if (this.kind === 'ghost') list.push({ kind: 'servant', turns: Math.max(1, this.ttl ?? 0) });
    return list;
  }
}
