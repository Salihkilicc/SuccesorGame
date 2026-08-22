// src/core/story/prices.ts
//
// ============================================================================
//  THE FIGURE ON THE BUTTON AND THE FIGURE IN THE LEDGER
// ============================================================================
//
//  THE BUG, AND THE GAME HAS HAD IT BEFORE. Seven choices in corporateOps.ts
//  quote a price in their own text and pay a different one:
//
//      "Invest in robotic line automation ({opsAutomationCost})."
//          the text computed  clamp(capital x 3%, 1M..15M)
//          the effect charged a flat 1,500,000
//
//  They agree on exactly one company size and nowhere else. At three million
//  of capital the button says one million and takes one and a half; at a
//  hundred million it says three million and takes one and a half.
//
//  This is the pearOfferHeir bug, word for word - "the salutation quoted a
//  scaling number and the scene paid a literal" - and the fix there was this
//  fix: one function, read by both sides. See core/story/pearPrice.ts, whose
//  header describes the same failure and whose shape this copies deliberately.
//
//  ---------------------------------------------------------------------------
//  AND IT IS WHERE THE REWARD SIDE WAS HIDING
//  ---------------------------------------------------------------------------
//  `cfoTreasuryGain` is the one figure in this book that comes IN, and its
//  formula was already written, already proportional, already interpolated
//  into the CFO's letter - and the effect behind it paid five hundred thousand
//  flat forever. So the single money-positive choice in the entire
//  conversation system was also the one most obviously broken by this.
//
//  Reported as "sohbetlerde ceza ve kazanclari dengeleyelim, kazanc da lazim,
//  hep ceza".
//
//  ---------------------------------------------------------------------------
//  WHY A BOOK RATHER THAN A NUMBER ON THE EFFECT
//  ---------------------------------------------------------------------------
//  Because the text has to name the same thing. A `{ kind: 'capital', amount:
//  ... }` carrying a share would still leave the sentence computing its own,
//  and two formulas that agree today are two formulas. The scene names an
//  ENTRY; the entry is the only place the arithmetic lives.
//
//  PURE. No stores. The capital is passed in.
// ============================================================================

/** Everything a scene is allowed to quote. Closed, like the effect vocabulary. */
export type Quoted =
    | 'opsAutomation'
    | 'opsBonus'
    | 'opsLogistics'
    | 'techPatent'
    | 'techCloud'
    | 'cfoInvestor'
    | 'cfoTreasuryGain';

export type PriceEntry = {
    /** Of company capital. */
    share: number;
    /** Never cheaper than this, so it is not free when the company is small. */
    min: number;
    /** Never dearer than this, so a giant does not see a silly number. */
    max: number;
    /** Which way the money goes. `in` is the company being paid. */
    direction: 'in' | 'out';
    /**
     * What the scene writes in its own sentence.
     *
     * Stored rather than derived from the key, because six of them end in
     * "Cost" and the seventh is a gain - and a naming convention that holds
     * for six of seven is the kind of thing that gets "tidied up" into a
     * template and silently stops interpolating.
     */
    token: string;
};

/**
 * The book.
 *
 * The shares and clamps are the ones storyText.ts was already using, moved
 * rather than invented: the sentences were right and the effects were wrong,
 * so the sentences are what survived.
 */
export const PRICE_BOOK: Record<Quoted, PriceEntry> = {
    opsAutomation: { share: 0.03, min: 1_000_000, max: 15_000_000, direction: 'out', token: '{opsAutomationCost}' },
    opsBonus: { share: 0.01, min: 300_000, max: 5_000_000, direction: 'out', token: '{opsBonusCost}' },
    opsLogistics: { share: 0.02, min: 800_000, max: 10_000_000, direction: 'out', token: '{opsLogisticsCost}' },
    techPatent: { share: 0.015, min: 500_000, max: 8_000_000, direction: 'out', token: '{techPatentCost}' },
    techCloud: { share: 0.02, min: 600_000, max: 10_000_000, direction: 'out', token: '{techCloudCost}' },
    cfoInvestor: { share: 0.005, min: 200_000, max: 3_000_000, direction: 'out', token: '{cfoInvestorCost}' },
    cfoTreasuryGain: { share: 0.01, min: 500_000, max: 10_000_000, direction: 'in', token: '{cfoTreasuryGain}' },
};

/** What this costs, or pays, at this size of company. Always positive. */
export const quotedAmount = (companyCapital: number, item: Quoted): number => {
    const entry = PRICE_BOOK[item];
    if (!entry) return 0;
    const capital = Number.isFinite(companyCapital) ? Math.max(0, companyCapital) : 0;
    return Math.max(entry.min, Math.min(Math.round(capital * entry.share), entry.max));
};

/**
 * The same figure, signed for the ledger.
 *
 * Separate from the one above because the SENTENCE wants "$3,000,000" and the
 * ledger wants -3000000, and having one of them remember to negate is how the
 * two drift apart again.
 */
export const quotedDelta = (companyCapital: number, item: Quoted): number => {
    const amount = quotedAmount(companyCapital, item);
    return PRICE_BOOK[item]?.direction === 'in' ? amount : -amount;
};

/** Every entry, for the interpolator and for the test that pairs them up. */
export const QUOTED: Quoted[] = Object.keys(PRICE_BOOK) as Quoted[];
