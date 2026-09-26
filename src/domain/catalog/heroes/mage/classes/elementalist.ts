import type { BranchedClassDef } from '../../../classes/interfaces/ClassDef';
import {
  chainLightning,
  detonate,
  frostSpike,
  iceArmor,
  ignite,
  lightning,
} from '../abilities/elementalist';
import { frostbite, ignition, overcharge } from '../talents/elementalist';

/** «Элементалист» — подкласс мага: одна стихия на выбор — огонь, лёд или молния. */
export const elementalist: BranchedClassDef = {
  id: 'elementalist',
  lineage: 'mage',
  stage: 1,
  parents: ['mage'],
  bonuses: { damage: 2 },
  branches: [
    // огонь: копить горение → порог → взрыв → детонация
    { id: 'fire', steps: [{ perk: ignite }, { talent: ignition }, { perk: detonate }] },
    // лёд: ослабить → заморозить → защититься
    { id: 'ice', steps: [{ perk: frostSpike }, { talent: frostbite }, { perk: iceArmor }] },
    // молния: держать ману высокой → бить сильнее → цепь
    {
      id: 'lightning',
      steps: [{ perk: lightning }, { talent: overcharge }, { perk: chainLightning }],
    },
  ],
  branchChoice: 'one',
};
