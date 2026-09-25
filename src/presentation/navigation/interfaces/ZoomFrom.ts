/** Прямоугольник кнопки, из которой вырастает (и в которую сжимается) окно меню. */
export interface ZoomFrom {
  x: number;
  y: number;
  w: number;
  h: number;
  angle?: number;
}
