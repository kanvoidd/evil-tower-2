import type Phaser from 'phaser';

/** Бесконечное «дыхание» объекта: масштаб туда и обратно за cycleMs. */
export const pulse = (
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject,
  cycleMs: number,
  scale: number,
  delay = 0,
): Phaser.Tweens.Tween =>
  scene.tweens.add({
    targets: target,
    scaleX: scale,
    scaleY: scale,
    duration: cycleMs / 2,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
    delay,
  });

/** Появление с лёгким «выпрыгиванием» из уменьшенного размера. */
export const popIn = (
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject,
  delay = 0,
  from = 0.6,
): void => {
  (target as any).setScale?.(from);
  (target as any).setAlpha?.(0);
  scene.tweens.add({
    targets: target,
    scaleX: 1,
    scaleY: 1,
    alpha: 1,
    duration: 260,
    delay,
    ease: 'Back.easeOut',
  });
};

/**
 * Каскадное появление элементов: каждый чуть позже предыдущего «всплывает» на место с проявлением.
 * dy — откуда едут (положительное — снизу), dx — сбоку.
 */
export const staggerIn = (
  scene: Phaser.Scene,
  targets: Phaser.GameObjects.GameObject[],
  o: { delay?: number; gap?: number; dy?: number; dx?: number; ms?: number } = {},
): void => {
  const { delay = 60, gap = 55, dy = 26, dx = 0, ms = 340 } = o;
  targets.forEach((g, i) => {
    const obj = g as unknown as Phaser.GameObjects.Components.Transform &
      Phaser.GameObjects.Components.Alpha;
    if (!obj || !('x' in obj)) return;
    const x = obj.x;
    const y = obj.y;
    obj.setAlpha(0);
    obj.x = x + dx;
    obj.y = y + dy;
    scene.tweens.add({
      targets: obj,
      alpha: 1,
      x,
      y,
      duration: ms,
      delay: delay + i * gap,
      ease: 'Cubic.easeOut',
    });
  });
};
