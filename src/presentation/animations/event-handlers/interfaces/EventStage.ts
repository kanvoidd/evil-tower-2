import type { ISoundPlayer } from '../../../../application/ports';
import type { IBattleState } from '../../../../domain/combat';
import type { BoardView } from '../../../board/BoardView';
import type { IBattleHud } from '../../../hud/interfaces/IBattleHud';
import type { PhaserClock } from '../../../phaser/PhaserClock';
import type { Animations } from '../../Animations';

/** Сцена, на которой обработчики показывают события: бой (только чтение), поле, анимации, HUD, звук. */
export interface EventStage {
  battle: IBattleState;
  board: BoardView;
  anims: Animations;
  hud: IBattleHud;
  sound: ISoundPlayer;
  clock: PhaserClock;
}
