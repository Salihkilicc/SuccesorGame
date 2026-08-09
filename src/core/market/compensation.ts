// src/core/market/compensation.ts
//
// ============================================================================
//  WHAT THE CEO ACTUALLY TAKES HOME
// ============================================================================
//
//  Until now the player owned a company but was never PAID by it. Personal
//  cash only moved through the life-side economy, so running a profitable
//  business made the company rich and left the CEO exactly where he started.
//  The only way to get money out was a dividend, which pays every shareholder
//  and therefore mostly pays other people.
//
//  This is the other lever: an annual bonus of 2% of the year's profit,
//  struck AFTER tax, paid once every four quarters into personal cash.
//
//  Four rules, and each one exists for a reason:
//
//  1) THE BASE IS AFTER-TAX PROFIT. Not revenue, not EBIT. Revenue would pay
//     you for selling at a loss; EBIT would pay you for a year the taxman
//     already took. Net profit is the only number that means "what the
//     company actually kept".
//
//  2) IT PAYS ANNUALLY, NOT QUARTERLY. A quarterly cut would let you strip
//     cash out of one good quarter and walk away from the three bad ones
//     that follow. A year is long enough that a bad quarter costs you.
//
//  3) A LOSING YEAR PAYS NOTHING. Not a negative — nothing. Clawing money
//     back out of personal cash would be a different mechanic (and a nasty
//     one, since personal cash can be spent). The floor is zero.
//
//  4) THE LOSS DOES NOT CARRY. Tax already carries losses forward, and
//     stacking a second carryforward here would punish one bad year twice:
//     once at the tax line and again on next year's bonus. Each bonus year
//     starts clean.
//
//  The company pays it, so it leaves company capital. Money is not created
//  here — it is moved from the corporate account to the personal one, which
//  is the whole point of the mechanic.
// ============================================================================

/** 2% of the year's after-tax profit. */
export const CEO_BONUS_RATE = 0.02;

/** Four quarters to a bonus year. */
export const BONUS_PERIOD_QUARTERS = 4;

/**
 * What the engine carries between quarters. Small on purpose: the whole
 * mechanic is two numbers, and anything else would be derivable from them.
 */
export type BonusAccrual = {
    /** After-tax profit summed since the last payout. May be negative. */
    profitAccrued: number;
    /** Quarters counted since the last payout, 0-3 in normal play. */
    quartersAccrued: number;
};

export type BonusOutcome = {
    /** The accrual to carry into next quarter. */
    next: BonusAccrual;
    /** Cash to move from company capital to personal cash. 0 most quarters. */
    paid: number;
    /**
     * The year's profit the payout was struck on. Kept even when `paid` is 0
     * on a losing year, because "you earned nothing, and here is why" is a
     * more useful thing to show than a bare zero.
     */
    base: number;
    /** True on the quarter the year closed, whether or not it paid. */
    closed: boolean;
};

export const EMPTY_ACCRUAL: BonusAccrual = { profitAccrued: 0, quartersAccrued: 0 };

/**
 * Fold one quarter's result into the accrual, and settle the year if this
 * quarter completes it.
 *
 * `quarters` is normally 1. It can be more if a tick advances several
 * quarters at once, in which case the year closes on that tick and the
 * accrual resets whole rather than carrying a remainder — the alternative
 * is apportioning a lump of profit across a boundary it never had, which
 * would be a guess dressed up as arithmetic.
 */
export const accrueCeoBonus = (
    current: BonusAccrual,
    netProfitAfterTax: number,
    quarters: number = 1,
): BonusOutcome => {
    const steps = Math.max(1, Math.floor(quarters));
    const profitAccrued = (current?.profitAccrued ?? 0) + (netProfitAfterTax || 0);
    const quartersAccrued = (current?.quartersAccrued ?? 0) + steps;

    if (quartersAccrued < BONUS_PERIOD_QUARTERS) {
        return {
            next: { profitAccrued, quartersAccrued },
            paid: 0,
            base: profitAccrued,
            closed: false,
        };
    }

    // The year is up. A loss pays nothing and does not follow you into the
    // next one - see rule 4 above.
    const paid = profitAccrued > 0 ? profitAccrued * CEO_BONUS_RATE : 0;
    return {
        next: { ...EMPTY_ACCRUAL },
        paid,
        base: profitAccrued,
        closed: true,
    };
};

/** Quarters left before the next payout. 0 means it settles this quarter. */
export const quartersToBonus = (accrual: BonusAccrual): number =>
    Math.max(0, BONUS_PERIOD_QUARTERS - (accrual?.quartersAccrued ?? 0));

/**
 * What the bonus would be if the year closed right now. Shown on the finance
 * screen so the number is not a surprise that arrives once a year.
 */
export const projectedBonus = (accrual: BonusAccrual): number =>
    Math.max(0, (accrual?.profitAccrued ?? 0)) * CEO_BONUS_RATE;
