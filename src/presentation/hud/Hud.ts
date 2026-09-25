import type Phaser from 'phaser';

import type { ISoundPlayer } from '../../application/ports';
import type { IRunState } from '../../domain/logic/run';
import type { ConsumableId } from '../../domain/types';
import type { Animations } from '../animations/Animations';
import type { Point } from '../animations/interfaces/Point';
import { type IMuteSwitch, PlateButton, soundButton } from '../components';
import { GAME_W } from '../theme';
import { ConsumableBar } from './ConsumableBar';
import { EnemyCounter } from './EnemyCounter';
import { GearBar } from './GearBar';
import type { IBattleHud } from './interfaces/IBattleHud';
import type { IHudActions } from './interfaces/IHudActions';
import { LootBar } from './LootBar';
import { PerkBar } from './PerkBar';
import { ResourceBar } from './ResourceBar';
import { RoomInfo } from './RoomInfo';
import { StatsRow } from './StatsRow';
import { TutorialHint } from './TutorialHint';

/**
 * Панели вокруг поля боя. Верх: расходники с «АВТО», «Сбежать», звук, прочность снаряжения и кошель;
 * под ними — комната, её свойство и счётчик врагов. Низ целиком отдан способностям: полоса ресурса,
 * характеристики и кнопки.
 *
 *   Run State → Hud.update() → панели
 *
 * HUD бой не меняет: кнопки отдают команды игрока через `IHudActions`.
 */
export class Hud implements IBattleHud {
  readonly consumables: ConsumableBar;
  readonly perks: PerkBar;
  readonly hint: TutorialHint;
  readonly loot: LootBar;
  private readonly enemies: EnemyCounter;
  private readonly resource: ResourceBar;
  private readonly stats: StatsRow;
  private readonly gear: GearBar;

  constructor(
    scene: Phaser.Scene,
    private readonly run: IRunState,
    banked: { gold: number; souls: number },
    actions: IHudActions,
    private readonly animations: Animations,
    sound: ISoundPlayer,
    audio: IMuteSwitch,
  ) {
    this.consumables = new ConsumableBar(scene, run.lineage, actions, animations, sound);
    // «сбежать», звук и добыча за комнату — верхняя полоса: весь низ экрана отдан кнопкам способностей
    new PlateButton(scene, 330, ConsumableBar.Y, {
      w: 68,
      h: 68,
      icon: 'svg_arrow',
      iconSize: 34,
      radius: 22,
      onClick: () => actions.command({ type: 'escape' }),
    });
    soundButton(scene, 414, ConsumableBar.Y, audio, 56);
    this.loot = new LootBar(scene, banked);
    new RoomInfo(scene, run.room, run.mod);
    this.enemies = new EnemyCounter(scene);
    this.resource = new ResourceBar(scene);
    this.stats = new StatsRow(scene);
    this.gear = new GearBar(scene);
    this.perks = new PerkBar(scene, run.stats.abilities, actions);
    this.hint = new TutorialHint(scene);
    this.perks.update(run);
    this.refresh();
  }

  /** Всё, что HUD показывает о бое, — после хода. */
  update(): void {
    this.refresh();
    this.perks.update(this.run);
  }

  // ---------------------------------------------------------------- IBattleHud

  refresh(): void {
    const r = this.run;
    this.resource.update(r.res, r.stats.resMax, r.stats.resource, r.boost > 0);
    this.stats.update(r.stats);
    this.gear.update(r.weapon, r.armor);
    this.enemies.update(r.killsLeft, r.totalEnemies, r.exitOpen);
    this.consumables.update(r);
  }

  refreshAbilities(): void {
    this.perks.update(this.run);
  }

  addLoot(gold: number, souls: number): void {
    this.loot.add(gold, souls);
  }

  lootAnchor(kind: 'gold' | 'souls'): Point {
    return this.loot.anchor(kind);
  }

  slotAnchor(item: ConsumableId): Point | null {
    return this.consumables.anchor(item);
  }

  bumpSlot(item: ConsumableId): void {
    this.consumables.bump(item);
  }

  note(text: string, color: string, size: number): void {
    this.animations.text.show(GAME_W / 2, TutorialHint.Y, text, color, size);
  }

  /** Не хватает ресурса на удар — шкала мигает. */
  flashResource(): void {
    this.resource.flash();
  }
}
