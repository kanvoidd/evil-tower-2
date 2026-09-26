import { Ratio, Turns } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';

// Способности, которые открывает «Элементалист». Где они стоят — ветки в classes/elementalist.ts.

// ---- огонь

/** «Поджог»: тики горения копятся на цели. */
export const ignite = defineAbility({
  id: 'ignite',
  behavior: 'strike',
  levels: [
    { dmg: Ratio.of(0), burn: Ratio.of(0.5), ticks: Turns.of(2) },
    { dmg: Ratio.of(0), burn: Ratio.of(0.5), ticks: Turns.of(3) },
  ],
  cost: 2,
  target: 'enemy',
  cooldown: 1,
});

/** «Детонация»: все горящие враги взрываются разом. */
export const detonate = defineAbility({
  id: 'detonate',
  behavior: 'detonate',
  params: { blastMul: Ratio.of(1), splashMul: Ratio.of(0.5) },
  cost: 5,
  target: 'self',
  cooldown: 4,
});

// ---- лёд

/** «Ледяной шип»: урон и ослабление врага, на втором уровне — и его брони. */
export const frostSpike = defineAbility({
  id: 'frost_spike',
  behavior: 'strike',
  levels: [
    { dmg: Ratio.of(1.2), weaken: Ratio.of(0.3), debuffTurns: Turns.of(2) },
    {
      dmg: Ratio.of(1.2),
      weaken: Ratio.of(0.3),
      armorBreak: Ratio.of(0.5),
      debuffTurns: Turns.of(2),
    },
  ],
  cost: 3,
  target: 'enemy',
  cooldown: 1,
});

/** «Ледяной доспех»: защита, щит и ответный удар по каждому, кто бьёт героя. */
export const iceArmor = defineAbility({
  id: 'ice_armor',
  behavior: 'ward',
  params: { shield: Ratio.of(0.3), defense: 3, thorns: Ratio.of(0.6), turns: Turns.of(3) },
  cost: 5,
  target: 'self',
  cooldown: 5,
});

// ---- молния

/** «Молния»: на втором уровне бьёт сильнее при высоком запасе маны. */
export const lightning = defineAbility({
  id: 'lightning',
  behavior: 'strike',
  levels: [
    { dmg: Ratio.of(2.5) },
    { dmg: Ratio.of(2.5), manaAbove: Ratio.of(0.7), manaBonus: Ratio.of(0.5) },
  ],
  cost: 3,
  target: 'adjacent',
});

/** «Цепная молния»: число целей растёт с уровнем. */
export const chainLightning = defineAbility({
  id: 'chain_lightning',
  behavior: 'chain_lightning',
  levels: [
    { falloff: [Ratio.of(1), Ratio.of(0.75)] },
    { falloff: [Ratio.of(1), Ratio.of(0.75), Ratio.of(0.5)] },
    { falloff: [Ratio.of(1), Ratio.of(0.75), Ratio.of(0.5), Ratio.of(0.35)] },
  ],
  cost: 5,
  target: 'enemy',
  cooldown: 2,
});
