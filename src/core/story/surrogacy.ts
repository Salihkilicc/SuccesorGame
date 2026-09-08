// src/core/story/surrogacy.ts
//
// ============================================================================
//  THE OTHER WAY A DYNASTY GETS AN HEIR
// ============================================================================
//
//  The dating pool now leans away from the player rather than flipping a coin,
//  so a woman playing this game meets women about one time in five and can
//  marry one. That opened a hole nobody had to think about before: the only
//  route to a child was a button whose single condition was `isMarried`, and
//  a couple of the same gender pressing it produced a biological child out of
//  nowhere.
//
//  Closing the button on its own would have been worse than leaving it. A
//  founder who dies with no children gets `diedWithoutAnHeir` and the RUN
//  ENDS - so a blocked button quietly turns marrying somebody of the same
//  gender into a decision to end the dynasty, which is not a rule anybody
//  chose and not one the game says out loud.
//
//  So there is a second door, and it costs something. Not a percentage of
//  what the player is worth: this is a medical and legal arrangement with a
//  market price, and billing a trillionaire ten billion for it would be
//  absurd. A flat price is felt hard by a founder and is nothing to a dynasty,
//  which is exactly what a service should be.
//
//  ---------------------------------------------------------------------------
//  AND IT TAKES THE TIME IT TAKES
//  ---------------------------------------------------------------------------
//  Three quarters. That is nine months and it needs no other justification -
//  the number is the real one. It also does the thing the price cannot: the
//  free route is instant, so without a wait the paid route would be strictly
//  worse in every way that matters and the price would be the whole story.
//  A wait makes it a decision made EARLY rather than a purchase made late.
//
//  PURE. No stores, no clock. See core/store/useFamilyStore.ts for where the
//  booking is kept and useGameStore for the quarter that delivers it.
// ============================================================================

/** What the arrangement costs, from personal money rather than the company. */
export const SURROGACY_COST = 750_000;

/** Quarters between paying and the child arriving. Nine months. */
export const SURROGACY_QUARTERS = 3;

/** A booking that has been paid for and is waiting. */
export type PendingBirth = {
    /** Chosen when it was booked, so no modal has to open on a tick. */
    name: string;
    gender: 'Male' | 'Female';
    /** Counts down to zero. Delivered on the quarter it reaches zero. */
    quartersLeft: number;
};

/** Everything the caller needs to decide what to draw. */
export type SurrogacyOffer =
    /** Not applicable: they can simply have a child. */
    | { kind: 'notNeeded' }
    /** No partner, or not married. The ordinary rule, unchanged. */
    | { kind: 'unavailable'; reason: 'noPartner' | 'notMarried' }
    /** Offered, and this is what it costs. */
    | { kind: 'offered'; cost: number; quarters: number; affordable: boolean }
    /** Already paid for and on its way. */
    | { kind: 'waiting'; quartersLeft: number };

export type SurrogacyInput = {
    playerGender?: 'male' | 'female';
    partnerGender?: 'male' | 'female';
    isMarried?: boolean;
    money?: number;
    pending?: PendingBirth | null;
};

/**
 * Whether the two of them can have a child between them.
 *
 * UNKNOWN GENDER COUNTS AS YES. A partner met before PartnerProfile.gender
 * existed has none, and taking the ordinary route away from an old save
 * because of a missing field would break a dynasty that was running fine.
 * The same reasoning as the portraits: when the game does not know, it does
 * not act on a guess.
 */
export const canConceiveTogether = (
    playerGender?: 'male' | 'female',
    partnerGender?: 'male' | 'female',
): boolean => {
    if (playerGender !== 'male' && playerGender !== 'female') return true;
    if (partnerGender !== 'male' && partnerGender !== 'female') return true;
    return playerGender !== partnerGender;
};

/**
 * What the partner card should show where the baby button used to be.
 *
 * One function rather than four conditions on a screen, because the screen is
 * where this kind of rule goes to rot: a card that decides for itself whether
 * somebody can have a child is a card that will disagree with the tick.
 */
export const surrogacyOffer = (input: SurrogacyInput): SurrogacyOffer => {
    const { playerGender, partnerGender, isMarried, money, pending } = input;

    // A booking outlives everything. The money is spent and the arrangement
    // is made; a break-up does not undo either, and refunding it would make
    // booking and cancelling a way to park cash.
    if (pending) return { kind: 'waiting', quartersLeft: pending.quartersLeft };

    if (canConceiveTogether(playerGender, partnerGender)) return { kind: 'notNeeded' };

    // The marriage requirement is the one that was already there, applied
    // unchanged. This route is not a way around it.
    if (partnerGender === undefined) return { kind: 'unavailable', reason: 'noPartner' };
    if (!isMarried) return { kind: 'unavailable', reason: 'notMarried' };

    return {
        kind: 'offered',
        cost: SURROGACY_COST,
        quarters: SURROGACY_QUARTERS,
        affordable: (money ?? 0) >= SURROGACY_COST,
    };
};

/**
 * One quarter passes for a booking.
 *
 * Returns the booking that is still waiting, or null once it is done - so the
 * caller stores the result and the arrival is `advanceBooking(...) === null`
 * with a booking that existed. No second flag to fall out of step with the
 * counter.
 */
export const advanceBooking = (pending: PendingBirth | null): PendingBirth | null => {
    if (!pending) return null;
    const left = pending.quartersLeft - 1;
    return left > 0 ? { ...pending, quartersLeft: left } : null;
};

/** Whether this tick is the one the child arrives on. */
export const arrivesThisQuarter = (pending: PendingBirth | null): boolean =>
    !!pending && pending.quartersLeft <= 1;
