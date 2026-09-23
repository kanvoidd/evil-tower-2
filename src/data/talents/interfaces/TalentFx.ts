/**
 * Дерево талантов в духе WoW: три пути (урон / здоровье / защита), между способностями — не
 * три одинаковых шарика, а цепочки РАЗНОЙ длины: где-то один талант, где-то три. Все цепочки
 * яруса сходятся в следующую способность.
 *
 * Значения в `v` — СУММАРНЫЕ: [20, 30, 40] значит «+20% → +30% → +40%», а не прибавку к предыдущему рангу.
 *
 * Правило ворот: следующая способность (и метаморфоза) открывается, когда ЛЮБАЯ одна цепочка
 * яруса пройдена целиком — все её таланты прокачаны до максимума.
 *
 * Таланты и способности сохраняются при метаморфозе: пиромант владеет и заклинаниями мага,
 * и приёмами магистра, и своими. Поэтому в цепочках есть таланты-синергии — они меняют способности,
 * полученные раньше («Живое пламя» заставляет любую способность поджигать цель, так что цепная
 * молния мага у пироманта начинает поджигать).
 */
export type TalentFx =
  // ---- урон и способности (путь У)
  | 'dmgPct' | 'crit' | 'critMul' | 'perkPower' | 'artifactMul' | 'execute' | 'pierce'
  // усиление конкретных заклинаний мага; boltEcho — молния с шансом бьёт ту же цель второй раз
  | 'lightningPower' | 'shotPower' | 'chainPower' | 'boltEcho'
  | 'doubleStrike' | 'lowHpDmg' | 'fullHpDmg' | 'bossDmg' | 'ignite' | 'killDmg'
  | 'rageDmg' | 'goldDmg' | 'defDmg' | 'everyThird' | 'roomCrit'
  // ---- здоровье и запас (путь З)
  | 'hpPct' | 'resMaxPct' | 'lowHpDr' | 'bigHitCut' | 'startShield' | 'potionPct'
  | 'cheatDeath' | 'revive' | 'killHp' | 'bossHp' | 'freePerk' | 'healShield' | 'stepHeal'
  // ---- защита и ослабление врагов (путь Щ)
  | 'def' | 'parry' | 'dodge' | 'block' | 'thorns' | 'weaken' | 'firstHitDown'
  | 'armorBonus' | 'dotDr' | 'bossDr' | 'magicDr' | 'killDefTurn' | 'killDefStack'
  | 'roomGuard' | 'counterBuff' | 'highHpDef' | 'resDef' | 'perkDef' | 'scarDef' | 'manaShield'
  // ---- синергии: меняют уже полученные способности
  | 'abilityIgnite' | 'abilityStun' | 'abilitySplash' | 'abilityPoison' | 'abilityVuln'
  | 'abilityCrit' | 'abilityLifesteal' | 'abilityRefund' | 'abilityShield'
  | 'killBlast' | 'basicSplit' | 'perkCostDown';
