import type Phaser from 'phaser';

/** Искры, разлетающиеся из точки: убийство, открытый сундук, удар в спину. */
export class BurstAnimation {
  constructor(private readonly scene: Phaser.Scene) {}

  play(x: number, y: number, color: number, n = 10): void {
    for (let i = 0; i < n; i++) {
      const s = this.scene.add
        .image(x, y, 'px')
        .setTint(color)
        .setDepth(80)
        .setScale(1 + Math.random() * 2);
      const a = Math.random() * Math.PI * 2;
      const d = 40 + Math.random() * 70;
      this.scene.tweens.add({
        targets: s,
        x: x + Math.cos(a) * d,
        y: y + Math.sin(a) * d,
        alpha: 0,
        duration: 380 + Math.random() * 200,
        onComplete: () => s.destroy(),
      });
    }
  }
}
