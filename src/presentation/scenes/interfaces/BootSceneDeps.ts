import type { Profile } from '../../../domain/account';

export interface BootSceneDeps {
  profile: Profile;
  /** Загрузка до первого экрана: SDK платформы, сохранение, язык и звук. */
  startup: () => Promise<void>;
}
