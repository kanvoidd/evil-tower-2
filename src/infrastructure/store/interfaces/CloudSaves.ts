import type { Lang } from '../../../domain/shared';

/** Облачные сохранения платформы и язык игрока для нового профиля. */
export interface CloudSaves {
  loadCloud(): Promise<unknown | null>;
  saveCloud(data: unknown): Promise<void>;
  getLang(): Lang;
}
