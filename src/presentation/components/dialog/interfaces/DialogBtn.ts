import type { PlateStyle } from '../../plate/interfaces/PlateStyle';
import type { PlateButton } from '../../plate-button/PlateButton';

export interface DialogBtn {
  label: string;
  onClick?: () => void;
  style?: PlateStyle;
  /** Не закрывать диалог после нажатия. */
  keep?: boolean;
  icon?: string;
  w?: number;
  /** Получить созданную кнопку (например, чтобы отключить после нажатия). */
  ref?: (btn: PlateButton) => void;
}
