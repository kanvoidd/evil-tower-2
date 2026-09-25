import type { Signal } from '../../../../domain/logic/signal/Signal';

/** Кошелёк, за которым следит полоса валют: текущие суммы и сигнал об их изменении. */
export interface IWalletSource {
  readonly gold: number;
  readonly souls: number;
  readonly walletChanged: Signal;
}
