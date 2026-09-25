import type Phaser from 'phaser';
import type { Point } from '../animations/interfaces/Point';
import { GAME_W } from '../theme';
import { CurrencyBar } from '../components';

/**
 * Кошель в правом верхнем углу боя: всё, что принёс забег, — пройденные комнаты (уже в кошельке героя)
 * плюс добыча текущей комнаты, которая пропадёт при гибели или побеге.
 */
export class LootBar {
  private readonly bar: CurrencyBar;
  private gold = 0;
  private souls = 0;

  constructor(scene: Phaser.Scene, private readonly banked: { gold: number; souls: number }) {
    this.bar = new CurrencyBar(scene, GAME_W - 32, 46, { goldIcon: 'ico_pouch', compact: true });
    this.show();
  }

  /** Добыча комнаты: +золото и +души; трата золота не уводит кошель в минус. */
  add(gold: number, souls: number): void {
    this.gold = Math.max(0, this.gold + gold);
    this.souls += souls;
    this.show();
  }

  anchor(kind: 'gold' | 'souls'): Point {
    return this.bar.iconWorld(kind);
  }

  private show(): void {
    this.bar.setValues(this.banked.gold + this.gold, this.banked.souls + this.souls);
  }
}
