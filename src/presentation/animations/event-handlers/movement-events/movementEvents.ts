import type { EventHandlers } from '../interfaces/EventHandler';

/** Движение карт: появление, шаг героя, сдвиг, перестановка, исчезновение. */
export const movementEvents: Pick<EventHandlers, 'spawn' | 'move' | 'slide' | 'swap' | 'remove'> = {
  async spawn(ev, { board, anims, sound, clock }, deal) {
    // на клетке не должно остаться чужого вида — иначе карты наезжают друг на друга
    const old = board.viewAt(ev.cell);
    if (old) {
      board.release(old);
      void anims.death.vanish(old, 0.4, 140);
    }
    void anims.spawn.play(board.place(ev.card, ev.cell));
    if (deal) {
      sound.play('spawn');
      await clock.delay(70);
    }
  },

  async move(ev, { board, anims, sound }) {
    await anims.motion.settled();
    // герой встаёт на добычу — её карточка тает у него под ногами
    const target = board.viewAt(ev.to);
    if (target && target.kind !== 'enemy') {
      board.release(target);
      void anims.death.vanish(target, 0.3, 160);
    }
    sound.play('move');
    await anims.move.step(board.player, ev.to);
    board.player.cell = ev.to;
  },

  async slide(ev, { board, anims }) {
    const v = board.view(ev.uid);
    if (!v) return;
    v.cell = ev.to;
    await anims.move.step(v, ev.to);
  },

  async swap(ev, { board, anims, sound }) {
    const va = board.viewAt(ev.a);
    const vb = board.viewAt(ev.b);
    sound.play('move');
    if (va) va.cell = ev.b;
    if (vb) vb.cell = ev.a;
    await anims.move.swap(va, vb, ev.a, ev.b);
  },

  remove(ev, { board, anims }) {
    const v = board.view(ev.uid);
    if (!v) return;
    board.release(v);
    void anims.death.vanish(v, 0.4, 160);
  },
};
