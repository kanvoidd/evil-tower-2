import type { Profile } from '../../domain/account/profile';
import { ROOMS, ROOMS_PER_FLOOR } from '../../domain/catalog/levels';
import { anyAffordable, TREES } from '../../domain/progression/skill-tree/skillTree';
import type { ShopCatalog } from '../shop/ShopCatalog';
import type { HubHint } from './interfaces/HubHint';
import type { HubState } from './interfaces/HubState';

/** Что показать в хабе: рекорд, значки «есть что купить», подарки и подсказку обучения. */
export class GetHubState {
  /** Столько душ нужно, чтобы обучение позвало в дерево навыков. */
  private static readonly SKILL_HINT_SOULS = 10;

  constructor(
    private readonly profile: Profile,
    private readonly shop: ShopCatalog,
  ) {}

  execute(): HubState {
    const p = this.profile;
    const cleared = p.best;
    // рекорд — самая высокая комната, пройденная за один забег; забег всегда начинается с 1-1
    const room = ROOMS[Math.max(0, Math.min(cleared, ROOMS.length) - 1)];
    return {
      record: {
        cleared,
        total: ROOMS.length,
        floors: ROOMS.length / ROOMS_PER_FLOOR,
        roomId: room.id,
        floor: room.floor,
      },
      skillBadge: anyAffordable(TREES[p.activeLineage], p.activeLineageSave, p.souls),
      shopBadge: this.shop.hasAffordableUpgrade(),
      gift: { ready: p.giftReady(), remainingMs: p.giftRemainingMs() },
      daily: p.dailyStatus(),
      hint: this.hint(),
    };
  }

  /** После первого боя — в дерево навыков (когда хватает душ), после первого улучшения — в бой. */
  private hint(): HubHint | null {
    const tut = this.profile.tutorial;
    if (tut.fight && !tut.skill && this.profile.souls >= GetHubState.SKILL_HINT_SOULS)
      return 'skill';
    if (tut.fight && tut.skill && !tut.hub) return 'play';
    return null;
  }
}
