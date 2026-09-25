/** Общая громкость и «без звука» у звукового движка. Реализация — в infrastructure. */
export interface IAudioOutput {
  /** 0…1. */
  setVolume(v: number): void;
  setMuted(m: boolean): void;
}
