import type { BranchedClassDef, ClassDef } from './interfaces/ClassDef';

/** Класс профессионального развития — с ветками вместо ярусов. */
export const isBranched = (c: ClassDef): c is BranchedClassDef => 'branches' in c;
