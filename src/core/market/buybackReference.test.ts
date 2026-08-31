// src/core/market/buybackReference.test.ts
//
// ============================================================================
//  THE LAST DOOR ON THE CRASH AND BUY EXPLOIT
// ============================================================================
//
//  Reported as "I can create losses on purpose, take a billion dollar company
//  down to a million, and then buy the shares out". The boardroom door was
//  shut first: a director prices a control block off the UNAFFECTED price - what
//  the stock was worth before the fall - so they will not hand over control at
//  the bottom of a hole the buyer dug. See core/market/buyout.ts.
//
//  This is the other door, and it was left open. The company buying its own
//  float and retiring it raises the player's percentage without buying anything
//  from anybody, and `quoteBuyback` priced it off whatever the ticker said
//  today. Measured at the time, on a listed company with a four million share
//  float:
//
//      quarter   spot price   retiring the whole float
//      healthy     $502.08              $3,012.50M
//      q8            $0.95                   $5.71M
//      q12           $0.14                   $0.85M
//
//  A three and a half thousand fold discount for breaking your own company.
//  It does not hand over control on its own - the board's block is untouched -
//  but it is the same trick through a different door, and half a fix is the
//  kind that gets found.
// ============================================================================

import { decayReference } from './buyout';
import { companyValuation, quoteBuyback, sharePrice, smoothPrice } from './equity';

const TOTAL = 14_000_000;
const PLAYER = 3_500_000;
const FLOAT = 4_000_000;
const BUDGET = 1e12;

const healthy = {
    cash: 300_000_000, ttmRevenue: 900_000_000, ttmEbit: 220_000_000,
    tangibleAssets: 400_000_000, debt: 0, isPublic: true, brandValue: 60, marketShare: 4,
};
const wrecked = {
    ...healthy, cash: 5_000_000, ttmRevenue: 120_000_000,
    ttmEbit: -180_000_000, debt: 500_000_000,
};

/** Run the collapse the player engineers, with the reference decaying beside it. */
const crash = (quarters: number) => {
    const start = sharePrice(companyValuation(healthy as any).total, TOTAL);
    const wreckedValue = companyValuation(wrecked as any).total;
    const floor = sharePrice(wreckedValue, TOTAL);
    let price = start;
    let reference = start;
    for (let q = 0; q < quarters; q++) {
        price = smoothPrice(price, floor, true, wreckedValue);
        reference = decayReference(reference, price);
    }
    return { price, reference, start };
};

describe('a company cannot retire its own stock at a price it engineered', () => {
    it('the buyback is priced off the higher of the ticker and the reference', () => {
        const cheap = quoteBuyback(BUDGET, 1, TOTAL, PLAYER, FLOAT, 100);
        expect(cheap.averagePrice).toBeGreaterThanOrEqual(100);
    });

    it('and off the ticker when the company is genuinely worth more than it was', () => {
        const risen = quoteBuyback(BUDGET, 200, TOTAL, PLAYER, FLOAT, 100);
        expect(risen.averagePrice).toBeGreaterThanOrEqual(200);
    });

    it('and omitting the reference behaves exactly as it did before', () => {
        // Every existing caller and every test written against the old
        // signature still means what it meant.
        expect(quoteBuyback(BUDGET, 40, TOTAL, PLAYER, FLOAT).totalCost)
            .toBe(quoteBuyback(BUDGET, 40, TOTAL, PLAYER, FLOAT, 0).totalCost);
    });

    it('and a nonsense reference cannot make the float free', () => {
        for (const bad of [NaN, -500, Infinity]) {
            const q = quoteBuyback(BUDGET, 40, TOTAL, PLAYER, FLOAT, bad as number);
            expect(Number.isFinite(q.totalCost)).toBe(true);
            expect(q.totalCost).toBeGreaterThan(0);
        }
    });
});

describe('so wrecking the company does not put the float on sale', () => {
    it('twelve quarters of sabotage still cost most of what it cost healthy', () => {
        // THE DEFECT, as the player met it: $3,012M became $0.85M.
        const { price, reference, start } = crash(12);
        const before = quoteBuyback(BUDGET, start, TOTAL, PLAYER, FLOAT, start).totalCost;
        const after = quoteBuyback(BUDGET, price, TOTAL, PLAYER, FLOAT, reference).totalCost;
        expect(after / before).toBeGreaterThan(0.15);
    });

    it('and it is hundreds of times dearer than it was without the reference', () => {
        const { price, reference } = crash(12);
        const withRule = quoteBuyback(BUDGET, price, TOTAL, PLAYER, FLOAT, reference).totalCost;
        const without = quoteBuyback(BUDGET, price, TOTAL, PLAYER, FLOAT).totalCost;
        expect(withRule / without).toBeGreaterThan(100);
    });

    it('and the share price really does collapse, which the fix does not deny', () => {
        // The premise is sound. What is denied is the CONSEQUENCE.
        const { price, start } = crash(12);
        expect(price / start).toBeLessThan(0.001);
    });

    it('and an honestly declining company still gets cheaper to buy back', () => {
        // The rule has to leave a way through or it is a wall. A company
        // sliding eight per cent a quarter is genuinely worth less and the
        // reference walks down with it.
        let price = 100;
        let reference = 100;
        let previous = Infinity;
        for (let q = 0; q < 40; q++) {
            price *= 0.92;
            reference = decayReference(reference, price);
            const cost = quoteBuyback(BUDGET, price, TOTAL, PLAYER, FLOAT, reference).totalCost;
            expect(cost).toBeLessThan(previous);
            previous = cost;
        }
    });
});

describe('the wiring', () => {
    const fs = require('fs');
    const path = require('path');
    const read = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8');

    it('the store hands the reference over, or the rule is data nothing reads', () => {
        const src = read('features', 'finance', 'stores', 'useEquityStore.ts');
        expect(src).toMatch(/const reference = useStatsStore\.getState\(\)\.sharePriceReference \|\| 0/);
        expect(src).toMatch(/cap\.publicShares, reference,/);
    });

    it('and both doors on the exploit now use the same reference', () => {
        // The boardroom and the treasury. Half a fix is the kind that gets
        // found.
        expect(read('features', 'shareholders', 'stores', 'useShareholderStore.ts'))
            .toMatch(/sharePriceReference/);
        expect(read('features', 'finance', 'stores', 'useEquityStore.ts'))
            .toMatch(/sharePriceReference/);
    });
});
