import type { CardKind } from '../../../catalog';

/** Из чего собирается карта. Всё, что не указано, начинается с нуля. */
export interface CardInit {
  uid: number;
  kind: CardKind;
  /**
   * Id врага в каталоге (у слуги — врага, чья он мёртвая версия); у добычи — её вид (`gold`,
   * `chest_empty`, …). По умолчанию равен `kind`.
   */
  defId?: string;
  hp?: number;
  atk?: number;
  /** Номинал: сколько золота в карте золота. */
  value?: number;
  elite?: boolean;
  /** Слуга: сколько ходов ему осталось. */
  ttl?: number;
}
