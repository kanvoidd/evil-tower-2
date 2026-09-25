import type { Lang } from '../../../shared';
import type { SaveData } from '../../save/interfaces/SaveData';
import { ProfilePart } from '../profile-part/ProfilePart';

/** Настройки игрока и его отметки: язык, звук, пройденные шаги обучения, последняя реклама. */
export class PlayerSettings extends ProfilePart {
  get lang(): Lang {
    return this.doc.lang;
  }

  setLang(l: Lang): void {
    this.doc.lang = l;
    this.state.touch();
  }

  /** Громкость 0…1. */
  get volume(): number {
    return this.doc.volume;
  }

  get muted(): boolean {
    return this.doc.muted;
  }

  setAudio(volume: number, muted: boolean): void {
    this.doc.volume = volume;
    this.doc.muted = muted;
    this.state.touch();
  }

  get tutorial(): Readonly<SaveData['tutorial']> {
    return this.doc.tutorial;
  }

  /** Шаг обучения пройден. */
  markTutorial(step: keyof SaveData['tutorial']): void {
    this.doc.tutorial[step] = true;
    this.state.touch();
  }

  get lastInterstitial(): number {
    return this.doc.ads.lastInterstitial;
  }

  noteInterstitial(at: number): void {
    this.doc.ads.lastInterstitial = at;
    this.state.touch();
  }
}
