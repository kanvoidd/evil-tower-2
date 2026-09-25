/** Время игры. Паузы в потоке игры идут по нему, а не по `setTimeout`, — чтобы замирать вместе с игрой. */
export interface IClock {
  delay(ms: number): Promise<void>;
}
