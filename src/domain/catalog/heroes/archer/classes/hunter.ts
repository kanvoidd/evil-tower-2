import type { BranchedClassDef } from '../../../classes/interfaces/ClassDef';

/**
 * «Охотник» — базовый класс. Своих перков нет: сразу бесплатный выбор подкласса, а общие
 * характеристики растут в дереве «Основа» (talents/base.ts).
 */
export const hunter: BranchedClassDef = {
  id: 'hunter',
  lineage: 'archer',
  stage: 0,
  parents: [],
  bonuses: {},
  branches: [],
  branchChoice: 'all',
};
