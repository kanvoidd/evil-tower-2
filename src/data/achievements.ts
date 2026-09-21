import type { SaveData } from '../types';

export interface AchievementDef {
  id: string;
  name: { ru: string; en: string };
  desc: { ru: string; en: string };
  target: number;
  /** Текущее значение прогресса из сохранения. */
  progress: (s: SaveData) => number;
}

const count = (key: keyof SaveData['stats']) => (s: SaveData): number => s.stats[key];
const floorCleared = (f: number) => (s: SaveData): number => (s.cleared.includes(`${f}-5`) ? 1 : 0);

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_blood', name: { ru: 'Первая кровь', en: 'First Blood' }, desc: { ru: 'Победите первого монстра', en: 'Defeat your first monster' }, target: 1, progress: count('kills') },
  { id: 'slayer', name: { ru: 'Истребитель', en: 'Slayer' }, desc: { ru: 'Победите 100 монстров', en: 'Defeat 100 monsters' }, target: 100, progress: count('kills') },
  { id: 'exterminator', name: { ru: 'Гроза башни', en: 'Terror of the Tower' }, desc: { ru: 'Победите 1000 монстров', en: 'Defeat 1000 monsters' }, target: 1000, progress: count('kills') },
  { id: 'rich', name: { ru: 'Кладоискатель', en: 'Treasure Hunter' }, desc: { ru: 'Соберите 1000 золота', en: 'Collect 1000 gold' }, target: 1000, progress: count('goldEarned') },
  { id: 'tycoon', name: { ru: 'Богач', en: 'Tycoon' }, desc: { ru: 'Соберите 50000 золота', en: 'Collect 50000 gold' }, target: 50000, progress: count('goldEarned') },
  { id: 'soul_collector', name: { ru: 'Собиратель душ', en: 'Soul Collector' }, desc: { ru: 'Соберите 1000 опыта душ', en: 'Collect 1000 soul XP' }, target: 1000, progress: count('soulsEarned') },
  { id: 'soul_hoarder', name: { ru: 'Хранитель душ', en: 'Soul Hoarder' }, desc: { ru: 'Соберите 100000 опыта душ', en: 'Collect 100000 soul XP' }, target: 100000, progress: count('soulsEarned') },
  { id: 'chest_finder', name: { ru: 'Любитель сундуков', en: 'Chest Lover' }, desc: { ru: 'Откройте 25 сундуков', en: 'Open 25 chests' }, target: 25, progress: count('chestsOpened') },
  { id: 'rooms_10', name: { ru: 'Восходитель', en: 'Climber' }, desc: { ru: 'Пройдите 10 комнат', en: 'Clear 10 rooms' }, target: 10, progress: count('roomsCleared') },
  { id: 'rooms_50', name: { ru: 'Старожил башни', en: 'Tower Regular' }, desc: { ru: 'Пройдите 50 комнат', en: 'Clear 50 rooms' }, target: 50, progress: count('roomsCleared') },
  { id: 'floor_1', name: { ru: 'Хозяин склепа', en: 'Lord of the Crypt' }, desc: { ru: 'Пройдите 1 этаж', en: 'Clear floor 1' }, target: 1, progress: floorCleared(1) },
  { id: 'floor_2', name: { ru: 'Покоритель катакомб', en: 'Catacomb Conqueror' }, desc: { ru: 'Пройдите 2 этаж', en: 'Clear floor 2' }, target: 1, progress: floorCleared(2) },
  { id: 'floor_3', name: { ru: 'Ныряльщик', en: 'Deep Diver' }, desc: { ru: 'Пройдите 3 этаж', en: 'Clear floor 3' }, target: 1, progress: floorCleared(3) },
  { id: 'floor_5', name: { ru: 'Садовник', en: 'Gardener' }, desc: { ru: 'Пройдите 5 этаж', en: 'Clear floor 5' }, target: 1, progress: floorCleared(5) },
  { id: 'floor_7', name: { ru: 'Ледоруб', en: 'Ice Breaker' }, desc: { ru: 'Пройдите 7 этаж', en: 'Clear floor 7' }, target: 1, progress: floorCleared(7) },
  { id: 'floor_10', name: { ru: 'Владыка башни', en: 'Master of the Tower' }, desc: { ru: 'Пройдите 10 этаж', en: 'Clear floor 10' }, target: 1, progress: floorCleared(10) },
  { id: 'flawless', name: { ru: 'Без единой царапины', en: 'Flawless' }, desc: { ru: 'Пройдите комнату, не получив урона', en: 'Clear a room without taking damage' }, target: 1, progress: count('flawless') },
  { id: 'metamorphosis', name: { ru: 'Метаморфоза', en: 'Metamorphosis' }, desc: { ru: 'Станьте новым классом', en: 'Evolve into a new class' }, target: 1, progress: count('metamorphoses') },
  { id: 'unbreakable', name: { ru: 'Расточитель', en: 'Spendthrift' }, desc: { ru: 'Сломайте 3 предмета', en: 'Break 3 items' }, target: 3, progress: count('itemsBroken') },
];
