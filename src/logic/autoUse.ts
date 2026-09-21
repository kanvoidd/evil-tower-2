import type { AutoUseSave, ConsumableId } from '../types';
import { GAMEPLAY } from '../config';
import { neighborsOf, type Run } from './run';
import type { PlayerStats } from './stats';

/** По умолчанию всё выключено: игрок включает автоприменение сам, рядом с нужным расходником. */
export const DEFAULT_AUTO_USE: AutoUseSave = { heal: false, regen: false, artifact: false };

/**
 * Цена основного действия класса в ресурсе: удар мага или выстрел стрелка/наёмника.
 * 0 — бой обходится без ресурса (воин: он нужен только для мощного удара, это роскошь, а не необходимость).
 */
export const coreCost = (s: PlayerStats): number => (s.attackCost > 0 ? s.attackCost : s.ranged !== 'none' ? s.rangedCost : 0);

/** Наибольший урон, который может нанести контратака соседнего врага (тот, кого герой атакует, отвечает). */
export const worstStrike = (run: Run): number => {
  let worst = 0;
  for (const c of neighborsOf(run.playerCell)) {
    const card = run.cards[c];
    if (card?.kind === 'enemy') worst = Math.max(worst, run.strikeDamage(card.atk));
  }
  return worst;
};

/** Следующий ответный удар может убить героя (щит считается за здоровье). */
export const inDanger = (run: Run): boolean => run.hp + run.shield <= worstStrike(run);

/**
 * Зелье исцеления «по необходимости»: когда здоровья не хватает на весь объём лечения (ничего не пропадает зря)
 * либо следующий удар врага мог бы стать смертельным (тогда не жалеем, лечим сразу).
 */
export const needsHeal = (run: Run): boolean => {
  if (run.over || run.consumables.potion_heal <= 0) return false;
  const missing = run.stats.maxHp - run.hp;
  if (missing <= 0) return false;
  return missing >= GAMEPLAY.healPotionHp || inDanger(run);
};

/**
 * Зелье восстановления: ресурса не хватает на следующий удар/выстрел, шкала почти пуста (зелье вернёт не меньше 60% шкалы —
 * иначе оно пропало бы зря, например у наёмника, чей удар стоит всю шкалу), а враги ещё есть.
 */
export const needsRegen = (run: Run): boolean => {
  if (run.over || run.consumables.potion_regen <= 0) return false;
  const need = coreCost(run.stats);
  if (need <= 0 || run.res >= need || run.enemiesLeft <= 0) return false;
  return run.stats.resMax - run.res >= Math.ceil(run.stats.resMax * 0.6);
};

/** Артефакт (маг): одним ударом уничтожает 3+ врагов, а при опасности — хотя бы двух. */
export const worthArtifact = (run: Run): boolean => {
  if (run.over || run.lineage !== 'mage' || run.consumables.artifact <= 0) return false;
  const dmg = run.artifactDamage();
  let kills = 0;
  for (const c of run.cards) if (c?.kind === 'enemy' && c.hp <= dmg) kills++;
  return kills >= 3 || (kills >= 2 && inDanger(run));
};

/** Что применить прямо сейчас (не больше одного предмета за ход) — или null. Порядок: жизнь, ресурс, артефакт. */
export const pickAutoUse = (run: Run, cfg: AutoUseSave): ConsumableId | null => {
  if (run.over) return null;
  if (cfg.heal && needsHeal(run)) return 'potion_heal';
  if (cfg.regen && needsRegen(run)) return 'potion_regen';
  if (cfg.artifact && worthArtifact(run)) return 'artifact';
  return null;
};
