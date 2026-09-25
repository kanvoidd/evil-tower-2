import type { Profile } from '../../domain/logic/profile';
import type { IAudioOutput } from '../ports';

/**
 * Настройки звука: громкость и «без звука». Выбор игрока сохраняется в профиле и сразу
 * применяется к звуковому движку — кнопкой звука на любом экране и ползунком в настройках.
 */
export class AudioSettings {
  constructor(private readonly profile: Profile, private readonly output: IAudioOutput) {}

  get volume(): number {
    return this.profile.volume;
  }

  get muted(): boolean {
    return this.profile.muted;
  }

  /** Звук не слышен: выключен кнопкой или громкость на нуле. */
  get silent(): boolean {
    return this.muted || this.volume <= 0;
  }

  /** Кнопка звука: включает или выключает звук и возвращает новое состояние. */
  toggleMuted(): boolean {
    const muted = !this.muted;
    this.output.setMuted(muted);
    this.profile.setAudio(this.volume, muted);
    return muted;
  }

  /** Ползунок громкости: ненулевая громкость заодно снимает «без звука». */
  setVolume(v: number): void {
    const muted = v > 0 ? false : this.muted;
    this.output.setVolume(v);
    this.output.setMuted(muted);
    this.profile.setAudio(v, muted);
  }
}
