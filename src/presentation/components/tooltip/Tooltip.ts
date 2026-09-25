import Phaser from 'phaser';

import { GAME_W } from '../../theme';
import { plateTexture, shadowTexture } from '../plate/Plates';
import { pinToScreen } from '../screen-pin/ScreenPin';
import { txt } from '../text/Text';
import type { TipState } from './interfaces/TipState';

/** Одна подсказка на сцену. */
const tips = new WeakMap<Phaser.Scene, TipState>();
const tipHooked = new WeakSet<Phaser.Scene>();

/** Прячет подсказку (если задан owner — только его собственную). */
export const hideTip = (scene: Phaser.Scene, owner?: unknown): void => {
  const cur = tips.get(scene);
  if (!cur || (owner !== undefined && cur.owner !== owner)) return;
  tips.delete(scene);
  cur.timer.remove();
  scene.tweens.add({ targets: cur.c, alpha: 0, duration: 120, onComplete: () => cur.c.destroy() });
};

/**
 * Подсказка-облачко возле якоря (экранные координаты). Появляется над якорем, а если места нет — под ним;
 * исчезает через несколько секунд или по следующему нажатию.
 */
export const showTip = (
  scene: Phaser.Scene,
  text: string,
  anchor: { x: number; y: number },
  owner: unknown = null,
  o: { gap?: number; maxW?: number; ttl?: number } = {},
): void => {
  hideTip(scene);
  const maxW = o.maxW ?? 470;
  const gap = o.gap ?? 30;
  const label = txt(scene, 0, 0, text, 22, {
    wrap: maxW,
    weight: 700,
    strokeThickness: 0,
    align: 'left',
    origin: [0, 0],
  });
  const padX = 22;
  const padY = 16;
  const w = label.width + padX * 2;
  const h = label.height + padY * 2;
  const c = scene.add.container(0, 0).setDepth(3000).setScrollFactor(0);
  c.add(scene.add.image(0, 7, shadowTexture(scene, w, h, 20, 14)).setAlpha(0.9));
  c.add(scene.add.image(0, 0, plateTexture(scene, w, h, 1, 'raised', 20)));
  label.setPosition(-w / 2 + padX, -h / 2 + padY);
  c.add(label);
  let cy = anchor.y - gap - h / 2;
  const below = cy - h / 2 < 12;
  if (below) cy = anchor.y + gap + h / 2;
  const cx = Phaser.Math.Clamp(anchor.x, 12 + w / 2, GAME_W - 12 - w / 2);
  c.setPosition(cx, cy);
  const px = Phaser.Math.Clamp(anchor.x - cx, -w / 2 + 28, w / 2 - 28);
  const tail = scene.add.graphics();
  if (below)
    tail
      .fillStyle(0x40476a, 1)
      .fillTriangle(px - 11, -h / 2 + 1, px + 11, -h / 2 + 1, px, -h / 2 - 11);
  else
    tail
      .fillStyle(0x2a2f49, 1)
      .fillTriangle(px - 11, h / 2 - 1, px + 11, h / 2 - 1, px, h / 2 + 11);
  c.add(tail);
  pinToScreen(c);
  c.setAlpha(0);
  scene.tweens.add({ targets: c, alpha: 1, duration: 140 });
  const timer = scene.time.delayedCall(o.ttl ?? 5200, () => hideTip(scene, owner));
  tips.set(scene, { c, owner, timer });
  if (!tipHooked.has(scene)) {
    tipHooked.add(scene);
    // сцена переиспользуется при перезапуске: старую подсказку нужно забыть вместе с её объектами
    scene.events.on('shutdown', () => tips.delete(scene));
  }
  // следующее нажатие где угодно закрывает подсказку (регистрируем чуть позже, чтобы не сработало от текущего)
  scene.time.delayedCall(60, () => scene.input?.once('pointerdown', () => hideTip(scene)));
};

/**
 * Подсказка для интерактивного объекта: на компьютере — при наведении мыши, на телефоне — при долгом нажатии
 * (обычное короткое нажатие работает как раньше; после долгого нажатия действие кнопки не срабатывает).
 */
export const tipOnHover = (
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.Container,
  tip: string | (() => string),
): void => {
  const text = (): string => (typeof tip === 'string' ? tip : tip());
  const show = (): void => {
    const b = obj.getBounds();
    showTip(scene, text(), { x: b.centerX, y: b.top }, obj, { gap: 12 });
  };
  let hold: Phaser.Time.TimerEvent | null = null;
  const cancelHold = (): void => {
    hold?.remove();
    hold = null;
  };
  obj.on('pointerover', (p: Phaser.Input.Pointer) => {
    if (!p.wasTouch) show();
  });
  obj.on('pointerout', () => {
    cancelHold();
    hideTip(scene, obj);
  });
  obj.on('pointerdown', (p: Phaser.Input.Pointer) => {
    hideTip(scene, obj);
    if (!p.wasTouch) return;
    cancelHold();
    hold = scene.time.delayedCall(450, () => {
      hold = null;
      show();
      (obj as { swallowClick?: boolean }).swallowClick = true;
    });
  });
  obj.on('pointerup', (p: Phaser.Input.Pointer) => {
    cancelHold();
    // после нажатия подсказка обновляется: мышь всё ещё над кнопкой — показываем актуальное состояние («Сейчас включено…»)
    hideTip(scene, obj);
    if (!p.wasTouch) show();
  });
};
