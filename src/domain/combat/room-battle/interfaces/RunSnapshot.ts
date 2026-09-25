import type { EngineSnapshot } from '../../engine/interfaces/EngineSnapshot';

/** Снимок состояния для «Отката времени»: поле и колода у движка, остальное — у правил. */
export interface RunSnapshot {
  engine: EngineSnapshot;
  hp: number;
  shield: number;
  res: number;
  totals: string;
  consumables: string;
  flags: string;
}
