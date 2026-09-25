import Phaser from 'phaser';

/**
 * Фиксирует объект и всех его потомков на экране. Нужно, потому что hit-test вложенных объектов
 * использует их собственный scrollFactor: без этого кнопки в панелях не нажимаются при сдвинутой камере.
 */
export const pinToScreen = (o: Phaser.GameObjects.GameObject): void => {
  (o as unknown as { setScrollFactor?: (v: number) => void }).setScrollFactor?.(0);
  if (o instanceof Phaser.GameObjects.Container) o.list.forEach(pinToScreen);
};
