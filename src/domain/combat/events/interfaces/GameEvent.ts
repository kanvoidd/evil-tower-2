import type { AbilityId } from '../../../catalog';
import type { ConsumableId, StatusKind } from '../../../types';
import type { Card } from '../../card/Card';
import type { FxStyle } from './FxStyle';
import type { Loot } from './Loot';

/**
 * Событие боя. Логика не рисует ничего сама: она складывает события в журнал движка,
 * а сцена проигрывает их по порядку.
 */
export type GameEvent =
  | { type: 'spawn'; cell: number; card: Card }
  /** style: 'shot' — выстрел, 'backstab' — телепорт за спину, 'bolt' — молния мага. */
  | {
      type: 'attack';
      from: number;
      to: number;
      ranged: boolean;
      by: 'player' | 'enemy';
      style?: 'shot' | 'backstab' | 'bolt';
    }
  | {
      type: 'hit';
      cell: number;
      amount: number;
      crit: boolean;
      target: 'player' | 'enemy';
      hp: number;
      absorbed?: boolean;
    }
  | { type: 'miss'; cell: number; kind: 'dodge' | 'parry' | 'evade' | 'block' | 'stun' | 'smoke' }
  | { type: 'kill'; cell: number; uid: number }
  | { type: 'move'; from: number; to: number }
  | { type: 'slide'; uid: number; from: number; to: number }
  | { type: 'swap'; a: number; b: number }
  | { type: 'gold'; cell: number; amount: number }
  | { type: 'souls'; cell: number; amount: number }
  | { type: 'spend'; amount: number }
  | { type: 'heal'; amount: number; hp: number; source: 'potion' | 'perk' | 'lifesteal' | 'revive' }
  | { type: 'resource'; now: number; max: number }
  | { type: 'shield'; now: number }
  | { type: 'chest'; cell: number; loot: Loot[]; empty?: boolean }
  | { type: 'pickup'; cell: number; item: ConsumableId; count: number }
  | { type: 'break'; slot: 'weapon' | 'armor'; id: string }
  | { type: 'status'; cell: number; uid: number; kind: StatusKind; turns: number }
  | { type: 'fx'; cells: number[]; style: FxStyle; from?: number }
  /** Карта ушла с поля не боем и не подбором под ноги — вид нужно убрать. */
  | { type: 'remove'; cell: number; uid: number }
  /** Героя зажали со всех сторон и ему нечем ответить: карты рвут его по очереди. */
  | { type: 'swarm'; cells: number[] }
  /** Способность применена (для всплывающей подписи и звука). */
  | { type: 'perk'; id: string; ability: AbilityId }
  /** Способность «заряжена» или снята с зарядки (null). */
  | { type: 'armed'; id: string | null }
  | { type: 'rewind' }
  | { type: 'artifact'; cells: number[] }
  | { type: 'boost'; turns: number }
  | { type: 'win' }
  | { type: 'lose' };
