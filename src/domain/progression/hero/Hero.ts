import type { ClassId, EquipmentSave, LineageId } from '../../catalog';
import type { PlayerStats } from '../../combat';
import { Souls } from '../../shared';
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
} from '../skill-tree';
import type { LineageSave } from '../skill-tree/interfaces/LineageSave';
import { buildPlayerStats } from '../stats/stats';
import { HeroClassState } from './hero-class-state/HeroClassState';

/**
 * Герой — линейка, которую ведёт игрок: прогресс дерева талантов и класс, за который он играет.
 * Метаморфоза меняет класс, но не героя: тот же экземпляр, те же таланты и способности —
 * маг → элементалист → магистр, воин → рыцарь → паладин или берсерк.
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
  canLearn(node: TreeNode, souls: Souls): BuyResult {
    if (node.kind === 'class') return { ok: false, reason: 'state' };
    return canBuy(this.tree, this.progress, node, souls);
  }

  /** Выучить талант (следующий ранг) или способность. Классы — только через метаморфозу. */
  learn(node: TreeNode): void {
    if (!this.canLearn(node, Souls.of(Infinity)).ok)
      throw new Error(`узел ${node.id} сейчас не выучить`);
    applyBuy(this.tree, this.progress, node);
    this.onChange();
  }

  /** Можно ли стать классом `to` прямо сейчас: следующая ступень, ворота яруса пройдены, хватает душ. */
  canMetamorphose(to: ClassId, souls: Souls): BuyResult {
    if (!this.classState.canBecome(to)) return { ok: false, reason: 'state' };
    return canBuy(this.tree, this.progress, this.tree.classNode[to], souls);
  }

  /** Метаморфоза: тот же герой становится классом `to`. Ничего не отнимает — способности и таланты остаются. */
  metamorphose(to: ClassId): void {
    if (!this.canMetamorphose(to, Souls.of(Infinity)).ok)
      throw new Error(`метаморфоза ${this.classId} → ${to} недоступна`);
    applyBuy(this.tree, this.progress, this.tree.classNode[to]);
    this.onChange();
  }

  /** Отменить можно метаморфозу в класс, выбранный из нескольких, пока герой не ушёл дальше. */
  get canCancelMetamorphosis(): boolean {
    return canCancelMetamorphosis(this.tree, this.progress, this.classId);
  }

  /** Ветка класса сбрасывается, часть душ возвращается; герой снова — класс-родитель. */
  cancelMetamorphosis(): { refund: Souls; to: ClassId } {
    const from = this.classState;
    if (!this.canCancelMetamorphosis || !from.parents.length)
      throw new Error(`метаморфозу ${from.id} не отменить`);
    const { refund } = applyCancelMetamorphosis(this.tree, this.progress, from.id);
    this.onChange();
    return { refund, to: this.classId };
  }

  /** Характеристики для боя: класс, таланты всей линейки и снаряжение. */
  combatStats(weapon: EquipmentSave | null, armor: EquipmentSave | null): PlayerStats {
    return buildPlayerStats({ classId: this.classId, lineage: this.progress, weapon, armor });
  }
}
