import Phaser from 'phaser';
import { fmt } from '../../../i18n';
import { HEX } from '../../theme';
import { icon } from '../icon/Icon';
import { txt } from '../text/Text';
import type { CurrencyOpts } from './interfaces/CurrencyOpts';
import type { IWalletSource } from './interfaces/IWalletSource';

/** Золото и опыт душ: значок + число, без рамки и подложки. x — правый край блока. */
export class CurrencyBar extends Phaser.GameObjects.Container {
  private goldText: Phaser.GameObjects.Text;
  private soulText: Phaser.GameObjects.Text;
  private goldIcon: Phaser.GameObjects.Image;
  private soulIcon: Phaser.GameObjects.Image;
  private shownGold: number;
  private shownSouls: number;
  private readonly wallet?: IWalletSource;
  private readonly iconSize: number;

  constructor(scene: Phaser.Scene, x: number, y: number, o: CurrencyOpts = {}) {
    super(scene, x, y);
    this.wallet = o.wallet;
    const fs = o.compact ? 28 : 32;
    this.iconSize = o.compact ? 34 : 38;
    const gap = o.compact ? 40 : 46;
    this.shownGold = this.wallet?.gold ?? 0;
    this.shownSouls = this.wallet?.souls ?? 0;
    this.goldText = txt(scene, 0, 0, fmt(this.shownGold), fs, { origin: [1, 0.5], color: HEX.gold, weight: 900 });
    this.soulText = txt(scene, 0, gap, fmt(this.shownSouls), fs, { origin: [1, 0.5], color: HEX.soul, weight: 900 });
    this.goldIcon = icon(scene, 0, 0, o.goldIcon ?? 'ico_gold', this.iconSize);
    this.soulIcon = icon(scene, 0, gap, 'ico_soul', this.iconSize);
    this.add([this.goldIcon, this.soulIcon, this.goldText, this.soulText]);
    this.place();
    const wallet = this.wallet;
    if (wallet) {
      wallet.walletChanged.on(this.refresh, this);
      this.once(Phaser.GameObjects.Events.DESTROY, () => wallet.walletChanged.off(this.refresh, this));
    }
    scene.add.existing(this);
  }

  private place(): void {
    this.goldIcon.x = -this.goldText.width - 10 - this.iconSize / 2;
    this.soulIcon.x = -this.soulText.width - 10 - this.iconSize / 2;
  }

  /** Для вручную заданных значений (сумка с золотом и души за комнату). */
  setValues(gold: number, souls: number): void {
    this.tick(this.goldText, this.shownGold, gold, (v) => (this.shownGold = v));
    this.tick(this.soulText, this.shownSouls, souls, (v) => (this.shownSouls = v));
  }

  /** Мировые координаты значков — цель для «полёта» монет. */
  iconWorld(kind: 'gold' | 'souls'): { x: number; y: number } {
    const i = kind === 'gold' ? this.goldIcon : this.soulIcon;
    return { x: this.x + i.x, y: this.y + i.y };
  }

  private refresh(): void {
    if (!this.wallet) return;
    this.tick(this.goldText, this.shownGold, this.wallet.gold, (v) => (this.shownGold = v));
    this.tick(this.soulText, this.shownSouls, this.wallet.souls, (v) => (this.shownSouls = v));
  }

  private tick(text: Phaser.GameObjects.Text, from: number, to: number, set: (v: number) => void): void {
    if (!this.scene || from === to) return;
    const obj = { v: from };
    this.scene.tweens.add({
      targets: obj,
      v: to,
      duration: Math.min(600, 150 + Math.abs(to - from) * 6),
      onUpdate: () => {
        set(obj.v);
        text.setText(fmt(obj.v));
        this.place();
      },
      onComplete: () => {
        set(to);
        text.setText(fmt(to));
        this.place();
      },
    });
    if (to > from) this.scene.tweens.add({ targets: text, scale: 1.18, duration: 110, yoyo: true });
  }
}
