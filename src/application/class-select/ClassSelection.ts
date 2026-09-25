import { CLASSES } from '../../domain/data/classes';
import { LINEAGE_ORDER } from '../../domain/data/heroes';
import { ROOMS } from '../../domain/data/levels';
import { GAMEPLAY } from '../../domain/gameplay';
import type { Profile } from '../../domain/logic/profile';
import { classStartStats, classTraits } from '../../domain/logic/traits';
import type { ClassId, LineageId } from '../../domain/types';
import type { ClassSelectMode } from './interfaces/ClassSelectMode';
import type { HeroChoice } from './interfaces/HeroChoice';

/**
 * Выбор героя: кого показать в карусели и что с ним можно сделать — выбрать стартового героя,
 * открыть нового за золото или сменить героя. У каждого героя свой кошелёк и свой рекорд,
 * поэтому смена героя ничего не отнимает у прежнего.
 */
export class ClassSelection {
  constructor(private readonly profile: Profile, readonly mode: ClassSelectMode) {}

  /** Цена нового героя в золоте. */
  get unlockCost(): number {
    return GAMEPLAY.classUnlockCost;
  }

  /** Все герои по порядку линеек. */
  choices(): HeroChoice[] {
    return LINEAGE_ORDER.map((l) => this.choiceOf(l));
  }

  /** Герой той же линейки, что и `classId` (после открытия или смены — с новым состоянием). */
  choice(classId: ClassId): HeroChoice {
    return this.choiceOf(CLASSES[classId].lineage);
  }

  /** С кого карусель начинает: в первом запуске — с первого героя, иначе — с того, кто сейчас в игре. */
  initialIndex(choices: readonly HeroChoice[]): number {
    if (this.mode === 'first') return 0;
    return Math.max(0, choices.findIndex((c) => c.classId === this.profile.activeClass));
  }

  /** Первый запуск: герой открыт и сразу выбран. */
  chooseFirst(classId: ClassId): void {
    this.profile.unlockLineage(CLASSES[classId].lineage);
    this.profile.setActiveClass(classId);
  }

  /** Открыть героя за золото текущего героя. false — не хватает золота. */
  unlock(lineage: LineageId): boolean {
    return this.profile.buyLineage(lineage);
  }

  /** Сменить героя: дальше играет он, со своим кошельком и прогрессом. */
  switchTo(classId: ClassId): void {
    this.profile.setActiveClass(classId);
  }

  private choiceOf(lineage: LineageId): HeroChoice {
    const p = this.profile;
    const opened = this.mode === 'first' || p.isLineageUnlocked(lineage);
    // одна запись на линейку: улучшенный класс заменяет прежний (наёмник → ассасин), назад пути нет
    const classId: ClassId = this.mode === 'switch' && opened ? p.hero(lineage).classId : lineage;
    const s = classStartStats(classId);
    const current = this.mode === 'switch' && classId === p.activeClass;
    return {
      classId,
      lineage,
      opened,
      climbed: p.bestOf(lineage),
      total: ROOMS.length,
      traits: classTraits(classId),
      stats: { maxHp: s.maxHp, damage: s.damage, crit: s.crit },
      action: this.mode === 'first' ? 'start' : !opened ? 'unlock' : current ? 'current' : 'pick',
    };
  }
}
