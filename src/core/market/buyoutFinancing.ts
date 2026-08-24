// src/core/market/buyoutFinancing.ts
//
// ============================================================================
//  PAYING FOR SOMEBODY ELSE'S STAKE IN YOUR OWN COMPANY
// ============================================================================
//
//  Buying a company had three ways to pay. Buying a SHAREHOLDER had one, and
//  it was your own wallet: `if (money < offerPrice) return`.
//
//  mergers.ts already knew why that is not enough. Its header says it in
//  Turkish: "Onceki hali yalnizca NAKIT kabul ediyordu. Sonuc: kendinden
//  buyuk bir sirketi asla alamiyordun." The same sentence is true here and
//  nobody had written it down, because nobody had needed to buy out a
//  shareholder until the succession started producing them.
//
//  ---------------------------------------------------------------------------
//  THE ARITHMETIC THAT MAKES THIS URGENT
//  ---------------------------------------------------------------------------
//  inheritance.ts splits an estate in a deliberate way: SHARES DO NOT DIVIDE
//  and cash does. The successor takes HEIR_STOCK_SHARE - sixty per cent - of
//  the parent's holding, so a founder who held 55 per cent leaves a successor
//  holding 33. The siblings split the other forty per cent between them. But
//  the cash goes a quarter to the surviving spouse and the rest EQUALLY among
//  the children, so the successor gets one nth of it.
//
//  A big stake and a small wallet, on purpose. Which means that on the morning
//  they take the chair, a sibling's seven per cent of the company is worth
//  something like ten times everything the successor owns in cash. Buying them
//  out of personal money is not difficult, it is arithmetically impossible,
//  and it will stay impossible however well the run goes, because the company
//  grows faster than the salary does.
//
//  ---------------------------------------------------------------------------
//  SO: THREE ROUTES, AND THEY ARE NOT THE SAME THREE AS AN ACQUISITION
//  ---------------------------------------------------------------------------
//  `stock` does not survive the translation. Handing a shareholder newly
//  issued shares in your company to buy their shares in your company is a
//  circle: they end up holding roughly what they started with and everybody
//  else is diluted for nothing. It is not offered.
//
//  What replaces it is the thing family firms actually do.
//
//    CASH       Your own money. You end up holding their shares, so your
//               count rises and so does your percentage. Nothing is owed to
//               anybody afterwards. Limited by a wallet that will never be
//               big enough for a serious holding.
//
//    TREASURY   The COMPANY buys the holding and retires it. You gain no
//               shares at all - and your percentage still rises, because the
//               denominator shrank. Thirty three per cent of a company
//               becomes thirty five when seven per cent is torn up. It costs
//               you personally nothing and costs the business its capital.
//
//    LEVERAGED  The same retirement, paid for with borrowed money. No cash
//               leaves anybody today. The interest sits on the company every
//               quarter for as long as the debt lives, which is the honest
//               price of not having had the money.
//
//  ---------------------------------------------------------------------------
//  AND THE PART THAT IS ACTUALLY THE POINT
//  ---------------------------------------------------------------------------
//  The last two spend the COMPANY'S money, so they are board decisions, and
//  governance.ts already settled what that means: below CONTROL_THRESHOLD -
//  fifty per cent - everything goes to a vote.
//
//  A successor starts at thirty three. So every treasury buyout they attempt
//  goes to the board, and the board is where runSuccession put their siblings.
//  You are asking your brothers to vote on spending the family's company to
//  buy one of them out and raise your share of what is left.
//
//  None of that needed inventing. It falls out of two rules that were already
//  written, one in inheritance.ts and one in governance.ts, which is the
//  argument for having written them properly.
//
//  PURE. No stores, no clock. Quotes only: whether a route can be walked and
//  what it costs. Walking it is the store's job.
// ============================================================================

import type { ProposalKind } from './governance';

/** How the holding gets paid for. */
export type BuyoutRoute = 'cash' | 'treasury' | 'leveraged';

/**
 * How much of a company's own valuation it may borrow to retire its own stock.
 *
 * Lower than MAX_LEVERAGE_RATIO in mergers.ts, which allows sixty per cent for
 * an acquisition. Borrowing to buy an asset and borrowing to buy back your own
 * paper are not the same risk: one adds something that earns, the other adds
 * nothing and shrinks the equity underneath the debt. Lenders price that
 * difference, and so does this.
 */
export const MAX_RECAP_LEVERAGE = 0.35;

export interface BuyoutFinancingInput {
    /** What the holder is being paid, in total. */
    price: number;
    /** The player's personal money. */
    playerCash: number;
    /** The company treasury. */
    companyCapital: number;
    /** What the company is worth. */
    companyValuation: number;
    /** What the company already owes. */
    existingDebt: number;
    /** Shares in issue, before anything happens. */
    totalShares: number;
    /** What the player holds now. */
    playerShares: number;
    /** What the holder being bought out holds. */
    targetShares: number;
    /** Annual rate, from the credit score. */
    interestRate: number;
}

export interface BuyoutFinancingQuote {
    route: BuyoutRoute;
    feasible: boolean;
    reason?: string;

    /** Out of the player's pocket. */
    personalCashUsed: number;
    /** Out of the company treasury. */
    companyCashUsed: number;
    /** New borrowing against the company. */
    debtRaised: number;
    /** Yearly cost of that borrowing. */
    annualInterest: number;

