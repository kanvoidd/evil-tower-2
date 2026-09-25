/**
 * Игровая платформа (Яндекс Игры): отметки «игра идёт/пауза», реклама, таблица рекордов
 * и статистика игрока. Вне платформы реализация работает заглушкой.
 */
export interface IPlatform {
  /** Игра загружена и готова к взаимодействию (один раз за сессию). */
  ready(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  /** Реклама с наградой; true — досмотрена, награду нужно выдать. */
  showRewarded(): Promise<boolean>;
  /** Полноэкранная реклама; true — была показана. */
  showInterstitial(): Promise<boolean>;
  submitScore(board: string, score: number): Promise<void>;
  setStats(stats: Record<string, number>): Promise<void>;
}
