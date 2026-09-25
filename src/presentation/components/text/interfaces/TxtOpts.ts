export interface TxtOpts {
  color?: string;
  stroke?: string;
  strokeThickness?: number;
  align?: 'left' | 'center' | 'right';
  wrap?: number;
  origin?: [number, number];
  /** 'ui' — Nunito (по умолчанию), 'title' — Alegreya SC (заголовки, логотип). */
  font?: 'ui' | 'title';
  weight?: 700 | 800 | 900;
  /** Совместимость: false = более лёгкое начертание. */
  bold?: boolean;
  lineSpacing?: number;
  /** Уменьшать шрифт, пока строка не влезет в ширину. */
  maxWidth?: number;
}
