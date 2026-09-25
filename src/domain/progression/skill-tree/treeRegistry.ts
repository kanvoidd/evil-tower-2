import { LINEAGE_ORDER, type LineageId } from '../../catalog';
import type { Tree } from './interfaces/Tree';
import { SkillTreeBuilder } from './tree-builder/SkillTreeBuilder';

/** Деревья прокачки всех линеек — строятся один раз из каталога. */
export const TREES = Object.fromEntries(
  LINEAGE_ORDER.map((l) => [l, SkillTreeBuilder.build(l)]),
) as Record<LineageId, Tree>;
