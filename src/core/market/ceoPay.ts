// src/core/market/ceoPay.ts
//
// ============================================================================
//  SETTING YOUR OWN SALARY, WITHOUT IT BEING A CHEAT CODE
// ============================================================================
//
//  The gap: `salaryRatio` decides what every employee in the company is paid
//  and nothing at all decides what the player is paid. The founder's own wage
//  is a constant in personalEconomy.ts, flat from the first quarter to the
//  last, which is a strange thing in a game about running a company.
//
//  The reason it had not been added is that it is a hole, and an obvious one.
//  Written naively - a number field, spend it out of capital - it defeats
//  every rule the last few commits established:
//
//    LOOPHOLE 1  Set pay to the entire treasury. One tap, personal fortune.
//
//    LOOPHOLE 2  Spike it for one quarter, collect, put it back. Free money
//                with a two second round trip and no consequence.
//
//    LOOPHOLE 3  And the serious one: a buyout paid from company money needs
//                a BOARD VOTE, and a buyout paid from your own pocket does
//                not. A salary you control is a pipe from the treasury to
//                your wallet, so it turns every company-funded buyout into a
//                personal one with an extra step, and governance stops
//                meaning anything.
//
//    LOOPHOLE 4  Pay yourself nothing to inflate profit, and take 4% of the
//                bigger number as a bonus.
//
//    LOOPHOLE 5  Raise it the quarter before you die, so the estate is fat.
//
//  So the rules below exist one per hole, and each is named after the hole.
//
//  ---------------------------------------------------------------------------
//  THE CEILING IS A SHARE OF REVENUE, NOT OF CAPITAL OR PROFIT
//  ---------------------------------------------------------------------------
//  Against loophole 1. Capital is the obvious base and it is the wrong one:
//  it is a POOL, so a cap against it lets you drain a good year in a single
//  quarter. Profit is worse, because profit is what the salary comes out of,
//  so a cap against it chases its own tail.
//
//  Revenue is the one number the player cannot move quickly. It is TRAILING,
//  over four quarters, so a single spectacular quarter raises it by a
//  quarter of itself and no more.
//
//  ---------------------------------------------------------------------------
//  AND THE MONEY STILL CANNOT LEAVE WITHOUT A VOTE
//  ---------------------------------------------------------------------------
//  Against loophole 3, which is the one that matters. Anything above
//  PAY_VOTE_MULTIPLE of the base goes to the board as a `pay` proposal, on
//  the same gate as a buyback or a loan. Below CONTROL_THRESHOLD - which is
//  where a successor starts - governance.ts already sends EVERYTHING to a
//  vote, so a successor cannot raise their own pay by a penny without asking
//  the family they are trying to buy out.
//
//  Even at the ceiling, a year of the maximum raise is two per cent of
//  revenue. A sibling's holding is a multiple of annual revenue. The pipe is
//  not just watched, it is too narrow to matter, which is the difference
//  between a rule and a speed bump.
//
//  PURE. No stores, no clock.
// ============================================================================

/** What the founder is paid before they have ever asked for more, per QUARTER. */
export { CEO_BASE_SALARY_QUARTERLY } from './personalEconomy';
import { CEO_BASE_SALARY_QUARTERLY } from './personalEconomy';

/**
 * The most a CEO may take, as a share of TRAILING ANNUAL revenue.
 *
 * Two per cent. Real chief executives of large companies take a great deal
 * less and of small ones a great deal more, and the number is chosen for the
 * second reason rather than the first: it has to be worth doing early, when
 * revenue is small and the base salary is most of it, without being worth
 * anything late, when revenue is enormous and this would otherwise become the
 * fastest way to get rich in the game.
 */
export const MAX_PAY_SHARE_OF_REVENUE = 0.02;

/**
 * A raise beyond this multiple of the base goes to the board.
 *
 * Not zero, because a board that votes on every cost of living adjustment is
 * a board nobody wants to sit through. One and a half times is "you have
 * given yourself a real rise" territory.
 */
export const PAY_VOTE_MULTIPLE = 1.5;

/**
 * Quarters between changes.
 *
 * Against loophole 2. A year, which is the same period the CEO bonus settles
 * over, so the two cannot be played against each other either.
 */
export const PAY_CHANGE_COOLDOWN = 4;

/**
 * What greed costs, in trust, with every member, at the ceiling.
 *
 * Paid whether or not the vote passed. A board that approved your rise
 * because the numbers were good still watched you ask for it, and this is
 * what makes a passed vote cost something - otherwise the optimal play is to
 * ask for the maximum every year and take the free ones.
 */
export const PAY_RISE_TRUST_COST = 12;

export type PayDecision = {
    /** What the player asked for, per quarter, after clamping. */
    requested: number;
    /** What they will actually be paid, per quarter. */
    granted: number;
    /** True when the request was cut down to the ceiling. */
    capped: boolean;
    /** The ceiling itself, so a screen can show it. */
    ceiling: number;
    /** Whether the board has to approve this. */
    needsVote: boolean;
    /** Trust cost per member, 0 for a cut or a token rise. */
    trustCost: number;
    /** Why it was refused outright. Null when it can proceed. */
    blocked: string | null;
};

