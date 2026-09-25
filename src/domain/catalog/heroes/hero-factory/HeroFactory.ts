import type { ClassDef } from '../../classes/interfaces/ClassDef';
import type { ClassDefinition } from '../../classes/interfaces/ClassDefinition';
import type { ClassId } from '../../classes/interfaces/ClassId';
import type { AbilityId } from '../../perks/interfaces/AbilityId';
import type { AbilityParams } from '../../perks/interfaces/AbilityParams';
import type { PerkDef, PerkDefOf } from '../../perks/interfaces/PerkDef';
import type { PerkSlot } from '../../perks/interfaces/PerkSlot';
import type { TalentDef } from '../../talents/interfaces/TalentDef';
import type { TalentFx } from '../../talents/interfaces/TalentFx';
import type { TalentPath } from '../../talents/interfaces/TalentPath';
import type { TalentTierNumber } from '../../talents/interfaces/TalentTierNumber';
import type { LineageDef } from '../interfaces/LineageDef';
import type { LineageId } from '../interfaces/LineageId';
import type { Stats } from '../interfaces/Stats';
import type { PerkSpecOf } from './interfaces/PerkSpec';
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
  private static readonly PATH_KEY: Record<keyof TalentTier, TalentPath> = {
    a: 'attack',
    v: 'vitality',
    g: 'guard',
  };

  abstract readonly lineage: LineageId;

  abstract createLineage(): LineageDef;
  /** Классы линейки в порядке развития: базовый, второй, два финальных. */
  abstract createClasses(): ClassDef[];
  /** Перки всех классов линейки. */
  abstract createPerks(): PerkDef[];
  /** Таланты деревьев всех классов линейки. */
  abstract createTalents(): TalentDef[];

  /**
   * Полные определения классов линейки — из тех же продуктов фабрики: база линейки плюс бонусы
   * класса, его способности и таланты, и куда из него ведёт метаморфоза. Шаблонный метод:
   * конкретные фабрики его не переопределяют.
   */
  createClassDefinitions(): ClassDefinition[] {
    const lineage = this.createLineage();
    const classes = this.createClasses();
    const perks = this.createPerks();
    const talents = this.createTalents();
    return classes.map((c) => ({
      id: c.id,
      lineage,
      stage: c.stage,
      parent: c.parent,
      baseStats: HeroFactory.withMods(lineage.base, c.mods),
      abilities: perks.filter((p) => p.classId === c.id),
      talents: talents.filter((t) => t.classId === c.id),
      next: classes.filter((x) => x.parent === c.id).map((x) => x.id),
    }));
  }

  /** База линейки с аддитивными бонусами класса. */
  private static withMods(base: Stats, mods: Partial<Stats>): Stats {
    const out = { ...base };
    for (const k of Object.keys(out) as Array<keyof Stats>) out[k] = base[k] + (mods[k] ?? 0);
    return out;
  }

  protected lineageDef(o: Omit<LineageDef, 'id'>): LineageDef {
    return { id: this.lineage, ...o };
  }

  protected classDef(
    id: ClassId,
    stage: 0 | 1 | 2,
    parent: ClassId | null,
    mods: Partial<Stats> = {},
  ): ClassDef {
    return { id, lineage: this.lineage, stage, parent, mods };
  }

  protected perk<A extends AbilityId>(
    classId: ClassId,
    slot: PerkSlot,
    o: PerkSpecOf<A>,
  ): PerkDefOf<A> {
    return {
      id: `${classId}_${slot}`,
      classId,
      slot,
      ability: o.ability,
      params: (o.params ?? {}) as AbilityParams[A],
      icon: `perk_${classId}_${slot}`,
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
