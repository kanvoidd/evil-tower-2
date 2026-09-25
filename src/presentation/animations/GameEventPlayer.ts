import type { IAnimationPlayer } from '../../application/game/interfaces/IAnimationPlayer';
import type { ISoundPlayer, SfxName } from '../../application/ports';
import { CONSUMABLES } from '../../domain/catalog/consumables';
import { PERK_BY_ID } from '../../domain/catalog/perks';
import type { GameEvent } from '../../domain/combat/events';
import type { IRunState } from '../../domain/combat/room-battle';
import type { ConsumableId } from '../../domain/types';
import { perkName, t, type TKey } from '../../i18n';
import { BoardLayout } from '../board/BoardLayout';
import type { BoardView } from '../board/BoardView';
import type { IBattleHud } from '../hud/interfaces/IBattleHud';
import type { PhaserClock } from '../phaser/PhaserClock';
import { HEX } from '../theme';
import type { Animations } from './Animations';

type Ev<K extends GameEvent['type']> = Extract<GameEvent, { type: K }>;

/**
 * Проигрыватель событий боя. Бой ничего не рисует сам: он отдаёт журнал событий, а этот класс
 * по порядку показывает каждое — анимацией, звуком, всплывающей подписью и обновлением панелей.
 *
 *   Run → GameEvent[] → GameEventPlayer → Animations / BoardView / HUD
 *
 * Состояние боя проигрыватель только читает — например, чтобы показать, что героя уже добивают.
 */
export class GameEventPlayer implements IAnimationPlayer {
  /** Промахи: подпись, её цвет и размер, звук. */
  private static readonly MISS: Record<
    Ev<'miss'>['kind'],
    { key: TKey; color: string; size: number; sfx?: SfxName }
  > = {
    dodge: { key: 'game.dodge', color: '#7fe8d0', size: 32, sfx: 'dodge' },
    parry: { key: 'game.parry', color: '#9ec5ff', size: 32, sfx: 'parry' },
    block: { key: 'game.block', color: '#7fc4ff', size: 30, sfx: 'parry' },
    evade: { key: 'game.evade', color: HEX.textDim, size: 28, sfx: 'dodge' },
    stun: { key: 'game.stunned', color: '#ffd86b', size: 26 },
    smoke: { key: 'game.smoke', color: HEX.textDim, size: 26 },
  };

  private alive = true;

  constructor(
    private readonly run: IRunState,
    private readonly board: BoardView,
    private readonly anims: Animations,
    private readonly hud: IBattleHud,
    private readonly sound: ISoundPlayer,
    private readonly clock: PhaserClock,
  ) {}

  /** Сцена закрывается: недоигранные события больше не показываем. */
  stop(): void {
    this.alive = false;
  }

  /** Показать события по порядку. `deal` — первая раздача: карты выкладываются со звуком и паузой. */
  async play(events: readonly GameEvent[], o: { deal?: boolean } = {}): Promise<void> {
    for (const ev of events) {
      if (!this.alive) return;
      await this.handle(ev, !!o.deal);
    }
    await this.anims.motion.settled();
  }

  private async handle(ev: GameEvent, deal: boolean): Promise<void> {
    switch (ev.type) {
      case 'spawn':
        return this.spawn(ev, deal);
      case 'attack':
        return this.attack(ev);
      case 'hit':
        return this.hit(ev);
      case 'miss':
        return this.miss(ev);
      case 'kill':
        return this.kill(ev);
      case 'move':
        return this.move(ev);
      case 'slide':
        return this.slide(ev);
      case 'gold':
        return this.gold(ev);
      case 'souls':
        return this.souls(ev);
      case 'heal':
        return this.heal(ev);
      case 'resource':
      case 'boost':
        return this.hud.refresh();
      case 'shield':
        return this.board.setShield(ev.now);
      case 'chest':
        return this.chest(ev);
      case 'pickup':
        return this.pickup(ev);
      case 'break':
        return this.breakItem();
      case 'perk':
        return this.perk(ev);
      case 'armed':
        return this.armed();
      case 'spend':
        return this.spend(ev);
      case 'status':
        return this.status(ev);
      case 'fx':
        return this.fx(ev);
      case 'remove':
        return this.remove(ev);
      case 'swarm':
        return this.swarm(ev);
      case 'swap':
        return this.swap(ev);
      case 'rewind':
        return this.rewind();
      case 'artifact':
        return this.artifact();
      case 'win':
      case 'lose':
        return;
    }
  }

