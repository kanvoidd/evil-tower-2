import type { SettingsCommand } from '../../../../application/settings/interfaces/SettingsCommand';
import type { Lang } from '../../../../domain/shared';

export interface SettingsViewDeps {
  /** Громкость 0…1 и слышен ли звук сейчас. */
  volume: number;
  silent: boolean;
  lang: Lang;
  /** Экран перерисовывается после смены языка — без окна-перехода и каскада. */
  noZoom: boolean;
  commands: (cmd: SettingsCommand) => void;
}
