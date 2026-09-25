import type { Profile } from '../../domain/account';
import type { RoomDef } from '../../domain/catalog';
import { type GameEvent, type IBattleSession, RoomBattleFactory } from '../../domain/combat';
import {
  RecordPolicy,
  type RoomPay,
  RoomPayout,
  type RunCarry,
  TowerClimb,
} from '../../domain/expedition';
import { makeRng, type Rng } from '../../domain/shared';
import type { IPlatform } from '../ports/IPlatform';
import type { IProfileStorage } from '../ports/IProfileStorage';
import type { ISeedSource } from '../ports/ISeedSource';
import type { RunEndReason } from './interfaces/RunEndReason';
import type { TowerRunDeps } from './interfaces/TowerRunDeps';

/**
 * Забег по башне глазами текущей комнаты — координатор: правила забега (оплата комнаты, рекорд,
 * переход в следующую комнату) — в домене (`expedition`), бой в комнате — `RoomBattle`, а здесь —
 * порядок вызовов и запись: износ и расходники после комнаты, выплата в кошелёк героя, рекорд,
 * таблица рекордов платформы, автопрокачка на заработанные души, сохранение.
 */
export class TowerRun {
  /** Итоги комнаты уже записаны (износ, убийства) — второй раз не пишем. */
  private committed = false;
  private battle!: IBattleSession;

  private readonly profile: Profile;
  private readonly platform: IPlatform;
  private readonly storage: IProfileStorage;
  private readonly seeds: ISeedSource;

  constructor(
    deps: TowerRunDeps,
    private carry: RunCarry,
  ) {
    this.profile = deps.profile;
    this.platform = deps.platform;
    this.storage = deps.storage;
    this.seeds = deps.seeds;
  }

  /** Новый забег: всегда с 1-1, рекорд героя запоминается, чтобы в конце сказать «новый рекорд». */
  static start(profile: Profile): RunCarry {
    return TowerClimb.start(profile.best);
  }

  get state(): RunCarry {
    return this.carry;
  }

  get room(): RoomDef {
    return TowerClimb.room(this.carry);
  }

  /** Вся башня пройдена. */
  get complete(): boolean {
    return TowerClimb.complete(this.carry);
  }

  get maxRooms(): number {
    return TowerClimb.length;
  }

  /** Номер следующей комнаты («2-1»). */
  get nextRoomId(): string {
    return TowerClimb.nextRoomId(this.carry);
  }

  /** Добыча текущей комнаты ещё не в кошельке героя — пропадёт при гибели или побеге. */
  get lootAtStake(): boolean {
    return RoomPayout.atStake(this.battle.totals);
  }

  /**
   * Бой в комнате собирает фабрика: героя берёт у фабрик героев, врагов — у фабрик этажей.
   * Случайности комнаты идут от нового зерна источника зёрен.
   */
  enterRoom(rng: Rng = makeRng(this.seeds.next())): IBattleSession {
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
  clearRoom(): RoomPay {
    const battle = this.battle;
    this.commitRoom();
    const pay = RoomPayout.of(battle.room, battle.totals);
    const p = this.profile;
    p.addGold(pay.gold);
    p.addSouls(pay.souls);
    p.bump('roomsCleared');
    if (pay.flawless) p.bump('flawless');
    this.carry = TowerClimb.advance(this.carry, pay, battle.carryOut());
    p.recordRun(RecordPolicy.climb(this.carry));
    p.checkNow();
    this.storage.flush();
    return pay;
  }

  /**
   * Конец забега: гибель, побег или вся башня. Награда за пройденные комнаты уже в кошельке.
   * Здесь — рекорд, таблица рекордов и автопрокачка на заработанные души.
   */
  end(reason: RunEndReason): { record: boolean; best: number; autoBuys: number } {
    const p = this.profile;
    this.commitRoom();
    if (reason === 'dead') p.bump('deaths');
    const record = RecordPolicy.isRecord(this.carry);
    p.recordRun(RecordPolicy.climb(this.carry));
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
