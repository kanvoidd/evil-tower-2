import type { SfxName } from '../../../../application/ports';
import type { PlateStyle } from '../../plate/interfaces/PlateStyle';

export interface BtnOpts {
  w: number;
  h: number;
  label?: string;
  fontSize?: number;
  font?: 'ui' | 'title';
  icon?: string;
  iconSize?: number;
  pulse?: { cycle: number; scale: number };
  style?: PlateStyle;
  onClick?: () => void;
  sound?: SfxName | null;
  labelColor?: string;
  radius?: number;
  shadow?: boolean;
  /** Вторая строка под подписью (мелким шрифтом). */
  sub?: string;
  subColor?: string;
  /** Оставлено для совместимости (раньше кнопки наклонялись). */
  angle?: number;
  seed?: number;
}
