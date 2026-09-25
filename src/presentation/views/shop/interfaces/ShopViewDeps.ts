import type { ShopCommand } from '../../../../application/shop/interfaces/ShopCommand';
import type { ShopCatalog } from '../../../../application/shop/ShopCatalog';
import type { IHeroCardSource, IWalletSource } from '../../../components';

export interface ShopViewDeps {
  /** Предложения лавки — перечитываются после каждой покупки. */
  catalog: ShopCatalog;
  /** Нажатия игрока. */
  commands: (cmd: ShopCommand) => void;
  hero: IHeroCardSource;
  wallet: IWalletSource;
  /** Лавку открыли из хаба: содержимое проявляется из «окна» кнопки. */
  fromHub: boolean;
}
