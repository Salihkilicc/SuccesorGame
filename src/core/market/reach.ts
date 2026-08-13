// src/core/market/reach.ts
//
// ============================================================================
//  SOME COMPANIES ARE NOT BOUGHT. THEY ARE TALKED TO.
// ============================================================================
//
//  The acquisition screen offered "Friendly offer" against Pear Inc. exactly
//  as it offered it against a dental clinic: a button, a price, a tap. Pear is
//  three trillion. The player's company starts at two million.
//
//  That is not a difficulty problem - the financing check would refuse it
//  anyway and print a reason. It is a FICTION problem. The screen said the
//  approach existed, and the whole design of the mail negotiation is that
//  against a company of that size the approach does not exist: you write to
//  them, you wait a quarter, and somebody answers. That is the entire point of
//  having built it.
//
//  So the button is locked, and the lock says where to go instead.
//
//  ---------------------------------------------------------------------------
//  AN ABSOLUTE LINE, NOT A RELATIVE ONE
//  ---------------------------------------------------------------------------
//  The obvious rule is "anything worth more than half of you", which scales
//  with the player and needs no constant. It was rejected on purpose: it makes
//  the lock a moving target, so the set of companies you have to write to
//  changes every quarter and nothing in the world feels fixed.
//
//  Pear is untouchable because Pear is enormous, not because you are small.
//  A trillion-dollar company does not become approachable when your revenue
//  improves; it becomes approachable when something happens between you and
//  the people who run it. An absolute line says that, and it says the same
//  thing in year one and year twenty.
//
//  ---------------------------------------------------------------------------
//  WHERE A FUTURE UNLOCK GOES
//  ---------------------------------------------------------------------------
//  `friendlyLock` is the one function that decides this, and it is the one
//  place another route in should be written - a story flag, a board seat, a
//  founder who owes you something. It is deliberately NOT parameterised for
//  that today: an `unlocked` argument nothing passes is a mechanism that looks
//  wired and is not, which is the failure this codebase keeps finding.
//
//  When there is a real condition, it arrives here as an argument with a
//  caller, and this comment can be deleted.
// ============================================================================

/**
 * Above this, a company cannot be bought over the counter.
 *
 * Half a trillion. It catches six of the fifty-nine companies in the market:
 * Pear (3T), BitCash (1.2T), Microhard (950B), Berkshire Hat (700B), Edison
 * Motors (650B) and UnitedHealth (550B) - the trillion-dollar ones and the
 * ones close enough to it that walking in with a chequebook is not a thing a
 * person does. Etherium at 400B is the first company below the line, and
 * buying Etherium outright should feel possible eventually.
 */
export const FRIENDLY_LOCK_MARKET_CAP = 500_000_000_000;

export type FriendlyLock = {
    /** Why the button is shut. Shown on the lock. */
    reason: string;
    /** What to do instead. The reason a lock is not a dead end. */
    hint: string;
};

/**
 * Is a friendly acquisition off the table for this company?
 *
 * `undefined` means it is available, which is the answer for fifty-three of
 * the fifty-nine companies in the market. The lock is the exception and has to
 * stay the exception - a game where every button is shut teaches nothing.
 */
export const friendlyLock = (marketCap: number): FriendlyLock | undefined => {
    if (!(marketCap >= FRIENDLY_LOCK_MARKET_CAP)) return undefined;
    return {
        reason: 'Too big to buy over the counter.',
        hint: 'Write to them. Mail → Compose → Offer to acquire.',
    };
};

/** Convenience for the screens, which mostly want the boolean. */
export const isOutOfReach = (marketCap: number): boolean =>
    friendlyLock(marketCap) !== undefined;
