import type Phaser from 'phaser';

/** Твины Phaser как обещания: анимации боя ждут друг друга через await, а не через вложенные колбэки. */
export class PhaserTweens {
  constructor(private readonly scene: Phaser.Scene) {}

  /** Запускает твин и разрешается, когда он доиграл. */
  play(cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((done) => this.scene.tweens.add({ ...cfg, onComplete: () => done() }));
  }

  /** Твин без ожидания — для фоновых движений, которые никто не ждёт. */
  fire(cfg: Phaser.Types.Tweens.TweenBuilderConfig): Phaser.Tweens.Tween {
    return this.scene.tweens.add(cfg);
  }

  /** Остановить все твины объекта (например, перед тем как вернуть карточку на место). */
  stop(target: object): void {
    this.scene.tweens.killTweensOf(target);
  }
}
