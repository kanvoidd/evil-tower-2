import type { ClassSelection } from '../../../../application/class-select/ClassSelection';
import type { ClassSelectCommand } from '../../../../application/class-select/interfaces/ClassSelectCommand';

export interface ClassSelectViewDeps {
  /** Герои карусели и то, что с каждым можно сделать. */
  selection: ClassSelection;
  /** Нажатия игрока. */
  commands: (cmd: ClassSelectCommand) => void;
}
