import Phaser from 'phaser';

import { FLOORS, ROOMS, ROOMS_PER_FLOOR } from '../../../domain/catalog';
import { t, type TKey } from '../../../i18n';
import {
  background,
  closeButton,
  PlateButton,
  plateTexture,
  ScrollList,
  shadowTexture,
  staggerIn,
  toast,
  txt,
  UiSound,
} from '../../components';
import { zoomIn } from '../../navigation/SceneTransitions';
import { COLOR, GAME_H, GAME_W, HEX } from '../../theme';
import type { LevelsViewDeps } from './interfaces/LevelsViewDeps';

/**
 * Башня — карта рекорда: зелёные комнаты герой уже проходил за один забег, золотая — та, где забег
 * оборвался. Отсюда комнату не запустить: забег всегда начинается с 1-1 («Играть» в лобби).
 * Башня снизу вверх. Все этажи — одинаковые плиты по центру; комнаты идут слева направо, снизу вверх:
 * нижний ряд из трёх плиток, верхний — обычная комната и широкая плитка босса.
 */
export class LevelsView {
  private static readonly VIEW = new Phaser.Geom.Rectangle(0, 128, GAME_W, GAME_H - 128);
  private static readonly HEADER_H = 88;
  private static readonly ROW_H = 122;
  private static readonly TILE_H = 96;
  private static readonly SLAB_W = 624;
  private static readonly SLAB_PAD = 28;
  private static readonly GAP = 20;
  private static readonly SLAB_GAP = 8;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly d: LevelsViewDeps,
  ) {
    const L = LevelsView;
    const s = scene;
    background(s);
    const title = txt(s, GAME_W / 2, 66, t('levels.title'), 54, {
      font: 'title',
      color: HEX.gold,
      strokeThickness: 6,
    });
    const record = txt(
      s,
      GAME_W / 2,
      106,
      t('levels.record', { n: d.record.best, max: ROOMS.length }),
      20,
      { color: HEX.textDim, weight: 800, strokeThickness: 0 },
    );
    const close = closeButton(s, () => d.exit.leave());

    const lowRow = Math.ceil(ROOMS_PER_FLOOR / 2);
    const blockH = L.HEADER_H + 2 * L.ROW_H + 26;
    const topPad = 130;
    const bottomPad = 110;
    const total = topPad + bottomPad + FLOORS * blockH;
    const list = new ScrollList(s, L.VIEW, total);
    const c = list.content;

    const cx = GAME_W / 2;
    const l = cx - L.SLAB_W / 2;
    const r = cx + L.SLAB_W / 2;
    const inner = L.SLAB_W - L.SLAB_PAD * 2;
    const cell = (inner - L.GAP * (lowRow - 1)) / lowRow;
    let frontierY = total - bottomPad;

    // Третий этаж — вверху списка, первый — внизу.
    for (let f = FLOORS; f >= 1; f--) {
      const yTop = topPad + (FLOORS - f) * blockH;
      const slabH = blockH - L.SLAB_GAP;

      c.add(
        s.add
          .image(cx, yTop + slabH / 2 + 8, shadowTexture(s, L.SLAB_W, slabH, 32, 20))
          .setAlpha(0.85),
      );
      c.add(s.add.image(cx, yTop + slabH / 2, plateTexture(s, L.SLAB_W, slabH, 1, 'panel', 32)));
      if (f === FLOORS) {
        const teeth = 5;
        const tw = L.SLAB_W / (teeth * 2 - 1);
        for (let n = 0; n < teeth; n++) {
          c.add(
            s.add.image(l + n * 2 * tw + tw / 2, yTop - 8, plateTexture(s, tw, 36, 1, 'panel', 8)),
          );
        }
      }

      // заголовок этажа: название слева, прогресс справа
      const done = ROOMS.filter((rm, i) => rm.floor === f && this.reached(i) === 'cleared').length;
      c.add(
        txt(
          s,
          l + 34,
          yTop + 40,
          `${t('levels.floor', { n: f })} · ${t(`floor.${f}.name` as TKey)}`,
          30,
          { font: 'title', origin: [0, 0.5], color: HEX.gold, strokeThickness: 0 },
        ),
      );
      c.add(
        txt(s, r - 34, yTop + 40, `${done} / ${ROOMS_PER_FLOOR}`, 24, {
          origin: [1, 0.5],
          color: done === ROOMS_PER_FLOOR ? HEX.good : HEX.textDim,
          weight: 900,
          strokeThickness: 0,
        }),
      );

      // комнаты: номера растут снизу вверх и слева направо
      const bottom = yTop + slabH;
      for (let i = 1; i <= ROOMS_PER_FLOOR; i++) {
        const index = ROOMS.findIndex((rm) => rm.floor === f && rm.index === i);
        const room = ROOMS[index];
        const row = i <= lowRow ? 0 : 1;
        const col = row === 0 ? i - 1 : i - lowRow - 1;
        const boss = i === ROOMS_PER_FLOOR;
        const w = boss && row === 1 ? inner - col * (cell + L.GAP) : cell;
        const x = l + L.SLAB_PAD + col * (cell + L.GAP) + w / 2;
        const cy2 = bottom - 12 - row * L.ROW_H - L.ROW_H / 2;
        c.add(this.roomButton(room.id, this.reached(index), x, cy2, w, boss));
        if (this.reached(index) === 'frontier') frontierY = cy2;
      }
    }

    list.scrollToContentY(frontierY);
    s.input.keyboard?.on('keydown-ESC', () => d.exit.leave());
    zoomIn(s);
    staggerIn(s, [title, record, close], { dy: -22, delay: 200, gap: 60 });
    // башня проявляется плавно и «поднимается» на место
    c.setAlpha(0);
    s.tweens.add({ targets: c, alpha: 1, duration: 420, delay: 300, ease: 'Sine.easeOut' });
  }

  /** Сколько комнат герой прошёл за лучший забег и докуда он дошёл. */
  private reached(index: number): 'cleared' | 'frontier' | 'locked' {
    const best = this.d.record.best;
    return index < best ? 'cleared' : index === best ? 'frontier' : 'locked';
  }

  private roomButton(
    id: string,
    state: 'cleared' | 'frontier' | 'locked',
    x: number,
    y: number,
    w: number,
    boss: boolean,
  ): Phaser.GameObjects.Container {
    const s = this.scene;
    const cleared = state === 'cleared';
    const frontier = state === 'frontier';
    const available = cleared || frontier;
    const holder = s.add.container(x, y);
    if (frontier) {
      const glow = s.add
        .image(0, 0, 'glow')
        .setTint(COLOR.gold)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDisplaySize(w + 90, LevelsView.TILE_H + 90)
        .setAlpha(0.3);
      s.tweens.add({
        targets: glow,
        alpha: { from: 0.12, to: 0.36 },
        duration: 1700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      holder.add(glow);
    }
    const style = frontier ? 'gold' : cleared ? 'green' : 'dark';
    const iconKey = !available
      ? 'svg_lock'
      : boss
        ? 'svg_skull'
        : cleared
          ? 'svg_check'
          : undefined;
    const btn = new PlateButton(s, 0, 0, {
      w,
      h: LevelsView.TILE_H,
      label: available ? id : undefined,
      fontSize: boss ? 40 : 36,
      radius: 26,
      style,
      icon: iconKey,
      iconSize: !available ? 40 : 30,
      sound: null,
      shadow: available,
      pulse: frontier ? { cycle: 2800, scale: 1.03 } : undefined,
      onClick: () => {
        // комнату отсюда не запустить: подсказываем, как устроен забег
        UiSound.play(available ? 'click' : 'error');
        toast(
          s,
          available ? t('levels.run_hint') : t('levels.locked'),
          available ? 'svg_arrow' : 'svg_lock',
        );
      },
    });
    if (!available) btn.pulseC.setAlpha(0.75);
    holder.add(btn);
    return holder;
  }
}
