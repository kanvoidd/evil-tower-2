import Phaser from 'phaser';

import type { ISoundPlayer } from '../../application/ports';
import { CONSUMABLE_SLOTS, CONSUMABLES } from '../../domain/catalog';
import { type IBattleState, needsHeal, needsRegen, worthArtifact } from '../../domain/combat';
import type { ConsumableId, LineageId } from '../../domain/types';
import { t, type TKey } from '../../i18n';
import type { Animations } from '../animations/Animations';
import type { Point } from '../animations/interfaces/Point';
import { icon, outlineTexture, plateTexture, shadowTexture, tipOnHover, txt } from '../components';
import { HEX } from '../theme';
import type { ConsumableSlot } from './interfaces/ConsumableSlot';
import type { IHudActions } from './interfaces/IHudActions';

/**
 * Три слота расходников слева сверху: счётчик в бейдже на углу (не перекрывает иконку),
 * золотая рамка, когда расходник действительно нужен, а под каждым — переключатель «АВТО».
 */
export class ConsumableBar {
  static readonly Y = 58;

  private static readonly AUTO_TIP: Record<ConsumableId, TKey> = {
    potion_heal: 'auto.use.heal.tip',
    potion_regen: 'auto.use.regen.tip',
    artifact: 'auto.use.artifact.tip',
  };

  private readonly slots: ConsumableSlot[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    lineage: LineageId,
    private readonly actions: IHudActions,
    private readonly animations: Animations,
    private readonly sound: ISoundPlayer,
  ) {
    CONSUMABLE_SLOTS.forEach((id, i) => {
      const x = 62 + i * 84;
      const y = ConsumableBar.Y;
      const locked = !!CONSUMABLES[id].lineage && CONSUMABLES[id].lineage !== lineage;
      const c = scene.add.container(x, y);
      c.add(scene.add.image(0, 5, shadowTexture(scene, 74, 74, 22, 10)).setAlpha(0.8));
      c.add(scene.add.image(0, 0, plateTexture(scene, 74, 74, 1, 'panel', 22)));
      const hint = scene.add
        .image(0, 0, outlineTexture(scene, 74, 74, 22, '#f0c75e', 4))
        .setVisible(false);
      c.add(hint);
      c.add(
        icon(scene, 0, -1, locked ? 'svgw_lock' : CONSUMABLES[id].icon, locked ? 32 : 50).setAlpha(
          locked ? 0.4 : 1,
        ),
      );
      const badge = scene.add.container(26, 26);
      badge.add(scene.add.circle(0, 0, 15, 0x0b0d12).setStrokeStyle(2, 0xf0c75e));
      const count = txt(scene, 0, -1, '', 18, { weight: 900, strokeThickness: 0 });
      badge.add(count);
      c.add(badge);
      c.setSize(74, 74).setInteractive(
        new Phaser.Geom.Rectangle(0, 0, 74, 74),
        Phaser.Geom.Rectangle.Contains,
      );
      c.on('pointerup', (p: Phaser.Input.Pointer) => {
        if (Phaser.Math.Distance.Between(p.x, p.y, p.downX, p.downY) < 20)
          actions.command({ type: 'use-item', itemId: id });
      });
      this.slots.push({ id, c, badge, count, hint, locked });
      if (!locked) this.buildAutoPill(id, x, y + 55);
    });
  }

  isLocked(item: ConsumableId): boolean {
    return !!this.slots.find((s) => s.id === item)?.locked;
  }

  anchor(item: ConsumableId): Point | null {
    const sl = this.slots.find((s) => s.id === item);
    return sl ? { x: sl.c.x, y: sl.c.y } : null;
  }

  /** Находка прилетела в слот — он «подпрыгивает», когда значок долетает. */
  bump(item: ConsumableId): void {
    const sl = this.slots.find((s) => s.id === item);
    if (sl) this.animations.bump.play(sl.c, 1.12, 140, { delay: 500 });
  }

  /** Расходник применился сам — слот заметно подскакивает. */
  jump(item: ConsumableId): void {
    const sl = this.slots.find((s) => s.id === item);
    if (sl) this.animations.bump.play(sl.c, 1.16, 170);
  }

  update(battle: IBattleState): void {
    this.slots.forEach((sl) => {
      const n = battle.consumables[sl.id];
      sl.count.setText(String(n));
      sl.badge.setVisible(!sl.locked && n > 0);
      sl.c.setAlpha(sl.locked ? 0.5 : n > 0 ? 1 : 0.5);
    });
    this.updateHints(battle);
  }

  /** Подсвечивает расходник, когда он действительно нужен (те же правила, что у автоприменения; лечение — с запасом). */
  private updateHints(battle: IBattleState): void {
    const s = battle.stats;
    const wants: Partial<Record<ConsumableId, boolean>> = {
      potion_heal:
        needsHeal(battle) || (battle.hp <= s.maxHp * 0.4 && battle.consumables.potion_heal > 0),
      potion_regen: needsRegen(battle),
      artifact: worthArtifact(battle),
    };
    this.slots.forEach((sl) => {
      const on = !!wants[sl.id];
      sl.hint.setVisible(on);
      if (on && !sl.hintTween) {
        sl.hintTween = this.scene.tweens.add({
          targets: sl.hint,
          alpha: { from: 0.4, to: 1 },
          duration: 1100,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      } else if (!on && sl.hintTween) {
        sl.hintTween.stop();
        sl.hintTween = undefined;
      }
    });
  }

  /**
   * Переключатель автоприменения — маленькая кнопка «АВТО» прямо под расходником. Нажатие — включить/выключить,
   * наведение мыши или долгое нажатие — подсказка с понятным описанием, что именно и когда применяется само.
   */
  private buildAutoPill(id: ConsumableId, x: number, y: number): void {
    const s = this.scene;
    const w = 74;
    const h = 30;
    const c = Object.assign(s.add.container(x, y), { swallowClick: false });
    const plate = s.add.image(0, 0, plateTexture(s, w, h, 1, 'dark', h / 2));
    const label = txt(s, 0, -1, t('auto.tag'), 15, { weight: 900, strokeThickness: 0 });
    c.add([plate, label]);
    const refresh = (): void => {
      const on = this.actions.isAutoOn(id);
      plate.setTexture(plateTexture(s, w, h, 1, on ? 'green' : 'dark', h / 2));
      label.setColor(on ? '#0f3b23' : HEX.textDim);
    };
    refresh();
    // область нажатия чуть больше кнопки (палец крупнее), но вниз — чтобы не отнимать площадь у самого расходника
    c.setSize(w, h).setInteractive(
      new Phaser.Geom.Rectangle(-6, -2, w + 12, h + 18),
      Phaser.Geom.Rectangle.Contains,
    );
    c.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (c.swallowClick) {
        c.swallowClick = false;
        return;
      }
      if (Phaser.Math.Distance.Between(p.x, p.y, p.downX, p.downY) > 20) return;
      const on = this.actions.toggleAuto(id);
      this.sound.play('click');
      refresh();
      this.animations.text.show(
        x,
        y + 32,
        `${t('auto.tag')}: ${t(on ? 'auto.on' : 'auto.off')}`,
        on ? HEX.good : HEX.textDim,
        20,
      );
    });
    tipOnHover(
      s,
      c,
      () =>
        `${t(ConsumableBar.AUTO_TIP[id])}\n${t(this.actions.isAutoOn(id) ? 'auto.state.on' : 'auto.state.off')}`,
    );
  }
}
