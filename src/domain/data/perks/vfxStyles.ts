/**
 * Визуальный почерк способности. Рисуется в `src/presentation/animations/effects/vfx/Vfx.ts`: у каждой семьи эффектов
 * свой цвет, форма и звук, поэтому по вспышке сразу понятно, что именно сработало.
 */
export const VFX_STYLES = [
  'bolt', 'chain', 'arcane', 'beam',
  // огонь пироманта: тлеющее клеймо, летящий шар, цепная детонация, огненная буря
  'fire', 'explosion', 'ignite', 'fireball', 'detonate', 'inferno',
  'holy', 'banner',
  // некромантия: взрыв плоти, призрачные слуги, нити вуду, жатва душ
  'dark', 'soul', 'mark', 'corpse', 'ghost', 'voodoo', 'harvest',
  'quake', 'slam', 'blades',
  'shot', 'arrows',
  'smoke', 'swap', 'rewind',
] as const;
