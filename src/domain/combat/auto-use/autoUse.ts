import { FULL_BAR } from '../../catalog/perks';
import type { AutoUseSave, ConsumableId } from '../../types';
import { Grid } from '../engine/grid/Grid';
import type { PlayerStats } from '../player';
import type { IRunState } from '../room-battle';

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
export const worstStrike = (run: IRunState): number => {
  let worst = 0;
  for (const c of Grid.neighbors(run.playerCell)) {
    const card = run.cards[c];
    if (card?.kind === 'enemy' && card.stun <= 0)
      worst = Math.max(worst, run.strikeDamage(card.atk));
  }
  return worst;
};

/** Следующий ответный удар может убить героя (щит считается за здоровье). */
export const inDanger = (run: IRunState): boolean => run.hp + run.shield <= worstStrike(run);

/**
 * Зелье исцеления «по необходимости»: когда здоровья не хватает на весь объём лечения (ничего не пропадает зря)
 * либо следующий удар врага мог бы стать смертельным.
 */
export const needsHeal = (run: IRunState): boolean => {
  if (run.over || run.consumables.potion_heal <= 0) return false;
  const missing = run.stats.maxHp - run.hp;
  if (missing <= 0) return false;
  return missing >= run.healPotionAmount() || inDanger(run);
};

/**
 * Зелье восстановления: ресурса не хватает на основное действие, шкала почти пуста (вернёт не меньше 60%),
 * а враги ещё есть.
 */
export const needsRegen = (run: IRunState): boolean => {
  if (run.over || run.consumables.potion_regen <= 0) return false;
  const need = coreCost(run.stats);
  if (need <= 0 || run.res >= need || run.enemiesLeft <= 0) return false;
  return run.stats.resMax - run.res >= Math.ceil(run.stats.resMax * 0.6);
};

/** Артефакт (маг): одним ударом уничтожает 3+ врагов, а при опасности — хотя бы двух. */
export const worthArtifact = (run: IRunState): boolean => {
  if (run.over || !run.lineageDef.artifacts || run.consumables.artifact <= 0) return false;
  const dmg = run.artifactDamage();
  let kills = 0;
  for (const c of run.cards) if (c?.kind === 'enemy' && c.hp <= dmg) kills++;
  return kills >= 3 || (kills >= 2 && inDanger(run));
};

/** Что применить прямо сейчас (не больше одного предмета за ход) — или null. Порядок: жизнь, ресурс, артефакт. */
export const pickAutoUse = (run: IRunState, cfg: AutoUseSave): ConsumableId | null => {
  if (run.over) return null;
  if (cfg.heal && needsHeal(run)) return 'potion_heal';
  if (cfg.regen && needsRegen(run)) return 'potion_regen';
  if (cfg.artifact && worthArtifact(run)) return 'artifact';
  return null;
};
