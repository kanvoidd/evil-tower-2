import { type ConsumableId, CONSUMABLES } from '../../../../domain/catalog';
import { t } from '../../../../i18n';
import { BoardLayout } from '../../../board/BoardLayout';
import { HEX } from '../../../theme';
import type { EventHandlers } from '../interfaces/EventHandler';

/** Добыча и расходы: золото и души в кошель комнаты, лечение, сундуки, подбор, поломка, трата. */
export const lootEvents: Pick<
  EventHandlers,
  'gold' | 'souls' | 'value' | 'heal' | 'chest' | 'pickup' | 'break' | 'spend'
> = {
  /** Золото копится в кошеле комнаты и попадёт в кошелёк героя, только когда комната будет пройдена. */
  gold(ev, { anims, hud, sound }) {
    hud.addLoot(ev.amount, 0);
    const p = BoardLayout.cellPos(ev.cell);
    anims.text.show(p.x, p.y + 6, `+${ev.amount}`, HEX.gold, 32);
    anims.projectile.play(
      'ico_gold',
      p,
      hud.lootAnchor('gold'),
      Math.min(6, Math.ceil(ev.amount / 8)),
    );
    sound.play('coin');
  },

  /** Кучку золота смяли — на карточке новый номинал. */
  value(ev, { board, anims }) {
    const v = board.view(ev.uid);
    v?.label?.setText(`+${ev.value}`);
    if (v) anims.hit.blink(v);
  },

  /** Души, как и золото, копятся до конца комнаты: гибель в ней не приносит ничего. */
  souls(ev, { anims, hud }) {
    hud.addLoot(0, ev.amount);
    const p = BoardLayout.cellPos(ev.cell);
    anims.text.show(p.x, p.y + 46, `+${ev.amount}`, HEX.soul, 26);
    anims.projectile.play(
      'ico_soul',
      p,
      hud.lootAnchor('souls'),
      Math.min(5, Math.ceil(ev.amount / 6)),
    );
  },

  heal(ev, { battle, board, anims, sound }) {
    board.setPlayerHp(ev.hp, battle.stats.maxHp);
    const p = board.playerPoint();
    anims.text.show(p.x, p.y - 30, `+${ev.amount}`, HEX.good, 36);
    if (ev.source === 'potion' || ev.source === 'revive') sound.play('potion');
  },

  chest(ev, { anims, sound }) {
    const p = BoardLayout.cellPos(ev.cell);
    if (ev.empty) {
      // пустой: глухой звук, серая пыль и подпись вместо добычи
      sound.play('error');
      anims.burst.play(p.x, p.y, 0x8a8fa8, 10);
      anims.text.show(p.x, p.y - 20, t('game.chest_empty'), HEX.textDim, 26);
      return;
    }
    sound.play('chest');
    anims.burst.play(p.x, p.y, 0xf1c40f, 18);
    const items = ev.loot.filter((l) => l.kind !== 'gold').map((l) => l.kind as ConsumableId);
    if (items.length) anims.lootPop.play(p, items);
  },

  pickup(ev, { anims, hud, sound }) {
    const slot = hud.slotAnchor(ev.item);
    if (slot)
      anims.projectile.play(CONSUMABLES[ev.item].icon, BoardLayout.cellPos(ev.cell), slot, 1);
    hud.bumpSlot(ev.item);
    sound.play('potion');
    hud.refresh();
  },

  break(_ev, { battle, board, anims, hud, sound }) {
    sound.play('break');
    const p = board.playerPoint();
    anims.text.show(p.x, p.y - 100, t('game.broken'), HEX.bad, 28);
    hud.refresh();
    board.setPlayerDamage(battle.stats.damage);
  },

  spend(ev, { board, anims, hud, sound }) {
    hud.addLoot(-ev.amount, 0);
    const p = board.playerPoint();
    anims.text.show(p.x, p.y - 70, `-${ev.amount}`, HEX.bad, 28);
    sound.play('coin');
  },
};
