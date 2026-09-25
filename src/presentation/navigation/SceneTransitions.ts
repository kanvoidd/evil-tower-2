import Phaser from 'phaser';

import { COLOR, GAME_H, GAME_W, TIMING } from '../theme';
import type { ZoomFrom } from './interfaces/ZoomFrom';

/**
 * Переходы между экранами: окно меню из кнопки, наезд камеры, мягкий уход из меню.
 * Уходящая сцена запускает следующую, пришедшая — проигрывает своё появление.
 */

/**
 * «Окно» из кнопки: каменный фон меню виден через скруглённое окно, размер которого плавно меняется между
 * прямоугольником кнопки и всем экраном. По краю — тонкая золотая кайма, углы к концу выпрямляются.
 * t = 0 — окно равно кнопке, t = 1 — окно на весь экран.
 */
const windowReveal = (
  scene: Phaser.Scene,
  from: ZoomFrom,
): { set: (t: number) => void; destroy: () => void } => {
  const img = scene.add
    .image(GAME_W / 2, GAME_H / 2, 'bg_stone')
    .setDepth(3000)
    .setScrollFactor(0);
  const maskG = scene.make.graphics({ x: 0, y: 0 }, false).setScrollFactor(0);
  img.setMask(maskG.createGeometryMask());
  const edge = scene.add.graphics().setDepth(3001).setScrollFactor(0);
  const lerp = Phaser.Math.Linear;
  return {
    set: (t) => {
      const x = lerp(from.x, GAME_W / 2, t);
      const y = lerp(from.y, GAME_H / 2, t);
      const w = lerp(from.w, GAME_W, t);
      const h = lerp(from.h, GAME_H, t);
      const r = lerp(28, 0, t * t);
      maskG
        .clear()
        .fillStyle(0xffffff, 1)
        .fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
      edge
        .clear()
        .lineStyle(4, COLOR.gold, 0.8 * (1 - t))
        .strokeRoundedRect(x - w / 2, y - h / 2, w, h, r);
    },
    destroy: () => {
      img.clearMask(true);
      img.destroy();
      maskG.destroy();
      edge.destroy();
    },
  };
};

/**
 * Выход из меню: всё содержимое (кроме каменного фона) плавно гаснет, затем запускается следующая сцена.
 * Так возврат в хаб не «рубит» интерфейс на полуслове — дальше окно сжимается в кнопку (zoomIn с `to`).
 */
export const leaveMenu = (scene: Phaser.Scene, next: string, data?: object, ms = 170): void => {
  const targets = scene.children.list.filter(
    (o) => (o as unknown as { depth: number }).depth > -100,
  );
  scene.tweens.add({
    targets,
    alpha: 0,
    duration: ms,
    ease: 'Sine.easeIn',
    onComplete: () => scene.scene.start(next, data),
  });
};

/** Открытие меню: окно вырастает из кнопки на весь экран, затем запускается целевая сцена (она проявляет содержимое). */
export const zoomOut = (scene: Phaser.Scene, from: ZoomFrom, next: string, data?: object): void => {
  const win = windowReveal(scene, from);
  const state = { t: 0 };
  win.set(0);
  scene.tweens.add({
    targets: state,
    t: 1,
    duration: TIMING.menuZoom,
    ease: 'Cubic.easeInOut',
    onUpdate: () => win.set(state.t),
    onComplete: () => scene.scene.start(next, { ...data, zoomIn: true }),
  });
};

/**
 * Появление сцены. Без `to` каменный фон просто растворяется, открывая содержимое (меню после открытия);
 * с `to` окно сжимается обратно в кнопку-источник (возврат в хаб).
 */
export const zoomIn = (scene: Phaser.Scene, to?: ZoomFrom): void => {
  if (!to) {
    const img = scene.add
      .image(GAME_W / 2, GAME_H / 2, 'bg_stone')
      .setDepth(3000)
      .setScrollFactor(0);
    scene.tweens.add({
      targets: img,
      alpha: 0,
      duration: TIMING.menuZoom * 0.8,
      ease: 'Sine.easeOut',
      onComplete: () => img.destroy(),
    });
    return;
  }
  const win = windowReveal(scene, to);
  const state = { t: 1 };
  win.set(1);
  scene.tweens.add({
    targets: state,
    t: 0,
    duration: TIMING.menuZoom,
    ease: 'Cubic.easeInOut',
    onUpdate: () => win.set(state.t),
    onComplete: () => win.destroy(),
  });
};

/**
 * Уход в другую сцену: экран затемняется и чуть «наезжает» (камера приближается) — ощущение движения вперёд.
 * Новая сцена в ответ вызывает dollyIn.
 */
export const fadeToScene = (scene: Phaser.Scene, next: string, data?: object, ms = 280): void => {
  const cam = scene.cameras.main;
  cam.fadeOut(ms, 9, 10, 16);
  cam.zoomTo(1.06, ms, 'Cubic.easeIn');
  cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start(next, data));
};

/** Появление сцены после fadeToScene: камера отъезжает с лёгким увеличением, картинка проявляется. */
export const dollyIn = (scene: Phaser.Scene, ms = 380): void => {
  const cam = scene.cameras.main;
  cam.fadeIn(Math.round(ms * 0.75), 9, 10, 16);
  cam.setZoom(0.95);
  cam.zoomTo(1, ms, 'Cubic.easeOut');
};
