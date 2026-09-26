import type { AbilityBehaviorId } from '../../catalog';
import { ArmedTrap } from './archer/armed-trap/ArmedTrap';
import { Hook } from './archer/hook/Hook';
import { Stampede } from './archer/stampede/Stampede';
import { Trap } from './archer/trap/Trap';
import type { IAbility } from './interfaces/IAbility';
import { ChainLightning } from './mage/chain-lightning/ChainLightning';
import { Detonate } from './mage/detonate/Detonate';
import { Ray } from './mage/ray/Ray';
import { Shuffle } from './mage/shuffle/Shuffle';
import { Swap } from './mage/swap/Swap';
import { Bribe } from './mercenary/bribe/Bribe';
import { DeathMark } from './mercenary/death-mark/DeathMark';
import { Reaper } from './mercenary/reaper/Reaper';
import { Sentence } from './mercenary/sentence/Sentence';
import { ShadowReap } from './mercenary/shadow-reap/ShadowReap';
import { ShurikenFan } from './mercenary/shuriken-fan/ShurikenFan';
import { SmokeScreen } from './mercenary/smoke-screen/SmokeScreen';
import { WindShadow } from './mercenary/wind-shadow/WindShadow';
import { Strike } from './shared/strike/Strike';
import { Ward } from './shared/ward/Ward';
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
  strike: new Strike(),
  ward: new Ward(),
  chain_lightning: new ChainLightning(),
  ray: new Ray(),
  detonate: new Detonate(),
  swap: new Swap(),
  shuffle: new Shuffle(),
  hook: new Hook(),
  stampede: new Stampede(),
  trap: new Trap(),
  armed_trap: new ArmedTrap(),
  bribe: new Bribe(),
  sentence: new Sentence(),
  death_mark: new DeathMark(),
  shadow_reap: new ShadowReap(),
  reaper: new Reaper(),
  shuriken_fan: new ShurikenFan(),
  smoke_screen: new SmokeScreen(),
  wind_shadow: new WindShadow(),
};
