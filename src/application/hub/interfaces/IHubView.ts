import type { DailyStatus } from '../../../domain/account/profile';
import type { GiftState } from './GiftState';

/** Хаб на экране — то, что поток хаба меняет в нём после входа и после наград. */
export interface IHubView {
  /** Автопрокачка купила `buys` улучшений. */
  autoSkilled(buys: number): void;
  /** Награда получена. */
  rewarded(): void;
  /** Состояние подарков: «Дар башни» и ежедневная награда. */
  showRewards(gift: GiftState, daily: DailyStatus): void;
}
