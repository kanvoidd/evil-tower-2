import type Phaser from 'phaser';

import { ENEMIES } from '../../../domain/catalog/enemies';
import type { PlayerStats } from '../../../domain/combat';
import type { Card } from '../../../domain/combat/card/Card';
import type { TKey } from '../../../i18n';
import { t, tr } from '../../../i18n';
import { plateTexture, statPill, txt } from '../../components';
import { CARD_W, STATUS_TINT } from '../../textures/Textures';
import { HEX } from '../../theme';
import type { CardView } from './interfaces/CardView';

/**
 * Фабрика карточек поля. Сцена не собирает карточки сама: она просит фабрику нарисовать
 * карту или героя в нужной точке и получает готовый вид.
 */
export class CardViewFactory {
  /** Центр «окна» с артом внутри карточки и линии подписей. */
  private static readonly ART_Y = -33;
  private static readonly LABEL_Y = 48;
  private static readonly PILL_Y = 86;

  /** Значки статусов на карточке врага: короткая подпись. */
  private static readonly STATUS_TAG: Record<string, string> = {
    stun: '✶',
    burn: '♨',
    poison: '☠',
    mark: '◆',
    link: '⚯',
    vuln: '!',
    weak: '↓',
    // метка «взрыв трупа», заражение призрачными слугами и оставшиеся ходы призрака
    corpse: '✹',
    haunt: '☁',
    ghost: '⏳',
  };

  constructor(private readonly scene: Phaser.Scene) {}

  createCard(card: Card, cell: number, at: { x: number; y: number }): CardView {
    const s = this.scene;
    const { ART_Y, LABEL_Y, PILL_Y } = CardViewFactory;
    const c = s.add.container(at.x, at.y).setDepth(1);
    let frameKey = 'card_item';
    let spriteKey = '';
    let spriteSize = 112;
    let label = '';
    let labelColor: string = HEX.text;
    switch (card.kind) {
      case 'enemy': {
        const def = ENEMIES[card.defId];
        frameKey = 'card_enemy';
        spriteKey = def.icon;
        spriteSize = def.boss ? 124 : 108;
        label = tr(def.name);
        if (def.boss) labelColor = HEX.gold;
        break;
      }
      case 'exit':
        frameKey = 'card_exit';
        spriteKey = 'spr_exit';
        spriteSize = 120;
        label = t('game.exit');
        labelColor = HEX.gold;
        break;
      case 'ghost':
        frameKey = 'card_ghost';
        spriteKey = 'enemy_ghost';
        spriteSize = 108;
        label = t('game.ghost');
        labelColor = '#a9e8ff';
        break;
      case 'gold':
        frameKey = 'card_gold';
        spriteKey = 'spr_gold';
        label = `+${card.value}`;
        labelColor = HEX.gold;
        break;
      case 'chest':
        frameKey = 'card_chest';
        spriteKey = 'spr_chest';
        label = t('game.chest');
        break;
      case 'potion_heal':
        spriteKey = 'item_potion_heal';
        label = t('shop.potion_heal');
        break;
      case 'potion_regen':
        spriteKey = 'item_potion_regen';
        label = t('shop.potion_regen');
        break;
      case 'artifact':
        spriteKey = 'item_artifact';
        label = t('shop.artifact');
        break;
    }
    const frame = s.add.image(0, 0, frameKey);
    const shadow = s.add.ellipse(
      0,
      ART_Y + spriteSize / 2 - 6,
      spriteSize * 0.62,
      12,
      0x000000,
      0.35,
    );
    const sprite = s.add.image(0, ART_Y, spriteKey).setDisplaySize(spriteSize, spriteSize);
    const flash = s.add.image(0, 0, frameKey).setTintFill(0xff2a2a).setAlpha(0.5).setVisible(false);
    c.add([frame, shadow, sprite, flash]);
    const view: CardView = {
      c,
      uid: card.uid,
      kind: card.kind,
      cell,
      frame,
      sprite,
      flash,
      defId: card.defId,
    };
    if (card.kind === 'enemy') {
      view.statusRow = s.add.container(0, -92);
      c.add(view.statusRow);
      c.add(
        txt(s, 0, LABEL_Y, label, 21, {
          color: labelColor,
          maxWidth: CARD_W - 32,
          strokeThickness: 3,
        }),
      );
      view.atk = statPill(s, -47, PILL_Y, { w: 84, stat: 'damage', text: String(card.atk) });
      view.hp = statPill(s, 47, PILL_Y, { w: 84, stat: 'health', text: String(card.hp) });
      c.add([view.atk.c, view.hp.c]);
      this.showStatuses(view, card);
    } else if (card.kind === 'gold') {
      const amount = txt(s, 0, 74, label, 34, { color: labelColor, weight: 900 });
      c.add(amount);
    } else if (card.kind === 'ghost') {
      // призрак — союзник: вместо атаки и здоровья показываем, сколько ходов ему осталось
      sprite.setAlpha(0.8);
      view.statusRow = s.add.container(0, -92);
      c.add(view.statusRow);
      c.add(txt(s, 0, 74, label, 22, { color: labelColor, maxWidth: CARD_W - 32 }));
      this.showStatuses(view, card);
    } else {
      c.add(txt(s, 0, 74, label, 22, { color: labelColor, maxWidth: CARD_W - 32 }));
    }
    return view;
  }

