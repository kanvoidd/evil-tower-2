import type { Profile } from '../../domain/account';
import { type RoomDef, ROOMS } from '../../domain/catalog';
import { type GameEvent, type IBattleSession, RoomBattleFactory } from '../../domain/combat';
import { Gold, makeRng, randomSeed, type Rng, Souls } from '../../domain/shared';
import type { IPlatform } from '../ports/IPlatform';
import type { IProfileStorage } from '../ports/IProfileStorage';
import type { RunCarry } from './interfaces/RunCarry';
import type { RunEndReason } from './interfaces/RunEndReason';

/**
 * Забег по башне глазами текущей комнаты: с чем герой в неё вошёл и что забег оставляет
 * в профиле. Бой в комнате — `RoomBattle` (домен), а здесь — учёт: износ и расходники после комнаты,
 * награда за пройденную комнату, рекорд, таблица рекордов, автопрокачка на заработанные души.
 *
 * Пройденная комната сразу платит в кошелёк героя — закрытая вкладка ничего не отнимает;
 * добыча текущей комнаты пропадает при гибели или побеге.
 */
export class TowerRun {
  /** Итоги комнаты уже записаны (износ, убийства) — второй раз не пишем. */
  private committed = false;
  private battle!: IBattleSession;

  constructor(
    private readonly profile: Profile,
    private readonly platform: IPlatform,
    private readonly storage: IProfileStorage,
    private carry: RunCarry,
  ) {}

  /** Новый забег: всегда с 1-1, рекорд героя запоминается, чтобы в конце сказать «новый рекорд». */
  static start(profile: Profile): RunCarry {
    return { index: 0, rooms: 0, gold: Gold.of(0), souls: Souls.of(0), best: profile.best };
  }

  get state(): RunCarry {
    return this.carry;
  }

  get room(): RoomDef {
    return ROOMS[Math.min(this.carry.index, ROOMS.length - 1)];
  }

  /** Вся башня пройдена. */
  get complete(): boolean {
    return this.carry.index >= ROOMS.length;
  }

  get maxRooms(): number {
    return ROOMS.length;
  }

  /** Номер следующей комнаты («2-1»). */
  get nextRoomId(): string {
    return ROOMS[this.carry.index].id;
  }

  /** Добыча текущей комнаты ещё не в кошельке героя — пропадёт при гибели или побеге. */
  get lootAtStake(): boolean {
    return this.battle.totals.gold > 0 || this.battle.totals.souls > 0;
  }

  /** Бой в комнате собирает фабрика: героя берёт у фабрик героев, врагов — у фабрик этажей. */
  enterRoom(rng: Rng = makeRng(randomSeed())): IBattleSession {
    const p = this.profile;
    this.battle = RoomBattleFactory.standard().create({
      room: this.room,
      stats: p.playerStats(),
      weapon: p.equipped('weapon'),
      armor: p.equipped('armor'),
      consumables: { ...p.heroSave.consumables },
      rng,
      carry: this.carry.hero,
    });
    return this.battle;
  }

  /** Счётчики профиля по событиям хода: открытые сундуки и сломанные предметы. */
  count(events: readonly GameEvent[]): void {
    for (const ev of events) {
      if (ev.type === 'chest' && !ev.empty) this.profile.bump('chestsOpened');
      else if (ev.type === 'break') this.profile.bump('itemsBroken');
    }
  }

  /** Расходники героя — такими, какими их оставил ход. */
  keepConsumables(): void {
    this.profile.keepConsumables(this.battle.consumables);
  }

  /** Износ экипировки, расходники и убийства комнаты — в профиль (один раз за комнату). */
  commitRoom(): void {
    if (this.committed) return;
    this.committed = true;
    this.profile.commitBattle(this.battle.weapon, this.battle.armor, this.battle.consumables);
    this.profile.bump('kills', this.battle.totals.kills);
    this.profile.markTutorial('fight');
  }

  /** Пройденная комната сразу платит всё: сумку, души и бонус за прохождение. */
  clearRoom(): { gold: Gold; souls: Souls; flawless: boolean } {
    const battle = this.battle;
    const room = battle.room;
    this.commitRoom();
    const gold = Gold.of(battle.totals.gold + room.clearGold);
    const souls = Souls.of(battle.totals.souls + room.clearSouls);
    const flawless = battle.totals.damageTaken === 0;
    const p = this.profile;
    p.addGold(gold);
    p.addSouls(souls);
    p.bump('roomsCleared');
    if (flawless) p.bump('flawless');
    const c = this.carry;
    this.carry = {
      ...c,
      index: c.index + 1,
      rooms: c.rooms + 1,
      gold: Gold.of(c.gold + gold),
      souls: Souls.of(c.souls + souls),
      hero: battle.carryOut(),
    };
    // рекорд пишем сразу: закрытая посреди забега вкладка не должна его отнимать
    p.recordRun(this.carry.rooms);
    p.checkNow();
    this.storage.flush();
    return { gold, souls, flawless };
  }

  /**
   * Конец забега: гибель, побег или вся башня. Награда за пройденные комнаты уже в кошельке.
   * Здесь — рекорд, таблица рекордов и автопрокачка на заработанные души.
   */
  end(reason: RunEndReason): { record: boolean; best: number; autoBuys: number } {
    const p = this.profile;
    this.commitRoom();
    if (reason === 'dead') p.bump('deaths');
    const c = this.carry;
    const record = c.rooms > c.best;
    p.recordRun(c.rooms);
    // в таблицу рекордов идёт лучший забег среди героев
    void this.platform.submitScore('rooms', p.bestClimb);
    void this.platform.setStats({ rooms: p.bestClimb, kills: p.stats.kills });
    const autoBuys = p.runAutoSkill()?.buys.length ?? 0;
    p.checkNow();
    this.storage.flush();
    return { record, best: p.best, autoBuys };
  }

  /** «Удвоить награду»: весь забег ещё раз (видео уже досмотрено). */
  doubleReward(): void {
    this.profile.addGold(this.carry.gold);
    this.profile.addSouls(this.carry.souls);
    this.storage.flush();
  }

  /** Уход из боя: итоги комнаты в профиль и сразу на диск. */
  leave(): void {
    this.commitRoom();
    this.storage.flush();
  }
}
