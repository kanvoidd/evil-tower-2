import type Phaser from 'phaser';

import type { AbilityId } from '../../domain/catalog';
import type { Card, IBattleState, PlayerStats } from '../../domain/combat';
import type { CellIndex } from '../../domain/shared';
import type { Point } from '../animations/interfaces/Point';
import { plateTexture, txt } from '../components';
import { abilityIcon } from '../textures';
import { CARD_H, CARD_W, HEX } from '../theme';
import { BoardLayout } from './BoardLayout';
import type { CardView, CardViewFactory } from './card-view';

/**
 * Поле боя глазами игрока: какая карточка лежит на какой клетке и как выглядит герой.
 * Что на поле на самом деле, решает бой; как карточки появляются и уходят — анимации.
 * Вид только помнит карточки и перекрашивает их по запросу.
 */
export class BoardView {
  readonly player: CardView;
  private readonly views = new Map<number, CardView>();
  /** Метки ловушек по клеткам. */
  private readonly traps = new Map<CellIndex, Phaser.GameObjects.Container>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly factory: CardViewFactory,
    stats: PlayerStats,
    hp: number,
    playerCell: CellIndex,
  ) {
    for (let i = 0; i < 9; i++) {
      const p = BoardLayout.cellPos(i);
      scene.add
        .image(p.x, p.y, plateTexture(scene, CARD_W - 8, CARD_H - 8, 1, 'dark', 22))
        .setAlpha(0.45)
        .setDepth(-10);
    }
    this.player = factory.createHero(stats, hp, playerCell, BoardLayout.cellPos(playerCell));
  }

  /** Новая карточка на клетке (без анимации появления). */
  place(card: Card, cell: CellIndex): CardView {
    const v = this.factory.createCard(card, cell, BoardLayout.cellPos(cell));
    this.views.set(card.uid, v);
    return v;
  }

  view(uid: number): CardView | undefined {
    return this.views.get(uid);
  }

  viewAt(cell: number): CardView | undefined {
    for (const v of this.views.values()) if (v.cell === cell) return v;
    return undefined;
  }

  /** Снять карточку с учёта — дальше её уводит с экрана анимация. */
  release(v: CardView): void {
    this.views.delete(v.uid);
  }

  cards(): IterableIterator<CardView> {
    return this.views.values();
  }

  playerPoint(): Point {
    return { x: this.player.c.x, y: this.player.c.y };
  }

  /**
   * Метка ловушки на клетке: значок способности, которой она сработает, и сколько ходов осталось
   * («Взведённая ловушка»). `on: false` — ловушка сработала и снята.
   */
  setTrap(cell: CellIndex, abilityId: AbilityId, turns: number, on: boolean): void {
    this.traps.get(cell)?.destroy();
    this.traps.delete(cell);
    if (!on) return;
    const s = this.scene;
    const p = BoardLayout.cellPos(cell);
    const mark = s.add.container(p.x + CARD_W / 2 - 26, p.y - CARD_H / 2 + 26).setDepth(4);
    mark.add(s.add.image(0, 0, plateTexture(s, 46, 46, 1, 'dark', 23)));
    mark.add(s.add.image(0, 0, abilityIcon(abilityId)).setDisplaySize(34, 34));
    if (turns > 0) mark.add(txt(s, 16, 14, String(turns), 18, { weight: 900, color: HEX.gold }));
    this.traps.set(cell, mark);
  }

  showStatuses(v: CardView, card: Card): void {
    this.factory.showStatuses(v, card);
  }

  /** Значки состояний над врагами и слугами — по текущему полю боя. */
  refreshStatuses(cards: ReadonlyArray<Card | null>): void {
    for (const v of this.views.values()) {
      if (v.kind !== 'enemy' && v.kind !== 'ghost') continue;
      const card = cards[v.cell];
      if (card) this.factory.showStatuses(v, card);
    }
  }

  /** Заряжена способность: карточки, по которым её не применить, гаснут. Без заряда подсветка снята. */
  showTargets(battle: IBattleState): void {
    const armed = battle.armed;
    for (const v of this.views.values()) {
      const ok = !!armed && battle.perkTargetOk(armed, v.cell);
      v.c.setAlpha(armed && !ok ? 0.45 : 1);
    }
  }

  /** Рамка «добьёт одним ударом» у врагов. */
  markKillable(wouldKill: (cell: CellIndex) => boolean): void {
    for (const v of this.views.values()) {
      if (v.kind !== 'enemy') continue;
      v.frame.setTexture(wouldKill(v.cell) ? 'card_kill' : 'card_enemy');
    }
  }

  setPlayerHp(hp: number, maxHp: number): void {
    this.player.hp?.setText(`${Math.max(0, hp)}/${maxHp}`);
    this.player.hp?.setTextColor(hp <= maxHp * 0.3 ? HEX.bad : HEX.white);
  }

  setPlayerDamage(damage: number): void {
    this.player.atk?.setText(String(damage));
  }

  setShield(now: number): void {
    const sh = this.player.shield;
    if (!sh) return;
    sh.c.setVisible(now > 0);
    sh.setText(String(now));
  }
}
