// src/data/story/pearPrice.ts
//
// ============================================================================
//  ONE NUMBER, AND BOTH HALVES OF THE LETTER READ IT
// ============================================================================
//
//  Pear's offer appears twice in the game and it appeared in two places in the
//  code, which is how they came apart.
//
//    THE WORDS said `{pearOffer}`, a token filled by data/i18n/storyText.ts,
//    which computes `max(48M, companyValue * 1.25)`.
//
//    THE MONEY was `{ kind: 'cash', amount: OFFER }` in pearOffer.ts, with
//    OFFER a literal 48,000,000.
//
//  Those agree in the sixth quarter and only in the sixth quarter, because
//  that is the only time the company is small enough for the floor to bind.
//  A player who reached the letter with a larger company was promised a number
//  in the salutation and paid a different one on signing, and nothing anywhere
//  would have said so: the ending fires immediately afterwards, so the only
//  trace is a figure on the closing record that does not match the letter the
//  player just read.
//
//  It became load-bearing the moment Pear started writing to SUCCESSORS, where
//  the company is measured in billions and the floor never binds at all.
//
//  So: one function, and the two callers ask it rather than each other.
// ============================================================================

/**
 * What Pear will pay, all cash, no financing condition.
 *
 * A PREMIUM ON THE VALUATION, which is the whole reason the offer is hard to
 * refuse. Vogel does not underpay - that is stated in the ending text for
 * taking it - and an insultingly low offer would be easy to turn down and
 * would cost the scene everything.
 */
export const PEAR_OFFER_MULTIPLE = 1.25;

/**
 * The floor, for the first letter.
 *
 * The father's company is worth about four and a half million in the sixth
 * quarter, and 1.25 times that is a rounding error rather than a temptation.
 * Forty eight million is life changing money for a twenty six year old, which
 * is what makes `soldToPear` a real ending rather than a mistake.
 *
 * It stops binding almost immediately and it is meant to.
 */
export const PEAR_OFFER_FLOOR = 48_000_000;

/** What the letter says, and what signing pays. The same call, both times. */
export const pearOfferAmount = (companyValue: number): number => {
    const worth = Number.isFinite(companyValue) ? Math.max(0, companyValue) : 0;
    return Math.max(PEAR_OFFER_FLOOR, Math.round(worth * PEAR_OFFER_MULTIPLE));
};
