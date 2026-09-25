import type { IPlatform } from '../../ports';
import type { ClassSelection } from '../ClassSelection';
import type { IClassSelectDialogs } from './IClassSelectDialogs';
import type { IClassSelectNavigator } from './IClassSelectNavigator';
import type { IClassSelectView } from './IClassSelectView';

export interface ClassSelectControllerDeps {
  selection: ClassSelection;
  platform: IPlatform;
  view: IClassSelectView;
  dialogs: IClassSelectDialogs;
  navigator: IClassSelectNavigator;
}
