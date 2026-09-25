import Phaser from 'phaser';

import type { IInput } from '../../application/game/interfaces/IInput';
import type { PlayerCommand } from '../../application/game/interfaces/PlayerCommand';
import type { ConsumableId } from '../../domain/catalog';
import { CellIndex } from '../../domain/shared';
import { BoardLayout } from '../board/BoardLayout';

/**
 * Ввод Phaser → команды игрока. Касание клетки, стрелки/WASD (шаг к соседней клетке), 1–3
 * (расходники) и Esc (уйти из забега). Что значит команда — удар, шаг или подбор, — решает бой.
 */
export class PhaserInput implements IInput {
  /** Стрелки и WASD: куда смещается клетка героя. */
  private static readonly STEPS: Record<string, [number, number]> = {
    UP: [0, -1],
    W: [0, -1],
    DOWN: [0, 1],
    S: [0, 1],
    LEFT: [-1, 0],
    A: [-1, 0],
    RIGHT: [1, 0],
    D: [1, 0],
  };

  private static readonly ITEM_KEYS: Record<string, ConsumableId> = {
    ONE: 'potion_heal',
    TWO: 'potion_regen',
    THREE: 'artifact',
  };

  /** Касание дальше этого — перетаскивание, а не нажатие. */
  private static readonly TAP_SLOP = 24;

  private readonly handlers: Array<(cmd: PlayerCommand) => void> = [];

  constructor(
    scene: Phaser.Scene,
    private readonly playerCell: () => number,
  ) {
    scene.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (Phaser.Math.Distance.Between(p.x, p.y, p.downX, p.downY) > PhaserInput.TAP_SLOP) return;
      const cell = BoardLayout.cellAt(p.x, p.y);
      if (cell >= 0) this.emit({ type: 'select-cell', cell: CellIndex.of(cell) });
    });
    const kb = scene.input.keyboard;
    for (const [key, [dx, dy]] of Object.entries(PhaserInput.STEPS))
      kb?.on(`keydown-${key}`, () => this.step(dx, dy));
    for (const [key, itemId] of Object.entries(PhaserInput.ITEM_KEYS))
      kb?.on(`keydown-${key}`, () => this.emit({ type: 'use-item', itemId }));
    kb?.on('keydown-ESC', () => this.emit({ type: 'escape' }));
  }

  onCommand(handler: (cmd: PlayerCommand) => void): void {
    this.handlers.push(handler);
  }

  private emit(cmd: PlayerCommand): void {
    for (const h of this.handlers) h(cmd);
  }

  /** Клавиша направления — касание соседней клетки; за краем поля ничего не происходит. */
  private step(dx: number, dy: number): void {
    const pc = this.playerCell();
    const col = (pc % 3) + dx;
    const row = Math.floor(pc / 3) + dy;
    if (col < 0 || col > 2 || row < 0 || row > 2) return;
    this.emit({ type: 'select-cell', cell: CellIndex.of(row * 3 + col) });
  }
}
