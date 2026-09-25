import type { Profile } from '../../domain/account';
import type { ClassId } from '../../domain/types';

/**
 * Отказ от финального класса: его ветка сбрасывается, часть потраченных душ возвращается,
 * герой снова — класс-родитель.
 */
export class CancelMetamorphosis {
  constructor(private readonly profile: Profile) {}

  execute(): { refund: number; to: ClassId } {
    const r = this.profile.activeHero.cancelMetamorphosis();
    if (r.refund > 0) this.profile.addSouls(r.refund, false);
    this.profile.setActiveClass(r.to);
    return r;
  }
}
