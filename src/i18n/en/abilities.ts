import type { abilities as ru } from '../ru/abilities';

export const abilities: Record<keyof typeof ru, string> = {
  // warrior
  'ability.power_strike.name': 'Power Strike',
  'ability.power_strike.desc':
    'Your next blow hits twice as hard. Overkill damage punches through into the enemy behind the target.',
  'ability.earthquake.name': 'Earthquake',
  'ability.earthquake.desc':
    'A ground stomp: every enemy in the hero’s row and column takes {dmg}% damage and is stunned.',
  'ability.never_give_up.name': 'Never Give Up',
  'ability.never_give_up.desc':
    'Once per room a lethal blow leaves you at {hpLeft} HP and bursts into a shockwave: every enemy takes twice the damage you absorbed.',
  // knight
  'ability.shield_bash.name': 'Shield Bash',
  'ability.shield_bash.desc':
    'A shoving blow: the enemy is knocked one cell back and swaps with the card behind it. Both take collision damage — doubled against the wall. The target is stunned.',
  'ability.war_cry.name': 'War Cry',
  'ability.war_cry.desc':
    'A banner unfurls over the board: every enemy loses {weaken}% attack until the room ends.',
  'ability.duel.name': 'Challenge',
  'ability.duel.desc':
    'The deadliest enemy is dragged to a cell next to you and stunned — a golem or boss can be hit without answering.',
  // berserk
  'ability.whirlwind.name': 'Whirlwind',
  'ability.whirlwind.desc': 'You spin and strike every adjacent enemy for {dmg}% damage.',
  'ability.rage.name': 'Rage',
  'ability.rage.desc':
    'Every {hpPerResource} HP you lose grants {resource} stamina. The more it hurts, the more often you whirl.',
  'ability.carnage.name': 'Carnage',
  'ability.carnage.desc':
    'Consecutive kills stack +{perKill}% damage each, up to +{cap}%. A turn without a kill resets it.',
  'ability.madness.name': "Berserker's Madness",
  'ability.madness.desc':
    'Three turns of red haze: every blow splashes onto the target’s neighbours and survivors never answer. At the end you lose {hpCost}% of your current HP.',
  // paladin
  'ability.holy_wrath.name': 'Holy Wrath',
  'ability.holy_wrath.desc':
    'A strike of light at {dmg_x}× damage — or {holyDmg_x}× against undead and demons.',
  'ability.justice_beam.name': 'Beam of Justice',
  'ability.justice_beam.desc':
    'A pillar of light sweeps the target’s whole column: every enemy takes full damage, undead and demons take double.',
  'ability.verdict.name': 'Verdict',
  'ability.verdict.desc':
    'Golden pillars crash down: every enemy at or below {limit}% of your damage dies instantly (bosses excepted).',
  'ability.heavens_wrath.name': 'Wrath of Heaven',
  'ability.heavens_wrath.desc':
    'The sky splits: every enemy takes double damage — quadruple for undead and demons — and is stunned.',
  // mage: elementalist
  'ability.ignite.name': 'Ignite',
  'ability.ignite.desc':
    'Sets any enemy alight: {ticks} burn ticks of {burn}% damage each. Ticks stack on the target. Cooldown {cooldown} turn.',
  'ability.ignite.lv2': 'Burn ticks per cast: {ticks}',
  'ability.detonate.name': 'Detonation',
  'ability.detonate.desc':
    'Every burning enemy explodes: {blastMul}% of its stored burn to itself, {splashMul}% to neighbours. Cooldown {cooldown} turns.',
  'ability.frost_spike.name': 'Frost Spike',
  'ability.frost_spike.desc':
    'A spike into any enemy: {dmg}% damage, and it hits {weaken}% weaker for {debuffTurns} turns. Cooldown {cooldown} turn.',
  'ability.frost_spike.lv2': 'Also cuts the enemy’s armour by {armorBreak}%',
  'ability.ice_armor.name': 'Ice Armour',
  'ability.ice_armor.desc':
    'For {turns} turns: a shield of {shield}% health, +{defense} defence, and anyone who strikes you takes {thorns}% damage. Cooldown {cooldown} turns.',
  'ability.lightning.name': 'Lightning',
  'ability.lightning.desc': 'A bolt into an adjacent enemy: {dmg}% damage for {cost} mana.',
  'ability.lightning.lv2':
    'With mana at {manaAbove}% of the bar or more — another +{manaBonus}% damage',
  'ability.chain_lightning.name': 'Chain Lightning',
  'ability.chain_lightning.desc':
    'Hits the target and jumps to a neighbouring enemy: {falloff1}% → {falloff2}%. Cooldown {cooldown} turns.',
  'ability.chain_lightning.lv2': 'Third target of the chain: {falloff3}%',
  'ability.chain_lightning.lv3': 'Fourth target of the chain: {falloff4}%',
  // mage: arcanist
  'ability.magic_shot.name': 'Arcane Shot',
  'ability.magic_shot.desc':
    'Hits the nearest enemy on the chosen line: {dmg}% damage. Cooldown {cooldown} turn.',
  'ability.magic_shot.lv2': 'Pierces the line: each next enemy takes {stepLoss}% less',
  'ability.swap.name': 'Pinpoint Swap',
  'ability.swap.desc':
    'Swap any two cards (two taps): pull a potion closer or move an enemy away. Cooldown {cooldown} turns.',
  'ability.shuffle.name': 'Field Shuffle',
  'ability.shuffle.desc':
    'Every card on the field except the hero takes a new place. Cooldown {cooldown} turns.',
  // mage: warlock
  'ability.blight_shot.name': 'Blight Shot',
  'ability.blight_shot.desc':
    '{dmg}% damage and infection: when the enemy dies it bursts, hitting neighbours for {infect}% of its health. Cooldown {cooldown} turn.',
  'ability.dead_servant.name': 'Dead Servant',
  'ability.dead_servant.desc':
    'An infected enemy rises as your servant when it dies: {hp}% of its health and {dmg}% of its attack. Servant turns: {turns} — it strikes adjacent enemies.',
  // mage: magister
  'ability.magic_shield.name': 'Magic Shield',
  'ability.magic_shield.desc':
    'A shield of {shield}% of maximum health. Cooldown {cooldown} turns.',
  // hunter: bowman
  'ability.pierce_shot.name': 'Piercing Shot',
  'ability.pierce_shot.desc':
    'A shot over a card: tap an enemy two cells away in a straight line — {cost} focus.',
  'ability.still_aim.name': 'Lurking Marksman',
  'ability.still_aim.desc':
    'Each turn standing still: damage +{perStack}%, up to {maxStacks} stacks. A step resets them.',
  // hunter: crossbowman
  'ability.bolt_volley.name': 'Bolt Volley',
  'ability.bolt_volley.desc':
    'A shot over a card for {cost} focus, and a point-blank hit pierces the enemy’s armour.',
  'ability.hook_bolt.name': 'Hook Bolt',
  'ability.hook_bolt.desc':
    'Pulls a distant enemy from your row or column onto the adjacent cell. Cooldown {cooldown} turns.',
  // hunter: beastmaster
  'ability.stampede.name': 'Boar Stampede',
  'ability.stampede.desc':
    'Boars run along your row or column: enemies are stunned, gold piles are trampled to a single coin. Cooldown {cooldown} turns.',
  'ability.stampede.lv2': 'Boars run along any line of the field',
  'ability.falcon.name': 'Falcon',
  'ability.falcon.desc':
    'The falcon strikes any enemy: {dmg}% damage and bleeding for {bleed}% per turn, turns: {bleedTurns}. Cooldown {cooldown} turn.',
  // hunter: huntsman
  'ability.snare.name': 'Snare',
  'ability.snare.desc':
    'A trap on a cell: an enemy that lands on it takes {dmg}% damage and is stunned. Cooldown {cooldown} turns.',
  'ability.armed_trap.name': 'Primed Trap',
  'ability.armed_trap.desc':
    'Tap another ability’s button: each tap is a turn of delay, up to {maxDelay}. Then pick a cell — the ability fires there by itself. Traps per room: {charges}.',
  // mercenary
  'ability.backstab.name': 'Backstab',
  'ability.backstab.desc':
    'Teleport behind any enemy on the board and land a guaranteed critical hit with no answer.',
  'ability.bribe.name': 'Bribe',
  'ability.bribe.desc':
    'You pay {goldShare}% of the room pouch (at least {goldMin}) and a non-boss simply leaves. No souls, no gold — only safety.',
  'ability.cold_blood.name': 'Cold Blood',
  'ability.cold_blood.desc': 'A backstab that kills refunds {resource} vigilance.',
  // assassin
  'ability.shadow_dance.name': 'Dance of Shadows',
  'ability.shadow_dance.desc':
    'A backstab that kills teleports you to the weakest enemy for free — a chain of up to three strikes.',
  'ability.sentence.name': 'Death Sentence',
  'ability.sentence.desc':
    'The target takes {vuln}% more damage from every source. Its death refunds all of your vigilance.',
  'ability.lethal_dose.name': 'Lethal Dose',
  'ability.lethal_dose.desc':
    'A backstab poisons: {poison}% of maximum health per turn for {turns} turns ({bossPoison}% on bosses).',
  // darkassassin
  'ability.death_mark.name': 'Death Mark',
  'ability.death_mark.desc':
    'A counting skull appears on the card: after three turns the enemy dies, and a boss loses {bossHpShare}% of its maximum health.',
  'ability.chain_mark.name': 'Chained Mark',
  'ability.chain_mark.desc': 'When a marked enemy dies, the mark leaps to the nearest one.',
  'ability.shadow_reap.name': 'Shadow Reaping',
  'ability.shadow_reap.desc':
    'Every marked enemy dies at once (bosses lose {bossHpShare}% of their maximum health).',
  'ability.reaper.name': 'Reaper',
  'ability.reaper.desc':
    'Three turns of reaping: the backstab is free and kills any non-boss, and every kill extends the reaping by a turn.',
  // ninja
  'ability.shuriken_fan.name': 'Shuriken Fan',
  'ability.shuriken_fan.desc':
    'Four shuriken fly at the nearest enemies for {dmg}% each, rolling separate crits and drawing no answer.',
  'ability.substitution.name': 'Substitution',
  'ability.substitution.desc':
    'On a successful dodge you vanish, leaving a log behind, reappear at the attacker’s back and strike a crit.',
  'ability.smoke_screen.name': 'Smoke Screen',
  'ability.smoke_screen.desc':
    'For two turns enemies never answer your blows — the board is full of smoke.',
  'ability.wind_shadow.name': 'Wind Shadow',
  'ability.wind_shadow.desc':
    'You sweep across the whole board and hit every enemy twice — the second blow is a crit.',
};
