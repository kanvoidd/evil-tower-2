import type Phaser from 'phaser';

import type { SkillTreeCommand } from '../../../application/skill-tree/interfaces/SkillTreeCommand';
import type { SkillTreeQuery } from '../../../application/skill-tree/SkillTreeQuery';
import { FULL_BAR } from '../../../domain/catalog';
import { classTraits, type NodeState, type TreeNode } from '../../../domain/progression';
import {
  describeTrait,
  fmt,
  perkDesc,
  perkName,
  t,
  talentDesc,
  talentName,
  type TKey,
} from '../../../i18n';
import {
  fitHeight,
  icon,
  pinToScreen,
  PlateButton,
  plateTexture,
  shadowTexture,
  txt,
} from '../../components';
import { GAME_H, GAME_W, HEX } from '../../theme';
import type { NodeInfo } from './interfaces/NodeInfo';
import { NodeView } from './NodeView';

/**
 * Нижняя панель дерева: что за узел выбран, его цена и кнопка — купить, улучшить или отказаться
 * от финального класса. Кнопки отдают команды; что можно купить, решает приложение.
 */
export class SkillInfoPanel {
  /** Высота панели — дерево панорамируется над ней. */
  static readonly H = 306;

  readonly root: Phaser.GameObjects.Container;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly query: SkillTreeQuery,
    private readonly commands: (cmd: SkillTreeCommand) => void,
  ) {
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(800);
  }

  clear(): void {
    this.root.removeAll(true);
  }

  show(n: TreeNode, st: NodeState): void {
    const s = this.scene;
    const q = this.query;
    const p = this.root;
    const H = SkillInfoPanel.H;
    p.removeAll(true);
    const info = this.infoOf(n);
    const y0 = GAME_H - H;
    const pw = GAME_W - 16;
    p.add(s.add.image(GAME_W / 2, y0 + H / 2 - 4, shadowTexture(s, pw, H, 34, 24)).setAlpha(0.9));
    p.add(s.add.image(GAME_W / 2, y0 + H / 2 + 2, plateTexture(s, pw, H, 1, 'panel', 34)));
    p.add(s.add.image(84, y0 + 86, plateTexture(s, 108, 108, 1, 'dark', 26)));
    p.add(s.add.image(84, y0 + 86, info.tex).setDisplaySize(84, 84));
    if (info.iconKey) p.add(icon(s, 84, y0 + 86, info.iconKey, 44));
    p.add(
      txt(s, 158, y0 + 46, info.title, 32, {
        font: 'title',
        origin: [0, 0.5],
        maxWidth: 520,
        color: HEX.gold,
        strokeThickness: 0,
      }),
    );
    if (info.sub)
      p.add(
        txt(s, 158, y0 + 82, info.sub, 19, {
          origin: [0, 0.5],
          color: HEX.textMute,
          weight: 800,
          strokeThickness: 0,
          maxWidth: 520,
        }),
      );
    let desc = info.desc;
    // Способности прежних классов остаются с героем — показываем, откуда она пришла.
    if (n.kind === 'perk' && n.owner !== q.activeClass) {
      desc += `\n${t('skill.from_class', { c: t(`class.${n.owner}.name` as TKey) })}`;
    }
    if (st === 'locked' && (n.kind === 'perk' || n.kind === 'class'))
      desc += `\n${t('skill.gate')}`;
    const descText = txt(s, 158, y0 + 104, desc, 21, {
      origin: [0, 0],
      wrap: 520,
      weight: 700,
      strokeThickness: 0,
      lineSpacing: 0,
      align: 'left',
    });
    fitHeight(descText, 108, 14);
    p.add(descText);

    const cost = q.cost(n);
    const rowY = GAME_H - 54;
    let btn: PlateButton | null = null;
    let status = '';
    let statusColor: string = HEX.textDim;

    if (n.kind === 'class' && st === 'owned' && q.canCancel(n)) {
      btn = new PlateButton(s, GAME_W - 200, rowY, {
        w: 340,
        h: 70,
        label: t('skill.cancel_meta'),
        fontSize: 22,
        style: 'red',
        radius: 24,
        onClick: () => this.commands({ type: 'cancel-metamorphosis' }),
      });
    } else if (st === 'owned') {
      status = n.kind === 'talent' ? t('skill.maxed') : t('skill.owned');
      statusColor = HEX.good;
    } else if (st === 'available' || st === 'partial') {
      const can = q.souls >= cost;
      btn = new PlateButton(s, GAME_W - 190, rowY, {
        w: 320,
        h: 70,
        label: st === 'partial' ? t('skill.upgrade') : t('skill.buy'),
        fontSize: 30,
        style: 'gold',
        radius: 24,
        icon: 'ico_soul',
        iconSize: 32,
        onClick: () => this.commands({ type: 'buy', node: n }),
      });
      btn.setLocked(!can);
    } else if (st === 'blocked') {
      status = t('skill.blocked');
      statusColor = HEX.bad;
    } else {
      status = t('skill.locked');
    }
    if (cost > 0 && st !== 'owned') {
      p.add(s.add.image(56, rowY, 'ico_soul').setDisplaySize(36, 36));
      p.add(
        txt(s, 82, rowY, fmt(cost), 30, {
          origin: [0, 0.5],
          weight: 900,
          color: q.souls >= cost ? HEX.soul : HEX.bad,
        }),
      );
    }
    if (status) {
      const sx = cost > 0 && st !== 'owned' ? 200 : 56;
      p.add(
        txt(s, sx, rowY, status, 20, {
          origin: [0, 0.5],
          align: 'left',
          wrap: GAME_W - 32 - sx,
          color: statusColor,
          weight: 700,
          strokeThickness: 0,
        }),
      );
    }
    if (btn) p.add(btn);
    pinToScreen(p);
  }

  private infoOf(n: TreeNode): NodeInfo {
    const q = this.query;
    if (n.kind === 'talent') {
      const def = q.talent(n);
      const rank = q.rank(n);
      return {
        title: talentName(def),
        sub: `${t('skill.tier_label', { n: n.tier!, path: t(`path.${n.path}` as TKey) })} · ${t('skill.rank', { n: rank, max: q.maxRank(n) })}`,
        desc: talentDesc(def, rank),
        tex: `tal_${n.path}`,
        iconKey: NodeView.talentIcon(n),
      };
    }
    if (n.kind === 'perk') {
      const perk = q.perk(n)!;
      const slotKey = (
        {
          start: 'skill.perk_start',
          p2: 'skill.perk_p2',
          p3: 'skill.perk_p3',
          legend: 'skill.perk_legend',
        } as const
      )[n.slot!];
      const lines: string[] = [perkDesc(perk)];
      if (perk.passive) lines.push(t('skill.passive'));
      else if (perk.basic) lines.push(t('skill.basic'));
      if (perk.cost !== undefined && !perk.passive) {
        lines.push(
          perk.cost === FULL_BAR
            ? t('skill.cost_full')
            : t('skill.cost_res', { n: perk.cost, r: t(`res.${q.resource}` as TKey) }),
        );
      }
      if (perk.once) lines.push(t('skill.once'));
      return { title: perkName(perk), sub: t(slotKey), desc: lines.join('\n'), tex: perk.icon };
    }
    if (n.kind === 'class') {
      return {
        title: t(`class.${n.classId}.name` as TKey),
        sub: t('skill.class'),
        desc: classTraits(n.classId!, 3)
          .map((tr) => `• ${describeTrait(tr)}`)
          .join('\n'),
        tex: `cls_${n.classId}`,
      };
    }
    return { title: t('skill.evo'), sub: '', desc: t('skill.evo_desc'), tex: 'evo_gate' };
  }
}
