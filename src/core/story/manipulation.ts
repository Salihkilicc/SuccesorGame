// src/core/story/manipulation.ts
//
// ============================================================================
//  BREAKING YOUR OWN COMPANY TO BUY IT CHEAPLY IS A CRIME, NOT A STRATEGY
// ============================================================================
//
//  Reported as: "I create losses on purpose, take a billion dollar company
//  down to a million, and then buy the shares cheaply and take it over."
//
//  The first answer was to make it impossible: a control block is priced off
//  the unaffected price, so the board simply will not sell at the bottom of a
//  hole you dug. See core/market/buyout.ts.
//
//  That closes the boardroom door and it does nothing about the idea, which
//  the player then put better than the fix did: "either close the route, or
//  let them go to prison for it, with a new game over." So this file is the
//  second answer, and the two do different jobs. The unaffected price stops
//  the exploit from PAYING. This stops it from being FREE.
//
//  ---------------------------------------------------------------------------
//  THE HARD PART IS NOT THE PUNISHMENT, IT IS THE DETECTION
//  ---------------------------------------------------------------------------
//  A falling share price is not a crime. A company can genuinely fail. And a
//  chief executive who buys stock while their company is falling apart is not
//  a criminal either - that is usually the bravest thing in the file, and a
//  rule that convicted them would punish conviction itself.
//
//  "The price fell and the player bought" therefore catches the honest player
//  and the guilty one equally, which makes it useless.
//
//  WHAT SEPARATES THEM IS WHAT HAPPENS NEXT. A real collapse stays collapsed.
//  A manufactured one recovers, because there was never anything wrong, and it
//  recovers just after the buying stops. That is also how the offence is
//  actually proved in life: nobody is arrested at the moment of purchase, the
//  file is opened later, when the pattern is visible looking backwards.
//
//  So the test has three legs, in the shape the no-confidence vote already
//  uses, and the third one is the clock:
//
//    1. DEPRESSED   the stock was far under its unaffected price when you
//                   bought, so this was not an ordinary purchase
//    2. MATERIAL    you took a serious piece of the company, not a routine
//                   few thousand shares
//    3. RECOVERED   and within a few years the price came back, which is the
//                   leg an honest disaster can never satisfy
//
//  A player who genuinely wrecked the company and genuinely bought the dip is
//  only ever convicted if the wreck turns out not to have been real. Which
//  hands them the trade the whole mechanic is for: you can beat the charge by
//  keeping the company on the floor, and keeping it on the floor costs you
//  every penny the crime was worth.
//
//  PURE. No stores, no clock, nothing injected but the numbers.
// ============================================================================

// ============================================================================
//  LEG ONE: WAS IT DEPRESSED
// ============================================================================

/**
 * At or below this fraction of the unaffected price, a purchase goes in the
 * ledger.
 *
 * Not a hair trigger. Ordinary bad quarters move a share by ten or twenty per
 * cent and nobody investigates those; a stock at two fifths of what it was
 * worth is a different kind of event, and buying INTO one is the thing worth
 * writing down. See core/market/buyout.ts for where the reference comes from.
 */
export const SUSPICION_DEPRESSION = 0.40;

// ============================================================================
//  LEG TWO: WAS IT MATERIAL
// ============================================================================

/**
 * Percentage points of the company gained while it was depressed, below which
 * nobody cares.
 *
 * A chief executive topping up by half a point is not cornering anything. The
 * exploit as reported moves the holding by tens of points at a time, so this
 * is set well under what the crime needs and well over what routine looks
 * like.
 */
export const SUSPICION_MIN_GAIN = 3;

// ============================================================================
//  LEG THREE: DID IT COME BACK
// ============================================================================

/**
 * Back to this fraction of what the stock was worth before the fall, and the
 * fall was never real.
 *
 * Sixty per cent rather than a full recovery, because a manufactured collapse
 * does not need to be fully undone to give the game away, and holding out for
 * the whole distance would let a guilty player bank the crime by stopping at
 * fifty nine.
 */
export const RECOVERY_RATIO = 0.60;

/**
 * How long the file stays open.
 *
 * Sixteen quarters. Long enough that waiting it out means four years of
 * deliberately running a broken company, which is the cost the mechanic
 * exists to impose; short enough that it does not follow a player who really
 * did buy a disaster into their retirement.
 */
