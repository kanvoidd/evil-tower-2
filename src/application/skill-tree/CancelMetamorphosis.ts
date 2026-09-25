import type { Profile } from '../../domain/account';
import type { ClassId } from '../../domain/catalog';
import type { Souls } from '../../domain/shared';

/**
 * Отказ от финального класса: его ветка сбрасывается, часть потраченных душ возвращается,
 * герой снова — класс-родитель.
 */
export class CancelMetamorphosis {
  constructor(private readonly profile: Profile) {}

  execute(): { refund: Souls; to: ClassId } {
    const r = this.profile.activeHero.cancelMetamorphosis();
    if (r.refund > 0) this.profile.addSouls(r.refund, false);
    this.profile.setActiveClass(r.to);
    return r;
  }
}
