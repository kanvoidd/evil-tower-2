import type { SfxName } from './SfxName';

/** Проигрывание звуковых эффектов. Реализация (синтез на WebAudio) — в infrastructure. */
export interface ISoundPlayer {
  play(name: SfxName): void;
}
