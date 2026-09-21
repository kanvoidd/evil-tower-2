import { ADS } from '../config';
import { YSDK } from '../sdk/YandexSDK';
import { Store } from './Store';

/** Реклама с наградой — только по желанию игрока. true = награду нужно выдать. */
export const watchRewarded = async (): Promise<boolean> => {
  YSDK.gameplayStop();
  return YSDK.showRewarded();
};

/**
 * Полноэкранная реклама только в логических паузах (возврат в лобби после комнаты):
 * не раньше, чем через несколько комнат, и не чаще собственного кулдауна (платформа ограничивает частоту сама).
 */
export const maybeInterstitial = async (): Promise<void> => {
  const d = Store.data;
  if (Store.roomsPlayedTotal < ADS.firstAdAfterRooms) return;
  if (Date.now() - d.ads.lastInterstitial < ADS.interstitialCooldownMs) return;
  YSDK.gameplayStop();
  const shown = await YSDK.showInterstitial();
  if (shown) {
    d.ads.lastInterstitial = Date.now();
    Store.save();
  }
};
