// src/features/love/logic/partnerUpkeep.ts
//
// ============================================================================
//  THE MOST EXPENSIVE PERSON IN THE GAME COST FOUR HUNDREDTHS OF A PER CENT
// ============================================================================
//
//  Reported as: the partners are not rich, make them rich, and make it follow
//  prestige. The tier ladder was already right about WHO turns up - see
//  courtship.ts, money opens the room - and completely wrong about what being
//  in that room costs, because the seven numbers were typed rather than
//  derived:
//
//      GLOBAL_ELITE 40,000   HIGH_SOCIETY 10,000   CORPORATE_ELITE 5,000
//      UNDERGROUND   2,000   ARTISTIC        800   BLUE_COLLAR      500
//      STUDENT_LIFE    200
//
//  A student to a reigning queen is two hundred times. The GATE between those
//  two rooms is a company worth nothing and a company worth a quarter of a
//  trillion, which is infinity times. So the ladder of people got flatter and
//  flatter against the ladder of money, and past about a billion dollars the
//  cost of a partner stopped being a number the player could see move.
//
//  ---------------------------------------------------------------------------
//  MEASURED, AND WORSE THAN IT LOOKED
//  ---------------------------------------------------------------------------
//  Run against the real `companyValuation` and the real `payCeiling`, at the
//  moment a player is standing exactly on each tier's gate:
//
//      tier              earns/month     partner cost      share of income
//      ARTISTIC              52,083         480 - 2,000     0.9% - 3.8%
//      CORPORATE_ELITE      520,833       3,000 - 12,500    0.6% - 2.4%
//      HIGH_SOCIETY       5,208,333       6,000 - 25,000    0.1% - 0.5%
//      GLOBAL_ELITE     260,416,667      24,000 - 100,000   0.01% - 0.04%
//
//  The bottom of the ladder was fine and the top was a rounding error. A
//  dynasty that has just walked into the room above old money is introduced to
//  a head of state and told she costs one part in ten thousand of the money.
//
//  ---------------------------------------------------------------------------
//  SO THE ROOM'S OWN PRICE DECIDES WHAT THE ROOM COSTS
//  ---------------------------------------------------------------------------
//  `TIER_UNLOCK` already says what a company must be worth to be seen in each
//  room. That number is the only honest anchor available: it is what the game
//  has already decided this level of society is worth. Everything below is
//  derived from it, so the two ladders cannot drift apart again - and if
//  anybody moves a gate, the cost of the people behind it moves with it.
//
//  PURE. No stores, no clock.
// ============================================================================

import { payCeiling } from '../../../core/market/ceoPay';
import { MONTHS_PER_QUARTER } from '../../../core/market/personalEconomy';
import { TIER_UNLOCK } from './courtship';
import type { PersonalityTrait, SocialTier } from '../../../data/relationshipTypes';

/**
 * How much annual revenue sits behind a dollar of company value. MEASURED.
 *
 * Not guessed: `companyValuation` was run across five orders of magnitude of
 * revenue, at three margins, public and private. The ratio is flat in the size
 * of the company and depends only on those two things:
 *
 *      margin   private   public
 *        8%       0.70     1.16
 *       15%       0.94     1.59
 *       25%       1.28     2.22
 *
 * 1.6 is the public company at a fifteen per cent margin, which is what a
 * player standing on one of the upper gates actually looks like - the top two
 * rooms open at five billion and at a quarter of a trillion, and nobody
 * arrives there private and thin. It is the middle of the measured range too,
 * so it is wrong by less than a factor of two at either extreme.
 */
export const VALUE_TO_REVENUE = 1.6;

/**
 * What a partner costs, as a share of what the player earns in the month.
 *
 * Five per cent, and the number is taken from the game rather than invented:
 * the ungated bottom of the ladder already runs at 2% to 8% of the founder's
 * base pay, and that is the feel Salih has been playing with since the start.
 * So this is the bottom rung's arithmetic, applied all the way up.
 *
 * Against `costMultiplier`, which runs 0.6 to 2.5, it opens into a real band:
 * a Strategic Pragmatist takes 3% of the month and a High Maintenance takes
 * 12.5%. That is a decision. A flat 0.04% is not.
 */
export const UPKEEP_SHARE_OF_PAY = 0.05;

/**
 * What the chief executive of a company this size may pay themselves, monthly.
 *
 * Straight through `payCeiling`, which is the actual rule the game runs on -
 * two per cent of trailing annual revenue, floored at the founder's base
 * salary. Reusing it rather than restating it is the whole point: the day
 * somebody changes MAX_PAY_SHARE_OF_REVENUE, this moves with it.
 */
export const monthlyPayAtValue = (companyValue: number): number => {
    const value = Math.max(0, companyValue || 0);
    const annualRevenue = value / VALUE_TO_REVENUE;
    return payCeiling(annualRevenue) / MONTHS_PER_QUARTER;
};

/**
 * Two significant figures, and it is not cosmetic.
 *
 * The derivation lands on $13,020,833. A number like that on a card reads as
 * an accident - it looks computed, which is exactly what a player should not
 * be thinking about while looking at a person. $13,000,000 reads as a price.
 *
 * It also stops a one point move in any upstream constant showing up as a
 * different-looking partner, which would make the two ladders feel loose even
 * though they are welded together.
 */
