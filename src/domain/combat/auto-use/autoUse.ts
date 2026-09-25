import { type ConsumableId, FULL_BAR } from '../../catalog';
import { Grid } from '../engine/grid/Grid';
import type { PlayerStats } from '../player';
import type { IBattleState } from '../room-battle';
import type { AutoUseSave } from './interfaces/AutoUseSave';

/** По умолчанию всё выключено: игрок включает автоприменение сам, рядом с нужным расходником. */
export const DEFAULT_AUTO_USE: AutoUseSave = { heal: false, regen: false, artifact: false };

/**
 * Цена основного действия класса в ресурсе: базовое действие линейки (молния, выстрел, удар в спину),
 * а если его нет — самая дешёвая способность класса (воину выносливость нужна именно на них).
 */
export const coreCost = (s: PlayerStats): number => {
  if (s.attack.mode !== 'none') return s.rangedCost;
  const costs = s.abilities
    .map((a) => (a.cost === FULL_BAR ? s.resMax : (a.cost ?? 0)))
    .filter((c) => c > 0);
  return costs.length ? Math.min(...costs) : 0;
};

/** Наибольший урон, который может нанести контратака соседнего врага. */
export const worstStrike = (battle: IBattleState): number => {
  let worst = 0;
  for (const c of Grid.neighbors(battle.playerCell)) {
    const card = battle.cards[c];
    if (card?.kind === 'enemy' && card.stun <= 0)
      worst = Math.max(worst, battle.strikeDamage(card.atk));
  }
  return worst;
};

/** Следующий ответный удар может убить героя (щит считается за здоровье). */
export const inDanger = (battle: IBattleState): boolean =>
  battle.hp + battle.shield <= worstStrike(battle);

/**
 * Зелье исцеления «по необходимости»: когда здоровья не хватает на весь объём лечения (ничего не пропадает зря)
 * либо следующий удар врага мог бы стать смертельным.
 */
export const needsHeal = (battle: IBattleState): boolean => {
  if (battle.over || battle.consumables.potion_heal <= 0) return false;
  const missing = battle.stats.maxHp - battle.hp;
  if (missing <= 0) return false;
  return missing >= battle.healPotionAmount() || inDanger(battle);
};

/**
 * Зелье восстановления: ресурса не хватает на основное действие, шкала почти пуста (вернёт не меньше 60%),
 * а враги ещё есть.
 */
export const needsRegen = (battle: IBattleState): boolean => {
  if (battle.over || battle.consumables.potion_regen <= 0) return false;
  const need = coreCost(battle.stats);
  if (need <= 0 || battle.res >= need || battle.enemiesLeft <= 0) return false;
  return battle.stats.resMax - battle.res >= Math.ceil(battle.stats.resMax * 0.6);
};

/** Артефакт (маг): одним ударом уничтожает 3+ врагов, а при опасности — хотя бы двух. */
export const worthArtifact = (battle: IBattleState): boolean => {
  if (battle.over || !battle.lineageDef.artifacts || battle.consumables.artifact <= 0) return false;
  const dmg = battle.artifactDamage();
  let kills = 0;
  for (const c of battle.cards) if (c?.kind === 'enemy' && c.hp <= dmg) kills++;
  return kills >= 3 || (kills >= 2 && inDanger(battle));
};

/** Что применить прямо сейчас (не больше одного предмета за ход) — или null. Порядок: жизнь, ресурс, артефакт. */
export const pickAutoUse = (battle: IBattleState, cfg: AutoUseSave): ConsumableId | null => {
  if (battle.over) return null;
  if (cfg.heal && needsHeal(battle)) return 'potion_heal';
  if (cfg.regen && needsRegen(battle)) return 'potion_regen';
  if (cfg.artifact && worthArtifact(battle)) return 'artifact';
  return null;
};
