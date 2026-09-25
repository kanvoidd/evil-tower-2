import type { ClassId } from '../../classes/interfaces/ClassId';
import type { TalentDef } from '../../talents/interfaces/TalentDef';
import type { TalentFx } from '../../talents/interfaces/TalentFx';
import type { TalentPath } from '../../talents/interfaces/TalentPath';
import type { TalentTierNumber } from '../../talents/interfaces/TalentTierNumber';
import type { TalentSeed } from './interfaces/TalentSeed';
import type { TalentTier } from './interfaces/TalentTier';

/**
 * Абстрактная фабрика героя — переходная: линейка и классы уже лежат определениями в папке
 * линейки (`heroes/<линейка>/`), способности и перки — тоже (`abilities/`, `ClassDef.perks`). Фабрики
 * выпускают только таланты, пока те не перейдут в определения (этап D `docs/REFACTORING-PLAN-3.md`).
 *
 * Защищённые методы — общие «станки»: правила, по которым собирается любой продукт (id таланта по
 * ярусу и цепочке). Конкретные фабрики описывают только содержание.
 */
export abstract class HeroFactory {
  private static readonly PATH_KEY: Record<keyof TalentTier, TalentPath> = {
    a: 'attack',
    v: 'vitality',
    g: 'guard',
  };

  /** Таланты деревьев всех классов линейки. */
  abstract createTalents(): TalentDef[];

  /** Заготовка таланта для `talentTree`. */
  protected talent(fx: TalentFx, v: number[], v2?: number[]): TalentSeed {
    return { fx, v, v2 };
  }

  /** Дерево талантов класса: три яруса, в каждом по цепочке на путь. */
  protected talentTree(classId: ClassId, tiers: [TalentTier, TalentTier, TalentTier]): TalentDef[] {
    const out: TalentDef[] = [];
    tiers.forEach((tier, ti) => {
      (['a', 'v', 'g'] as const).forEach((p) => {
        tier[p].forEach((seed, step) => {
          out.push({
            id: `${classId}/${p}${ti + 1}-${step + 1}`,
            classId,
            path: HeroFactory.PATH_KEY[p],
            tier: (ti + 1) as TalentTierNumber,
            step,
            fx: seed.fx,
            v: seed.v,
            v2: seed.v2,
          });
        });
      });
    });
    return out;
  }
}
