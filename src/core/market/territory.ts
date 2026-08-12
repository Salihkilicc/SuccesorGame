// src/core/market/territory.ts
//
// ============================================================================
//  WALKING INTO SOMEBODY ELSE'S MARKET
// ============================================================================
//
//  Four product markets, four incumbents who were there first. The moment the
//  player ships into a category they have never sold in, whoever is largest in
//  it writes to them, and the letter contains one decision with two answers.
//
//  ---------------------------------------------------------------------------
//  THE SHAPE OF THE DILEMMA, AND WHY IT IS NOT SYMMETRICAL
//  ---------------------------------------------------------------------------
//  A choice between two costs is only interesting if the costs are different
//  KINDS of thing. Two doors that both take money is one door with a slider.
//
//      DEFER   You take their terms. It costs NOTHING today and a percentage
//              of that category's revenue for the rest of the game. It is
//              free while you are small in the market and expensive exactly
//              in proportion to how well you eventually do - so the player who
//              accepts it is taxing a success they cannot yet imagine having.
//
//      FIGHT   They come for you now. Their pull in that category rises for a
//              handful of quarters, which costs share and therefore money
//              while it lasts - and then it stops, and you owe nobody
//              anything.
//
//  Deferring is cheap now and compounds. Fighting is expensive now and ends.
//  That is the real shape of an incumbent-versus-entrant fight and it means
//  neither answer is the correct one twice: a player who is about to win the
//  category should fight, and one who is passing through should not.
//
//  ---------------------------------------------------------------------------
//  PURE, AND IMPORTING NOTHING FROM THE APP
//  ---------------------------------------------------------------------------
//  Same split as negotiation.ts and effects.ts. The arithmetic is here, the
//  memory is in useTerritoryStore, and the tick is the only thing that knows
//  about both.
// ============================================================================

import { PRODUCT_MARKETS, type MarketCategory } from './productMarkets';

// ============================================================================
//  WHO OWNS EACH MARKET
// ============================================================================
//  DERIVED, NOT WRITTEN DOWN. The giant of a category is whoever holds the
//  most of it in PRODUCT_MARKETS, computed here rather than listed in a second
//  place - the same reasoning that put the negotiators' target ids under a
//  test against the market list. A hand-written roster is a roster that
//  disagrees with the data the first time somebody rebalances a share.
// ============================================================================

export interface Giant {
    category: MarketCategory;
    stockId: string;
    name: string;
    share: number;
    strength: number;
}

export const giantOf = (category: string): Giant | undefined => {
    const market = PRODUCT_MARKETS.find(m => m.category === category);
    if (!market || !market.competitors.length) return undefined;
    const top = market.competitors.reduce((best, c) => (c.share > best.share ? c : best));
    return {
        category: market.category,
        stockId: top.stockId,
        name: top.name,
        share: top.share,
        strength: top.strength,
    };
};

export const GIANTS: Giant[] = PRODUCT_MARKETS
    .map(m => giantOf(m.category))
    .filter((g): g is Giant => !!g);

// ============================================================================
//  THE PRICE OF NOT FIGHTING
// ============================================================================
//  A standing cut of what you make in their category. Not a licence you buy
//  and own - a percentage, forever, and it is charged on REVENUE rather than
//  on profit, because a loss-making quarter is not a reason for them to waive
//  it and they would never write it that way.
// ============================================================================

/**
 * The cut, and it is the same for all four.
 *
 * DECLARED HERE AND RE-DECLARED IN data/events/territory.ts, which is the one
 * piece of duplication in this feature and it is not an accident. The audit
 * enforces that story data may not import the engine - `loadTs` refuses any
 * path outside core/story and data/story - and the first version of the scene
 * file imported these three constants from here. The audit did not complain
 * about the import. It stopped being able to read data/events at all, and
 * reported one line about an undefined id while four scenes and a whole
 * category of check went quietly dark.
 *
 * So the scenes carry their own numbers, because a scene IS the contract and
 * the engine only does arithmetic on what it is handed. The two are held
 * together by a test rather than by an import.
 *
 * 6%, AND THE FIRST ANSWER WAS 4%, WHICH MADE THE DILEMMA FAKE.
 *
 * The two costs have to cross somewhere a player will actually reach, or one
 * of the two doors is simply correct and the letter is decoration. Measured
 * against the real share formula, at flat revenue:
 *
 *     siege     ~31% of the category for six quarters  = 1.86 quarters of it
 *     royalty   the rate, every quarter, forever
 *
 * At 4% the crossover was around 46 quarters - eleven and a half years, past
 * the end of most campaigns - so deferring was the right answer nearly every
 * time. At 6% it lands near 31 quarters, which is mid-campaign, and a player
 * whose category is GROWING reaches it sooner still, because the royalty
 * scales with the revenue and the siege does not.
 *
 * Six points of revenue is roughly an eighth of the gross margin on that line.
 * Steep - and it has to be, because on the day it is signed it costs nothing
 * at all, which is the whole trap.
 */
