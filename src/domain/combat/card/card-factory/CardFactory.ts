import type { EnemyDef } from '../../../catalog';
import type { IDeckSupply } from '../../engine/interfaces/IDeckSupply';
import { Card } from '../Card';
import type { CardInit } from '../interfaces/CardInit';
import type { DeckPlan } from './interfaces/DeckPlan';

/**
 * Абстрактная фабрика карт (паттерн Abstract Factory).
 *
 * Семейство продуктов — все карты одного захода в комнату: враги, добыча, слуги и выход.
 * Они обязаны сходиться друг с другом: сила врагов и номинал золота считаются по одному
 * модификатору комнаты, а у всех карт захода сквозная нумерация `uid`, по которой сцена
 * узнаёт карточку. Поэтому всё семейство выпускает одна конкретная фабрика
 * (`RoomCardFactory` — обычная комната башни).
 *
 * Фабрика же и доливает колоду движку (`IDeckSupply`): колода бесконечна, и какие карты
 * в ней лежат — правило комнаты, а не движка.
 */
export abstract class CardFactory implements IDeckSupply {
  private uid = 1;

  /** Враг с поправками комнаты. */
  abstract createEnemy(def: EnemyDef, elite: boolean): Card;
  /** Горсть золота с номиналом по экономике комнаты. */
  abstract createGold(): Card;
  /** Стартовая колода захода. */
  abstract createDeck(): DeckPlan;
  /** Сколько золота выпадает в этой комнате: из карты, из сундука. */
  abstract rollGold(lo: number, hi: number): number;
  /** Долить колоду, если она мелеет. */
  abstract topUp(deck: Card[]): void;

  createChest(): Card {
    return this.make({ kind: 'chest' });
  }

  /** Пустой сундук: выглядит как обычный, внутри ничего. */
  createEmptyChest(): Card {
    const c = this.make({ kind: 'chest' });
    c.defId = 'chest_empty';
    return c;
  }

  createPotion(kind: 'potion_heal' | 'potion_regen'): Card {
    return this.make({ kind });
  }

  createArtifact(): Card {
    return this.make({ kind: 'artifact' });
  }

  /**
   * Мёртвый слуга чернокнижника: мёртвая версия врага `defId` — союзник, который несколько ходов
   * бьёт соседних врагов и получает от них ответ.
   */
  createServant(defId: string, hp: number, atk: number, ttl: number): Card {
    return this.make({ kind: 'ghost', defId, hp: Math.max(1, hp), atk: Math.max(1, atk), ttl });
  }

  /** Переход на следующий этаж. */
  createExit(): Card {
    return this.make({ kind: 'exit' });
  }

  /** Общий станок: каждая карта захода получает следующий `uid`. */
  protected make(init: Omit<CardInit, 'uid'>): Card {
    return new Card({ uid: this.uid++, ...init });
  }
}
