import { t } from '../../../../i18n';
import { BoardLayout } from '../../../board/BoardLayout';
import { HEX } from '../../../theme';
import type { EventHandlers } from '../interfaces/EventHandler';
import { MISS_STYLE } from './missStyle';

/** Бой: удар, попадание, промах, гибель врага, статусы, «Растерзание». */
export const combatEvents: Pick<
  EventHandlers,
  'attack' | 'hit' | 'miss' | 'kill' | 'status' | 'swarm'
> = {
  async attack(ev, { battle, board, anims, clock }) {
    // героя уже добивают: враги бросаются к нему, а не бьют каждый в свою клетку
    if (battle.over === 'lose' && ev.by === 'enemy') {
      const v = board.viewAt(ev.from);
      if (v) anims.attack.melee.rush(v, board.playerPoint());
      await clock.delay(70);
      return;
    }
    const attacker = ev.by === 'player' ? board.player : board.viewAt(ev.from);
    if (!attacker) return;
    await anims.attack.pick(ev.by === 'player' && ev.ranged, ev.style).play(attacker, ev.to);
  },

  hit(ev, { battle, board, anims, sound }) {
    const v = ev.target === 'player' ? board.player : board.viewAt(ev.cell);
    const p = BoardLayout.cellPos(ev.cell);
    const text = anims.text;
    if (ev.absorbed) {
      text.show(p.x, p.y - 30, t('game.absorbed'), '#7fc4ff', 28);
      return;
    }
    text.show(p.x, p.y - 30, `-${ev.amount}`, ev.crit ? HEX.gold : HEX.bad, ev.crit ? 46 : 36);
    if (ev.crit) text.show(p.x, p.y - 80, t('game.crit'), HEX.gold, 26);
    sound.play(ev.target === 'player' ? 'hurt' : ev.crit ? 'crit' : 'hit');
    if (!v) return;
    if (ev.target === 'player') {
      board.setPlayerHp(ev.hp, battle.stats.maxHp);
      anims.flash.shake(140, 0.006);
    } else {
      v.hp?.setText(String(ev.hp));
    }
    anims.hit.blink(v);
  },

  miss(ev, { board, anims, sound }) {
    const m = MISS_STYLE[ev.kind];
    const p = BoardLayout.cellPos(ev.cell);
    if (m.sfx) sound.play(m.sfx);
    anims.text.show(p.x, p.y - 40, t(m.key), m.color, m.size);
    if (ev.kind === 'dodge') anims.hit.dodge(board.player);
  },

  kill(ev, { board, anims, sound }) {
    const v = board.view(ev.uid);
    if (!v) return;
    board.release(v);
    sound.play('kill');
    anims.burst.play(v.c.x, v.c.y, 0xffffff);
    void anims.death.kill(v);
  },

  status(ev, { battle, board }) {
    const v = board.view(ev.uid);
    const card = battle.cards[ev.cell];
    if (v && card) board.showStatuses(v, card);
  },

  /** Героя зажали и ему нечем ответить — карты идут рвать его по очереди. */
  async swarm(ev, { board, anims, hud, sound, clock }) {
    sound.play('burst');
    anims.flash.shake(520, 0.012);
    hud.note(t('game.cornered'), HEX.bad, 30);
    for (const cell of ev.cells) {
      const v = board.viewAt(cell);
      if (v) anims.bump.play(v.c, 1.1, 140);
    }
    await clock.delay(420);
  },
};
