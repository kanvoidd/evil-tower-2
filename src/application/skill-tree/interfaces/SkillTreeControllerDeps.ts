import type { BuySkill } from '../BuySkill';
import type { CancelMetamorphosis } from '../CancelMetamorphosis';
import type { Metamorphose } from '../Metamorphose';
import type { SkillTreeQuery } from '../SkillTreeQuery';
import type { ISkillTreeDialogs } from './ISkillTreeDialogs';
import type { ISkillTreeNavigator } from './ISkillTreeNavigator';
import type { ISkillTreeView } from './ISkillTreeView';

export interface SkillTreeControllerDeps {
  query: SkillTreeQuery;
  buySkill: BuySkill;
  metamorphose: Metamorphose;
  cancelMetamorphosis: CancelMetamorphosis;
  view: ISkillTreeView;
  dialogs: ISkillTreeDialogs;
  navigator: ISkillTreeNavigator;
}
