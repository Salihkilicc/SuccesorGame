// src/core/story/standing.ts
//
// ============================================================================
//  MONEY BUYS SOME OF WHAT BEING RESPECTED BUYS
// ============================================================================
//
//  `publicReputation` is what the world thinks of you, and until now it was the
//  whole of it: a dial moved by the FBI, by a plant accident, by a crisis
//  answered well or badly. Nothing you owned touched it. A billionaire and a
//  man with a factory got the same answer from the same room, which is not how
//  any room has ever worked.
//
//  ---------------------------------------------------------------------------
//  IT IS ADDED, NOT WRITTEN IN
//  ---------------------------------------------------------------------------
//  The tempting version nudges the dial every quarter as the net worth grows.
//  It is wrong twice: the dial is a story record that events move by hand, so a
//  quarterly nudge would fight every one of them, and the bonus would COMPOUND
//  rather than track, so a player who got rich and then went broke would keep
//  the standing.
//
//  This is derived instead. The dial is untouched and stays exactly what the
//  story made it; the money is added at the moment somebody asks, and it goes
//  away when the money does.
//
//  ---------------------------------------------------------------------------
//  TWENTY POINTS, AND WHY THAT IS THE RIGHT SIZE
//  ---------------------------------------------------------------------------
//  Enough to matter and not enough to replace the other thing. Reputation runs
//  0 to 100 and the courtship weight is 0.7, so twenty points of wealth is
//  fourteen points of acceptance: real, and about a fifth of the range.
//
//  What it must NOT do is make the disgraced billionaire a solved problem. The
//  FBI conviction is worth minus thirty five in one go and a crisis answered
//  badly is minus ten; being rich cannot buy either of those back. It buys a
//  head start, and a man who has been indicted is still finished.
//
//  LOGARITHMIC, because wealth in this game spans fifty thousand dollars to a
//  trillion and a linear scale would be zero for the entire first act and
//  saturated for the rest. Each factor of ten is worth the same amount, which
//  is also how people actually talk about it.
//
//  PURE. No stores, no clock. `readStanding` in world.ts does the reading.
// ============================================================================

/** Below this, money is not yet a thing anybody has heard about. */
export const WEALTH_PRESTIGE_FLOOR = 10_000_000;

/** And above this it stops helping. You are already as rich as it gets. */
export const WEALTH_PRESTIGE_CEILING = 10_000_000_000;

/**
 * The most that money alone is worth.
 *
 * Twenty. See the header for why it is not more: a disgraced billionaire has
 * to stay a disgraced billionaire.
 */
export const WEALTH_PRESTIGE_MAX = 20;

/**
 * What being worth this much adds to how the world sees you. 0 to 20.
 *
 * Measured against PERSONAL net worth rather than the company's value, and the
 * distinction earns its keep: `companyValue` already decides which rooms open
 * (see features/love/logic/courtship.ts) and reusing it here would make one
 * number do two jobs. Net worth is what the player actually holds, so selling
 * their stake down costs them standing and a founder who kept it has something
 * a hired chief executive does not.
 */
export const wealthPrestige = (netWorth: number): number => {
    // NaN and Infinity both read as "I do not trust this number" and both give
    // nothing. Safe direction on purpose: a broken figure that silently awards
    // the maximum is a bug that looks like a feature.
    const worth = Number.isFinite(netWorth) ? netWorth : 0;
    if (worth <= WEALTH_PRESTIGE_FLOOR) return 0;
    if (worth >= WEALTH_PRESTIGE_CEILING) return WEALTH_PRESTIGE_MAX;

    // Each factor of ten is worth the same, which is also how people talk
    // about money: the step from ten million to a hundred feels like the step
    // from a hundred million to a billion, and it is not the same number of
    // dollars.
    const span = Math.log10(WEALTH_PRESTIGE_CEILING) - Math.log10(WEALTH_PRESTIGE_FLOOR);
    const climbed = Math.log10(worth) - Math.log10(WEALTH_PRESTIGE_FLOOR);
    return WEALTH_PRESTIGE_MAX * (climbed / span);
};

/**
 * How the world sees you: what you did, plus what you are worth.
 *
 * CAPPED AT 100, which is the only reason the cap is stated out loud. A player
 * at reputation 95 who is worth ten billion computes to 115, and every reader
 * of this number treats it as a percentage. Letting it out at 115 would be
 * harmless in the courtship sum and would quietly break the first thing that
 * ever divides by it.
 */
export const standing = (publicReputation: number, netWorth: number): number => {
    const base = Number.isFinite(publicReputation) ? publicReputation : 0;
    return Math.max(0, Math.min(100, base + wealthPrestige(netWorth)));
};
