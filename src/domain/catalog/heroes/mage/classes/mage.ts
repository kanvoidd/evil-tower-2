import type { BranchedClassDef } from '../../../classes/interfaces/ClassDef';

/**
 * «Маг» — базовый класс. Своих перков нет: сразу бесплатный выбор подкласса, а общие
 * характеристики растут в дереве «Основа» (talents/base.ts).
 */
export const mage: BranchedClassDef = {
  id: 'mage',
  lineage: 'mage',
  stage: 0,
  parents: [],
  bonuses: {},
  branches: [],
  branchChoice: 'all',
};
