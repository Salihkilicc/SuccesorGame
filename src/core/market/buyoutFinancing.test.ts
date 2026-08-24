// src/core/market/buyoutFinancing.test.ts
//
// ============================================================================
//  THE WALLET THAT WAS NEVER GOING TO BE BIG ENOUGH
// ============================================================================
//
//  Buying a company had three ways to pay. Buying a SHAREHOLDER had one line:
//  `if (money < offerPrice) return`.
//
//  That is not a difficulty curve, it is a wall, and the succession is what
//  makes it obvious. inheritance.ts divides an estate on a deliberate rule -
//  shares do not split, cash does - so the successor takes sixty per cent of
//  the parent's HOLDING and one nth of the parent's CASH. Big stake, small
//  wallet, on purpose.
//
//  The first test below is the whole argument: at the numbers this game
//  actually produces, a sibling's holding costs roughly ten times everything
//  the new player owns, and it gets worse as the run goes well, because the
//  company grows faster than a salary.
// ============================================================================

import {
    quoteBuyoutFinancing,
    quoteAllBuyoutRoutes,
    MAX_RECAP_LEVERAGE,
    BUYOUT_ROUTE_LABELS,
    BUYOUT_ROUTE_EXPLANATIONS,
    type BuyoutRoute,
} from './buyoutFinancing';
import { HEIR_STOCK_SHARE } from '../story/inheritance';

/**
 * A succession at a plausible scale.
 *
 * Founder held 55% of a company worth fifty billion and left two billion in
 * cash. Spouse takes a quarter of the cash, the four children split the rest,
 * and the successor takes sixty per cent of the shares while the siblings
 * divide the other forty.
 */
const SHARES = 10_000_000;
const VALUATION = 50_000_000_000;
const PRICE_PER_SHARE = VALUATION / SHARES; // 5,000

const FOUNDER_SHARES = SHARES * 0.55;
const SUCCESSOR_SHARES = FOUNDER_SHARES * HEIR_STOCK_SHARE;      // 33% of the company
const SIBLING_SHARES = (FOUNDER_SHARES * (1 - HEIR_STOCK_SHARE)) / 3;

const SUCCESSOR_CASH = (2_000_000_000 * 0.75) / 4;               // 375m
const SIBLING_PRICE = SIBLING_SHARES * PRICE_PER_SHARE * 1.7;    // with the 70% ask

const INPUT = {
    price: SIBLING_PRICE,
    playerCash: SUCCESSOR_CASH,
    // Comfortably over the sibling price, which is about 6.2bn. The gap is
    // narrow on purpose: the treasury is not free money, it is the company.
    companyCapital: 8_000_000_000,
    companyValuation: VALUATION,
    existingDebt: 0,
    totalShares: SHARES,
    playerShares: SUCCESSOR_SHARES,
    targetShares: SIBLING_SHARES,
    interestRate: 0.08,
};

describe('the problem', () => {
    it('is that a sibling costs an order of magnitude more than the successor owns', () => {
        // This is not a hard purchase. It is an impossible one, and it stays
        // impossible however well the run goes.
        expect(SIBLING_PRICE / SUCCESSOR_CASH).toBeGreaterThan(9);
    });

    it('and paying out of pocket is refused, with somewhere else to go', () => {
        const q = quoteBuyoutFinancing('cash', INPUT);
        expect(q.feasible).toBe(false);
        // A dead end that names no alternative is the thing this replaces.
        expect(q.reason).toMatch(/company can buy|borrow/i);
    });
});

describe('paying for it yourself', () => {
    const rich = { ...INPUT, playerCash: SIBLING_PRICE * 2 };

    it('moves the shares to you, so both count and percentage rise', () => {
        const q = quoteBuyoutFinancing('cash', rich);
        expect(q.feasible).toBe(true);
        expect(q.playerSharesAfter).toBe(SUCCESSOR_SHARES + SIBLING_SHARES);
        expect(q.totalSharesAfter).toBe(SHARES);
        expect(q.ownershipAfter).toBeGreaterThan(q.ownershipBefore);
    });

    it('and spends nothing that is not yours', () => {
        const q = quoteBuyoutFinancing('cash', rich);
        expect(q.companyCashUsed).toBe(0);
        expect(q.debtRaised).toBe(0);
        expect(q.personalCashUsed).toBe(SIBLING_PRICE);
    });

    it('so nobody gets a vote on it', () => {
        expect(quoteBuyoutFinancing('cash', rich).proposalKind).toBeNull();
    });
});