    /** Shares the player ends up personally holding. */
    playerSharesAfter: number;
    /** Shares in issue afterwards. Falls when a holding is retired. */
    totalSharesAfter: number;
    /** The player's percentage, before and after. */
    ownershipBefore: number;
    ownershipAfter: number;

    /** Whether this route puts the decision in front of the board. */
    proposalKind: ProposalKind | null;
}

const pct = (part: number, whole: number): number =>
    whole > 0 ? (part / whole) * 100 : 0;

/**
 * What one route would cost and leave behind.
 *
 * Always returns a quote, even an unaffordable one, because a route the player
 * cannot walk today is still information: the treasury figure is what tells
 * somebody their own wallet is never going to be the answer.
 */
export const quoteBuyoutFinancing = (
    route: BuyoutRoute,
    input: BuyoutFinancingInput,
): BuyoutFinancingQuote => {
    const price = Math.max(0, input.price || 0);
    const totalShares = Math.max(0, input.totalShares || 0);
    const playerShares = Math.max(0, input.playerShares || 0);
    const targetShares = Math.max(0, input.targetShares || 0);
    const ownershipBefore = pct(playerShares, totalShares);

    const base = {
        route,
        feasible: true as boolean,
        personalCashUsed: 0,
        companyCashUsed: 0,
        debtRaised: 0,
        annualInterest: 0,
        playerSharesAfter: playerShares,
        totalSharesAfter: totalShares,
        ownershipBefore,
        ownershipAfter: ownershipBefore,
        proposalKind: null as ProposalKind | null,
    };

    // ----------------------------------------------------------------------
    //  CASH: the shares change hands and nothing is destroyed.
    // ----------------------------------------------------------------------
    if (route === 'cash') {
        const playerSharesAfter = playerShares + targetShares;
        const quote = {
            ...base,
            personalCashUsed: price,
            playerSharesAfter,
            ownershipAfter: pct(playerSharesAfter, totalShares),
        };
        if ((input.playerCash || 0) < price) {
            return {
                ...quote,
                feasible: false,
                reason: 'Not enough personal cash. The company can buy the holding instead, or borrow against itself to do it.',
            };
        }
        return quote;
    }

    // ----------------------------------------------------------------------
    //  TREASURY AND LEVERAGED: the shares are RETIRED.
    // ----------------------------------------------------------------------
    //  The player gains nothing and gains percentage, which is the part that
    //  reads as a trick until you see the denominator. Their count is
    //  untouched; there is simply less company for it to be a share of.
    // ----------------------------------------------------------------------
    const totalSharesAfter = Math.max(0, totalShares - targetShares);
    const retired = {
        ...base,
        totalSharesAfter,
        ownershipAfter: pct(playerShares, totalSharesAfter),
        // Spending or borrowing the company's money to retire its own stock.
        // governance.ts has had a name for this all along.
        proposalKind: (route === 'leveraged' ? 'debt' : 'buyback') as ProposalKind,
    };

    if (route === 'treasury') {
        const quote = { ...retired, companyCashUsed: price };
        if ((input.companyCapital || 0) < price) {
            return {
                ...quote,
                feasible: false,
                reason: 'The treasury will not cover it. Borrowing against the company would.',
            };
        }
        return quote;
    }

    const capacity = (input.companyValuation || 0) * MAX_RECAP_LEVERAGE - (input.existingDebt || 0);
    const quote = {
        ...retired,
        debtRaised: price,
        annualInterest: price * Math.max(0, input.interestRate || 0),
    };
    if (capacity < price) {
        return {
            ...quote,
            feasible: false,
            reason: `Lenders will not fund a buyback past ${Math.round(MAX_RECAP_LEVERAGE * 100)}% leverage. There is room for about ${Math.max(0, Math.round(capacity)).toLocaleString()}.`,
        };
    }
    return quote;
};

/** Every route, so a screen can show what it cannot afford as well as what it can. */
export const quoteAllBuyoutRoutes = (
    input: BuyoutFinancingInput,
): Record<BuyoutRoute, BuyoutFinancingQuote> => ({
    cash: quoteBuyoutFinancing('cash', input),
    treasury: quoteBuyoutFinancing('treasury', input),
    leveraged: quoteBuyoutFinancing('leveraged', input),
});

export const BUYOUT_ROUTE_LABELS: Record<BuyoutRoute, string> = {
    cash: 'Your money',
    treasury: 'Company buys it back',
    leveraged: 'Company borrows to buy it back',
};

export const BUYOUT_ROUTE_EXPLANATIONS: Record<BuyoutRoute, string> = {
    cash:
        'You buy the shares yourself and you keep them. Nobody is owed anything afterwards and the board has no say, '
        + 'because it is not their money. The limit is that it is your money, and a serious holding will always cost '
        + 'more than a salary can hold.',
    treasury:
        'The company buys the holding and tears it up. You gain no shares at all, and your percentage still rises, '
        + 'because there is less company left to divide. It costs you nothing personally and costs the business its '
        + 'capital, so the board votes on it, and the board is where your family sits.',
    leveraged:
        'The same, borrowed. Nobody pays anything today and the company carries the interest every quarter for as '
        + 'long as the debt lives. It is how this is usually done and it is how companies are usually ruined, which '
        + 'are the same sentence.',
};
