import type { IAbility } from '../../interfaces/IAbility';

/**
 * «Взведённая ловушка». Своего действия у механики нет: выбор способности и задержки — часть
 * наведения (`PerkActions`), отсчёт и срабатывание на клетке — ловушки боя (`RoomTraps`).
 */
export class ArmedTrap implements IAbility<'armed_trap'> {
  readonly behavior = 'armed_trap';

  apply(): void {
    // ловушку ставит наведение: к этому моменту она уже на поле
  }
}