export const INVESTIGATION_WINDOW = 16;

// ============================================================================

/** One purchase, written down at the time, judged later. */
export interface SuspiciousBuy {
    /** The quarter it happened in. */
    quarter: number;
    /** What the stock was worth before the fall. */
    referenceAtBuy: number;
    /** What it cost on the day. */
    priceAtBuy: number;
    /** Percentage points of the company gained. */
    gained: number;
}

export interface BuyContext {
    quarter: number;
    price: number;
    reference: number;
    /** Ownership before and after, in per cent. */
    ownershipBefore: number;
    ownershipAfter: number;
}

/** How far under the unaffected price this was, 0 (at it) to 1 (worthless). */
export const depressionOf = (price: number, reference: number): number => {
    const r = Math.max(0, reference || 0);
    if (!(r > 0)) return 0;
    return Math.max(0, Math.min(1, 1 - Math.max(0, price || 0) / r));
};

/**
 * Does this quarter's buying go in the ledger?
 *
 * Returns null for everything ordinary, which is almost everything.
 */
export const recordSuspicion = (ctx: BuyContext): SuspiciousBuy | null => {
    const price = Math.max(0, ctx?.price || 0);
    const reference = Math.max(0, ctx?.reference || 0);
    const gained = (ctx?.ownershipAfter || 0) - (ctx?.ownershipBefore || 0);

    if (!(reference > 0)) return null;
    if (gained < SUSPICION_MIN_GAIN) return null;
    if (price > reference * SUSPICION_DEPRESSION) return null;

    return {
        quarter: Math.max(0, Math.floor(ctx.quarter || 0)),
        referenceAtBuy: reference,
        priceAtBuy: price,
        gained,
    };
};

// ============================================================================
//  AND THEN THE PRICE EITHER COMES BACK OR IT DOES NOT
// ============================================================================

export interface RecoveryContext {
    quarter: number;
    price: number;
}

/**
 * Which entries in the ledger have now been proved, if any.
 *
 * A file only opens on a purchase whose company came back INSIDE the window.
 * Everything older than the window is dead, and the caller should drop it.
 */
export const provenBuys = (
    ledger: SuspiciousBuy[],
    ctx: RecoveryContext,
): SuspiciousBuy[] =>
    (ledger || []).filter(b => {
        const age = (ctx?.quarter || 0) - (b?.quarter || 0);
        if (age < 0 || age > INVESTIGATION_WINDOW) return false;
        return (ctx?.price || 0) >= (b?.referenceAtBuy || 0) * RECOVERY_RATIO;
    });

/** Entries too old to prove anything. The caller drops these to keep saves small. */
export const isStale = (buy: SuspiciousBuy, quarter: number): boolean =>
    (quarter || 0) - (buy?.quarter || 0) > INVESTIGATION_WINDOW;

// ============================================================================
//  WHAT THEY CAN PROVE, AGAINST WHAT YOU CAN ANSWER
// ============================================================================
//
//  Asked for as "let it depend on the situation" rather than one fixed
//  sentence. Two numbers decide it, and both are already in the game.
//
//  THE CASE is how brazen it was: how far under the real value you bought, and
//  how much of the company you took, over how many separate occasions. Doing it
//  once, gently, at thirty nine per cent is an argument. Doing it three times at
//  two per cent is a documentary.
//
//  THE DEFENCE is what a rich, well-connected chief executive actually has: a
//  board that will testify for you, and the money to fight for years. Neither
//  makes you innocent. Both are, unmistakably, how this goes in life.
// ============================================================================

/** 0 to 1. How strong the prosecution's file is. */
export const caseStrength = (proven: SuspiciousBuy[]): number => {
    const buys = proven || [];
    if (buys.length === 0) return 0;

    let score = 0;
    for (const b of buys) {
        const depth = depressionOf(b.priceAtBuy, b.referenceAtBuy); // 0..1
        // Twenty points of the company taken is a full weight incident.
        const size = Math.min(1, Math.max(0, b.gained) / 20);
        score += depth * size;
    }
    // A second and third occasion matter, but the first one carries most of it.
    return Math.max(0, Math.min(1, score));
};

