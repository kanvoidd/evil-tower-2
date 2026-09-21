import type { Lang } from '../types';
import type { PerkDef, PerkEffect } from '../data/perks';
import type { Trait } from '../logic/traits';
import { ru, type TKey } from './ru';
import { en } from './en';

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

const sign = (n: number): string => (n > 0 ? `+${n}` : `${n}`);
const pct = (r: number): number => Math.round(r * 100);

export const describeEffect = (fx: PerkEffect): string => {
  switch (fx.type) {
    case 'stat':
      if (fx.stat === 'resMax') return t('fx.resMax', { v: fx.add });
      if (fx.stat === 'regen') return t('fx.regen', { v: fx.add });
      if (fx.stat === 'attackCost') return t('fx.attackCost', { v: sign(fx.add) });
      return t(`node.${fx.stat}` as TKey, { v: fx.add });
    case 'onKillHeal': return t('fx.onKillHeal', { v: fx.amount });
    case 'onKillResource': return t('fx.onKillResource', { v: fx.amount });
    case 'burst': return t('fx.burst', { cost: fx.cost, pct: pct(fx.mul) });
    case 'thorns': return t('fx.thorns', { pct: pct(fx.ratio) });
    case 'lifesteal': return t('fx.lifesteal', { pct: pct(fx.ratio) });
    case 'startShield': return t('fx.startShield', { v: fx.amount });
    case 'goldBonus': return t('fx.goldBonus', { pct: pct(fx.ratio) });
    case 'soulBonus': return t('fx.soulBonus', { pct: pct(fx.ratio) });
    case 'execute': return t('fx.execute', { pct: pct(fx.ratio) });
    case 'splash': return t('fx.splash', { pct: pct(fx.ratio) });
    case 'rangedCost': return t('fx.rangedCost', { v: sign(fx.add) });
    case 'rangedMul': return t('fx.rangedMul', { pct: pct(fx.ratio) });
    case 'critMul': return t('fx.critMul', { pct: pct(fx.add) });
    case 'artifactMul': return t('fx.artifactMul', { pct: pct(fx.ratio) });
  }
};

/** Строка краткой сводки класса («Может использовать артефакты», «Повышенный шанс крита: 16%»…). */
export const describeTrait = (tr: Trait): string =>
  tr.id === 'mech' ? t(`trait.mech.${tr.lineage}` as TKey) : t(`trait.${tr.id}` as TKey, { n: tr.n ?? 0, m: tr.m ?? 0 });

export const perkName = (p: PerkDef): string => tr(p.name);

export const perkDesc = (p: PerkDef): string =>
  p.desc ? tr(p.desc) : p.effects.map(describeEffect).join('\n');

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
