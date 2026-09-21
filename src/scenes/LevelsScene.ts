import Phaser from 'phaser';
import { COLOR, GAME_H, GAME_W, HEX } from '../config';
import { FLOORS, ROOMS, ROOMS_PER_FLOOR } from '../data/levels';
import { AUDIO } from '../systems/Audio';
import { Store } from '../systems/Store';
import { t } from '../i18n';
import type { TKey } from '../i18n';
import {
  background, bindToasts, closeButton, fadeToScene, leaveMenu, PlateButton, plateTexture, ScrollList, shadowTexture, staggerIn, toast, txt,
  zoomIn,
} from '../ui/Kit';

const VIEW = new Phaser.Geom.Rectangle(0, 128, GAME_W, GAME_H - 128);
const HEADER_H = 88;
const ROW_H = 122;
const TILE_H = 96;
const SLAB_W = 624;
const SLAB_PAD = 28;
const GAP = 20;
const SLAB_GAP = 8;

/**
 * Башня: снизу вверх. Все этажи — одинаковые плиты по центру; комнаты идут слева направо, снизу вверх:
 * нижний ряд из трёх плиток, верхний — обычная комната и широкая плитка босса.
 */
export class LevelsScene extends Phaser.Scene {
  private list!: ScrollList;
  private closing = false;

  constructor() {
    super('Levels');
  }

  init(): void {
    this.closing = false;
  }

  create(): void {
    background(this);
    bindToasts(this);
    const title = txt(this, GAME_W / 2, 66, t('levels.title'), 54, { font: 'title', color: HEX.gold, strokeThickness: 6 });
    const close = closeButton(this, () => this.close());

    const lowRow = Math.ceil(ROOMS_PER_FLOOR / 2);
    const blockH = HEADER_H + 2 * ROW_H + 26;
    const topPad = 130;
    const bottomPad = 110;
    const total = topPad + bottomPad + FLOORS * blockH;
    this.list = new ScrollList(this, VIEW, total);
    const c = this.list.content;

    const cx = GAME_W / 2;
    const l = cx - SLAB_W / 2;
    const r = cx + SLAB_W / 2;
    const inner = SLAB_W - SLAB_PAD * 2;
    const cell = (inner - GAP * (lowRow - 1)) / lowRow;
    let frontierY = total - bottomPad;

    // Третий этаж — вверху списка, первый — внизу.
    for (let f = FLOORS; f >= 1; f--) {
      const yTop = topPad + (FLOORS - f) * blockH;
      const slabH = blockH - SLAB_GAP;

      c.add(this.add.image(cx, yTop + slabH / 2 + 8, shadowTexture(this, SLAB_W, slabH, 32, 20)).setAlpha(0.85));
      c.add(this.add.image(cx, yTop + slabH / 2, plateTexture(this, SLAB_W, slabH, 1, 'panel', 32)));
      if (f === FLOORS) {
        const teeth = 5;
        const tw = SLAB_W / (teeth * 2 - 1);
        for (let n = 0; n < teeth; n++) {
          c.add(this.add.image(l + n * 2 * tw + tw / 2, yTop - 8, plateTexture(this, tw, 36, 1, 'panel', 8)));
        }
      }

      // заголовок этажа: название слева, прогресс справа
      const done = ROOMS.filter((rm) => rm.floor === f && Store.isCleared(rm.id)).length;
      c.add(txt(this, l + 34, yTop + 40, `${t('levels.floor', { n: f })} · ${t(`floor.${f}.name` as TKey)}`, 30, { font: 'title', origin: [0, 0.5], color: HEX.gold, strokeThickness: 0 }));
      c.add(txt(this, r - 34, yTop + 40, `${done} / ${ROOMS_PER_FLOOR}`, 24, { origin: [1, 0.5], color: done === ROOMS_PER_FLOOR ? HEX.good : HEX.textDim, weight: 900, strokeThickness: 0 }));

      // комнаты: номера растут снизу вверх и слева направо
      const bottom = yTop + slabH;
      for (let i = 1; i <= ROOMS_PER_FLOOR; i++) {
        const room = ROOMS.find((rm) => rm.floor === f && rm.index === i)!;
        const row = i <= lowRow ? 0 : 1;
        const col = row === 0 ? i - 1 : i - lowRow - 1;
        const boss = i === ROOMS_PER_FLOOR;
        const w = boss && row === 1 ? inner - col * (cell + GAP) : cell;
        const x = l + SLAB_PAD + col * (cell + GAP) + w / 2;
        const cy = bottom - 12 - row * ROW_H - ROW_H / 2;
        c.add(this.roomButton(room.id, x, cy, w, boss));
        if (room.id === Store.frontierRoom) frontierY = cy;
      }
    }

    this.list.scrollToContentY(frontierY);
    this.input.keyboard?.on('keydown-ESC', () => this.close());
    zoomIn(this);
    staggerIn(this, [title, close], { dy: -22, delay: 200, gap: 60 });
    // башня проявляется плавно и «поднимается» на место
    const content = this.list.content;
    content.setAlpha(0);
    this.tweens.add({ targets: content, alpha: 1, duration: 420, delay: 300, ease: 'Sine.easeOut' });
  }

  private roomButton(id: string, x: number, y: number, w: number, boss: boolean): Phaser.GameObjects.Container {
    const cleared = Store.isCleared(id);
    const frontier = id === Store.frontierRoom;
    const available = cleared || frontier;
    const holder = this.add.container(x, y);
    if (frontier) {
      const glow = this.add.image(0, 0, 'glow').setTint(COLOR.gold).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(w + 90, TILE_H + 90).setAlpha(0.3);
      this.tweens.add({ targets: glow, alpha: { from: 0.12, to: 0.36 }, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      holder.add(glow);
    }
    const style = frontier ? 'gold' : cleared ? 'green' : 'dark';
    const icon = !available ? 'svg_lock' : boss ? 'svg_skull' : cleared ? 'svg_check' : undefined;
    const btn = new PlateButton(this, 0, 0, {
      w, h: TILE_H, label: available ? id : undefined, fontSize: boss ? 40 : 36, radius: 26, style,
      icon, iconSize: !available ? 40 : 30, sound: null, shadow: available,
      pulse: frontier ? { cycle: 2800, scale: 1.03 } : undefined,
      onClick: () => {
        if (!this.list.contains(this.input.activePointer)) return;
        if (!available) {
          AUDIO.play('error');
          toast(this, t('levels.locked'), 'svg_lock');
          return;
        }
        AUDIO.play('open');
        fadeToScene(this, 'Game', { roomId: id });
      },
    });
    if (!available) btn.pulseC.setAlpha(0.75);
    holder.add(btn);
    return holder;
  }

  private close(): void {
    if (this.closing) return;
    this.closing = true;
    AUDIO.play('click');
    leaveMenu(this, 'Hub', { from: 'levels' });
  }
}
