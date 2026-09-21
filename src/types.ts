export type Lang = 'ru' | 'en';

export type LineageId = 'warrior' | 'mage' | 'archer' | 'mercenary';

export type ClassId =
  | 'warrior' | 'knight' | 'berserk' | 'paladin'
  | 'mage' | 'magister' | 'necromancer' | 'pyromancer'
  | 'archer' | 'hawkeye' | 'arrowgod' | 'sniper'
  | 'mercenary' | 'assassin' | 'darkassassin' | 'ninja';

export type ResourceKind = 'stamina' | 'mana' | 'concentration' | 'vigilance';

/** Характеристики, которые прокачиваются в skill-tree и меняются перками/предметами. */
export type StatKey = 'damage' | 'crit' | 'health' | 'dodge' | 'defense' | 'parry' | 'luck';

export type Stats = Record<StatKey, number>;

export type ChainKind = 'damage' | 'health' | 'defense';

export type CardKind = 'enemy' | 'gold' | 'chest' | 'potion_heal' | 'potion_regen' | 'artifact';

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
 * Автопрокачка дерева: одна кнопка (вкл/выкл). Ветка (chain) и выбор на развилках (alt) не настраиваются в окне —
 * они запоминаются по последнему улучшению, которое игрок купил сам.
 */
export interface AutoSkillSave {
  on: boolean;
  chain: ChainKind;
  alt: boolean;
}

export interface AutoSave {
  use: AutoUseSave;
  skill: Partial<Record<LineageId, AutoSkillSave>>;
}

export interface SaveData {
  v: number;
  savedAt: number;
  createdAt: number;
  lang: Lang;
  volume: number;
  muted: boolean;
  gold: number;
  souls: number;
  /** null — игрок ещё не выбирал класс (первый запуск). */
  activeClass: ClassId | null;
  /** Открытые базовые линейки (для каждой хранится и то, что куплено в дереве). */
  lineages: Partial<Record<LineageId, LineageSave>>;
  weapon: Partial<Record<LineageId, EquipmentSave | null>>;
  armor: EquipmentSave | null;
  consumables: Record<ConsumableId, number>;
  /** Пройденные комнаты: id вида "1-3". */
  cleared: string[];
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
  tutorial: { fight: boolean; hub: boolean; skill: boolean; shop: boolean };
  ads: { lastInterstitial: number; runsSinceAd: number };
  auto: AutoSave;
  reviewAsked: boolean;
}

export interface LineageSave {
  /** Купленные узлы дерева (числовые id из drawio). */
  owned: number[];
  /** Последний купленный узел — сюда переводит камеру при открытии skill-tree. */
  last: number;
}
