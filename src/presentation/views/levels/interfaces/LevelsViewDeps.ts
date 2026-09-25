import type { MenuExit } from '../../../navigation/MenuExit';

export interface LevelsViewDeps {
  /** Рекорд героя: сколько комнат пройдено за лучший забег. */
  record: { readonly best: number };
  exit: MenuExit;
}
