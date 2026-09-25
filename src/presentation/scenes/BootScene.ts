import Phaser from 'phaser';

import { bakeTextures, queueExternalArt } from '../textures/Textures';
import { FONT_TITLE, FONT_UI, GAME_H, GAME_W } from '../theme';
import type { BootSceneDeps } from './interfaces/BootSceneDeps';

/**
 * Загрузка: шрифты, внешние картинки и процедурные текстуры. Что загрузить из платформы
 * и сохранения, решает корень композиции (`startup`); затем — выбор героя при первом запуске
 * или хаб.
 */
export class BootScene extends Phaser.Scene {
  constructor(private readonly deps: BootSceneDeps) {
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
    await this.deps.startup();
    await bakeTextures(this);
    document.getElementById('boot')?.remove();
    if (this.deps.profile.isFirstRun) this.scene.start('ClassSelect', { mode: 'first' });
    else this.scene.start('Hub');
  }
}
