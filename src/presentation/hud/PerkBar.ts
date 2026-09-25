import type Phaser from 'phaser';

import { type AbilityDef, FULL_BAR } from '../../domain/catalog';
import type { IBattleState } from '../../domain/combat';
import { abilityDesc, abilityName } from '../../i18n';
import type { Animations } from '../animations/Animations';
import { outlineTexture, PlateButton, tipOnHover, txt } from '../components';
import { abilityIcon } from '../textures';
import { GAME_W, HEX } from '../theme';
import type { IHudActions } from './interfaces/IHudActions';
import type { PerkButton } from './interfaces/PerkButton';

/**
 * Нижняя панель способностей. Способностей у поздних классов до десяти (перки сохраняются
 * при метаморфозе), поэтому кнопки раскладываются в один или два ряда и всегда центрируются.
 * Нажатие не применяет способность само — кнопка отдаёт команду игрока.
 */
export class PerkBar {
  private static readonly GRID_Y = 1158;
  private static readonly ROW_GAP = 92;
  private static readonly BTN_W = 112;
  private static readonly BTN_H = 84;
  private static readonly BTN_GAP = 14;
  private static readonly PER_ROW = 5;

  private readonly buttons: PerkButton[] = [];

  constructor(scene: Phaser.Scene, list: readonly AbilityDef[], actions: IHudActions) {
    if (!list.length) return;
    // до пяти кнопок — один ряд, дальше две полки (у пироманта и берсерка их десять)
    const rows = list.length > PerkBar.PER_ROW ? 2 : 1;
    const perRow = rows === 1 ? list.length : Math.ceil(list.length / 2);
    const h = PerkBar.BTN_H;
    const gap = PerkBar.BTN_GAP;
    // чем меньше кнопок, тем они крупнее — панель заполнена и на первом классе, и на финальном
    const w = [220, 220, 180, 148, 128, PerkBar.BTN_W][Math.min(perRow, 5)];
    const nameSize = Math.min(16, Math.round(w / 8));
    const yTop = PerkBar.GRID_Y - ((rows - 1) * PerkBar.ROW_GAP) / 2;
    list.forEach((perk, i) => {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, list.length - row * perRow);
      const total = inRow * w + (inRow - 1) * gap;
      const x = (GAME_W - total) / 2 + w / 2 + (i - row * perRow) * (w + gap);
      const y = yTop + row * PerkBar.ROW_GAP;
      const btn = new PlateButton(scene, x, y, {
        w,
        h,
        icon: abilityIcon(perk.id),
        iconSize: 46,
        radius: 22,
        style: 'raised',
        onClick: () => actions.command({ type: 'use-perk', abilityId: perk.id }),
      });
      btn.iconImg?.setY(-12);
      const frame = scene.add
        .image(0, 0, outlineTexture(scene, w, h, 22, '#f0c75e', 4))
        .setVisible(false);
      btn.pulseC.add(frame);
      // название под значком: в ряду из десяти кнопок иначе не понять, что где
      const name = txt(scene, 0, h / 2 - 15, abilityName(perk), nameSize, {
        weight: 800,
        strokeThickness: 3,
        color: HEX.textDim,
        maxWidth: w - 12,
      });
      btn.pulseC.add(name);
      // цена — бейдж в левом верхнем углу кнопки
      const costPlate = scene.add
        .circle(-w / 2 + 16, -h / 2 + 15, 14, 0x0b0d12)
        .setStrokeStyle(2, 0xf0c75e);
      const costText = txt(scene, costPlate.x, costPlate.y - 1, '', 16, {
        weight: 900,
        strokeThickness: 0,
        color: HEX.gold,
      });
      btn.pulseC.add([costPlate, costText]);
      tipOnHover(scene, btn, () => `${abilityName(perk)}\n${abilityDesc(perk)}`);
      this.buttons.push({ perk, btn, costText, costPlate, name, frame });
    });
  }

  get count(): number {
    return this.buttons.length;
  }

  /** Заряд, цена, перезарядка и доступность каждой кнопки — по текущему бою. */
  update(battle: IBattleState): void {
    for (const pb of this.buttons) {
      const ready = battle.perkReady(pb.perk);
      const armed = battle.armed?.id === pb.perk.id;
      const cd = battle.cooldownOf(pb.perk);
      const free = cd === 0 && battle.perkCostOf(pb.perk) === 0 && pb.perk.goldCost === undefined;
      pb.btn.setStyle(armed ? 'gold' : 'raised');
      pb.btn.setLocked(!ready.ok);
      pb.frame.setVisible(armed);
      pb.costText.setText(PerkBar.costLabel(battle, pb.perk));
      const costColor = cd > 0 ? HEX.soul : !ready.ok ? HEX.textMute : free ? HEX.good : HEX.gold;
      pb.costText.setColor(costColor);
      pb.costPlate.setStrokeStyle(2, parseInt(costColor.slice(1), 16));
      pb.name.setColor(armed ? HEX.dark : ready.ok ? HEX.text : HEX.textMute);
      pb.btn.pulseC.setAlpha(ready.ok || armed ? 1 : 0.55);
    }
  }

  /** Маг ткнул во врага рукой — первая кнопка подсказывает, где его удар. */
  nudgeFirst(animations: Animations): void {
    const first = this.buttons[0];
    if (first) animations.bump.play(first.btn.pulseC, 1.12, 130, { repeat: 1 });
  }

  /** Короткая метка цены: она живёт в маленьком бейдже, поэтому не больше двух знаков. */
  private static costLabel(battle: IBattleState, perk: AbilityDef): string {
    const cd = battle.cooldownOf(perk);
    if (cd > 0) return `⏱${cd}`;
    if (perk.goldCost !== undefined) return '$';
    const cost = battle.perkCostOf(perk);
    if (cost === 0) return '0';
    return perk.cost === FULL_BAR ? '⚡' : String(cost);
  }
}