  createHero(stats: PlayerStats, hp: number, cell: number, at: { x: number; y: number }): CardView {
    const s = this.scene;
    const { ART_Y, LABEL_Y, PILL_Y } = CardViewFactory;
    const c = s.add.container(at.x, at.y).setDepth(5);
    const frame = s.add.image(0, 0, 'card_hero');
    const shadow = s.add.ellipse(0, ART_Y + 50, 70, 12, 0x000000, 0.35);
    const sprite = s.add.image(0, ART_Y, `hero_${stats.classId}`).setDisplaySize(112, 112);
    const flash = s.add
      .image(0, 0, 'card_hero')
      .setTintFill(0xff2a2a)
      .setAlpha(0.5)
      .setVisible(false);
    c.add([frame, shadow, sprite, flash]);
    c.add(
      txt(s, 0, LABEL_Y, t(`class.${stats.classId}.name` as TKey), 21, {
        color: HEX.gold,
        maxWidth: CARD_W - 32,
      }),
    );
    const view: CardView = {
      c,
      uid: -1,
      kind: 'player',
      cell,
      frame,
      sprite,
      flash,
      defId: 'player',
    };
    view.atk = statPill(s, -52, PILL_Y, { w: 70, stat: 'damage', text: String(stats.damage) });
    view.hp = statPill(s, 45, PILL_Y, {
      w: 98,
      stat: 'health',
      text: `${hp}/${stats.maxHp}`,
      fontSize: 18,
    });
    view.shield = statPill(s, -56, -88, { w: 66, h: 28, stat: 'defense', text: '0', fontSize: 16 });
    view.shield.c.setVisible(false);
    c.add([view.atk.c, view.hp.c, view.shield.c]);
    return view;
  }

  /** Значки состояний над карточкой врага: оглушение, горение, яд, клеймо, связь, приговор. */
  showStatuses(view: CardView, card: Card): void {
    const row = view.statusRow;
    if (!row) return;
    const s = this.scene;
    row.removeAll(true);
    const list = card.statuses();
    if (!list.length) return;
    const w = 38;
    const gap = 6;
    const total = list.length * w + (list.length - 1) * gap;
    list.forEach(({ kind, turns }, i) => {
      const x = -total / 2 + w / 2 + i * (w + gap);
      const chip = s.add.container(x, 0);
      chip.add(s.add.image(0, 0, plateTexture(s, w, 30, 1, 'dark', 15)));
      chip.add(s.add.rectangle(0, 13, w - 10, 3, STATUS_TINT[kind] ?? 0xffffff));
      const tag = CardViewFactory.STATUS_TAG[kind];
      const label = turns > 1 ? `${tag}${turns}` : tag;
      chip.add(
        txt(s, 0, -2, label, 17, {
          weight: 900,
          strokeThickness: 3,
          color: `#${(STATUS_TINT[kind] ?? 0xffffff).toString(16).padStart(6, '0')}`,
        }),
      );
      row.add(chip);
    });
  }
}
