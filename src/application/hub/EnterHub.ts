import type { IPlatform } from '../ports';

/** Вход в хаб: платформа узнаёт, что игра готова и геймплей остановлен. */
export class EnterHub {
  constructor(private readonly platform: IPlatform) {}

  execute(): void {
    this.platform.ready();
    this.platform.gameplayStop();
  }
}