export interface Defence {
    /** Average board loyalty, 0-100. People who will speak for you. */
    boardLoyalty: number;
    /** Personal wealth. Lawyers are bought with this, not with company money. */
    personalWealth: number;
}

/**
 * What it costs to mount a full defence.
 *
 * Wealth past this point buys nothing more, or the endgame billionaire is
 * simply immune and the mechanic stops existing exactly where it is most
 * needed.
 */
export const FULL_DEFENCE_COST = 250_000_000;

/** 0 to 1. How much of the case you can answer. */
export const defenceStrength = (d: Defence): number => {
    // `?? 0` does not catch NaN, and `Math.min(100, NaN)` is NaN, so a single
    // bad input used to make the whole margin NaN and every comparison below
    // it false - which silently acquits. Found by the edge case test.
    const rawLoyalty = Number.isFinite(d?.boardLoyalty) ? d.boardLoyalty : 0;
    const rawWealth = Number.isFinite(d?.personalWealth) ? d.personalWealth : 0;
    const loyalty = Math.max(0, Math.min(100, rawLoyalty)) / 100;
    const money = Math.max(0, Math.min(1, rawWealth / FULL_DEFENCE_COST));
    // Neither alone is enough, and money is the weaker of the two: a board
    // that will speak for you is worth more than a barrister who cannot.
    //
    // MEASURED. At 0.35 for money the flagship case - bought at two per cent
    // of the real value, sixty five points of the company taken - came out as
    // `barred` for any wealthy player, so the ending the whole feature was
    // asked for could not be reached by the exact player it was written for.
    // At 0.25 that case reaches prison and a beloved, wealthy board still buys
    // its way down to a fine, which is the range that was wanted.
    return Math.max(0, Math.min(1, loyalty * 0.55 + money * 0.25));
};

export type Verdict = 'none' | 'fine' | 'barred' | 'prison';

/**
 * Below this the file is closed without a charge.
 *
 * The three legs can all be met by an honest player who bought a real dip in a
 * company that then really did recover, and without this they would be fined
 * for it. MEASURED: that player - five points taken at thirty per cent of the
 * reference - scores 0.175, and the exploit as reported scores above 0.9. The
 * gap is wide enough to put the line in.
 */
export const CASE_MINIMUM = 0.20;

/**
 * Below this the defence has beaten the case outright and nothing happens.
 *
 * Without it, a strong enough defence still ended in a fine, so a player with
 * a devoted board and real money was told they had been cleared and then
 * charged anyway. MEASURED: the flagship exploit scores 0.98 against a maximum
 * possible defence of 0.80, so it can never be acquitted however well defended
 * - which is the property that matters. What can be acquitted is the middle,
 * and the middle is where an honest player lives.
 */
export const VERDICT_ACQUIT = -0.15;

/** Above this, the chair is gone. Below it, it is money and embarrassment. */
export const VERDICT_BARRED = 0.25;
/** And above this, so are you. */
export const VERDICT_PRISON = 0.55;

/** What the fine costs, as a share of personal wealth. */
export const FINE_RATIO = 0.35;

export interface Judgement {
    verdict: Verdict;
    /** The number the verdict was read off, so a screen can explain itself. */
    margin: number;
    caseStrength: number;
    defenceStrength: number;
    /** Only meaningful for a fine. */
    fine: number;
}

export const judge = (proven: SuspiciousBuy[], d: Defence): Judgement => {
    const cs = caseStrength(proven);
    const ds = defenceStrength(d);
    const margin = cs - ds;

    let verdict: Verdict = 'none';
    if (cs >= CASE_MINIMUM && margin >= VERDICT_ACQUIT) {
        verdict = margin >= VERDICT_PRISON ? 'prison'
            : margin >= VERDICT_BARRED ? 'barred'
                : 'fine';
    }

    return {
        verdict,
        margin,
        caseStrength: cs,
        defenceStrength: ds,
        fine: verdict === 'fine'
            ? Math.round(Math.max(0, Number.isFinite(d?.personalWealth) ? d.personalWealth : 0)
                * FINE_RATIO)
            : 0,
    };
};
