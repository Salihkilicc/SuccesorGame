// src/core/market/subsidiaryValue.test.ts
//
// ============================================================================
//  WHAT AN ACQUIRED COMPANY IS WORTH TODAY
// ============================================================================
//
//  Reported as an acquired company selling for the same price forever,
//  "trilyon dolar da olsa aynı satis fiyati kaliyor" - and as something that
//  used to work and had broken.
//
//  It had. `quoteDivestiture` priced off `targetAnnualEbit`, which is written
//  on the day of the purchase and which `advanceDeal` never touches: it moves
//  the quarter counter, the goodwill and the impairment flag and nothing
//  else. Meanwhile `Subsidiary.valuation` moves EVERY QUARTER, up or down, on
//  the marketing, R&D, production and workforce the player sets - so the one
//  number they spend the game managing had no effect on the exit.
//
//  Measured before: 115M paid, 75.6M quoted at quarter 2, 75.6M at quarter
//  200. Only the commission moved.
// ============================================================================

import {
    DIVESTITURE_DISCOUNT_MIN,
    advanceDeal,
    quoteAcquisition,
    quoteDivestiture,
} from './mergers';

/** A deal as the store records one, ready to be walked forward. */
const freshDeal = () => ({
    ...(quoteAcquisition(100_000_000, 'Medium', false, 500_000_000) as never as Record<string, number>),
    quartersSinceClose: 0,
}) as never as Parameters<typeof quoteDivestiture>[0];

const held = (quarters: number) => {
    let deal = freshDeal();
    for (let i = 0; i < quarters; i++) deal = advanceDeal(deal, 1);
    return deal;
};

describe('the exit follows the valuation the player has been moving', () => {
    it('a subsidiary that grew is worth more', () => {
        const deal = held(8);
        const flat = quoteDivestiture(deal, 100_000_000);
        const grown = quoteDivestiture(deal, 400_000_000);
        expect(grown.currentFairValue).toBe(400_000_000);
        expect(grown.proceeds).toBeGreaterThan(flat.proceeds * 3);
    });

    it('and one that was run into the ground is worth less', () => {
        const deal = held(8);
        const ruined = quoteDivestiture(deal, 20_000_000);
        expect(ruined.currentFairValue).toBe(20_000_000);
        expect(ruined.proceeds).toBeLessThan(20_000_000);
    });

    it('and holding it longer no longer stops the price moving', () => {
        // The measured failure: proceeds stopped changing at quarter 40
        // because only the commission was moving. Now the value can carry on.
        const early = quoteDivestiture(held(4), 120_000_000);
        const late = quoteDivestiture(held(80), 700_000_000);
        expect(late.proceeds).toBeGreaterThan(early.proceeds * 4);
    });

    it('and the commission is still the only thing the CLOCK changes', () => {
        // Same valuation, longer held: more of it reaches the player.
        const v = 250_000_000;
        const soon = quoteDivestiture(held(3), v);
        const later = quoteDivestiture(held(60), v);
        expect(later.discount).toBeLessThan(soon.discount);
        expect(later.discount).toBeCloseTo(DIVESTITURE_DISCOUNT_MIN, 5);
        expect(later.proceeds).toBeGreaterThan(soon.proceeds);
    });

    it('and the lock still refuses to quote a price it will not honour', () => {
        const q = quoteDivestiture(held(0), 500_000_000);
        expect(q.locked).toBe(true);
        expect(q.proceeds).toBe(0);
    });

    it('and a holding with no live valuation falls back rather than reading zero', () => {
        // Every caller that predates this passes nothing. A holding quoted at
        // zero because a second argument was missing would be worse than the
        // frozen estimate it replaces.
        const deal = held(8);
        expect(quoteDivestiture(deal).currentFairValue).toBeGreaterThan(0);
        expect(quoteDivestiture(deal, 0).currentFairValue).toBeGreaterThan(0);
        expect(quoteDivestiture(deal, NaN).currentFairValue).toBeGreaterThan(0);
        expect(quoteDivestiture(deal, -5).currentFairValue).toBeGreaterThan(0);
    });

    it('and the gain is measured against what was actually paid', () => {
        const deal = held(20);
        const q = quoteDivestiture(deal, 400_000_000);
        expect(q.gainOrLoss).toBeCloseTo(q.proceeds - (deal as never as { price: number }).price, 5);
    });
});

describe('and every screen that quotes one passes it', () => {
    const fs = require('fs');
    const path = require('path');
    const live = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/^\s*\/\/.*$/gm, '');

    it('the sell screen and both store calls', () => {
        // A caller that forgets the second argument silently goes back to the
        // frozen price, which is exactly the bug and would look like nothing.
        const sources = [
            live('components', 'MyCompany', 'Actions', 'SellCompanyModal.tsx'),
            live('features', 'finance', 'stores', 'useCorporateFinanceStore.ts'),
        ].join('\n');
        const calls = [...sources.matchAll(/quoteDivestiture\(([^)]*)\)/g)].map(m => m[1]);
        expect(calls.length).toBeGreaterThanOrEqual(3);
        for (const args of calls) expect(args).toContain('valuation');
    });
});
