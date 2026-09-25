/** Уход из выбора героя: в первый забег или туда, откуда пришли. */
export interface IClassSelectNavigator {
  startGame(): void;
  back(): void;
}
