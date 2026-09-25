import type { IWalletSource } from './IWalletSource';

export interface CurrencyOpts {
  /**
   * Кошелёк, за которым следит полоса. Без него значения задаются вручную через `setValues`
   * (добыча за комнату).
   */
  wallet?: IWalletSource;
  goldIcon?: string;
  compact?: boolean;
}
