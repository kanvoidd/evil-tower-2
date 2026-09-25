import type { SettingsCommand } from './interfaces/SettingsCommand';
import type { SettingsControllerDeps } from './interfaces/SettingsControllerDeps';

/**
 * Поток настроек: громкость и язык.
 *
 *   ползунок / кнопка → SettingsCommand → SettingsController → AudioSettings / LanguageSettings → вид
 *
 * Смена языка перерисовывает экран: все тексты берутся из словаря заново.
 */
export class SettingsController {
  constructor(private readonly d: SettingsControllerDeps) {}

  execute(cmd: SettingsCommand): void {
    switch (cmd.type) {
      case 'volume':
        this.d.audio.setVolume(cmd.value);
        this.d.view.showVolume(cmd.value, this.d.audio.silent);
        return;
      case 'language':
        if (this.d.language.change(cmd.lang)) this.d.navigator.reload();
        return;
      case 'close':
        this.d.navigator.close();
        return;
    }
  }
}
