import type Phaser from 'phaser';

import type { ISoundPlayer } from '../../application/ports';
import { PhaserClock } from '../phaser/PhaserClock';
import { PhaserTweens } from '../phaser/PhaserTweens';
import { BackgroundMotion } from './BackgroundMotion';
import { AttackAnimations } from './combat/AttackAnimations';
import { BackstabAnimation } from './combat/BackstabAnimation';
import { DeathAnimation } from './combat/DeathAnimation';
import { HitAnimation } from './combat/HitAnimation';
import { MeleeAttackAnimation } from './combat/MeleeAttackAnimation';
import { MoveAnimation } from './combat/MoveAnimation';
import { RangedAttackAnimation } from './combat/RangedAttackAnimation';
import { SpawnAnimation } from './combat/SpawnAnimation';
import { BumpAnimation } from './effects/BumpAnimation';
import { BurstAnimation } from './effects/BurstAnimation';
import { FlashAnimation } from './effects/FlashAnimation';
import { LootPopAnimation } from './effects/LootPopAnimation';
import { ProjectileAnimation } from './effects/ProjectileAnimation';
import { Vfx } from './effects/vfx/Vfx';
import { VfxAnimation } from './effects/VfxAnimation';
import { FloatingText } from './text/FloatingText';

/**
 * Все анимации боя, собранные композицией из маленьких компонентов, а не наследованием:
 *
 *            Animations
 *     ┌──────────┼───────────┐
 *   Attack     Effect     Movement
 *  ┌──┼───┐
 * Melee Ranged Backstab
 *
 * Сцена и проигрыватель событий берут готовые компоненты отсюда и сами твинов не заводят.
 */
export class Animations {
  readonly motion = new BackgroundMotion();
  readonly attack: AttackAnimations;
  readonly hit: HitAnimation;
  readonly spawn: SpawnAnimation;
  readonly death: DeathAnimation;
  readonly move: MoveAnimation;
  readonly burst: BurstAnimation;
  readonly projectile: ProjectileAnimation;
  readonly flash: FlashAnimation;
  readonly bump: BumpAnimation;
  readonly vfx: VfxAnimation;
  readonly lootPop: LootPopAnimation;
  readonly text: FloatingText;

  constructor(scene: Phaser.Scene, sound: ISoundPlayer) {
    const tweens = new PhaserTweens(scene);
    const clock = new PhaserClock(scene);
    const vfx = new Vfx(scene);
    this.burst = new BurstAnimation(scene);
    this.flash = new FlashAnimation(scene);
    this.attack = new AttackAnimations(
      new MeleeAttackAnimation(tweens, this.motion),
      new RangedAttackAnimation('shot', scene, vfx, sound, clock, this.motion),
      new RangedAttackAnimation('bolt', scene, vfx, sound, clock, this.motion),
      new BackstabAnimation(scene, tweens, vfx, this.burst, sound, clock, this.motion),
    );
    this.hit = new HitAnimation(scene);
    this.spawn = new SpawnAnimation(tweens);
    this.death = new DeathAnimation(tweens);
    this.move = new MoveAnimation(tweens);
    this.projectile = new ProjectileAnimation(scene);
    this.bump = new BumpAnimation(scene);
    this.vfx = new VfxAnimation(vfx, this.flash, sound, clock);
    this.lootPop = new LootPopAnimation(scene);
    this.text = new FloatingText(scene);
  }
}
