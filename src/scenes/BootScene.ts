import Phaser from 'phaser';
import { FONT_TITLE, FONT_UI, GAME_H, GAME_W } from '../config';
import { YSDK } from '../sdk/YandexSDK';
import { AUDIO } from '../systems/Audio';
import { Store } from '../systems/Store';
import { setLang } from '../i18n';
import { bakeTextures, queueExternalArt } from '../ui/Textures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    const bar = this.add.rectangle(GAME_W / 2, GAME_H / 2, 4, 6, 0xf0c75e);
    this.load.on('progress', (p: number) => bar.setSize(Math.max(4, 320 * p), 6));
    queueExternalArt(this);
  }

  async create(): Promise<void> {
    const sample = 'Привет Hello 0123';
    await Promise.all([
      document.fonts.load(`800 24px ${FONT_TITLE}`, sample),
      document.fonts.load(`700 24px ${FONT_UI}`, sample),
      document.fonts.load(`800 24px ${FONT_UI}`, sample),
      document.fonts.load(`900 24px ${FONT_UI}`, sample),
    ]).catch(() => undefined);
    await YSDK.init();
    await Store.load();
    if (import.meta.env.DEV) {
      (await import('../debug')).applyDevParams();
      (window as unknown as { __store: typeof Store }).__store = Store;
    }
    setLang(Store.lang);
    AUDIO.setup(Store.data.volume, Store.data.muted);
    await bakeTextures(this);
    document.getElementById('boot')?.remove();
    if (Store.isFirstRun) this.scene.start('ClassSelect', { mode: 'first' });
    else this.scene.start('Hub');
  }
}
