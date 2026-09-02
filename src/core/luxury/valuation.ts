// src/core/luxury/valuation.ts
//
// ============================================================================
//  EVERY LUXURY IN THE GAME WAS WORTH EXACTLY WHAT IT COST, FOREVER
// ============================================================================
//
//  Asked for as "in the inventory, valuable jewellery or watches, if we buy
//  them they could appreciate year on year, that could be important too".
//
//  It is the difference between a shop and a market. Until now the only thing
//  that could move an owned asset's value was its CONDITION, so the whole
//  catalogue behaved like a car: buy it, watch it wear, sell it for less. A
//  vintage watch and a new helicopter aged in exactly the same direction, and
//  the only correct strategy was never to buy anything.
//
//  ---------------------------------------------------------------------------
//  TWO FORCES, NOT ONE
//  ---------------------------------------------------------------------------
//  These are separate things and they are kept separate:
//
//      CONDITION   what it has been through. upkeep.ts, and the player
//                  controls it by paying the bill.
//      THE MARKET  what the world thinks it is worth. Here, and the player
//                  controls it only by choosing what to buy.
//
//      market value = valueAt(driftedPrice(sticker, years), condition)
//
//  A neglected classic can still be worth more than it cost. A mint
//  helicopter is worth less. That is the point: the two forces pull in
//  different directions on different things, and choosing between a hypercar
//  and a vintage racer becomes a decision instead of a preference.
//
//  ---------------------------------------------------------------------------
//  WHERE THE RATES COME FROM
//  ---------------------------------------------------------------------------
//  The same place the upkeep rates did. `appreciationRatePerYear` is written
//  on four items in the shelved LuxoNet catalogue and has never had a reader:
//
//      hypercar      -2%     watch       +8%
//      private jet   -4%     mansion     +5%
//
//  Marine and jewellery had no anchor. A yacht is worse than a jet - it is the
//  standard joke about the two best days of ownership - and stones hold value
//  without the mechanical scarcity that makes a watch a market.
//
//  ---------------------------------------------------------------------------
//  AND A CLASS OF THINGS THAT IGNORES ITS CATEGORY
//  ---------------------------------------------------------------------------
//  A 1962 racer is not a car in the sense that a new hypercar is a car. The
//  catalogue already knows which is which - it carries a `type` on every item,
//  and `classic`, `classic_racer`, `race_car`, `jdm_legend`, `rally_legend`
//  and the three `vintage_*` watches are all there - so a collectible takes
//  the collector's rate whatever department it was bought in.
//
//  This is why the rate is chosen by TYPE FIRST and category second. A rule
//  keyed only on the category would have the most valuable car in the shop
//  depreciating like a runabout.
//
//  ---------------------------------------------------------------------------
//  AND IT IS CAPPED, BECAUSE COMPOUNDING OVER A DYNASTY IS ABSURD
//  ---------------------------------------------------------------------------
//  A run is decades and the game continues through successors. Eight per cent
//  a year for thirty years is ten times over, which is not a collectible, it
//  is a bug that pays out. The multiplier is bounded on both sides.
//
//  MEASURED, in multiples of the sticker price:
//
//                     10yr    20yr    40yr
//      watch          2.16    3.00    3.00   (capped from 21.7)
//      real estate    1.63    2.65    3.00   (capped from 7.0)
//      jewellery      1.34    1.81    3.00
//      collectible    1.79    3.00    3.00
//      hypercar       0.82    0.67    0.45
//      jet            0.66    0.44    0.20   (floored from 0.19)
//      yacht          0.60    0.36    0.20
//
//  So the ceiling binds for the things that go up and the floor binds for the
//  things that go down, which is the right way round: an appreciating asset
//  that runs away is an exploit, and a depreciating one that reaches zero is a
//  thing the player is still paying upkeep on for nothing.
//
//  ---------------------------------------------------------------------------
//  WHAT THIS DOES NOT DO
//  ---------------------------------------------------------------------------
//  The SHOP's prices do not move. This is the value of a thing you OWN, and a
//  catalogue that reprices itself is a different feature with its own reasons
//  to exist - and its own exploit, since buying low and selling high inside
//  one screen is a trade rather than a purchase.
//
//  ---------------------------------------------------------------------------
//  NOTED FOR THE GENERATION AFTER NEXT
//  ---------------------------------------------------------------------------
//  Asked for and deliberately deferred: when the CHILD takes over, the shop
//  should have moved on. New pieces on the shelf, some of the father's
//  favourites gone, as though a decade had passed while nobody was looking.
//
//  That is a catalogue with a generation stamp on it rather than a drift rate,
//  and it wants to be built next to the succession rather than here - the
//  inherited watch appreciating is THIS file's job, and the shop no longer
//  selling that watch is not. Written down at the point somebody would look
//  for it, because a plan agreed in conversation and recorded nowhere is a
//  plan that gets rediscovered as a missing feature.
//
//  PURE. No stores, no React.
// ============================================================================

