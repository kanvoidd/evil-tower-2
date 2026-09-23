import type { ClassId, LineageId, Stats, TalentPath } from '../../../types';
import type { ClassDef } from '../../classes/interfaces/ClassDef';
import type { PerkDef } from '../../perks/interfaces/PerkDef';
import type { PerkSlot } from '../../perks/interfaces/PerkSlot';
import type { TalentDef } from '../../talents/interfaces/TalentDef';
import type { TalentFx } from '../../talents/interfaces/TalentFx';
import type { LineageDef } from '../interfaces/LineageDef';
import type { PerkSpec } from './interfaces/PerkSpec';
import type { TalentSeed } from './interfaces/TalentSeed';
import type { TalentTier } from './interfaces/TalentTier';

/**
 * Абстрактная фабрика героя (паттерн Abstract Factory).
 *
 * Линейка — семейство связанных продуктов: сама линейка (ресурс, базовые характеристики),
 * её классы, их перки и таланты (скиллы дерева). Продукты одного семейства обязаны сходиться
 * друг с другом — перки и таланты только своих классов, классы только своей линейки, — поэтому
 * всё семейство выпускает одна конкретная фабрика (`WarriorFactory`, `MageFactory`, …).
 *
 * Реестры `LINEAGES`, `CLASSES`, `PERKS`, `TALENTS` собираются из списка фабрик только через этот
 * абстрактный интерфейс и ни одну линейку не знают по имени: новая линейка — это новая фабрика
 * в `HERO_FACTORIES`, остальной код не меняется.
 *
 * Защищённые методы — общие «станки»: правила, по которым собирается любой продукт (id и иконка
 * перка, id таланта по ярусу и цепочке). Конкретные фабрики описывают только содержание.
 */
export abstract class HeroFactory {
  private static readonly PATH_KEY: Record<keyof TalentTier, TalentPath> = { a: 'attack', v: 'vitality', g: 'guard' };

  abstract readonly lineage: LineageId;

  abstract createLineage(): LineageDef;
  /** Классы линейки в порядке развития: базовый, второй, два финальных. */
  abstract createClasses(): ClassDef[];
  /** Перки всех классов линейки. */
  abstract createPerks(): PerkDef[];
  /** Таланты деревьев всех классов линейки. */
  abstract createTalents(): TalentDef[];

  protected lineageDef(o: Omit<LineageDef, 'id'>): LineageDef {
    return { id: this.lineage, ...o };
  }

  protected classDef(id: ClassId, stage: 0 | 1 | 2, parent: ClassId | null, mods: Partial<Stats> = {}): ClassDef {
    return { id, lineage: this.lineage, stage, parent, mods };
  }

  protected perk(classId: ClassId, slot: PerkSlot, o: PerkSpec): PerkDef {
    return {
      id: `${classId}_${slot}`,
      classId,
      slot,
      ability: o.ability,
      icon: `perk_${classId}_${slot}`,
      name: { ru: o.ru, en: o.en },
      desc: { ru: o.dru, en: o.den },
      passive: o.passive,
      basic: o.basic,
      cost: o.cost,
      goldCost: o.goldCost,
      target: o.target,
      once: o.once,
      cooldown: o.cooldown,
      vfx: o.vfx,
    };
  }

  /** Заготовка таланта для `talentTree`. */
  protected talent(ru: string, en: string, fx: TalentFx, v: number[], v2?: number[]): TalentSeed {
    return { ru, en, fx, v, v2 };
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
            tier: (ti + 1) as 1 | 2 | 3,
            step,
            fx: seed.fx,
            v: seed.v,
            v2: seed.v2,
            name: { ru: seed.ru, en: seed.en },
          });
        });
      });
    });
    return out;
  }
}
