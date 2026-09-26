import type { LegacySave } from '../interfaces/LegacySave';
import type { SaveMigration } from '../interfaces/SaveMigration';
import { TREE_VERSION } from '../treeVersions';

/**
 * Мастер зверей: «Сокол» и его талант переехали в начало ветки, «Стадо кабанов» с талантом — за
 * ними. Сохранение помнит ранг места, а не перка, поэтому ранги меняются местами вслед за ними.
 */
export class FalconFirst implements SaveMigration {
  /** Пары мест, которые поменялись содержимым. */
  private static readonly SWAPS: ReadonlyArray<readonly [string, string]> = [
    ['perk/beastmaster/beasts-1', 'perk/beastmaster/beasts-3'],
    ['tal/beastmaster/beasts-2', 'tal/beastmaster/beasts-4'],
  ];

  readonly id = 'falcon-first';

  applies(doc: LegacySave): boolean {
    return (doc.treeVersion ?? 1) < TREE_VERSION.falconFirst;
  }

  migrate(doc: LegacySave): void {
    const ls = doc.lineages?.archer;
    if (ls) {
      const ranks = { ...ls.ranks };
      for (const [a, b] of FalconFirst.SWAPS) {
        const ra = ranks[a];
        const rb = ranks[b];
        delete ranks[a];
        delete ranks[b];
        if (rb) ranks[a] = rb;
        if (ra) ranks[b] = ra;
      }
      const last = FalconFirst.SWAPS.flat().includes(ls.last) ? 'cls/beastmaster' : ls.last;
      doc.lineages = { ...doc.lineages, archer: { ranks, last } };
    }
    doc.treeVersion = TREE_VERSION.falconFirst;
  }
}
