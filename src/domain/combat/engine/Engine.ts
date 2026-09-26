import { type CellIndex } from '../../shared';
import type { Card } from '../card/Card';
import type { GameEvent } from '../events';
import { Grid } from './grid/Grid';
import type { IDeckSupply } from './interfaces/IDeckSupply';
import type { IEngine } from './interfaces/IEngine';

/** Движок боя: поле, колода и журнал событий. Правила игры — в `RoomBattle`, здесь только механика. */
export class Engine implements IEngine {
  readonly board: Array<Card | null> = Array(Grid.SIZE).fill(null);
  readonly deck: Card[] = [];
  playerCell = Grid.CENTER;
  /** Клетки, освободившиеся за ход. */
  private vacated: CellIndex[] = [];
  private log: GameEvent[] = [];

  constructor(private readonly supply: IDeckSupply) {}

  put(cell: CellIndex, card: Card): void {
    this.board[cell] = card;
    this.emit({ type: 'spawn', cell, card });
  }

  clear(cell: CellIndex): Card | null {
    const card = this.board[cell];
    this.board[cell] = null;
    return card;
  }

  discard(cell: CellIndex): void {
    const card = this.board[cell];
    if (!card) return;
    this.board[cell] = null;
    this.emit({ type: 'remove', cell, uid: card.uid });
  }

  swap(a: CellIndex, b: CellIndex): void {
    const t = this.board[a];
    this.board[a] = this.board[b];
    this.board[b] = t;
    this.emit({ type: 'swap', a, b });
  }

  moveHero(to: CellIndex): void {
    const from = this.playerCell;
    this.vacated = this.vacated.filter((c) => c !== to);
    this.emit({ type: 'move', from, to });
    this.playerCell = to;
    this.vacated.push(from);
  }

  draw(): Card | undefined {
    return this.deck.shift();
  }

  vacate(cell: CellIndex): void {
    this.vacated.push(cell);
  }

  resetVacated(): void {
    this.vacated = [];
  }

  refill(): void {
    const cells = [...new Set(this.vacated)].sort((a, b) => a - b);
    this.vacated = [];
    for (const c of cells) {
      if (c === this.playerCell || this.board[c]) continue;
      this.supply.topUp(this.deck);
      const card = this.draw();
      if (!card) continue;
      this.put(c, card);
    }
  }

  emit(ev: GameEvent): void {
    this.log.push(ev);
  }

  mark(): number {
    return this.log.length;
  }

  since(mark: number): GameEvent[] {
    return this.log.slice(mark);
  }

  insert(mark: number, ev: GameEvent): void {
    this.log.splice(mark, 0, ev);
  }

  flush(): GameEvent[] {
    const out = this.log;
    this.log = [];
    return out;
  }
}