export const ROYALTY_RATE = 0.06;

export interface RoyaltyTerm {
    category: string;
    rate: number;
    /** The quarter it was agreed, for the letter and for the audit trail. */
    since: number;
    /** Whose terms these are. */
    giant: string;
}

export const royaltyDue = (
    revenueByCategory: Record<string, number>,
    terms: RoyaltyTerm[],
): number =>
    terms.reduce(
        (sum, t) => sum + Math.max(0, revenueByCategory[t.category] ?? 0) * t.rate,
        0,
    );

// ============================================================================
//  THE PRICE OF FIGHTING
// ============================================================================
//  They put their weight into the category. In `computeShares` the player's
//  share is
//
//      sumPlayer / (sumPlayer + K)
//
//  where K is the competitor pool. A siege multiplies K, which is exactly
//  what an incumbent spending against a new entrant does: it does not remove
//  your product, it makes everything else more attractive than it was.
//
//  IT ENDS, AND THAT IS THE POINT. A permanent penalty for fighting would
//  make deferring correct every time, which is the same as not having a
//  choice. Six quarters is long enough to hurt through a whole financial year
//  and short enough that a player can decide to ride it out.
// ============================================================================

export const SIEGE_QUARTERS = 6;
/**
 * How much heavier the field gets.
 *
 * 1.45 on K. Measured against the share formula: a player holding 20% of a
 * category (sumPlayer = K/4) drops to about 14.7% under it - a third of their
 * position, which is a bad year rather than an extinction. At 2.0 the same
 * player falls to 11% and the fight is unwinnable, which would make the
 * choice fake in the other direction.
 */
export const SIEGE_PRESSURE = 1.45;

export interface Siege {
    category: string;
    /** Counts down every quarter and is removed at zero. */
    quartersLeft: number;
    pressure: number;
    giant: string;
}

/** What to multiply the competitor pool by in this category this quarter. */
export const siegePressure = (category: string, sieges: Siege[]): number =>
    sieges
        .filter(s => s.category === category && s.quartersLeft > 0)
        .reduce((mult, s) => mult * s.pressure, 1);

/** One quarter passes. Expired sieges are dropped rather than left at zero. */
export const advanceSieges = (sieges: Siege[], quarters: number = 1): Siege[] =>
    sieges
        .map(s => ({ ...s, quartersLeft: s.quartersLeft - Math.max(1, quarters) }))
        .filter(s => s.quartersLeft > 0);

// ============================================================================
//  WHAT COUNTS AS WALKING IN
// ============================================================================
//  Not owning a product in the category - SELLING one. A product designed and
//  never shipped is not a territorial fact, and the incumbent has no way of
//  knowing about it. The tick raises the flag off the quarter's actual sales.
// ============================================================================

export const CATEGORY_FLAG: Record<string, string> = {
    Robotics: 'enteredRobotics',
    'Deep Tech': 'enteredDeepTech',
    'Bio-Tech': 'enteredBioTech',
};

/**
 * Consumer is deliberately absent.
 *
 * The player's starter product is a phone, so they have been in Consumer since
 * the first quarter and an "entry" flag there would either fire in Q1 - before
 * the father has died and before any of this makes sense - or never fire at
 * all. Its incumbent is Pear, and Pear's letter is triggered by SHARE instead:
 * he does not mind that you are in his market, he minds that you have started
 * to matter in it. See data/events/territory.ts.
 */
export const entriesThisQuarter = (
    soldByCategory: Record<string, number>,
    alreadyFlagged: (flag: string) => boolean,
): string[] =>
    Object.entries(CATEGORY_FLAG)
        .filter(([category, flag]) =>
            (soldByCategory[category] ?? 0) > 0 && !alreadyFlagged(flag))
        .map(([, flag]) => flag);
