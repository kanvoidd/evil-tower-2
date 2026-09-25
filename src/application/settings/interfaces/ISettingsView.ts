/** Настройки на экране. */
export interface ISettingsView {
  /** Громкость 0…1 и слышен ли звук вообще. */
  showVolume(volume: number, silent: boolean): void;
}
