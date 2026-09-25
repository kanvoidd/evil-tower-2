import type { ISoundPlayer, SfxName } from '../../../application/ports';

/**
 * Звук отклика общих компонентов интерфейса (нажатие кнопки, открытие окна, тост).
 * Проигрыватель подключает точка сборки (`UiSound.bind`), поэтому компоненты не знают,
 * чем звучит игра. Звуки боя сюда не относятся — их получают конструкторы анимаций.
 * До подключения компоненты молчат.
 */
export class UiSound {
  private static player: ISoundPlayer | null = null;

  static bind(player: ISoundPlayer): void {
    UiSound.player = player;
  }

  static play(name: SfxName): void {
    UiSound.player?.play(name);
  }
}
