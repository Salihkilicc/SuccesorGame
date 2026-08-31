// src/features/casino/data/vipRoom.ts
//
// ============================================================================
//  THE ROOM YOU CANNOT BUY YOUR WAY INTO TWICE
// ============================================================================
//
//  Asked for as: "if your cash is over a billion, put a VIP button top right.
//  Build a casino you can play with a percentage of your whole fortune, but
//  only people over ten billion get in. Ten, twenty five, fifty and a hundred
//  per cent of your money. And you can only go once every five quarters, not
//  every quarter. Make it extremely premium."
//
//  Three separate gates, and it is worth being clear that they are three
//  rather than one, because each does a different job:
//
//    SEE      one billion in CASH. The button exists. You know the room is
//             there long before you can use it, which is what makes it a
//             thing to reach rather than a thing that appears.
//    ENTER    ten billion. The door opens.
//    COOLDOWN five quarters. This is the one that makes it a mechanic
//             instead of a slot machine.
//
//  ---------------------------------------------------------------------------
//  WHY THE COOLDOWN IS THE WHOLE DESIGN
//  ---------------------------------------------------------------------------
//  A hundred per cent of your money on one hand is the largest number in this
//  game. Without a cooldown it is also a button you can press until it comes
//  up heads, and a bet you may repeat is not a risk, it is a wait. Five
//  quarters means the decision is made roughly four times in a decade and each
//  one is remembered.
//
//  It also means the room can be brutal without being unfair. Losing
//  everything is on the table - the player asked for the hundred per cent
//  chip by name - and the answer to "was that reasonable" is that the game
//  made you wait fifteen months to do it.
//
//  NOTE ON THE HUNDRED PER CENT CHIP: it is measured against CASH, not net
//  worth. Losing it does not take the company, the shares, the houses or the
//  dynasty. It takes the money in your pocket, which at ten billion and up is
//  a catastrophe rather than an ending, and that is the right size of wound.
//
//  PURE. No stores, no clock, no random.
// ============================================================================

/** Cash at which the door becomes visible. */
export const VIP_CASH_TO_SEE = 1_000_000_000;

/** Cash at which it opens. */
export const VIP_CASH_TO_ENTER = 10_000_000_000;

/**
 * Quarters between visits.
 *
 * Five, which is fifteen months: long enough that a hundred per cent bet is a
 * decision rather than a retry, short enough that a long run gets to make it
 * more than once.
 */
export const VIP_COOLDOWN_QUARTERS = 5;

/**
 * The four chips, as shares of everything you have.
 *
 * Asked for by name. They are not chips in the ordinary sense - there is no
 * rail of small denominations here, only four ways to answer one question.
 */
export const VIP_BET_FRACTIONS = [0.10, 0.25, 0.50, 1.00] as const;

/** The id the rest of the casino refers to this room by. */
export const VIP_LOCATION_ID = 'vip_noir';

/** Has this player ever seen the door? */
export const canSeeVip = (cash: number): boolean =>
    (Number.isFinite(cash) ? cash : 0) >= VIP_CASH_TO_SEE;

/** Is the fortune large enough for the room itself? */
export const richEnoughForVip = (cash: number): boolean =>
    (Number.isFinite(cash) ? cash : 0) >= VIP_CASH_TO_ENTER;

// ============================================================================

export type VipRefusal = 'tooPoor' | 'tooSoon' | null;

export interface VipEntry {
    allowed: boolean;
    reason: VipRefusal;
    /** Quarters until the door opens again. Zero when it is open. */
    quartersLeft: number;
}

/**
 * Whether the player may walk in right now.
 *
 * `lastVisitQuarter` is null for somebody who has never been. A negative or
 * future quarter is treated as never, because a save from a different clock
 * should open the door rather than lock it forever.
 */
export const vipEntry = (
    cash: number,
    lastVisitQuarter: number | null,
    currentQuarter: number,
): VipEntry => {
    const now = Math.max(0, Math.floor(currentQuarter || 0));
    const last = lastVisitQuarter === null || !Number.isFinite(lastVisitQuarter)
        ? null
        : Math.floor(lastVisitQuarter);

    const elapsed = last === null || last > now ? Infinity : now - last;
    const quartersLeft = Math.max(0, VIP_COOLDOWN_QUARTERS - elapsed);

    // THE MONEY IS CHECKED FIRST and the order matters for the message: a
    // player who is both broke and early should be told the thing they can do
    // something about tonight.
    if (!richEnoughForVip(cash)) {
        return { allowed: false, reason: 'tooPoor', quartersLeft };
    }
    if (quartersLeft > 0) {
        return { allowed: false, reason: 'tooSoon', quartersLeft };
    }
    return { allowed: true, reason: null, quartersLeft: 0 };
};

/**
 * The four stakes, in money.
 *
 * Rounded DOWN, so the hundred per cent chip is never a penny more than the
 * player actually has - a bet that cannot be covered is a crash, not a
 * gamble.
 */
export const vipChipsFor = (cash: number): number[] => {
    const wealth = Math.max(0, Number.isFinite(cash) ? cash : 0);
    return VIP_BET_FRACTIONS.map(f => Math.floor(wealth * f));
};

/** The largest of them, which is everything. */
export const vipMaxBet = (cash: number): number =>
    Math.floor(Math.max(0, Number.isFinite(cash) ? cash : 0));
