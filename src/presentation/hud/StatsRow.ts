import type Phaser from 'phaser';

import type { PlayerStats } from '../../domain/logic/stats';
import { statChip } from '../components';

/** Ряд характеристик героя под полосой ресурса: урон, защита, крит, уворот, парирование. */
export class StatsRow {
  private static readonly Y = 1036;

  private readonly row: Phaser.GameObjects.Container;

  constructor(private readonly scene: Phaser.Scene) {
    this.row = scene.add.container(0, 0);
  }

  update(s: PlayerStats): void {
    this.row.removeAll(true);
    const chips: Array<[string, string]> = [
      ['damage', String(s.damage)],
      ['defense', String(s.defense)],
      ['crit', `${Math.round(s.crit)}%`],
      ['dodge', `${Math.round(s.dodge)}%`],
      ['parry', `${Math.round(s.parry)}%`],
    ];
    // равномерный ряд, каждая метка центрируется
    chips.forEach(([stat, v], i) =>
      this.row.add(statChip(this.scene, 72 + i * 144, StatsRow.Y, stat, v, 32, 21, 'center')),
    );
  }
}
