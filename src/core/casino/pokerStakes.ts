// src/core/casino/pokerStakes.ts
//
// ============================================================================
//  A POKER ROOM HAS A BUY-IN, NOT A CHIP RACK
// ============================================================================
//
//  Asked for as: "in poker remove the bets, set a buy-in for each country and
//  for the VIP room, and you enter by paying it. Once you are in the game the
//  bets should show as percentages, 5 10 20 25 with plus and minus, like normal
//  poker. And in the VIP room let it be ten per cent of your money."
//
//  The chip rack was borrowed from the other three games and it never fitted
//  here. Roulette, blackjack and the slot are all one-shot: you choose a stake,
//  you play it, it resolves. Poker is a SESSION - you buy in once and the
//  betting happens inside the hand - so a rail of four chips outside the table
//  was asking a question that has no meaning at a poker room door. Every real
//  room posts one number on the wall instead, and that number is the buy-in.
//
//  ---------------------------------------------------------------------------
//  THE DOOR PRICE IS THE ROOM'S OWN SHARE
//  ---------------------------------------------------------------------------
//  Every location already carries the fraction of your fortune it plays for -
//  Athens half a per cent, Macau five - and it exists precisely so the danger
//  scales with the man rather than with the decade. See data/casinoStakes.ts.
//
//  So the poker buy-in IS that share, and the ladder ends exactly where it was
//  asked to:
//
//      Athens        0.5%
//      Istanbul        1%
//      Las Vegas       2%
//      Monte Carlo   3.5%
//      Macau           5%
//      VIP Noir       10%     asked for by name
//
//  Nothing is typed twice. A room that changes its share changes its poker
//  door with it, and there is no second ladder to fall out of step.
//
//  ---------------------------------------------------------------------------
//  AND THE RAISE IS A SHARE OF WHAT IS IN FRONT OF YOU
//  ---------------------------------------------------------------------------
//  5, 10, 20, 25 per cent of your STACK rather than of the pot.
//
//  Pot fractions are the language poker players use, but they break at the
//  bottom: five per cent of a pot is almost always below the minimum raise, so
//  two of the four buttons would produce the same number and the player would
//  reasonably think they were broken. A share of your own chips is always a
//  legal, meaningful bet, and it shrinks by itself when you are short - which
//  is exactly when bet sizing starts to matter.
//
//  PURE. No stores, no React.
// ============================================================================

/** The four quick sizes, as percentages of the player's own stack. */
export const RAISE_STEPS: readonly number[] = [5, 10, 20, 25];

/** What the plus and minus move by. */
export const RAISE_NUDGE = 5;

/** The smallest and largest the stepper will go. */
export const RAISE_MIN_PCT = 5;
export const RAISE_MAX_PCT = 100;

/**
 * How many big blinds the room's buy-in is worth.
 *
 * The buy-in is the room's share of the fortune; this is what divides it into
 * a blind. A hundred is the standard cash game stack and the reason is in
 * core/casino/pokerSession.ts.
 */
export const BLINDS_PER_BUY_IN = 100;

/**
 * What it costs to sit down.
 *
 * `share` is the room's own fraction and `floor` its absolute minimum, both
 * taken from the location. Passed in rather than imported so this file never
 * learns what a CasinoLocation is - the engine folder does not reach into
 * feature data.
 */
export const pokerBuyIn = (money: number, share: number, floor: number): number => {
    const wealth = Math.max(0, Number.isFinite(money) ? money : 0);
    const pct = Math.max(0, Number.isFinite(share) ? share : 0);
    const min = Math.max(0, Number.isFinite(floor) ? floor : 0);
    return Math.floor(Math.max(min, wealth * pct));
};

/** The big blind that buy-in implies. Never zero, or nobody can post. */
export const blindFor = (buyIn: number): number =>
    Math.max(1, Math.floor(Math.max(0, buyIn || 0) / BLINDS_PER_BUY_IN));

/** Whether the door will open at all. */
export const canAffordBuyIn = (money: number, buyIn: number): boolean =>
    (Number.isFinite(money) ? money : 0) >= buyIn && buyIn > 0;

/**
 * What a percentage button actually bets.
 *
 * Three things have to be true of the number this returns, and the reason the
 * clamping lives here rather than in the screen is that all three are RULES
 * rather than presentation:
 *
 *   IT MUST BE A RAISE. Below the current bet plus one it is a call wearing a
 *   raise's label, and the street would never close.
 *   IT CANNOT EXCEED THE STACK. Above it, the engine silently caps and the
 *   button lies about what it will do.
 *   IT IS MEASURED FROM THE STACK, so a short player's buttons shrink with
 *   them instead of all four collapsing onto all-in.
 */
export const raiseAmount = (
    percent: number,
    stack: number,
    committed: number,
    toMatch: number,
): number => {
    const chips = Math.max(0, Number.isFinite(stack) ? stack : 0);
    const inAlready = Math.max(0, Number.isFinite(committed) ? committed : 0);
    const bar = Math.max(0, Number.isFinite(toMatch) ? toMatch : 0);
    const pct = Math.max(0, Math.min(RAISE_MAX_PCT, Number.isFinite(percent) ? percent : 0));

    const ceiling = inAlready + chips;
    const want = inAlready + Math.round(chips * (pct / 100));
    return Math.max(Math.min(bar + 1, ceiling), Math.min(want, ceiling));
};

/** Move the stepper, staying inside the ladder. */
export const nudgeRaise = (percent: number, by: number): number => {
    const p = Number.isFinite(percent) ? percent : RAISE_MIN_PCT;
    const next = Math.round((p + by) / RAISE_NUDGE) * RAISE_NUDGE;
    return Math.max(RAISE_MIN_PCT, Math.min(RAISE_MAX_PCT, next));
};

/** True when this percentage would put every chip in. */
export const isAllIn = (
    percent: number, stack: number, committed: number, toMatch: number,
): boolean =>
    raiseAmount(percent, stack, committed, toMatch) >= committed + stack;
