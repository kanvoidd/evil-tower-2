import { LINEAGES } from '../../domain/data/heroes';
import { PERK_BY_ID, type PerkDef } from '../../domain/data/perks';
import type { TalentDef } from '../../domain/data/talents';
import type { Profile } from '../../domain/logic/profile';
import {
  type BuyResult,
  canBuy,
  canCancelMetamorphosis,
  costOf,
  isMaxed,
  maxRankOf,
  type NodeState,
  nodeState,
  perkIdOfNode,
  rankOf,
  talentOfNode,
  talentPointsSpent,
  type Tree,
  type TreeNode,
  TREES,
} from '../../domain/logic/skillTree';
import type { ClassId, LineageSave, ResourceKind } from '../../domain/types';

/**
 * Дерево навыков активного героя для показа: состояние и ранг каждого узла, цена, можно ли купить
 * или отменить метаморфозу. Только чтение — покупки идут через операции `BuySkill`, `Metamorphose`,
 * `CancelMetamorphosis`.
 */
export class SkillTreeQuery {
  constructor(private readonly profile: Profile) {}

  get tree(): Tree {
    return TREES[this.profile.activeLineage];
  }

  get activeClass(): ClassId {
    return this.profile.activeClass;
  }

  /** Ресурс линейки — для цены способностей. */
  get resource(): ResourceKind {
    return LINEAGES[this.profile.activeLineage].resource;
  }

  get souls(): number {
    return this.profile.souls;
  }

  /** Первое улучшение уже куплено (обучение дерева пройдено). */
  get tutorialDone(): boolean {
    return this.profile.tutorial.skill;
  }

  get autoSkillOn(): boolean {
    return this.profile.autoSkillCfg().on;
  }

  /** Сколько очков вложено в таланты. */
  get spentPoints(): number {
    return talentPointsSpent(this.tree, this.save);
  }

  /** Последний купленный узел (или базовый класс) — с него дерево открывается. */
  get lastNode(): TreeNode {
    const tree = this.tree;
    return tree.byId.get(this.save.last) ?? tree.classNode[tree.base];
  }

  state(n: TreeNode): NodeState {
    return nodeState(this.tree, this.save, n);
  }

  rank(n: TreeNode): number {
    return rankOf(this.save, n.id);
  }

  maxRank(n: TreeNode): number {
    return maxRankOf(n);
  }

  maxed(n: TreeNode): boolean {
    return isMaxed(this.save, n);
  }

  /** Цена следующего ранга таланта, способности или метаморфозы. */
  cost(n: TreeNode): number {
    return costOf(this.save, n);
  }

  /** Можно ли купить узел прямо сейчас: открыт ли он и хватает ли душ. */
  check(n: TreeNode): BuyResult {
    return canBuy(this.tree, this.save, n, this.profile.souls);
  }

  /** Узел — финальный класс героя, и от него можно отказаться. */
  canCancel(n: TreeNode): boolean {
    return n.kind === 'class' && canCancelMetamorphosis(this.tree, this.save, n.classId!);
  }

  talent(n: TreeNode): TalentDef {
    return talentOfNode(n);
  }

  perk(n: TreeNode): PerkDef | undefined {
    return PERK_BY_ID[perkIdOfNode(n)];
  }

  /** Обучение: самый дешёвый узел, который можно купить прямо сейчас (null — обучение пройдено или купить нечего). */
  tutorialTarget(): TreeNode | null {
    if (this.tutorialDone) return null;
    let best: TreeNode | null = null;
    for (const n of this.tree.nodes) {
      const st = this.state(n);
      if (st !== 'available' && st !== 'partial') continue;
      if (this.check(n).ok && (!best || this.cost(n) < this.cost(best))) best = n;
    }
    return best;
  }

  private get save(): LineageSave {
    return this.profile.activeLineageSave;
  }
}
