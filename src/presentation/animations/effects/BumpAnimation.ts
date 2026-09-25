import type Phaser from 'phaser';

/** Короткий «толчок»: объект чуть увеличивается и возвращается — на него стоит посмотреть. */
export class BumpAnimation {
  constructor(private readonly scene: Phaser.Scene) {}

  play(target: Phaser.GameObjects.GameObject, scale: number, ms: number, o: { delay?: number; repeat?: number } = {}): void {
    this.scene.tweens.add({ targets: target, scale, duration: ms, delay: o.delay ?? 0, yoyo: true, repeat: o.repeat ?? 0 });
  }
}
