import type { RoomModifier } from './interfaces/RoomModifier';

export const MODIFIERS: RoomModifier[] = [
  { id: 'plain', weight: 30 },
  { id: 'hoard', weight: 16, goldMul: 1.6, addChests: 1 },
  { id: 'swarm', weight: 14, noBoss: true, addEnemies: 3, hpMul: 0.75 },
  { id: 'elite', weight: 12, minFloor: 2, elites: 1 },
  { id: 'cursed', weight: 12, minFloor: 2, atkMul: 1.25, soulMul: 1.6 },
  { id: 'brittle', weight: 10, hpMul: 0.75, goldMul: 0.8 },
  { id: 'blessed', weight: 10, shieldPct: 0.25, addHeal: 1 },
  { id: 'champion', weight: 14, bossOnly: true, hpMul: 1.2, goldMul: 2, soulMul: 1.35 },
];

export const MODIFIER_BY_ID: Record<string, RoomModifier> = Object.fromEntries(MODIFIERS.map((m) => [m.id, m]));
