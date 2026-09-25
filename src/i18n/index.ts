import {
  ABILITY_BY_ID,
  type AbilityDef,
  type EnemyDef,
  type ItemDef,
  type TalentDef,
  type TalentFx,
  talentValue,
  talentValue2,
} from '../domain/catalog';
import type { Trait } from '../domain/progression';
import type { AchievementDef } from '../domain/rewards';
import type { Lang } from '../domain/shared';
import { abilityValues } from './abilityValues';
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

// Тексты контента — в словарях по id сущности; числа описаний — плейсхолдерами.
export const abilityName = (a: AbilityDef): string => t(`ability.${a.id}.name` as TKey);
export const abilityDesc = (a: AbilityDef): string =>
  t(`ability.${a.id}.desc` as TKey, abilityValues(a));
export const talentName = (td: TalentDef): string => t(`talent.${td.id}.name` as TKey);
export const enemyName = (e: EnemyDef): string => t(`enemy.${e.id}.name` as TKey);
export const itemName = (it: ItemDef): string => t(`item.${it.id}.name` as TKey);
export const achievementName = (a: AchievementDef): string => t(`ach.${a.id}.name` as TKey);
export const achievementDesc = (a: AchievementDef): string =>
  t(`ach.${a.id}.desc` as TKey, { target: a.target, floor: a.floor ?? '' });

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
  if (trait.id === 'ability')
    return t('trait.ability', {
      name: trait.abilityId ? abilityName(ABILITY_BY_ID[trait.abilityId]) : '',
    });
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
