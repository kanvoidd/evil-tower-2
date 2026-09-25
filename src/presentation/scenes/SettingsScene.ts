import Phaser from 'phaser';

import { AudioSettings } from '../../application/settings/AudioSettings';
import { LanguageSettings } from '../../application/settings/LanguageSettings';
import { SettingsController } from '../../application/settings/SettingsController';
import { SettingsNavigator } from '../navigation/SettingsNavigator';
import { SettingsView } from '../views/settings/SettingsView';
import type { SceneServices } from './interfaces/SceneServices';

/** Настройки. Сцена только собирает вид и связывает его с потоком настроек (`SettingsController`). */
export class SettingsScene extends Phaser.Scene {
  /** Экран пересобирается после смены языка — без окна-перехода. */
  private noZoom = false;
  private controller?: SettingsController;

  constructor(private readonly services: SceneServices) {
    super('Settings');
  }

  init(data: { noZoom?: boolean } = {}): void {
    this.noZoom = !!data.noZoom;
    this.controller = undefined;
  }

  create(): void {
    const { profile } = this.services;
    const audio = new AudioSettings(profile, this.services.audio);
    const language = new LanguageSettings(profile, this.services.locale);
    const view = new SettingsView(this, {
      volume: audio.volume,
      silent: audio.silent,
      lang: language.lang,
      noZoom: this.noZoom,
      commands: (cmd) => this.controller?.execute(cmd),
    });
    this.controller = new SettingsController({
      audio,
      language,
      view,
      navigator: new SettingsNavigator(this),
    });
  }
}
