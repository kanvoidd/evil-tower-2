import type { CellRejection } from '../../application/game/interfaces/CellRejection';
import type { IGameRenderer } from '../../application/game/interfaces/IGameRenderer';
import type { TutorialStep } from '../../application/game/interfaces/TutorialStep';
import type { ISoundPlayer } from '../../application/ports';
import type { PerkDef } from '../../domain/catalog';
import type { IBattleState } from '../../domain/combat';
import type { ConsumableId } from '../../domain/types';
import { t, type TKey } from '../../i18n';
import type { Animations } from '../animations/Animations';
import { BoardLayout } from '../board/BoardLayout';
import type { BoardView } from '../board/BoardView';
import type { Hud } from '../hud/Hud';
import { HEX } from '../theme';

/**
 * Отрисовка боя на Phaser: поле (`BoardView`), панели (`Hud`) и анимации отказа. Контроллер говорит,
 * что показать; как это выглядит и что прочитать из боя для этого — решает рендерер.
 */
export class PhaserRenderer implements IGameRenderer {
  /** Подпись отказа способности по причине. */
  private static readonly PERK_REJECT: Record<string, TKey> = {
    once: 'game.once_used',
    active: 'game.perk_active',
    cooldown: 'game.cooldown',
    gold: 'game.no_gold_perk',
  };

  constructor(
    private readonly battle: IBattleState,
    private readonly board: BoardView,
    private readonly hud: Hud,
    private readonly animations: Animations,
    private readonly sound: ISoundPlayer,
  ) {}

  refresh(): void {
    this.hud.update();
    this.board.refreshStatuses(this.battle.cards);
    this.board.showTargets(this.battle);
    this.board.setPlayerHp(this.battle.hp, this.battle.stats.maxHp);
    this.board.setPlayerDamage(this.battle.stats.damage);
  }

  markKillable(): void {
    this.board.markKillable((cell) => this.battle.wouldKill(cell));
  }

  rejectPerk(perk: PerkDef, reason: string | undefined): void {
    this.sound.play('error');
    const key = PhaserRenderer.PERK_REJECT[reason ?? ''] ?? 'game.no_res';
    const n = this.battle.cooldownOf(perk);
    this.overHero(100, t(key, { r: this.resourceName(), n }), HEX.bad, 22);
  }

  rejectCell(cell: number, reason: CellRejection): void {
    const v = this.board.viewAt(cell);
    switch (reason) {
      case 'target':
      case 'range':
        this.sound.play('error');
        if (v) this.animations.hit.jolt(v);
        return;
      case 'resource':
        this.sound.play('error');
        this.overHero(100, t('game.no_res', { r: this.resourceName() }), HEX.bad, 22);
        this.hud.flashResource();
        return;
      case 'melee':
        // маг вообще не бьёт рукой — подсказываем, что нужна кнопка способности
        this.sound.play('error');
        if (v) this.animations.hit.jolt(v);
        this.hud.note(t('game.no_melee'), HEX.gold, 22);
        this.hud.perks.nudgeFirst(this.animations);
        return;
      case 'invalid':
        return;
    }
  }

  rejectItem(hpFull: boolean): void {
    this.sound.play('error');
    if (hpFull) this.overHero(90, t('game.hp_full'), HEX.textDim, 22);
  }

  deny(): void {
    this.sound.play('error');
  }

  armed(pick: 'one' | 'two' | null): void {
    this.sound.play('click');
    this.hud.refreshAbilities();
    this.board.showTargets(this.battle);
    if (pick) this.hud.note(t(pick === 'two' ? 'game.pick_two' : 'game.pick_target'), HEX.gold, 24);
  }

  firstOfTwo(): void {
    this.sound.play('click');
    this.board.showTargets(this.battle);
  }

  autoUsed(item: ConsumableId): void {
    // автоприменение заметно: слот «подпрыгивает», над героем появляется метка «Авто»
    this.hud.consumables.jump(item);
    this.overHero(96, t('auto.used'), HEX.gold, 22);
  }

  selfRevived(): void {
    this.overHero(110, t('game.self_revive'), HEX.good, 28);
  }

  outcome(result: 'win' | 'lose'): void {
    this.sound.play(result);
  }

  tutorial(step: TutorialStep, cell?: number): void {
    this.hud.hint.show(
      t(`tut.${step}` as TKey),
      cell !== undefined ? BoardLayout.cellPos(cell) : undefined,
    );
  }

  clearHand(): void {
    this.hud.hint.clearHand();
  }

  clearTutorial(): void {
    this.hud.hint.clear();
  }

  private resourceName(): string {
    return t(`res.${this.battle.stats.resource}` as TKey);
  }

  /** Подпись над карточкой героя. */
  private overHero(dy: number, text: string, color: string, size: number): void {
    const p = this.board.playerPoint();
    this.animations.text.show(p.x, p.y - dy, text, color, size);
  }
}