describe('letting the company buy it back', () => {
    it('gives you no shares at all and still lifts your percentage', () => {
        // The part nobody believes until they watch the number move: your
        // count is untouched, there is simply less company to be a share of.
        const q = quoteBuyoutFinancing('treasury', INPUT);
        expect(q.feasible).toBe(true);
        expect(q.playerSharesAfter).toBe(SUCCESSOR_SHARES);
        expect(q.totalSharesAfter).toBe(SHARES - SIBLING_SHARES);
        expect(q.ownershipAfter).toBeGreaterThan(q.ownershipBefore);
    });

    it('by the exact amount the arithmetic says', () => {
        const q = quoteBuyoutFinancing('treasury', INPUT);
        expect(q.ownershipBefore).toBeCloseTo(33, 1);
        expect(q.ownershipAfter).toBeCloseTo(
            (SUCCESSOR_SHARES / (SHARES - SIBLING_SHARES)) * 100, 6,
        );
    });

    it('and costs you personally nothing', () => {
        const q = quoteBuyoutFinancing('treasury', INPUT);
        expect(q.personalCashUsed).toBe(0);
        expect(q.companyCashUsed).toBe(SIBLING_PRICE);
    });

    it('but it is their money, so it goes to the board', () => {
        // governance.ts already had the word for spending company money to
        // retire company stock.
        expect(quoteBuyoutFinancing('treasury', INPUT).proposalKind).toBe('buyback');
    });

    it('and an empty treasury says so, pointing at the loan', () => {
        const broke = { ...INPUT, companyCapital: 1 };
        const q = quoteBuyoutFinancing('treasury', broke);
        expect(q.feasible).toBe(false);
        expect(q.reason).toMatch(/borrow/i);
    });
});

describe('borrowing to do it', () => {
    it('retires the shares the same way', () => {
        const q = quoteBuyoutFinancing('leveraged', INPUT);
        expect(q.totalSharesAfter).toBe(SHARES - SIBLING_SHARES);
        expect(q.playerSharesAfter).toBe(SUCCESSOR_SHARES);
    });

    it('with nobody paying anything today', () => {
        const q = quoteBuyoutFinancing('leveraged', INPUT);
        expect(q.personalCashUsed).toBe(0);
        expect(q.companyCashUsed).toBe(0);
        expect(q.debtRaised).toBe(SIBLING_PRICE);
    });

    it('and a bill every year for as long as it lives', () => {
        const q = quoteBuyoutFinancing('leveraged', INPUT);
        expect(q.annualInterest).toBeCloseTo(SIBLING_PRICE * 0.08, 4);
    });

    it('capped tighter than an acquisition would be', () => {
        // Sixty per cent is allowed for buying an asset that earns. Buying
        // back your own paper adds nothing and thins the equity under the
        // debt, and MAX_RECAP_LEVERAGE prices that difference.
        expect(MAX_RECAP_LEVERAGE).toBeLessThan(0.6);
        const overLevered = { ...INPUT, existingDebt: VALUATION * MAX_RECAP_LEVERAGE };
        const q = quoteBuyoutFinancing('leveraged', overLevered);
        expect(q.feasible).toBe(false);
        expect(q.reason).toMatch(/leverage/i);
    });

    it('and the board hears it as debt rather than as a buyback', () => {
        expect(quoteBuyoutFinancing('leveraged', INPUT).proposalKind).toBe('debt');
    });
});

describe('the three of them together', () => {
    it('are quoted even when they cannot be walked', () => {
        // A route the player cannot afford is the most useful row on the
        // panel: it is what tells a successor their wallet is not the answer.
        const all = quoteAllBuyoutRoutes(INPUT);
        expect(all.cash.feasible).toBe(false);
        expect(all.treasury.feasible).toBe(true);
        expect(all.cash.ownershipAfter).toBeGreaterThan(all.cash.ownershipBefore);
    });

    it('and every one of them has a label and an explanation', () => {
        for (const r of ['cash', 'treasury', 'leveraged'] as BuyoutRoute[]) {
            expect(BUYOUT_ROUTE_LABELS[r].length).toBeGreaterThan(3);
            expect(BUYOUT_ROUTE_EXPLANATIONS[r].length).toBeGreaterThan(80);
        }
    });

    it('and none of them offers to pay in your own shares', () => {
        // `stock` works for an acquisition and is a circle here: you would
        // hand a shareholder new shares in the company whose shares you are
        // buying, and dilute everybody for nothing.
        expect(Object.keys(BUYOUT_ROUTE_LABELS)).not.toContain('stock');
    });
});

describe('the edges', () => {
    it('do not divide by zero before a company has issued anything', () => {
        const empty = { ...INPUT, totalShares: 0, playerShares: 0, targetShares: 0 };
        for (const r of ['cash', 'treasury', 'leveraged'] as BuyoutRoute[]) {
            const q = quoteBuyoutFinancing(r, empty);
            expect(Number.isFinite(q.ownershipBefore)).toBe(true);
            expect(Number.isFinite(q.ownershipAfter)).toBe(true);
        }
    });

    it('and buying out the entire register does not retire every share', () => {
        const everything = { ...INPUT, targetShares: SHARES, companyCapital: 1e15 };
        const q = quoteBuyoutFinancing('treasury', everything);
        expect(q.totalSharesAfter).toBe(0);
        expect(Number.isFinite(q.ownershipAfter)).toBe(true);
    });
});
