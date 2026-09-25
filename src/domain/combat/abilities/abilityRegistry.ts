import type { AbilityBehaviorId } from '../../catalog';
import { ArmorPiercing } from './archer/armor-piercing/ArmorPiercing';
import { ArrowRain } from './archer/arrow-rain/ArrowRain';
import { DoubleShot } from './archer/double-shot/DoubleShot';
import { FalconCourier } from './archer/falcon-courier/FalconCourier';
import { FalconHunt } from './archer/falcon-hunt/FalconHunt';
import { OneShot } from './archer/one-shot/OneShot';
import { RailShot } from './archer/rail-shot/RailShot';
import { Ricochet } from './archer/ricochet/Ricochet';
import { Starfall } from './archer/starfall/Starfall';
import type { IAbility } from './interfaces/IAbility';
import { ChainLightning } from './mage/chain-lightning/ChainLightning';
import { CorpseBlast } from './mage/corpse-blast/CorpseBlast';
import { DeadHarvest } from './mage/dead-harvest/DeadHarvest';
import { DeckDraw } from './mage/deck-draw/DeckDraw';
import { Detonate } from './mage/detonate/Detonate';
import { Fireball } from './mage/fireball/Fireball';
import { Ghosts } from './mage/ghosts/Ghosts';
import { Ignite } from './mage/ignite/Ignite';
import { Inferno } from './mage/inferno/Inferno';
import { Lightning } from './mage/lightning/Lightning';
import { MagicShot } from './mage/magic-shot/MagicShot';
import { Rewind } from './mage/rewind/Rewind';
import { Swap } from './mage/swap/Swap';
import { Voodoo } from './mage/voodoo/Voodoo';
import { Bribe } from './mercenary/bribe/Bribe';
import { DeathMark } from './mercenary/death-mark/DeathMark';
import { Reaper } from './mercenary/reaper/Reaper';
import { Sentence } from './mercenary/sentence/Sentence';
import { ShadowReap } from './mercenary/shadow-reap/ShadowReap';
import { ShurikenFan } from './mercenary/shuriken-fan/ShurikenFan';
import { SmokeScreen } from './mercenary/smoke-screen/SmokeScreen';
import { WindShadow } from './mercenary/wind-shadow/WindShadow';
import { Duel } from './warrior/duel/Duel';
import { Earthquake } from './warrior/earthquake/Earthquake';
import { HeavensWrath } from './warrior/heavens-wrath/HeavensWrath';
import { HolyWrath } from './warrior/holy-wrath/HolyWrath';
import { JusticeBeam } from './warrior/justice-beam/JusticeBeam';
import { Madness } from './warrior/madness/Madness';
import { PowerStrike } from './warrior/power-strike/PowerStrike';
import { ShieldBash } from './warrior/shield-bash/ShieldBash';
import { Verdict } from './warrior/verdict/Verdict';
import { WarCry } from './warrior/war-cry/WarCry';
import { Whirlwind } from './warrior/whirlwind/Whirlwind';

/**
 * Механики способностей с кнопкой — по id механики (`AbilityDef.behavior`). Пассивки и базовые
 * действия линеек работают в правилах боя (удар, ответ врагов, добыча), поэтому здесь их нет.
 */
export const ABILITY_BEHAVIORS: { readonly [B in AbilityBehaviorId]?: IAbility<B> } = {
  power_strike: new PowerStrike(),
  earthquake: new Earthquake(),
  shield_bash: new ShieldBash(),
  war_cry: new WarCry(),
  duel: new Duel(),
  whirlwind: new Whirlwind(),
  madness: new Madness(),
  holy_wrath: new HolyWrath(),
  justice_beam: new JusticeBeam(),
  verdict: new Verdict(),
  heavens_wrath: new HeavensWrath(),
  lightning: new Lightning(),
  magic_shot: new MagicShot(),
  chain_lightning: new ChainLightning(),
  swap: new Swap(),
  deck_draw: new DeckDraw(),
  rewind: new Rewind(),
  corpse_blast: new CorpseBlast(),
  ghosts: new Ghosts(),
  voodoo: new Voodoo(),
  dead_harvest: new DeadHarvest(),
  ignite: new Ignite(),
  fireball: new Fireball(),
  detonate: new Detonate(),
  inferno: new Inferno(),
  ricochet: new Ricochet(),
  falcon_hunt: new FalconHunt(),
  falcon_courier: new FalconCourier(),
  double_shot: new DoubleShot(),
  arrow_rain: new ArrowRain(),
  starfall: new Starfall(),
  rail_shot: new RailShot(),
  armor_piercing: new ArmorPiercing(),
  one_shot: new OneShot(),
  bribe: new Bribe(),
  sentence: new Sentence(),
  death_mark: new DeathMark(),
  shadow_reap: new ShadowReap(),
  reaper: new Reaper(),
  shuriken_fan: new ShurikenFan(),
  smoke_screen: new SmokeScreen(),
  wind_shadow: new WindShadow(),
};
