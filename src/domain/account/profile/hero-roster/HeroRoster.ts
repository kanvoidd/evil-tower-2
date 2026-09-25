import { CLASSES, type ClassId, type LineageId } from '../../../catalog';
import type { PlayerStats } from '../../../combat';
import {
  Hero,
  type LineageSave,
  newLineageSave,
  ProgressionBalance,
  TREES,
} from '../../../progression';
import { ProfilePart } from '../profile-part/ProfilePart';

/** Герои аккаунта: открытые линейки, их прогресс и класс, активный герой и его характеристики. */
export class HeroRoster extends ProfilePart {
  /** Герои открытых линеек — по экземпляру на линейку. */
  private readonly heroes = new Map<LineageId, Hero>();

  /** Документ подменили — прежние герои держат старый прогресс. */
  forget(): void {
    this.heroes.clear();
  }

  /**
   * Герой линейки: прогресс дерева и класс. Один экземпляр на открытую линейку — метаморфоза
   * меняет его класс, но не его самого. У закрытой линейки герой собирается на пустом прогрессе.
   */
  hero(lin: LineageId): Hero {
    const save = this.doc.lineages[lin];
    if (!save) return new Hero(lin, newLineageSave(TREES[lin]));
    let h = this.heroes.get(lin);
    if (!h || h.save !== save) {
      h = new Hero(lin, save, () => this.state.touch());
      this.heroes.set(lin, h);
    }
    return h;
  }

  /** Герой, которым сейчас играет игрок. */
  get activeHero(): Hero {
    return this.hero(this.activeLineage);
  }

  get isFirstRun(): boolean {
    return this.doc.activeClass === null;
  }

  /**
   * Класс, за который играет активный герой. Выводится из прогресса дерева (метаморфоза заменяет
   * класс), а сохранённый `activeClass` лишь выбирает, какой герой — какая линейка — сейчас в игре.
   */
  get activeClass(): ClassId {
    return this.activeHero.classId;
  }

  get activeLineage(): LineageId {
    return CLASSES[this.doc.activeClass ?? 'warrior'].lineage;
  }

  lineageSave(l: LineageId): LineageSave | null {
    return this.doc.lineages[l] ?? null;
  }

  get activeLineageSave(): LineageSave {
    return this.lineageSave(this.activeLineage) ?? this.unlockLineage(this.activeLineage);
  }

  isLineageUnlocked(l: LineageId): boolean {
    return !!this.doc.lineages[l];
  }

  unlockLineage(l: LineageId): LineageSave {
    if (!this.doc.lineages[l]) this.doc.lineages[l] = newLineageSave(TREES[l]);
    this.state.touch();
    return this.doc.lineages[l]!;
  }

  buyLineage(l: LineageId): boolean {
    if (this.isLineageUnlocked(l)) return true;
    if (!this.parts.wallets.spendGold(ProgressionBalance.heroUnlockCost)) return false;
    this.unlockLineage(l);
    return true;
  }

  setActiveClass(c: ClassId): void {
    this.doc.activeClass = c;
    // у каждого героя свой кошелёк — полоска валют должна показать новый
    this.state.walletChanged.emit();
    this.state.touch();
  }

  /** Характеристики активного героя для боя: класс, таланты и снаряжение (сломанное не в счёт). */
  playerStats(): PlayerStats {
    return this.activeHero.combatStats(
      this.doc.weapon[this.activeLineage] ?? null,
      this.parts.wallets.heroSave.armor,
    );
  }
}
