// src/core/story/inheritance.ts
//
// ============================================================================
//  WHAT AN ESTATE DOES TO A COMPANY
// ============================================================================
//
//  A net worth is already two things: cash in your own name, and a holding in
//  the company. They divide completely differently and the difference is the
//  whole of this file.
//
//      CASH DIVIDES FLAT. Every child gets the same, the heir included.
//      SHARES DO NOT. The heir takes most of them.
//
//  ---------------------------------------------------------------------------
//  THE HEIR IS FAVOURED IN STOCK, NOT IN MONEY
//  ---------------------------------------------------------------------------
//  This is the one decision in the file and everything else follows from it.
//  The obvious version favours the heir in both, and it is worse twice over:
//  it makes the succession screen a button that says "give this one more of
//  everything", and it makes the siblings' grievance a simple one about money,
//  which is the least interesting version of it.
//
//  Splitting it means the two currencies say different things. The others get
//  PAID. The heir gets CONTROL, and control is the thing that cannot be
//  divided without destroying it, which is the entire reason primogeniture was
//  ever invented and the entire reason the siblings mind.
//
//  So the sibling who wrote to you about the annual report is not poorer than
//  the one you chose. They are simply not in charge, and they have enough
//  money to be annoyed about it professionally.
//
//  ---------------------------------------------------------------------------
//  AND IT FRAGMENTS, WHICH IS THE POINT
//  ---------------------------------------------------------------------------
//  Sixty per cent of the family holding is a lot and it is not everything. A
//  founder holding 55 per cent of the company leaves an heir holding 33, with
//  three siblings on 7 each and a widow on the same. One generation and the
//  family still controls it between them; two and it does not; three and
//  somebody outside the family runs the company that has your name on it.
//
//  That is what happens to every family business and it is the story this game
//  has been about since the first quarter. It needs no extra mechanism. It
//  falls out of dividing an estate honestly, twice.
//
//  PURE. No stores, no clock, no random.
// ============================================================================

/** What the person who died actually owned. */
export type Estate = {
    /** Personal cash, not the company's capital. */
    cash: number;
    /** Shares in the company, from useShareholderStore.playerShareCount. */
    shares: number;
};

export type Survivor = {
    id: string;
    /** Every child inherits, including one too young to run anything. */
    kind: 'child';
} | {
    id: string;
    kind: 'spouse';
};

export type Bequest = {
    id: string;
    kind: 'heir' | 'child' | 'spouse';
    cash: number;
    /** Always a whole number. You cannot own two fifths of a share. */
    shares: number;
};

/**
 * The widow's cut, taken off the top before the children see any of it.
 *
 * A quarter, which is roughly what a forced share is in most of the places
 * that have one. It comes out of the CASH only: giving a spouse a block of
 * stock as well would put a second large holder on the register at the exact
 * moment the company can least afford one, and the interesting version of her
 * is a person on the board rather than a rival for it.
 */
export const SPOUSE_CASH_SHARE = 0.25;

/**
 * The heir's cut of the family's shareholding.
 *
 * Sixty per cent. Enough that they are unambiguously the one in charge of the
 * family's block, and not so much that the siblings are decoration.
 *
 * Deliberately NOT 100. An heir who inherits the whole holding makes the
 * others pure spectators, and the passed-over sibling who has been writing to
 * you for twenty years should arrive at the first board meeting with a vote in
 * their hand. That is the payoff for every one of those messages.
 */
export const HEIR_STOCK_SHARE = 0.6;

/**
 * Split a whole number into shares of a total, exactly.
 *
 * Written out rather than done with `Math.round` per person because rounding
 * each slice independently does not add up: three people splitting 100 shares
 * get 33 each and one share evaporates. Over a few generations that is a
 * register that no longer balances, and nothing would ever report it.
 *
 * The remainder goes to whoever is first in the list, which the caller orders
 * so that it is the heir.
 */
const splitWhole = (total: number, weights: number[]): number[] => {
    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum <= 0 || total <= 0) return weights.map(() => 0);
    const floors = weights.map(w => Math.floor((total * w) / sum));
    const given = floors.reduce((a, b) => a + b, 0);
    floors[0] += total - given;
    return floors;
};

/**
 * Who gets what.
 *
 * `heirId` is the successor from mortality.ts, and may be null: a family whose
 * children are all under sixteen still inherits, they simply inherit without
 * anybody taking control. That is the shape of `diedWithoutAnHeir` and it is
 * why the company gets absorbed rather than passed on.
 *
 * Returns an empty list when there is nobody at all, which is not an error. It
 * is the estate going to the state, and the ending says so.
 */
export const divideEstate = (
    estate: Estate,
    survivors: readonly Survivor[],
    heirId: string | null,
): Bequest[] => {
    const cash = Math.max(0, estate.cash || 0);
    const shares = Math.max(0, Math.floor(estate.shares || 0));

    const children = survivors.filter(s => s.kind === 'child');
    const spouse = survivors.find(s => s.kind === 'spouse');
    if (children.length === 0 && !spouse) return [];

    // ------------------------------------------------------------------
    //  CASH: the widow first, then flat across the children
    // ------------------------------------------------------------------
    //  Flat INCLUDING the heir. See the header: the heir's advantage is the
    //  stock, and paying them twice would make the succession screen a
    //  button marked "give this one more of everything".
    // ------------------------------------------------------------------
    const spouseCash = spouse && children.length > 0 ? cash * SPOUSE_CASH_SHARE
        : spouse ? cash
            : 0;
    const childCashPool = cash - spouseCash;
    const perChild = children.length > 0 ? childCashPool / children.length : 0;

    // ------------------------------------------------------------------
    //  STOCK: the heir, then the rest of the children
    // ------------------------------------------------------------------
    //  The spouse takes none. A second large holder arriving on the
    //  register at the moment the company can least afford one is a
    //  different game, and the interesting version of her is somebody on
    //  the board rather than a rival for it.
    // ------------------------------------------------------------------
    const heir = heirId ? children.find(c => c.id === heirId) : undefined;
    const others = children.filter(c => c.id !== heir?.id);

    // The heir first, so `splitWhole` gives them the odd share. Everything
    // else about this list is in family order.
    const stockOrder = heir ? [heir, ...others] : children;
    const weights = heir
        ? [
            others.length > 0 ? HEIR_STOCK_SHARE : 1,
            ...others.map(() => (1 - HEIR_STOCK_SHARE) / others.length),
        ]
        // Nobody is in charge, so nobody is favoured. This is the branch that
        // makes an underage family lose the company.
        : children.map(() => 1);
    const stock = splitWhole(shares, weights);

    const out: Bequest[] = stockOrder.map((child, i) => ({
        id: child.id,
        kind: (child.id === heir?.id ? 'heir' : 'child') as 'heir' | 'child',
        cash: perChild,
        shares: stock[i] ?? 0,
    }));

    if (spouse) out.push({ id: spouse.id, kind: 'spouse', cash: spouseCash, shares: 0 });
    return out;
};

/**
 * What the family still holds between them, as a fraction of the company.
 *
 * The number the whole design is about, and the reason it is worth returning
 * rather than leaving somebody to add the bequests up: one generation on it is
 * unchanged, and the interesting reading is what it is after two.
 */
export const familyHolding = (bequests: readonly Bequest[], totalShares: number): number => {
    if (!(totalShares > 0)) return 0;
    return bequests.reduce((sum, b) => sum + b.shares, 0) / totalShares;
};
