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
  /** style: 'shot' — выстрел, 'backstab' — телепорт за спину, 'bolt' — разряд. */
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
  /** Номинал карты на поле изменился (кабаны смяли кучку золота). */
  | { type: 'value'; cell: CellIndex; uid: number; value: number }
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
  /**
   * Способность «заряжена» или снята с зарядки (null). У «Взведённой ловушки» — выбранная для неё
   * способность `skill` и задержка `delay` в ходах.
   */
  | { type: 'armed'; ability: AbilityId | null; skill?: AbilityId; delay?: number }
  /**
   * Вспышка способности на клетках: стиль по id способности выбирает показ. Её вставляет бой, если
   * механика ничего не нарисовала сама, или сама механика, если знает, какие клетки задела.
   */
  | { type: 'cast'; ability: AbilityId; cells: CellIndex[] }
  /**
   * Ловушка поставлена (`on`) или сработала и снята. `ability` — чем она сработает («Капкан» или
   * способность «Взведённой ловушки»), `turns` — через сколько ходов (0 — когда на клетку попадёт враг).
   */
  | { type: 'trap'; cell: CellIndex; ability: AbilityId; turns: number; on: boolean }
  | { type: 'artifact'; cells: CellIndex[] }
  | { type: 'boost'; turns: number }
  | { type: 'win' }
  | { type: 'lose' };