  private async spawn(ev: Ev<'spawn'>, deal: boolean): Promise<void> {
    // на клетке не должно остаться чужого вида — иначе карты наезжают друг на друга
    const old = this.board.viewAt(ev.cell);
    if (old) {
      this.board.release(old);
      void this.anims.death.vanish(old, 0.4, 140);
    }
    void this.anims.spawn.play(this.board.place(ev.card, ev.cell));
    if (deal) {
      this.sound.play('spawn');
      await this.clock.delay(70);
    }
  }

  private async attack(ev: Ev<'attack'>): Promise<void> {
    if (this.run.over === 'lose' && ev.by === 'enemy') {
      const v = this.board.viewAt(ev.from);
      if (v) this.anims.attack.melee.rush(v, this.board.playerPoint());
      await this.clock.delay(70);
      return;
    }
    const attacker = ev.by === 'player' ? this.board.player : this.board.viewAt(ev.from);
    if (!attacker) return;
    await this.anims.attack.pick(ev.by === 'player' && ev.ranged, ev.style).play(attacker, ev.to);
  }

  private hit(ev: Ev<'hit'>): void {
    const v = ev.target === 'player' ? this.board.player : this.board.viewAt(ev.cell);
    const p = BoardLayout.cellPos(ev.cell);
    const text = this.anims.text;
    if (ev.absorbed) {
      text.show(p.x, p.y - 30, t('game.absorbed'), '#7fc4ff', 28);
      return;
    }
    text.show(p.x, p.y - 30, `-${ev.amount}`, ev.crit ? HEX.gold : HEX.bad, ev.crit ? 46 : 36);
    if (ev.crit) text.show(p.x, p.y - 80, t('game.crit'), HEX.gold, 26);
    this.sound.play(ev.target === 'player' ? 'hurt' : ev.crit ? 'crit' : 'hit');
    if (!v) return;
    if (ev.target === 'player') {
      this.board.setPlayerHp(ev.hp, this.run.stats.maxHp);
      this.anims.flash.shake(140, 0.006);
    } else {
      v.hp?.setText(String(ev.hp));
    }
    this.anims.hit.blink(v);
  }

  private miss(ev: Ev<'miss'>): void {
    const m = GameEventPlayer.MISS[ev.kind];
    const p = BoardLayout.cellPos(ev.cell);
    if (m.sfx) this.sound.play(m.sfx);
    this.anims.text.show(p.x, p.y - 40, t(m.key), m.color, m.size);
    if (ev.kind === 'dodge') this.anims.hit.dodge(this.board.player);
  }

  private kill(ev: Ev<'kill'>): void {
    const v = this.board.view(ev.uid);
    if (!v) return;
    this.board.release(v);
    this.sound.play('kill');
    this.anims.burst.play(v.c.x, v.c.y, 0xffffff);
    void this.anims.death.kill(v);
  }

  private async move(ev: Ev<'move'>): Promise<void> {
    await this.anims.motion.settled();
    // герой встаёт на добычу — её карточка тает у него под ногами
    const target = this.board.viewAt(ev.to);
    if (target && target.kind !== 'enemy') {
      this.board.release(target);
      void this.anims.death.vanish(target, 0.3, 160);
    }
    this.sound.play('move');
    await this.anims.move.step(this.board.player, ev.to);
    this.board.player.cell = ev.to;
  }

  private async slide(ev: Ev<'slide'>): Promise<void> {
    const v = this.board.view(ev.uid);
    if (!v) return;
    v.cell = ev.to;
    await this.anims.move.step(v, ev.to);
  }

  /** Золото копится в кошеле комнаты и попадёт в кошелёк героя, только когда комната будет пройдена. */
  private gold(ev: Ev<'gold'>): void {
    this.hud.addLoot(ev.amount, 0);
    const p = BoardLayout.cellPos(ev.cell);
    this.anims.text.show(p.x, p.y + 6, `+${ev.amount}`, HEX.gold, 32);
    this.anims.projectile.play(
      'ico_gold',
      p,
      this.hud.lootAnchor('gold'),
      Math.min(6, Math.ceil(ev.amount / 8)),
    );
    this.sound.play('coin');
  }

  /** Души, как и золото, копятся до конца комнаты: гибель в ней не приносит ничего. */
  private souls(ev: Ev<'souls'>): void {
    this.hud.addLoot(0, ev.amount);
    const p = BoardLayout.cellPos(ev.cell);
    this.anims.text.show(p.x, p.y + 46, `+${ev.amount}`, HEX.soul, 26);
    this.anims.projectile.play(
      'ico_soul',
      p,
      this.hud.lootAnchor('souls'),
      Math.min(5, Math.ceil(ev.amount / 6)),
    );
  }

