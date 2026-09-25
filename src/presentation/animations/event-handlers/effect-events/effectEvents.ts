import { PERK_BY_ID } from '../../../../domain/catalog';
import { perkName } from '../../../../i18n';
import { BoardLayout } from '../../../board/BoardLayout';
import { HEX } from '../../../theme';
import type { EventHandlers } from '../interfaces/EventHandler';

/** Эффекты и панели: способность, заряд, вспышки способностей, артефакт, ресурс, щит, исход. */
export const effectEvents: Pick<
  EventHandlers,
  'perk' | 'armed' | 'fx' | 'artifact' | 'resource' | 'boost' | 'shield' | 'win' | 'lose'
> = {
  perk(ev, { hud, sound }) {
    sound.play('burst');
    hud.note(perkName(PERK_BY_ID[ev.id]), HEX.gold, 28);
  },

  /** Способность заряжена или снята с заряда: кнопки и подсветка целей на поле. */
  armed(_ev, { battle, board, hud }) {
    hud.refreshAbilities();
    board.showTargets(battle);
  },

  async fx(ev, { board, anims }) {
    const origin = ev.from !== undefined ? BoardLayout.cellPos(ev.from) : board.playerPoint();
    await anims.vfx.play(ev.cells, ev.style, origin);
  },

  async artifact(_ev, { anims, sound, clock }) {
    sound.play('burst');
    anims.flash.flash(220, 0xb478ff);
    anims.flash.shake(260, 0.01);
    await clock.delay(250);
  },

  resource: (_ev, { hud }) => hud.refresh(),
  boost: (_ev, { hud }) => hud.refresh(),
  shield: (ev, { board }) => board.setShield(ev.now),
  // исход комнаты показывает поток боя (звук и окна), не проигрыватель
  win: () => undefined,
  lose: () => undefined,
};
