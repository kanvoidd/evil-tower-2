import type { HubMenu } from '../../../application/hub/interfaces/HubMenu';
import { HeroCard } from '../../components';
import type { ZoomFrom } from '../../navigation/interfaces/ZoomFrom';

/**
 * Раскладка главного экрана: две ровные колонки, карточка комнаты и «Играть».
 * Меню «вырастают» из прямоугольников своих кнопок и сжимаются в них обратно.
 */
export class HubLayout {
  static readonly logo = { x: 32, y: 64 } as const;
  static readonly trophy = { x: 396, y: 64, size: 64 } as const;
  static readonly sound = { x: 476, y: 64, size: 64 } as const;
  static readonly currency = { x: 688, y: 44 } as const;
  static readonly hero = { x: 164, y: 486 } as const;
  static readonly shop = { x: 504, y: 228, w: 368, h: 156 } as const;
  static readonly levels = { x: 504, y: 372, w: 368, h: 100 } as const;
  static readonly settings = { x: 504, y: 488, w: 368, h: 100 } as const;
  static readonly gift = { x: 504, y: 629, w: 368, h: 118 } as const;
  static readonly daily = { x: 504, y: 763, w: 368, h: 118 } as const;
  static readonly room = { x: 360, y: 918, w: 656, h: 104 } as const;
  static readonly play = { x: 360, y: 1078, w: 656, h: 128 } as const;

  /** Прямоугольник кнопки меню — откуда меню открывается и куда закрывается. */
  static menuRect(menu: HubMenu): ZoomFrom {
    switch (menu) {
      case 'shop':
        return HubLayout.rectOf(HubLayout.shop);
      case 'levels':
        return HubLayout.rectOf(HubLayout.levels);
      case 'settings':
        return HubLayout.rectOf(HubLayout.settings);
      case 'skill':
        return { x: HubLayout.hero.x, y: HubLayout.hero.y, w: HeroCard.W, h: HeroCard.H };
      case 'achievements':
        return { x: HubLayout.trophy.x, y: HubLayout.trophy.y, w: HubLayout.trophy.size, h: HubLayout.trophy.size };
    }
  }

  private static rectOf(b: { x: number; y: number; w: number; h: number }): ZoomFrom {
    return { x: b.x, y: b.y, w: b.w, h: b.h };
  }
}