export const readable = (amount: number): number => {
    const n = Math.max(0, Math.round(amount || 0));
    if (n < 100) return n;
    const digits = Math.floor(Math.log10(n));
    const step = Math.pow(10, digits - 1);
    return Math.round(n / step) * step;
};

// ---------------------------------------------------------------------------
//  THE THREE ROOMS THAT ARE OPEN TO EVERYBODY
// ---------------------------------------------------------------------------
//  STUDENT_LIFE, BLUE_COLLAR and UNDERGROUND have a gate of ZERO, so there is
//  nothing to derive from. That is not a hole in the rule, it is the rule
//  working: those three rooms do not care what the player is worth, so what
//  the people in them cost cannot depend on it either. A master sommelier
//  lives the same way whether they are seeing a founder or a dynasty.
//
//  They keep the numbers they have always had, and the numbers are ORDERED BY
//  LIFESTYLE RATHER THAN BY STANDING. UNDERGROUND is the bottom of
//  TIER_STANDING and the dearest of the three, because a high-stakes syndicate
//  whale lives expensively and a physics fellow does not. Standing is about
//  who will be seen with you; this is about what their week costs.
// ---------------------------------------------------------------------------
const UNGATED_UPKEEP: Partial<Record<SocialTier, number>> = {
    UNDERGROUND: 2_000,
    BLUE_COLLAR: 500,
    STUDENT_LIFE: 200,
};

/**
 * What somebody from this room costs a month, before their personality.
 *
 * Gated rooms derive it from their own gate. Ungated rooms keep a flat figure,
 * for the reason above.
 */
export const baseUpkeepFor = (tier: SocialTier): number => {
    const flat = UNGATED_UPKEEP[tier];
    if (flat !== undefined) return flat;

    const gate = TIER_UNLOCK[tier] ?? 0;
    if (gate <= 0) {
        // A gated tier whose gate has been moved to zero. Not currently
        // reachable, and falling back to the dearest ungated figure is better
        // than returning nothing and making a partner free.
        return UNGATED_UPKEEP.UNDERGROUND!;
    }
    return readable(monthlyPayAtValue(gate) * UPKEEP_SHARE_OF_PAY);
};

/**
 * And what THIS person costs, personality included.
 *
 * `costMultiplier` is unchanged and still does the whole of the work it did
 * before. What changed underneath it is the base it multiplies.
 */
export const upkeepFor = (
    tier: SocialTier,
    personality: Pick<PersonalityTrait, 'costMultiplier'> | null | undefined,
): number => {
    const multiplier = Number.isFinite(personality?.costMultiplier)
        ? Math.max(0, personality!.costMultiplier)
        : 1;
    return readable(baseUpkeepFor(tier) * multiplier);
};

// ============================================================================
//  AND NOW THAT IT IS A REAL NUMBER, IT CAN BE UNAFFORDABLE
// ============================================================================
//
//  This did not need to exist while the ceiling was forty thousand a month:
//  nobody who could reach GLOBAL_ELITE could fail to pay it. At thirteen
//  million it needs to exist, and the case that produces it is not exotic - it
//  is the ordinary shape of this game.
//
//  An heir inherits a partner along with the chair. The chair is worth less
//  than it was, because succession costs and because the company they are
//  handed is the company their parent left. The upkeep is not renegotiated by
//  anybody: it is charged out of PERSONAL cash every quarter, unconditionally,
//  and personal cash is allowed to go negative.
//
//  So without this, the failure mode is silent: a number the player never
//  looks at goes further and further below zero for years.
//
//  ---------------------------------------------------------------------------
//  WHAT HAPPENS INSTEAD IS THE CHEAPEST TRUE THING
//  ---------------------------------------------------------------------------
//  They notice. The shortfall costs `love`, in proportion to how much of the
//  bill went unpaid, and `love` is already what decides whether somebody stays
//  and whether they will marry you. No new system, no new screen: the person
//  who is used to a certain life stops being fond of somebody who cannot pay
//  for it, which is a thing the game can say in one sentence.
//
//  The money is STILL CHARGED. This is not a discount for being poor.
// ============================================================================

/** The most love a single quarter of not paying can cost. */
export const MAX_STRAIN_PER_QUARTER = 12;

/**
 * What an unaffordable quarter costs in love.
 *
 * `shortfall` is how much of the bill the player could not cover, `owed` is
 * the whole bill. Nothing missed costs nothing; the whole bill missed costs
 * the full twelve, and it is linear between - so a player who covers most of
 * it is treated as having covered most of it.
 */
export const upkeepStrain = (owed: number, shortfall: number): number => {
    const bill = Math.max(0, owed || 0);
    if (bill <= 0) return 0;
    const missed = Math.max(0, Math.min(bill, shortfall || 0));
    // NEGATIVE ZERO. `-Math.round(x * 0)` is -0, which is not 0 under
    // Object.is and which a store would happily pass on as a delta. Caught by
    // the test below rather than reasoned about, and worth an early return
    // rather than a clever negation: "nothing missed costs nothing" should
    // read as that.
    if (missed <= 0) return 0;
    return -Math.round(MAX_STRAIN_PER_QUARTER * (missed / bill));
};
