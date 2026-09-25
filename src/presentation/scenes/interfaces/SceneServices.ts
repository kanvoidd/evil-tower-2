import type { AdService } from '../../../application/ads/AdService';
import type {
  IAudioOutput,
  ILocale,
  IPlatform,
  IProfileStorage,
  ISoundPlayer,
} from '../../../application/ports';
import type { Profile } from '../../../domain/account';

/**
 * Всё, что сцены получают от корня композиции: профиль игрока и службы платформы за портами.
 * Сцена из этого собирает свой экран (вид, контроллер, операции) и ничего не импортирует
 * из инфраструктуры сама.
 */
export interface SceneServices {
  profile: Profile;
  /** Запись сохранения. */
  storage: IProfileStorage;
  platform: IPlatform;
  /** Звуки игры. */
  sound: ISoundPlayer;
  /** Громкость и «без звука» у звукового движка. */
  audio: IAudioOutput;
  /** Язык интерфейса. */
  locale: ILocale;
  ads: AdService;
}
