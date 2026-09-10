// src/core/social/gestures.ts
//
// ============================================================================
//  A BUTTON THAT COSTS NOTHING IS NOT A DECISION
// ============================================================================
//
//  Reported twice in one sentence: the things I do to raise a director's
//  regard do not change anything and can be pressed forever, and I can raise
//  my partner's the same way by hammering the button.
//
//  MEASURED, through the real store, pressing the board gesture ten times:
//
//      #1  delta 18.0   relationship  0 -> 68   money unchanged
//      #2  delta 10.0                68 -> 78   money unchanged
//      #3  delta  5.0                78 -> 83   money unchanged
//      #4  delta  3.0                83 -> 86   money unchanged
//      #5  delta  2.0                86 -> 88   money unchanged
//      #6  delta  1.0                88 -> 89   money unchanged
//      #7  delta  0.0                89 -> 89   money unchanged
//
//  Three separate faults in one screen.
//
//    IT WAS FREE. `money` never moved. The private dinner spends nothing at
//    all - its cost is a number in the confirmation copy and a `TODO: check
//    energy from stats store` in the handler. The gift writes
//    `updateStats({ money: money - GIFT_COST })` with the `money` captured at
//    render, which the same file already has a shelved note about being wrong
//    on the buyout, and which does nothing on a second press because the
//    value it writes has not changed.
//
//    NOTHING STOPPED IT. Fatigue takes the effect to zero by the seventh
//    press, which is a good rule and is not a limit: the seventh press is
//    still allowed, and so is the seventieth.
//
//    AND THE NUMBER ON SCREEN NEVER MOVED. Gestures raise RELATIONSHIP, and
//    what the board list draws is TRUST. So a player watching the bar while
//    pressing the button correctly reported that nothing happened.
//
//  ---------------------------------------------------------------------------
//  ONE RULE, TWO PLACES, AND IT IS A VALUE
//  ---------------------------------------------------------------------------
//  The board and the partner had separate handlers with the same hole, so a
//  fix in one would have left the other. This is the rule both call, and it is
//  pure: a record of what has been offered to whom, and a question about it.
//
//  ONCE PER PERSON PER QUARTER, per kind. Not a cooldown in real minutes,
//  because this game's clock is the quarter and a player who leaves the app
//  for an hour has not spent time with anybody. Per KIND, because taking
//  somebody to dinner and sending them a gift in the same quarter is two
//  different gestures and a person can receive both.
// ============================================================================

/** Whose regard, and by what means. */
export type GestureKey = string;

/**
 * What has been offered, and in which quarter.
 *
 * A quarter number rather than a boolean, so nothing has to be cleared: a
 * record from four quarters ago answers "not this quarter" by itself. The
 * board's `lobbied` map is wiped every quarter and this deliberately is not,
 * because a wipe is a step somebody can forget to call.
 */
export type GestureLedger = Record<GestureKey, number>;

/** How the two halves of a key are joined. Exported so tests read the shape. */
export const gestureKey = (personId: string, kind: string): GestureKey =>
    `${personId}:${kind}`;

/**
 * May this gesture be offered to this person this quarter?
 *
 * Total: a missing ledger, a missing person and a nonsense quarter all answer
 * yes rather than throwing, because the alternative is a screen that cannot
 * offer anything the moment a store has not stood up.
 */
export const canOffer = (
    ledger: GestureLedger | undefined,
    personId: string,
    kind: string,
    quarter: number,
): boolean => {
    if (!personId) return false;
    const q = Number.isFinite(quarter) ? Math.floor(quarter) : 0;
    const last = (ledger ?? {})[gestureKey(personId, kind)];
    if (!Number.isFinite(last)) return true;
    return (last as number) < q;
};

/** The ledger after offering it. Returns a new object; nothing is mutated. */
export const noteOffered = (
    ledger: GestureLedger | undefined,
    personId: string,
    kind: string,
    quarter: number,
): GestureLedger => {
    const q = Number.isFinite(quarter) ? Math.floor(quarter) : 0;
    return { ...(ledger ?? {}), [gestureKey(personId, kind)]: q };
};

/**
 * What to tell somebody who presses it twice.
 *
 * Here rather than at the call site so both screens say the same thing, and
 * so the sentence explains the rule rather than merely refusing: "not this
 * quarter" is a closed door, "you already did, and doing it again this
 * quarter would not mean anything" is a rule the player can plan around.
 */
export const ALREADY_OFFERED_KEY = 'social.alreadyThisQuarter';

// ============================================================================
//  AND WHAT THINGS COST
// ============================================================================
//
//  The dinner had a price in its confirmation copy and no price in its code.
//  These are the two numbers that were being claimed, now in one place where
//  the handler and the copy read the same value.
//
//  Money rather than an energy stat: the CEO cut has no energy, which is why
//  the dinner's cost was a `TODO` for so long. A private dinner for somebody
//  who owns eleven per cent of your company is not a cheap evening, and money
//  is a resource this game actually has.
// ============================================================================

/** A gift to a director. */
export const BOARD_GIFT_COST = 50_000;

/** An evening with one, which is dearer than a gift and worth more. */
export const BOARD_DINNER_COST = 120_000;

/**
 * Is the gesture worth offering at all, given what it will do?
 *
 * Fatigue already takes the effect to zero after six presses. Spending money
 * on a nought is not a decision either, so the screen may ask this and say so
 * rather than taking the fee for nothing.
 */
export const isWorthOffering = (expectedDelta: number): boolean =>
    Number.isFinite(expectedDelta) && expectedDelta > 0;
