import type { SfxName } from '../../../../application/ports';
import type { TKey } from '../../../../i18n';
import { HEX } from '../../../theme';
import type { EventOf } from '../interfaces/EventHandler';

/** Как показывается промах: подпись, её цвет и размер, звук. */
export const MISS_STYLE: Record<
  EventOf<'miss'>['kind'],
  { key: TKey; color: string; size: number; sfx?: SfxName }
> = {
  dodge: { key: 'game.dodge', color: '#7fe8d0', size: 32, sfx: 'dodge' },
  parry: { key: 'game.parry', color: '#9ec5ff', size: 32, sfx: 'parry' },
  block: { key: 'game.block', color: '#7fc4ff', size: 30, sfx: 'parry' },
  evade: { key: 'game.evade', color: HEX.textDim, size: 28, sfx: 'dodge' },
  stun: { key: 'game.stunned', color: '#ffd86b', size: 26 },
  smoke: { key: 'game.smoke', color: HEX.textDim, size: 26 },
};
