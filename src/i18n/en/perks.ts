import type { perks as ru } from '../ru/perks';

export const perks: Record<keyof typeof ru, string> = {
  // warrior
  'perk.warrior_start.name': 'Power Strike',
  'perk.warrior_start.desc':
    'Your next blow hits twice as hard. Overkill damage punches through into the enemy behind the target.',
  'perk.warrior_p2.name': 'Earthquake',
  'perk.warrior_p2.desc':
    'A ground stomp: every enemy in the hero’s row and column takes {dmg}% damage and is stunned.',
  'perk.warrior_p3.name': 'Never Give Up',
  'perk.warrior_p3.desc':
    'Once per room a lethal blow leaves you at {hpLeft} HP and bursts into a shockwave: every enemy takes twice the damage you absorbed.',
  // knight
  'perk.knight_start.name': 'Shield Bash',
  'perk.knight_start.desc':
    'A shoving blow: the enemy is knocked one cell back and swaps with the card behind it. Both take collision damage — doubled against the wall. The target is stunned.',
  'perk.knight_p2.name': 'War Cry',
  'perk.knight_p2.desc':
    'A banner unfurls over the board: every enemy loses {weaken}% attack until the room ends.',
  'perk.knight_p3.name': 'Challenge',
  'perk.knight_p3.desc':
    'The deadliest enemy is dragged to a cell next to you and stunned — a golem or boss can be hit without answering.',
  // berserk
  'perk.berserk_start.name': 'Whirlwind',
  'perk.berserk_start.desc': 'You spin and strike every adjacent enemy for {dmg}% damage.',
  'perk.berserk_p2.name': 'Rage',
  'perk.berserk_p2.desc':
    'Every {hpPerResource} HP you lose grants {resource} stamina. The more it hurts, the more often you whirl.',
  'perk.berserk_p3.name': 'Carnage',
  'perk.berserk_p3.desc':
    'Consecutive kills stack +{perKill}% damage each, up to +{cap}%. A turn without a kill resets it.',
  'perk.berserk_legend.name': "Berserker's Madness",
  'perk.berserk_legend.desc':
    'Three turns of red haze: every blow splashes onto the target’s neighbours and survivors never answer. At the end you lose {hpCost}% of your current HP.',
  // paladin
  'perk.paladin_start.name': 'Holy Wrath',
  'perk.paladin_start.desc':
    'A strike of light at {dmg_x}× damage — or {holyDmg_x}× against undead and demons.',
  'perk.paladin_p2.name': 'Beam of Justice',
  'perk.paladin_p2.desc':
    'A pillar of light sweeps the target’s whole column: every enemy takes full damage, undead and demons take double.',
  'perk.paladin_p3.name': 'Verdict',
  'perk.paladin_p3.desc':
    'Golden pillars crash down: every enemy at or below {limit}% of your damage dies instantly (bosses excepted).',
  'perk.paladin_legend.name': 'Wrath of Heaven',
  'perk.paladin_legend.desc':
    'The sky splits: every enemy takes double damage — quadruple for undead and demons — and is stunned.',
  // mage
  'perk.mage_start.name': 'Lightning Bolt',
  'perk.mage_start.desc':
    'The mage never strikes with his hands — only with lightning. Tap the ability button and pick an adjacent enemy (up, down, left or right) for {dmg}% spell damage at {cost} mana. Mana returns only {regen} per turn — watch it: a mage cornered on every side with an empty bar is doomed.',
  'perk.mage_p2.name': 'Arcane Shot',
  'perk.mage_p2.desc':
    '{dmg}% damage to a target in line with you — but only THROUGH a card: the shot cannot hit an adjacent enemy. {cooldown}-turn cooldown.',
  'perk.mage_p3.name': 'Chain Lightning',
  'perk.mage_p3.desc':
    'Strikes the target and arcs to neighbours: {falloff1}% → {falloff2}% → {falloff3}%. {cooldown}-turn cooldown.',
  // magister
  'perk.magister_start.name': 'Rearrange',
  'perk.magister_start.desc':
    'Swap any two cards (two taps): pull a potion closer or shove a golem away. {cooldown}-turn cooldown.',
  'perk.magister_p2.name': 'Draw of Fate',
  'perk.magister_p2.desc':
    'Send the chosen card (bosses excepted) to the bottom of the deck and draw a new one in its place. {cooldown}-turn cooldown.',
  'perk.magister_p3.name': 'Rewind',
  'perk.magister_p3.desc':
    'Once per room, rewinds the last turn entirely — board, health, resource. The dice fall differently on the retry.',
  // necromancer
  'perk.necromancer_start.name': 'Corpse Blast',
  'perk.necromancer_start.desc':
    'Mark an enemy: when it dies, its corpse bursts — neighbours take half its maximum health. Marked neighbours chain the blast. {cooldown}-turn cooldown.',
  'perk.necromancer_p2.name': 'Spectral Servants',
  'perk.necromancer_p2.desc':
    'Infect an enemy: when it dies, a ghost rises in its place. For three turns the ghost strikes adjacent enemies (up, down, left, right) for {dmg}% of your damage. At most two ghosts at once. {cooldown}-turn cooldown.',
  'perk.necromancer_p3.name': 'Voodoo Doll',
  'perk.necromancer_p3.desc':
    'Binds an enemy: half of the damage it takes is dealt to every other enemy on the board. {cooldown}-turn cooldown.',
  'perk.necromancer_legend.name': 'Harvest of the Dead',
  'perk.necromancer_legend.desc':
    'Every enemy loses half its current health (bosses a quarter). Those that die give double souls.',
  // pyromancer
  'perk.pyromancer_start.name': 'Ignite',
  'perk.pyromancer_start.desc':
    'Sets any enemy ablaze for {turns} turns. One that dies burning passes the flame to its neighbours. {cooldown}-turn cooldown.',
  'perk.pyromancer_p2.name': 'Fireball',
  'perk.pyromancer_p2.desc':
    'A long throw: the target takes {dmg}% damage, neighbours {splash}%, and everyone catches fire. Costs no mana — a {cooldown}-turn cooldown keeps it in check.',
  'perk.pyromancer_p3.name': 'Detonation',
  'perk.pyromancer_p3.desc':
    'Every burning enemy explodes for {blastMul}% on itself and {splashMul}% on its neighbours — the blasts chain across the board. {cooldown}-turn cooldown.',
  'perk.pyromancer_legend.name': 'Inferno',
  'perk.pyromancer_legend.desc':
    'A firestorm rolls out in waves: every enemy burns for {turns} turns at {burn}% of your damage per turn.',
  // archer
  'perk.archer_start.name': 'Piercing Shot',
  'perk.archer_start.desc':
    'A shot through a card: tap an enemy two cells away in a straight line and it takes damage from outside melee reach.',
  'perk.archer_p2.name': 'Angled Aim',
  'perk.archer_p2.desc':
    'You can also shoot the diagonal neighbours that are normally out of reach.',
  'perk.archer_p3.name': 'Ricochet',
  'perk.archer_p3.desc':
    'The arrow bounces from the target to the nearest enemy ({falloff2}%) and then once more ({falloff3}%).',
  // hawkeye
  'perk.hawkeye_start.name': 'Hunting Falcon',
  'perk.hawkeye_start.desc':
    'The falcon dives at any enemy on the board for {dmg}% damage and a stun.',
  'perk.hawkeye_p2.name': 'Falcon Courier',
  'perk.hawkeye_p2.desc':
    'The falcon fetches any card you need — gold, chest or potion — while you stay put.',
  'perk.hawkeye_p3.name': "Eagle's Sight",
  'perk.hawkeye_p3.desc':
    'The top three cards of the deck are visible. You may also shoot adjacent enemies — without an answer.',
  // arrowgod
  'perk.arrowgod_start.name': 'Double Shot',
  'perk.arrowgod_start.desc':
    'Two arrows in a row. If the first one kills, the second flies at the nearest enemy.',
  'perk.arrowgod_p2.name': "Hunter's Thrill",
  'perk.arrowgod_p2.desc': 'A critical shot refunds the concentration it cost.',
  'perk.arrowgod_p3.name': 'Arrow Rain',
  'perk.arrowgod_p3.desc':
    'Five arrows fall from the sky onto random enemies for {dmg}% damage each.',
  'perk.arrowgod_legend.name': 'Starfall',
  'perk.arrowgod_legend.desc':
    'The sky goes black with arrows: every enemy takes three hits of {dmg}%, each rolling its own crit.',
  // sniper
  'perk.sniper_start.name': 'Rail Shot',
  'perk.sniper_start.desc':
    'The arrow punches through the whole line: every enemy in the target’s row or column is hit, each {stepLoss}% weaker than the last.',
  'perk.sniper_p2.name': 'Armour Piercer',
  'perk.sniper_p2.desc':
    'A shot with a bonus equal to {hpShare}% of the target’s maximum health. Golems and bosses suffer most.',
  'perk.sniper_p3.name': "Hunter's Mark",
  'perk.sniper_p3.desc': 'Your first shot at an undamaged enemy always crits.',
  'perk.sniper_legend.name': 'One Shot, One Kill',
  'perk.sniper_legend.desc':
    'Time slows: the shot instantly kills any non-boss and travels on down the line, up to three kills. A boss loses {bossHpShare}% of its maximum health.',
  // mercenary
  'perk.mercenary_start.name': 'Backstab',
  'perk.mercenary_start.desc':
    'Teleport behind any enemy on the board and land a guaranteed critical hit with no answer.',
  'perk.mercenary_p2.name': 'Bribe',
  'perk.mercenary_p2.desc':
    'You pay {goldShare}% of the room pouch (at least {goldMin}) and a non-boss simply leaves. No souls, no gold — only safety.',
  'perk.mercenary_p3.name': 'Cold Blood',
  'perk.mercenary_p3.desc': 'A backstab that kills refunds {resource} vigilance.',
  // assassin
  'perk.assassin_start.name': 'Dance of Shadows',
  'perk.assassin_start.desc':
    'A backstab that kills teleports you to the weakest enemy for free — a chain of up to three strikes.',
  'perk.assassin_p2.name': 'Death Sentence',
  'perk.assassin_p2.desc':
    'The target takes {vuln}% more damage from every source. Its death refunds all of your vigilance.',
  'perk.assassin_p3.name': 'Lethal Dose',
  'perk.assassin_p3.desc':
    'A backstab poisons: {poison}% of maximum health per turn for {turns} turns ({bossPoison}% on bosses).',
  // darkassassin
  'perk.darkassassin_start.name': 'Death Mark',
  'perk.darkassassin_start.desc':
    'A counting skull appears on the card: after three turns the enemy dies, and a boss loses {bossHpShare}% of its maximum health.',
  'perk.darkassassin_p2.name': 'Chained Mark',
  'perk.darkassassin_p2.desc': 'When a marked enemy dies, the mark leaps to the nearest one.',
  'perk.darkassassin_p3.name': 'Shadow Reaping',
  'perk.darkassassin_p3.desc':
    'Every marked enemy dies at once (bosses lose {bossHpShare}% of their maximum health).',
  'perk.darkassassin_legend.name': 'Reaper',
  'perk.darkassassin_legend.desc':
    'Three turns of reaping: the backstab is free and kills any non-boss, and every kill extends the reaping by a turn.',
  // ninja
  'perk.ninja_start.name': 'Shuriken Fan',
  'perk.ninja_start.desc':
    'Four shuriken fly at the nearest enemies for {dmg}% each, rolling separate crits and drawing no answer.',
  'perk.ninja_p2.name': 'Substitution',
  'perk.ninja_p2.desc':
    'On a successful dodge you vanish, leaving a log behind, reappear at the attacker’s back and strike a crit.',
  'perk.ninja_p3.name': 'Smoke Screen',
  'perk.ninja_p3.desc':
    'For two turns enemies never answer your blows — the board is full of smoke.',
  'perk.ninja_legend.name': 'Wind Shadow',
  'perk.ninja_legend.desc':
    'You sweep across the whole board and hit every enemy twice — the second blow is a crit.',
};