/**
 * The most the player may pay themselves this quarter.
 *
 * Never below the base: a company with no revenue yet still pays its founder,
 * or the first four quarters of every run would be unsurvivable.
 */
export const payCeiling = (trailingAnnualRevenue: number): number => {
    const revenue = Math.max(0, trailingAnnualRevenue || 0);
    const fromRevenue = (revenue * MAX_PAY_SHARE_OF_REVENUE) / 4;
    return Math.max(CEO_BASE_SALARY_QUARTERLY, fromRevenue);
};

export type PayRequest = {
    /** Asked for, per quarter. */
    amount: number;
    /** Currently paid, per quarter. */
    current: number;
    /** Sum of the last four quarters of revenue. */
    trailingAnnualRevenue: number;
    /** Quarters since the last change. Large on a fresh game. */
    quartersSinceChange: number;
};

/**
 * Whether this raise is allowed, what it will actually be, and what it costs.
 *
 * Decides nothing about the money moving - that is the store's job - but every
 * rule that stops this being a cheat code lives here, where it can be tested
 * without a game running.
 */
export const decidePay = (req: PayRequest): PayDecision => {
    const ceiling = payCeiling(req?.trailingAnnualRevenue ?? 0);
    const current = Math.max(0, req?.current ?? CEO_BASE_SALARY_QUARTERLY);

    // Against loophole 4, and against a NaN reaching personal cash: a salary
    // is never negative and never a non-number. Zero IS allowed - refusing
    // your own pay is a legitimate thing to do in a bad year, and the bonus
    // arithmetic already makes it a poor trade.
    const asked = Number.isFinite(req?.amount) ? Math.max(0, req.amount) : current;

    const granted = Math.min(asked, ceiling);
    const capped = asked > ceiling;
    const isRise = granted > current;

    // Against loophole 2 and loophole 5. A CUT is always allowed and always
    // immediate: nobody games the system by paying themselves less, and a
    // player who wants to put money back into a dying company should not be
    // told to wait a year for permission.
    // ----------------------------------------------------------------------
    //  A GAP CANNOT BE NEGATIVE, WHATEVER THE CALLER BELIEVES
    // ----------------------------------------------------------------------
    //  `currentQuarter()` is derived from `age - initialGameState.age`, and a
    //  successor takes the chair at sixteen against a starting age of twenty,
    //  so the counter collapses. With a `ceoPaySetQuarter` left over from a
    //  life that ran for decades the subtraction goes NEGATIVE, and the wait
    //  it produces is a hundred and twenty quarters rather than four.
    //
    //  runSuccession resets both fields, which is the real fix. This is the
    //  belt: the worst a bad clock can ever cost is one full cooldown.
    // ----------------------------------------------------------------------
    const sinceChange = Math.max(0, req?.quartersSinceChange ?? 0);

    if (isRise && sinceChange < PAY_CHANGE_COOLDOWN) {
        const wait = PAY_CHANGE_COOLDOWN - sinceChange;
        return {
            requested: asked,
            granted: current,
            capped,
            ceiling,
            needsVote: false,
            trustCost: 0,
            blocked: `Pay is set once a year. ${wait} more ${wait === 1 ? 'quarter' : 'quarters'}.`,
        };
    }

    // Against loophole 3. The threshold is against the BASE rather than
    // against what you are already paid, so a player cannot walk up to any
    // number they like in small annual steps that each look modest.
    const needsVote = granted > CEO_BASE_SALARY_QUARTERLY * PAY_VOTE_MULTIPLE;

    return {
        requested: asked,
        granted,
        capped,
        ceiling,
        needsVote,
        trustCost: isRise ? greedCost(granted, ceiling) : 0,
        blocked: null,
    };
};

/**
 * What the room thinks of the number, from nothing at the base to the full
 * cost at the ceiling.
 *
 * Linear between, so there is no cliff to sit just underneath.
 */
export const greedCost = (granted: number, ceiling: number): number => {
    const headroom = ceiling - CEO_BASE_SALARY_QUARTERLY;
    if (headroom <= 0) return 0;
    const greed = Math.max(0, Math.min(1, (granted - CEO_BASE_SALARY_QUARTERLY) / headroom));
    return Math.round(PAY_RISE_TRUST_COST * greed);
};

/**
 * A year of pay as a share of a year of revenue, for the screen.
 *
 * The one figure that makes the ceiling explicable without a paragraph: the
 * player can see that they are asking for two per cent of everything the
 * company sells.
 */
export const payAsShareOfRevenue = (
    quarterlyPay: number,
    trailingAnnualRevenue: number,
): number => {
    const revenue = Math.max(0, trailingAnnualRevenue || 0);
    if (revenue <= 0) return 0;
    return (Math.max(0, quarterlyPay || 0) * 4) / revenue;
};
