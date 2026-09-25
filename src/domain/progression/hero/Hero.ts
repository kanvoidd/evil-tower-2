import type { ClassId, EquipmentSave, LineageId, LineageSave } from '../../types';
import {
  applyBuy,
  applyCancelMetamorphosis,
  type BuyResult,
  canBuy,
  canCancelMetamorphosis,
  currentClassOf,
  openedClasses,
  type Tree,
  type TreeNode,
  TREES,
} from '../skill-tree/skillTree';
import { buildPlayerStats, type PlayerStats } from '../stats/stats';
import { HeroClassState } from './hero-class-state/HeroClassState';

/**
 * Герой — линейка, которую ведёт игрок: прогресс дерева талантов и класс, за который он играет.
 * Метаморфоза меняет класс, но не героя: тот же экземпляр, те же таланты и способности —
 * маг → магистр → некромант или пиромант.
 *
 * Класс — состояние героя (`HeroClassState`), и оно не хранится отдельно от прогресса: это самый
 * развитый открытый класс линейки, поэтому герой и его дерево не могут разойтись. Души за
 * метаморфозу и таланты списывает вызывающий — кошелёк героя ведёт профиль. О каждом изменении
 * прогресса герой сообщает владельцу (`onChange`), чтобы тот его сохранил.
 */
export class Hero {
  constructor(
    readonly lineage: LineageId,
    private readonly progress: LineageSave,
    private readonly onChange: () => void = () => undefined,
  ) {}

  get tree(): Tree {
    return TREES[this.lineage];
  }

  /** Прогресс дерева — документ сохранения линейки. */
  get save(): LineageSave {
    return this.progress;
  }

  /** Класс, за который играет герой. */
  get classState(): HeroClassState {
    return HeroClassState.of(currentClassOf(this.tree, this.progress));
  }

  get classId(): ClassId {
    return this.classState.id;
  }

  /** Открытые классы линейки по порядку развития. */
  get openedClasses(): ClassId[] {
    return openedClasses(this.tree, this.progress);
  }

  /** Можно ли выучить талант или способность (узел дерева, но не класс): узел открыт и хватает душ. */
  canLearn(node: TreeNode, souls: number): BuyResult {
    if (node.kind === 'class') return { ok: false, reason: 'state' };
    return canBuy(this.tree, this.progress, node, souls);
  }

  /** Выучить талант (следующий ранг) или способность. Классы — только через метаморфозу. */
  learn(node: TreeNode): void {
    if (!this.canLearn(node, Infinity).ok) throw new Error(`узел ${node.id} сейчас не выучить`);
    applyBuy(this.tree, this.progress, node);
    this.onChange();
  }

  /** Можно ли стать классом `to` прямо сейчас: следующая ступень, ворота яруса пройдены, хватает душ. */
  canMetamorphose(to: ClassId, souls: number): BuyResult {
    if (!this.classState.canBecome(to)) return { ok: false, reason: 'state' };
    return canBuy(this.tree, this.progress, this.tree.classNode[to], souls);
  }

  /** Метаморфоза: тот же герой становится классом `to`. Ничего не отнимает — способности и таланты остаются. */
  metamorphose(to: ClassId): void {
    if (!this.canMetamorphose(to, Infinity).ok)
      throw new Error(`метаморфоза ${this.classId} → ${to} недоступна`);
    applyBuy(this.tree, this.progress, this.tree.classNode[to]);
    this.onChange();
  }

  /** Отменить можно только метаморфозу в финальный класс. */
  get canCancelMetamorphosis(): boolean {
    return canCancelMetamorphosis(this.tree, this.progress, this.classId);
  }

  /** Ветка финального класса сбрасывается, часть душ возвращается; герой снова — класс-родитель. */
  cancelMetamorphosis(): { refund: number; to: ClassId } {
    const from = this.classState;
    if (!this.canCancelMetamorphosis || !from.parent)
      throw new Error(`метаморфозу ${from.id} не отменить`);
    const { refund } = applyCancelMetamorphosis(this.tree, this.progress, from.id);
    this.onChange();
    return { refund, to: from.parent };
  }

  /** Характеристики для боя: класс, таланты всей линейки и снаряжение. */
  combatStats(weapon: EquipmentSave | null, armor: EquipmentSave | null): PlayerStats {
    return buildPlayerStats({ classId: this.classId, lineage: this.progress, weapon, armor });
  }
}
