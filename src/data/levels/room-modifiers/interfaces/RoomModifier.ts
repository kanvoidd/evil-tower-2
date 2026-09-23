/**
 * Случайное свойство комнаты — выпадает при каждом заходе и показывается в шапке боя.
 * Это второй рогаликовый слой: состав врагов уже случайный, а модификатор задаёт «характер» захода.
 */
export interface RoomModifier {
  id: string;
  weight: number;
  /** Только в комнатах с боссом / только без босса. */
  bossOnly?: boolean;
  noBoss?: boolean;
  minFloor?: number;
  hpMul?: number;
  atkMul?: number;
  goldMul?: number;
  soulMul?: number;
  addEnemies?: number;
  addChests?: number;
  addHeal?: number;
  /** Щит герою в начале комнаты, доля максимального здоровья. */
  shieldPct?: number;
  /** Сколько врагов получат «элитную» надбавку. */
  elites?: number;
}
