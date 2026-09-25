/** Что герой уносит из комнаты в следующую внутри одного забега. */
export interface RunCarryStats {
  hp: number;
  res: number;
  /** Реклама-воскрешение уже была в этом забеге. */
  revived: boolean;
  /** Талант «Возвращение» уже сработал в этом забеге. */
  selfRevived: boolean;
}
