import type { SkillTreeCommand } from '../../../../application/skill-tree/interfaces/SkillTreeCommand';
import type { SkillTreeQuery } from '../../../../application/skill-tree/SkillTreeQuery';
import type { IWalletSource } from '../../../components';

export interface SkillTreeViewDeps {
  /** Состояние дерева героя — перечитывается после каждой покупки. */
  query: SkillTreeQuery;
  wallet: IWalletSource;
  /** Нажатия игрока. */
  commands: (cmd: SkillTreeCommand) => void;
}
