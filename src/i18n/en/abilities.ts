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
  // mage
  'ability.lightning.name': 'Lightning Bolt',
  'ability.lightning.desc':
    'The mage never strikes with his hands — only with lightning. Tap the ability button and pick an adjacent enemy (up, down, left or right) for {dmg}% spell damage at {cost} mana. Mana returns only {regen} per turn — watch it: a mage cornered on every side with an empty bar is doomed.',
  'ability.magic_shot.name': 'Arcane Shot',
  'ability.magic_shot.desc':
    '{dmg}% damage to a target in line with you — but only THROUGH a card: the shot cannot hit an adjacent enemy. {cooldown}-turn cooldown.',
  'ability.chain_lightning.name': 'Chain Lightning',
  'ability.chain_lightning.desc':
    'Strikes the target and arcs to neighbours: {falloff1}% → {falloff2}% → {falloff3}%. {cooldown}-turn cooldown.',
  // magister
  'ability.swap.name': 'Rearrange',
  'ability.swap.desc':
    'Swap any two cards (two taps): pull a potion closer or shove a golem away. {cooldown}-turn cooldown.',
  'ability.deck_draw.name': 'Draw of Fate',
  'ability.deck_draw.desc':
    'Send the chosen card (bosses excepted) to the bottom of the deck and draw a new one in its place. {cooldown}-turn cooldown.',
  'ability.rewind.name': 'Rewind',
  'ability.rewind.desc':
    'Once per room, rewinds the last turn entirely — board, health, resource. The dice fall differently on the retry.',
  // necromancer
  'ability.corpse_blast.name': 'Corpse Blast',
  'ability.corpse_blast.desc':
    'Mark an enemy: when it dies, its corpse bursts — neighbours take half its maximum health. Marked neighbours chain the blast. {cooldown}-turn cooldown.',
  'ability.ghosts.name': 'Spectral Servants',
  'ability.ghosts.desc':
    'Infect an enemy: when it dies, a ghost rises in its place. For three turns the ghost strikes adjacent enemies (up, down, left, right) for {dmg}% of your damage. At most two ghosts at once. {cooldown}-turn cooldown.',
  'ability.voodoo.name': 'Voodoo Doll',
  'ability.voodoo.desc':
    'Binds an enemy: half of the damage it takes is dealt to every other enemy on the board. {cooldown}-turn cooldown.',
  'ability.dead_harvest.name': 'Harvest of the Dead',
  'ability.dead_harvest.desc':
    'Every enemy loses half its current health (bosses a quarter). Those that die give double souls.',
  // pyromancer
  'ability.ignite.name': 'Ignite',
  'ability.ignite.desc':
    'Sets any enemy ablaze for {turns} turns. One that dies burning passes the flame to its neighbours. {cooldown}-turn cooldown.',
  'ability.fireball.name': 'Fireball',
  'ability.fireball.desc':
    'A long throw: the target takes {dmg}% damage, neighbours {splash}%, and everyone catches fire. Costs no mana — a {cooldown}-turn cooldown keeps it in check.',
  'ability.detonate.name': 'Detonation',
  'ability.detonate.desc':
    'Every burning enemy explodes for {blastMul}% on itself and {splashMul}% on its neighbours — the blasts chain across the board. {cooldown}-turn cooldown.',
  'ability.inferno.name': 'Inferno',
  'ability.inferno.desc':
    'A firestorm rolls out in waves: every enemy burns for {turns} turns at {burn}% of your damage per turn.',
  // archer
  'ability.pierce_shot.name': 'Piercing Shot',
  'ability.pierce_shot.desc':
    'A shot through a card: tap an enemy two cells away in a straight line and it takes damage from outside melee reach.',
  'ability.diagonal.name': 'Angled Aim',
  'ability.diagonal.desc':
    'You can also shoot the diagonal neighbours that are normally out of reach.',
  'ability.ricochet.name': 'Ricochet',
  'ability.ricochet.desc':
    'The arrow bounces from the target to the nearest enemy ({falloff2}%) and then once more ({falloff3}%).',
  // hawkeye
  'ability.falcon_hunt.name': 'Hunting Falcon',
  'ability.falcon_hunt.desc':
    'The falcon dives at any enemy on the board for {dmg}% damage and a stun.',
  'ability.falcon_courier.name': 'Falcon Courier',
  'ability.falcon_courier.desc':
    'The falcon fetches any card you need — gold, chest or potion — while you stay put.',
  'ability.eagle_eye.name': "Eagle's Sight",
  'ability.eagle_eye.desc':
    'The top three cards of the deck are visible. You may also shoot adjacent enemies — without an answer.',
  // arrowgod
  'ability.double_shot.name': 'Double Shot',
  'ability.double_shot.desc':
    'Two arrows in a row. If the first one kills, the second flies at the nearest enemy.',
  'ability.hunter_thrill.name': "Hunter's Thrill",
  'ability.hunter_thrill.desc': 'A critical shot refunds the concentration it cost.',
  'ability.arrow_rain.name': 'Arrow Rain',
  'ability.arrow_rain.desc':
    'Five arrows fall from the sky onto random enemies for {dmg}% damage each.',
  'ability.starfall.name': 'Starfall',
  'ability.starfall.desc':
    'The sky goes black with arrows: every enemy takes three hits of {dmg}%, each rolling its own crit.',
  // sniper
  'ability.rail_shot.name': 'Rail Shot',
  'ability.rail_shot.desc':
    'The arrow punches through the whole line: every enemy in the target’s row or column is hit, each {stepLoss}% weaker than the last.',
  'ability.armor_piercing.name': 'Armour Piercer',
  'ability.armor_piercing.desc':
    'A shot with a bonus equal to {hpShare}% of the target’s maximum health. Golems and bosses suffer most.',
  'ability.hunters_mark.name': "Hunter's Mark",
  'ability.hunters_mark.desc': 'Your first shot at an undamaged enemy always crits.',
  'ability.one_shot.name': 'One Shot, One Kill',
  'ability.one_shot.desc':
    'Time slows: the shot instantly kills any non-boss and travels on down the line, up to three kills. A boss loses {bossHpShare}% of its maximum health.',
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
