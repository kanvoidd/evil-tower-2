import type Phaser from 'phaser';

/** Плашка «иконка + число», у которой можно менять текст и его цвет. */
export interface Pill {
  c: Phaser.GameObjects.Container;
  setText: (s: string) => void;
  setTextColor: (hex: string) => void;
}
