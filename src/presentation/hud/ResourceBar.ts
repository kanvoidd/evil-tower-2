import Phaser from 'phaser';

import type { ResourceKind } from '../../domain/catalog';
import { ConsumableBalance } from '../../domain/combat';
import { t, type TKey } from '../../i18n';
import { plateTexture, shadowTexture, txt } from '../components';
import { GAME_W, HEX } from '../theme';

/** Полоса ресурса класса над кнопками способностей: плавно доливается, показывает ускорение от зелья. */
export class ResourceBar {
  static readonly Y = 992;

  /** Цвет шкалы по ресурсу линейки. */
  private static readonly COLOR: Record<ResourceKind, number> = {
    stamina: 0xe9c94a,
    mana: 0x4f9bff,
    concentration: 0x46d68a,
    vigilance: 0xb287ff,
  };

  private readonly gfx: Phaser.GameObjects.Graphics;
  private readonly text: Phaser.GameObjects.Text;
  private readonly boost: Phaser.GameObjects.Text;
  private shown = 0;

  constructor(private readonly scene: Phaser.Scene) {
    const y = ResourceBar.Y;
    scene.add.image(GAME_W / 2, y, shadowTexture(scene, 480, 36, 18, 10)).setAlpha(0.7);
    scene.add.image(GAME_W / 2, y, plateTexture(scene, 480, 36, 1, 'dark', 18));
    this.gfx = scene.add.graphics();
    this.text = txt(scene, GAME_W / 2, y - 1, '', 20, { weight: 900 });
    this.boost = txt(scene, GAME_W / 2 + 250, y, '', 19, {
      color: HEX.gold,
      origin: [0, 0.5],
      weight: 900,
    });
  }

  update(res: number, max: number, kind: ResourceKind, boosted: boolean): void {
    this.scene.tweens.addCounter({
      from: this.shown,
      to: res,
      duration: 200,
      onUpdate: (tw) => {
        this.shown = tw.getValue() ?? res;
        this.draw(max, kind);
      },
      onComplete: () => {
        this.shown = res;
        this.draw(max, kind);
      },
    });
    this.text.setText(`${t(`res.${kind}` as TKey)}  ${Math.floor(res)}/${max}`);
    this.boost.setText(boosted ? `x${ConsumableBalance.regenBoostMul}` : '');
  }

  /** Не хватает ресурса: подпись шкалы мигает. */
  flash(): void {
    this.scene.tweens.add({ targets: this.text, alpha: 0.3, duration: 90, yoyo: true, repeat: 2 });
  }

  private draw(max: number, kind: ResourceKind): void {
    const k = Phaser.Math.Clamp(this.shown / max, 0, 1);
    const g = this.gfx;
    const h = 26;
    const x0 = GAME_W / 2 - 240 + 5;
    const y0 = ResourceBar.Y - h / 2;
    const w = Math.max(h, 470 * k);
    g.clear();
    if (k <= 0) return;
    g.fillStyle(ResourceBar.COLOR[kind], 1).fillRoundedRect(x0, y0, w, h, h / 2);
    g.fillStyle(0xffffff, 0.24).fillRoundedRect(
      x0 + 4,
      y0 + 3,
      Math.max(4, w - 8),
      h / 2 - 3,
      (h / 2 - 3) / 2,
    );
  }
}
