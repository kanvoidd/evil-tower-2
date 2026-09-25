import Phaser from 'phaser';

import { type EquipmentSave, ITEM_BY_ID } from '../../domain/catalog';
import { icon, txt } from '../components';
import { HEX } from '../theme';

/**
 * Прочность снаряжения в верхней полосе (низ экрана занят способностями): иконка и полоска
 * у оружия и доспеха. Сломанный предмет исчезает из ряда.
 */
export class GearBar {
  private static readonly Y = 58;

  private readonly row: Phaser.GameObjects.Container;

  constructor(private readonly scene: Phaser.Scene) {
    this.row = scene.add.container(0, 0);
  }

  update(weapon: EquipmentSave | null, armor: EquipmentSave | null): void {
    const s = this.scene;
    const y = GearBar.Y;
    this.row.removeAll(true);
    const gear: Array<{ e: EquipmentSave | null; x: number }> = [
      { e: weapon && weapon.durability > 0 ? weapon : null, x: 330 },
      { e: armor && armor.durability > 0 ? armor : null, x: 470 },
    ];
    gear.forEach(({ e, x }) => {
      if (!e) return;
      const it = ITEM_BY_ID[e.id];
      const k = Phaser.Math.Clamp(e.durability / it.durability, 0, 1);
      this.row.add(icon(s, x - 48, y + 55, it.icon, 38));
      this.row.add(
        txt(s, x + 16, y + 46, `${e.durability}/${it.durability}`, 16, {
          weight: 800,
          strokeThickness: 0,
          color: k <= 0.2 ? HEX.bad : HEX.textDim,
        }),
      );
      this.row.add(s.add.rectangle(x + 16, y + 64, 84, 6, 0x000000, 0.5));
      this.row.add(
        s.add
          .rectangle(x - 26, y + 64, Math.max(3, 84 * k), 6, k > 0.2 ? 0x66e39c : 0xff7468)
          .setOrigin(0, 0.5),
      );
    });
  }
}
