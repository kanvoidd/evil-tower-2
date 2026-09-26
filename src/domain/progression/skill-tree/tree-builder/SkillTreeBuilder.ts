import type { LineageId } from '../../../catalog';
import type { Tree } from '../interfaces/Tree';
import { BranchedTreeBuilder, isBranchedLineage } from './branched/BranchedTreeBuilder';
import { TieredTreeBuilder } from './tiered/TieredTreeBuilder';

/** Дерево прокачки линейки: с ветками (маг, охотник) или с ярусами (воин, наёмник). */
export class SkillTreeBuilder {
  static build(lineage: LineageId): Tree {
    return isBranchedLineage(lineage)
      ? BranchedTreeBuilder.build(lineage)
      : TieredTreeBuilder.build(lineage);
  }
}
