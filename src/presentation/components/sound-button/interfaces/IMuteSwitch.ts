/** Выключатель звука, которым управляет кнопка: текущее состояние и переключение. */
export interface IMuteSwitch {
  readonly muted: boolean;
  /** Переключает звук и возвращает новое состояние. */
  toggleMuted(): boolean;
}