  private heal(ev: Ev<'heal'>): void {
    this.board.setPlayerHp(ev.hp, this.run.stats.maxHp);
    const p = this.board.playerPoint();
    this.anims.text.show(p.x, p.y - 30, `+${ev.amount}`, HEX.good, 36);
    if (ev.source === 'potion' || ev.source === 'revive') this.sound.play('potion');
  }

  private chest(ev: Ev<'chest'>): void {
    const p = BoardLayout.cellPos(ev.cell);
    if (ev.empty) {
      // пустой: глухой звук, серая пыль и подпись вместо добычи
      this.sound.play('error');
      this.anims.burst.play(p.x, p.y, 0x8a8fa8, 10);
      this.anims.text.show(p.x, p.y - 20, t('game.chest_empty'), HEX.textDim, 26);
      return;
    }
    this.sound.play('chest');
    this.anims.burst.play(p.x, p.y, 0xf1c40f, 18);
    const items = ev.loot.filter((l) => l.kind !== 'gold').map((l) => l.kind as ConsumableId);
    if (items.length) this.anims.lootPop.play(p, items);
  }

  private pickup(ev: Ev<'pickup'>): void {
    const slot = this.hud.slotAnchor(ev.item);
    if (slot)
      this.anims.projectile.play(CONSUMABLES[ev.item].icon, BoardLayout.cellPos(ev.cell), slot, 1);
    this.hud.bumpSlot(ev.item);
    this.sound.play('potion');
    this.hud.refresh();
  }

  private breakItem(): void {
    this.sound.play('break');
    const p = this.board.playerPoint();
    this.anims.text.show(p.x, p.y - 100, t('game.broken'), HEX.bad, 28);
    this.hud.refresh();
    this.board.setPlayerDamage(this.run.stats.damage);
  }

  private perk(ev: Ev<'perk'>): void {
    this.sound.play('burst');
    this.hud.note(perkName(PERK_BY_ID[ev.id]), HEX.gold, 28);
  }

  /** Способность заряжена или снята с заряда: кнопки и подсветка целей на поле. */
  private armed(): void {
    this.hud.refreshAbilities();
    this.board.showTargets(this.run);
  }

  private spend(ev: Ev<'spend'>): void {
    this.hud.addLoot(-ev.amount, 0);
    const p = this.board.playerPoint();
    this.anims.text.show(p.x, p.y - 70, `-${ev.amount}`, HEX.bad, 28);
    this.sound.play('coin');
  }

  private status(ev: Ev<'status'>): void {
    const v = this.board.view(ev.uid);
    const card = this.run.cards[ev.cell];
    if (v && card) this.board.showStatuses(v, card);
  }

  private async fx(ev: Ev<'fx'>): Promise<void> {
    const origin = ev.from !== undefined ? BoardLayout.cellPos(ev.from) : this.board.playerPoint();
    await this.anims.vfx.play(ev.cells, ev.style, origin);
  }

  private remove(ev: Ev<'remove'>): void {
    const v = this.board.view(ev.uid);
    if (!v) return;
    this.board.release(v);
    void this.anims.death.vanish(v, 0.4, 160);
  }

  /** Героя зажали и ему нечем ответить — карты идут рвать его по очереди. */
  private async swarm(ev: Ev<'swarm'>): Promise<void> {
    this.sound.play('burst');
    this.anims.flash.shake(520, 0.012);
    this.hud.note(t('game.cornered'), HEX.bad, 30);
    for (const cell of ev.cells) {
      const v = this.board.viewAt(cell);
      if (v) this.anims.bump.play(v.c, 1.1, 140);
    }
    await this.clock.delay(420);
  }

  private async swap(ev: Ev<'swap'>): Promise<void> {
    const va = this.board.viewAt(ev.a);
    const vb = this.board.viewAt(ev.b);
    this.sound.play('move');
    if (va) va.cell = ev.b;
    if (vb) vb.cell = ev.a;
    await this.anims.move.swap(va, vb, ev.a, ev.b);
  }

  private async rewind(): Promise<void> {
    this.sound.play('burst');
    this.board.rebuild(this.run.cards, this.run.playerCell);
    this.hud.note(t('game.rewind'), HEX.soul, 28);
    await this.clock.delay(200);
  }

  private async artifact(): Promise<void> {
    this.sound.play('burst');
    this.anims.flash.flash(220, 0xb478ff);
    this.anims.flash.shake(260, 0.01);
    await this.clock.delay(250);
  }
}
