import type { AudioSettings } from '../AudioSettings';
import type { LanguageSettings } from '../LanguageSettings';
import type { ISettingsNavigator } from './ISettingsNavigator';
import type { ISettingsView } from './ISettingsView';

export interface SettingsControllerDeps {
  audio: AudioSettings;
  language: LanguageSettings;
  view: ISettingsView;
  navigator: ISettingsNavigator;
}
