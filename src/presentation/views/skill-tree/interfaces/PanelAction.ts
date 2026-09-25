import type { PlateButton } from '../../../components';

/** Нижний ряд панели узла: кнопка действия или строка состояния с цветом. */
export interface PanelAction {
  btn: PlateButton | null;
  status: string;
  statusColor: string;
}
