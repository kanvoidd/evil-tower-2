import type { CardKind } from '../../types';
import type { CardInit } from './interfaces/CardInit';
import type { CardStatus } from './interfaces/CardStatus';

/**
 * Карта на поле боя: враг, добыча, выход или призрак.
 *
 * Карта знает только себя: своё здоровье, атаку и наложенные состояния. Как она попадает
 * на поле и уходит с него, решает движок (`Engine`), а что с ней происходит в бою — правила
 * (`Run`). Создают карты фабрики (`CardFactory`).
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
  /** Кукла вуду: половина полученного урона расходится по остальным. */
  link = false;
  /** Приговор: получает больше урона. */
  vuln = 0;
  /** Сколько раз герой по нему попал. */
  hits = 0;
  /** Сколько раз он ударил героя. */
  swings = 0;
  /** «Взрыв трупа»: взорвётся, когда умрёт. */
  corpse?: boolean;
  /** «Призрачные слуги»: на месте его смерти встанет призрак. */
  haunt?: boolean;
  /** Горение наложено в этот ход — первый тик будет со следующего. */
  burnNew?: boolean;
  /** Призрак: сколько ходов ему осталось. */
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

  /** Точная копия со всеми состояниями — для «Отката времени». */
  clone(): Card {
    return Object.assign(Object.create(Card.prototype) as Card, this);
  }

  /** Поджечь: горение не слабеет от повторного поджога, берётся сильнейшее. */
  ignite(dmg: number, turns: number): void {
    this.burnDmg = Math.max(this.burnDmg, Math.max(1, dmg));
    this.burn = Math.max(this.burn, turns);
    // число на значке — это ровно столько тиков, сколько впереди
    this.burnNew = true;
  }

  poisonWith(dmg: number, turns: number): void {
    this.poisonDmg = Math.max(this.poisonDmg, Math.max(1, dmg));
    this.poison = Math.max(this.poison, turns);
  }

  stunFor(turns: number): void {
    this.stun = Math.max(this.stun, turns);
  }

  /** Значки состояний над карточкой — в том порядке, в котором их рисует сцена. */
  statuses(): CardStatus[] {
    const list: CardStatus[] = [];
    if (this.stun > 0) list.push({ kind: 'stun', turns: this.stun });
    if (this.burn > 0) list.push({ kind: 'burn', turns: this.burn });
    if (this.poison > 0) list.push({ kind: 'poison', turns: this.poison });
    if (this.mark > 0) list.push({ kind: 'mark', turns: this.mark });
    if (this.link) list.push({ kind: 'link', turns: 0 });
    if (this.vuln > 0) list.push({ kind: 'vuln', turns: 0 });
    if (this.corpse) list.push({ kind: 'corpse', turns: 0 });
    if (this.haunt) list.push({ kind: 'haunt', turns: 0 });
    if (this.kind === 'ghost') list.push({ kind: 'ghost', turns: Math.max(2, this.ttl ?? 0) });
    return list;
  }
}
