import { Grid } from '../../../../domain/combat';
import { FlowPart } from '../flow-part/FlowPart';

/** Первый бой: ударить → подобрать добычу → применить способность → уйти через переход. */
export class TutorialGuide extends FlowPart {
  /** Подсказка про способность — после стольких ходов. */
  static readonly PERK_HINT_AFTER_TURNS = 3;

  private stage = 0;

  update(): void {
    const tut = this.d.profile.tutorial;
    if (tut.fight || this.state.finished) return;
    const battle = this.d.battle;
    const adj = Grid.neighbors(battle.playerCell).filter((c) => battle.cards[c]);
    if (this.stage === 0) {
      const pick =
        adj.find((c) => battle.cards[c]!.kind === 'enemy' && battle.wouldKill(c)) ??
        adj.find((c) => battle.cards[c]!.kind === 'enemy') ??
        adj[0];
      this.d.view.tutorial('attack', pick);
      this.stage = 1;
    } else if (this.stage === 1) {
      const loot = adj.find((c) => battle.cards[c]!.kind !== 'enemy');
      if (battle.totals.kills > 0 && loot !== undefined) {
        this.d.view.tutorial('loot', loot);
        this.stage = 2;
      } else if (battle.totals.turns > 1) {
        this.d.view.tutorial('finish');
        this.stage = 3;
      }
    } else if (this.stage === 2 && battle.totals.turns > TutorialGuide.PERK_HINT_AFTER_TURNS) {
      this.d.view.tutorial(battle.stats.abilities.length && !tut.perk ? 'perk' : 'finish');
      this.stage = 3;
    }
  }
}
