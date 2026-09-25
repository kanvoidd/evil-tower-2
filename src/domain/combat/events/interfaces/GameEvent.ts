import type { AbilityId, ConsumableId } from '../../../catalog';
import type { CellIndex } from '../../../shared';
import type { Card } from '../../card/Card';
import type { StatusKind } from '../../card/interfaces/StatusKind';
import type { FxStyle } from './FxStyle';
import type { Loot } from './Loot';

/**
 * Событие боя. Логика не рисует ничего сама: она складывает события в журнал движка,
 * а сцена проигрывает их по порядку.
 */
export type GameEvent =
  | { type: 'spawn'; cell: CellIndex; card: Card }
  /** style: 'shot' — выстрел, 'backstab' — телепорт за спину, 'bolt' — молния мага. */
  | {
      type: 'attack';
      from: CellIndex;
      to: CellIndex;
      ranged: boolean;
      by: 'player' | 'enemy';
      style?: 'shot' | 'backstab' | 'bolt';
    }
  | {
      type: 'hit';
      cell: CellIndex;
      amount: number;
      crit: boolean;
      target: 'player' | 'enemy';
      hp: number;
      absorbed?: boolean;
    }
  | {
      type: 'miss';
      cell: CellIndex;
      kind: 'dodge' | 'parry' | 'evade' | 'block' | 'stun' | 'smoke';
    }
  | { type: 'kill'; cell: CellIndex; uid: number }
  | { type: 'move'; from: CellIndex; to: CellIndex }
  | { type: 'slide'; uid: number; from: CellIndex; to: CellIndex }
  | { type: 'swap'; a: CellIndex; b: CellIndex }
  | { type: 'gold'; cell: CellIndex; amount: number }
  | { type: 'souls'; cell: CellIndex; amount: number }
  | { type: 'spend'; amount: number }
  | { type: 'heal'; amount: number; hp: number; source: 'potion' | 'perk' | 'lifesteal' | 'revive' }
  | { type: 'resource'; now: number; max: number }
  | { type: 'shield'; now: number }
  | { type: 'chest'; cell: CellIndex; loot: Loot[]; empty?: boolean }
  | { type: 'pickup'; cell: CellIndex; item: ConsumableId; count: number }
  | { type: 'break'; slot: 'weapon' | 'armor'; id: string }
  | { type: 'status'; cell: CellIndex; uid: number; kind: StatusKind; turns: number }
  | { type: 'fx'; cells: CellIndex[]; style: FxStyle; from?: CellIndex }
  /** Карта ушла с поля не боем и не подбором под ноги — вид нужно убрать. */
  | { type: 'remove'; cell: CellIndex; uid: number }
  /** Героя зажали со всех сторон и ему нечем ответить: карты рвут его по очереди. */
  | { type: 'swarm'; cells: CellIndex[] }
  /** Способность применена (для всплывающей подписи и звука). */
  | { type: 'perk'; ability: AbilityId }
  /** Способность «заряжена» или снята с зарядки (null). */
  | { type: 'armed'; ability: AbilityId | null }
  /** Способность ничего не нарисовала сама — её вспышка по умолчанию; стиль выбирает показ. */
  | { type: 'cast'; ability: AbilityId; cells: CellIndex[] }
  | { type: 'rewind' }
  | { type: 'artifact'; cells: CellIndex[] }
  | { type: 'boost'; turns: number }
  | { type: 'win' }
  | { type: 'lose' };
