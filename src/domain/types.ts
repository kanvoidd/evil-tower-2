export type Lang = 'ru' | 'en';

export type LineageId = 'warrior' | 'mage' | 'archer' | 'mercenary';

export type ClassId =
  | 'warrior'
  | 'knight'
  | 'berserk'
  | 'paladin'
  | 'mage'
  | 'magister'
  | 'necromancer'
  | 'pyromancer'
  | 'archer'
  | 'hawkeye'
  | 'arrowgod'
  | 'sniper'
  | 'mercenary'
  | 'assassin'
  | 'darkassassin'
  | 'ninja';

export type ResourceKind = 'stamina' | 'mana' | 'concentration' | 'vigilance';

/** Характеристики, которые прокачиваются в дереве талантов и меняются перками/предметами. */
export type StatKey = 'damage' | 'crit' | 'health' | 'dodge' | 'defense' | 'parry' | 'luck';

export type Stats = Record<StatKey, number>;

/** Три пути дерева талантов: У — урон и способности, З — здоровье и запас, Щ — защита и ослабление врагов. */
export type TalentPath = 'attack' | 'vitality' | 'guard';

export type CardKind =
  'enemy' | 'gold' | 'chest' | 'potion_heal' | 'potion_regen' | 'artifact' | 'exit' | 'ghost';

/** Кем является враг: от этого зависят «Святая кара», «Луч правосудия» и прочие перки против нежити. */
export type EnemyTag = 'undead' | 'demon' | 'beast' | 'construct' | 'humanoid';

/** Состояния на карточке врага. */
export type StatusKind =
  'stun' | 'burn' | 'mark' | 'link' | 'vuln' | 'poison' | 'weak' | 'corpse' | 'haunt';

export type ItemSlot = 'weapon' | 'armor';

export type ConsumableId = 'potion_heal' | 'potion_regen' | 'artifact';

export interface EquipmentSave {
  id: string;
  durability: number;
}

/** Автоприменение расходников: у каждого расходника на игровом поле свой переключатель. */
export interface AutoUseSave {
  heal: boolean;
  regen: boolean;
  artifact: boolean;
}

/**
 * Автопрокачка дерева: одна кнопка (вкл/выкл). Путь (path) не настраивается в окне —
 * он запоминается по последнему таланту, который игрок прокачал сам.
 */
export interface AutoSkillSave {
  on: boolean;
  path: TalentPath;
}

export interface AutoSave {
  use: AutoUseSave;
  skill: Partial<Record<LineageId, AutoSkillSave>>;
}

export interface HeroSave {
  gold: number;
  souls: number;
  consumables: Record<ConsumableId, number>;
  armor: EquipmentSave | null;
  /** Рекорд: сколько комнат пройдено за один забег. */
  best: number;
}

export interface SaveData {
  v: number;
  savedAt: number;
  createdAt: number;
  lang: Lang;
  volume: number;
  muted: boolean;
  /** null — игрок ещё не выбирал класс (первый запуск). */
  activeClass: ClassId | null;
  /** Открытые базовые линейки (для каждой хранится и то, что куплено в дереве). */
  lineages: Partial<Record<LineageId, LineageSave>>;
  weapon: Partial<Record<LineageId, EquipmentSave | null>>;
  /**
   * Всё, что у героя своё: кошелёк, расходники, доспех и рекорд забега. Новый класс
   * начинает с нулями — как будто играешь сначала.
   */
  heroes: Partial<Record<LineageId, HeroSave>>;
  stats: {
    kills: number;
    goldEarned: number;
    soulsEarned: number;
    roomsCleared: number;
    deaths: number;
    chestsOpened: number;
    metamorphoses: number;
    flawless: number;
    itemsBroken: number;
  };
  achievements: string[];
  daily: { lastClaim: string; streak: number };
  gift: { readyAt: number };
  tutorial: { fight: boolean; hub: boolean; skill: boolean; shop: boolean; perk: boolean };
  ads: { lastInterstitial: number; runsSinceAd: number };
  auto: AutoSave;
  reviewAsked: boolean;
}

export interface LineageSave {
  /**
   * Сколько рангов куплено у каждого узла дерева. У таланта — 0..maxRanks, у перка и класса — 0 или 1.
   * Ключ — строковый id узла (`warrior/a1`, `warrior/p2`, `cls/knight`).
   */
  ranks: Record<string, number>;
  /** Последний купленный узел — сюда переводит камеру при открытии дерева. */
  last: string;
}
