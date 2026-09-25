import type { DeathFlow } from '../death-flow/DeathFlow';
import type { PlayerMoves } from '../player-moves/PlayerMoves';
import type { RoomOutcome } from '../room-outcome/RoomOutcome';
import type { RunEnd } from '../run-end/RunEnd';
import type { TurnFlow } from '../turn-flow/TurnFlow';
import type { TutorialGuide } from '../tutorial-guide/TutorialGuide';

/** Части потока боя: каждая зовёт другие по имени. */
export interface FlowParts {
  readonly moves: PlayerMoves;
  readonly turns: TurnFlow;
  readonly tutorial: TutorialGuide;
  readonly room: RoomOutcome;
  readonly death: DeathFlow;
  readonly runEnd: RunEnd;
}
