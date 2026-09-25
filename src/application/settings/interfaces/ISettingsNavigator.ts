/** Уход из настроек в хаб и перерисовка экрана после смены языка. */
export interface ISettingsNavigator {
  close(): void;
  reload(): void;
}
