import type { PerkDef } from '../domain/catalog/perks';
import type { TalentDef, TalentFx } from '../domain/catalog/talents';
import { talentValue, talentValue2 } from '../domain/catalog/talents';
import type { Trait } from '../domain/progression/traits/traits';
import type { Lang } from '../domain/types';
import { en } from './en';
import { ru, type TKey } from './ru';

let lang: Lang = 'ru';

export const setLang = (l: Lang): void => {
  lang = l;
  document.documentElement.lang = l;
};

export const getLang = (): Lang => lang;

export const t = (key: TKey, params?: Record<string, string | number>): string => {
  const s = (lang === 'ru' ? ru : en)[key] ?? ru[key] ?? key;
  return params ? s.replace(/\{(\w+)\}/g, (_m, k: string) => String(params[k] ?? '')) : s;
};

export const tr = (o: { ru: string; en: string }): string => o[lang];

export const perkName = (p: PerkDef): string => tr(p.name);
export const perkDesc = (p: PerkDef): string => tr(p.desc);

export const talentName = (t2: TalentDef): string => tr(t2.name);

/** Строка эффекта таланта на конкретном ранге («+18% к урону»). Пара «шанс / сила» — через `v2`. */
export const talentEffect = (fx: TalentFx, v: number, v2 = 0): string =>
  t(`tal.${fx}` as TKey, { v, v2 });

/**
 * Описание таланта в панели: что даёт сейчас и что даст следующий ранг.
 * rank = 0 — талант ещё не изучен, показываем первый ранг.
 */
export const talentDesc = (def: TalentDef, rank: number): string => {
  const lines: string[] = [];
  if (rank > 0)
    lines.push(
      `${t('skill.now')}: ${talentEffect(def.fx, talentValue(def, rank), talentValue2(def, rank))}`,
    );
  if (rank < def.v.length) {
    const label = rank > 0 ? t('skill.next') : t('skill.rank_one');
    lines.push(`${label}: ${talentEffect(def.fx, def.v[rank], def.v2?.[rank] ?? 0)}`);
  }
  return lines.join('\n');
};

/** Строка краткой сводки класса. */
export const describeTrait = (trait: Trait): string => {
  if (trait.id === 'mech') return t(`trait.mech.${trait.lineage}` as TKey);
  if (trait.id === 'ability') return t('trait.ability', { name: trait.name ? tr(trait.name) : '' });
  return t(`trait.${trait.id}` as TKey, { n: trait.n ?? 0 });
};

export const fmt = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(Math.floor(n));
};

export const fmtTime = (ms: number): string => {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

export type { TKey };