import { valueAt } from './upkeep';
import type { LuxuryCategory } from './upkeep';

export const QUARTERS_PER_YEAR = 4;

/**
 * What the market does to a thing per year, by department.
 *
 * Four of the six are the figures somebody already wrote on the LuxoNet
 * catalogue and nothing ever read.
 */
export const DRIFT_PER_YEAR: Record<LuxuryCategory, number> = {
    WATCH: 0.08,
    REAL_ESTATE: 0.05,
    JEWELRY: 0.03,
    VEHICLE: -0.02,
    AIRCRAFT: -0.04,
    MARINE: -0.05,
    // Steeper than a yacht, because the thing that ages an orbital asset is
    // not wear, it is that somebody launches a better one. A constellation
    // bought today is competing with a constellation nobody has built yet.
    SPACE: -0.07,
};

/**
 * Types that are collected rather than used, whatever department sold them.
 *
 * Read off the catalogue's own `type` field rather than invented: these are
 * the exact values already in the data. A new type spelled differently gets
 * its category's rate, which is the safe direction to be wrong in.
 */
export const COLLECTIBLE_TYPES: readonly string[] = [
    'classic',
    'classic_racer',
    'race_car',
    'jdm_legend',
    'rally_legend',
    'vintage_icon',
    'vintage_comp',
    'vintage_complex',
];

/** What a thing nobody makes any more does per year. */
export const COLLECTIBLE_DRIFT_PER_YEAR = 0.06;

/**
 * How far the market may take a thing from its sticker price.
 *
 * The ceiling stops an appreciating asset compounding into an exploit over a
 * dynasty; the floor stops a depreciating one reaching zero and leaving the
 * player paying upkeep on nothing.
 */
export const DRIFT_CEILING = 3.0;
export const DRIFT_FLOOR = 0.2;

const finite = (n: number, fallback = 0): number =>
    Number.isFinite(n) ? n : fallback;

/** The yearly rate this particular thing moves at. Type first, then category. */
export const driftRateFor = (category: string, type?: string): number => {
    if (type && COLLECTIBLE_TYPES.includes(type)) return COLLECTIBLE_DRIFT_PER_YEAR;
    return DRIFT_PER_YEAR[category as LuxuryCategory] ?? 0;
};

/**
 * What the market has done to it after this many quarters, as a multiple.
 *
 * Compounded per quarter rather than per year so that a partial year is not a
 * cliff - a collection valued once a quarter would otherwise sit flat for
 * three quarters and jump on the fourth.
 */
export const driftMultiplier = (
    category: string,
    type: string | undefined,
    quarters: number,
): number => {
    const q = Math.max(0, finite(quarters));
    const annual = driftRateFor(category, type);
    if (annual === 0 || q === 0) return 1;

    const perQuarter = Math.pow(1 + annual, 1 / QUARTERS_PER_YEAR);
    const raw = Math.pow(perQuarter, q);
    return Math.max(DRIFT_FLOOR, Math.min(DRIFT_CEILING, raw));
};

/** The sticker price, moved by the market, before condition is considered. */
export const driftedPrice = (
    price: number,
    category: string,
    type: string | undefined,
    quarters: number,
): number => Math.max(0, finite(price)) * driftMultiplier(category, type, quarters);

/**
 * What an owned thing is worth, all in.
 *
 * THE ONE ANSWER. The store writes it, the wealth screens read it and the
 * resale price comes off it, so there is no second derivation to drift from
 * this one - which is exactly how the repair exploit happened.
 */
export const marketValueOf = (asset: {
    price: number;
    category: string;
    type?: string;
    condition: number;
    quartersOwned?: number;
}): number => valueAt(
    driftedPrice(asset?.price, asset?.category, asset?.type, asset?.quartersOwned ?? 0),
    asset?.condition,
);
