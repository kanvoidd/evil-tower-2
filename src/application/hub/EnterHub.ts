import type { Profile } from '../../domain/account';
import type { IPlatform } from '../ports';
import type { HubEntry } from './interfaces/HubEntry';

/**
 * Вход в хаб: платформа узнаёт, что игра готова и геймплей остановлен, а души, заработанные
 * в башне, уходят в автопрокачку (если игрок её включил). Выполняется до того, как хаб построен:
 * карточка героя и значки показывают уже итог прокачки.
 */
export class EnterHub {
  constructor(
    private readonly profile: Profile,
    private readonly platform: IPlatform,
  ) {}

  execute(): HubEntry {
    this.platform.ready();
    this.platform.gameplayStop();
    const auto = this.profile.runAutoSkill();
    return { autoSkillBuys: auto?.buys.length ?? 0 };
  }
}
