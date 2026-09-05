// src/core/market/divestitureLock.test.ts
//
// ============================================================================
//  BUY A COMPANY IN THE MORNING, SELL IT IN THE AFTERNOON, KEEP THE DIFFERENCE
// ============================================================================
//
//  Reported as "I buy a company and sell it straight away for more, there is
//  no commission in between, so I make money instantly".
//
//  FOUR ROUTES WERE MEASURED FIRST AND ALL FOUR ALREADY LOST MONEY. The market
//  screen round trip is exactly break even; the acquisition flow followed by
//  `sellSubsidiary` loses between seven and ninety three per cent depending on
//  the target's risk band; a subsidiary with no deal record loses fifteen.
//  I was about to report that the exploit did not exist.
//
//  IT WAS THE FIFTH DOOR. `attemptToSellCompany` is a separate sell path, and
//  it never called `quoteDivestiture` at all:
//
//    - no exit commission, because the fifteen per cent lived in a function
//      this route did not use
//    - it credited the FULL asking price, and the asking price defaults to
//      `valuation`, which is set to WHAT YOU PAID - so the acquisition premium
//      that is supposed to evaporate on day one came straight back
//    - and a refusal only cost five per cent of the valuation, so the eighty
//      per cent die could simply be rolled again
//
//  One question answered in two places, and this was the copy the player was
//  using. The same shape as the buyout price, the brand scale and the reach
//  index before it.
//
//  ---------------------------------------------------------------------------
//  AND THE FIX IS TWO THINGS BECAUSE THE ABUSE IS TWO THINGS
//  ---------------------------------------------------------------------------
//  Asked for as "let us not be able to sell for two quarters, and raise the
//  commission", and decided as a commission that falls with how long it was
//  held rather than a flat one. A flat rate high enough to stop the flip also
//  taxes the player who spent a decade building the thing.
//
//  Measured through the real store, buying a $1.15B company and asking exactly
//  its fair value:
//
//      held    commission   received      net
//      0q          -         REFUSED        -
//      1q          -         REFUSED        -
//      3q         34%        $833M      -$317M
//      8q         28%        $906M      -$244M
//      20q        14%      $1,080M       -$70M
//      40q        12%      $1,109M       -$41M
//
//  A company that never grew always loses, which is correct: you paid a
//  premium to buy it and a fee to leave. What makes an exit profitable is the
//  company being worth more when you go, and that is the only thing that does.
// ============================================================================

import {
    DIVESTITURE_DECAY_QUARTERS,
    DIVESTITURE_DISCOUNT,
    DIVESTITURE_DISCOUNT_MAX,
    DIVESTITURE_DISCOUNT_MIN,
    DIVESTITURE_LOCK_QUARTERS,
    divestitureDiscount,
    divestitureLock,
    quoteDivestiture,
    type AcquisitionDeal,
} from './mergers';

const deal = (over: Partial<AcquisitionDeal> = {}): AcquisitionDeal => ({
    id: 'd', name: 'Target', price: 1_150_000_000, fairValue: 1_000_000_000,
    premium: 150_000_000, targetAnnualEbit: 70_000_000, quartersSinceClose: 0,
    goodwill: 150_000_000, impaired: false, hostile: false, ...over,
} as AcquisitionDeal);

describe('you cannot sell it the week you bought it', () => {
    it('the first two quarters are a refusal, not a price', () => {
        // A price the player can pay is a price somebody will pay, and a same
        // quarter round trip should not have an exchange rate.
        expect(divestitureLock(0).locked).toBe(true);
        expect(divestitureLock(1).locked).toBe(true);
        expect(divestitureLock(2).locked).toBe(false);
        expect(DIVESTITURE_LOCK_QUARTERS).toBe(2);
    });

    it('and it counts down, so the screen can say how long', () => {
        expect(divestitureLock(0).quartersLeft).toBe(2);
        expect(divestitureLock(1).quartersLeft).toBe(1);
        expect(divestitureLock(5).quartersLeft).toBe(0);
    });

    it('and a locked holding quotes nothing rather than a tempting number', () => {
        // Or the screen offers a price the store then refuses to honour,
        // which is the "it said yes and then no" bug in a different room.
        const q = quoteDivestiture(deal({ quartersSinceClose: 0 }));
        expect(q.locked).toBe(true);
        expect(q.proceeds).toBe(0);
    });

    it('and nonsense held counts do not unlock it', () => {
        expect(divestitureLock(-5).locked).toBe(true);
        expect(divestitureLock(NaN).locked).toBe(true);
    });
});

describe('and what it costs to leave falls with how long you stayed', () => {
    it('heaviest at the first legal moment', () => {
        expect(divestitureDiscount(DIVESTITURE_LOCK_QUARTERS)).toBeCloseTo(DIVESTITURE_DISCOUNT_MAX, 9);
        expect(DIVESTITURE_DISCOUNT_MAX).toBe(0.35);
    });

    it('and it only ever goes down from there', () => {
        let previous = Infinity;
        for (let q = 2; q <= 40; q++) {
            const d = divestitureDiscount(q);
            expect(d).toBeLessThanOrEqual(previous);
            previous = d;
        }
    });

    it('and it settles at the floor rather than at zero', () => {
        // Selling a business is never free, however long you owned it.
        expect(divestitureDiscount(DIVESTITURE_LOCK_QUARTERS + DIVESTITURE_DECAY_QUARTERS))
            .toBeCloseTo(DIVESTITURE_DISCOUNT_MIN, 9);
        expect(divestitureDiscount(500)).toBeCloseTo(DIVESTITURE_DISCOUNT_MIN, 9);
        expect(DIVESTITURE_DISCOUNT_MIN).toBeGreaterThan(0);
    });

    it('and five years is the distance, which cannot be waited out as a tactic', () => {
        expect(DIVESTITURE_DECAY_QUARTERS).toBe(20);
    });

    it('and the old flat constant is now the floor, so nothing that imports it breaks', () => {
        expect(DIVESTITURE_DISCOUNT).toBe(DIVESTITURE_DISCOUNT_MIN);
    });

    it('and the quote reports the rate it used, so the screen can name it', () => {
        const q = quoteDivestiture(deal({ quartersSinceClose: 8 }));
        expect(q.discount).toBeCloseTo(divestitureDiscount(8), 9);
        expect(q.proceeds).toBeCloseTo(q.currentFairValue * (1 - q.discount), 6);
    });
});

describe('so an immediate flip cannot pay', () => {
    it('at the first legal quarter you are well down on what you paid', () => {
        const q = quoteDivestiture(deal({ quartersSinceClose: 2 }));
        expect(q.gainOrLoss).toBeLessThan(0);
        expect(q.proceeds / 1_150_000_000).toBeLessThan(0.85);
    });

    it('and holding longer helps, but never enough on a company that did not grow', () => {
        const early = quoteDivestiture(deal({ quartersSinceClose: 3 }));
        const late = quoteDivestiture(deal({ quartersSinceClose: 40 }));
        expect(late.proceeds).toBeGreaterThan(early.proceeds);
        expect(late.gainOrLoss).toBeLessThan(0);
    });

    it('but a company you actually grew sells at a profit, which is the point', () => {
        // The rule has to leave a way to win or it is a wall. Doubling the
        // target's earnings over five years is a real exit.
        const grown = quoteDivestiture(deal({
            quartersSinceClose: 20, targetAnnualEbit: 140_000_000,
        }));
        expect(grown.gainOrLoss).toBeGreaterThan(0);
    });

    it('and a company you ruined sells for less, whatever the commission', () => {
        const ruined = quoteDivestiture(deal({ quartersSinceClose: 20, targetAnnualEbit: 0 }));
        expect(ruined.currentFairValue).toBeLessThan(deal().fairValue);
    });
});

describe('the wiring', () => {
    const fs = require('fs');
    const path = require('path');
    const read = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8');

    it('BOTH sell paths ask the same function', () => {
        // THE DEFECT. `attemptToSellCompany` was a second answer to a question
        // that already had one, and it was the answer the player was using.
        const store = read('features', 'finance', 'stores', 'useCorporateFinanceStore.ts');
        const attempt = store.slice(store.indexOf('attemptToSellCompany: (id, askingPrice)'));
        // ------------------------------------------------------------
        //  THE CALL TAKES THE LIVE VALUATION NOW
        // ------------------------------------------------------------
        //  It used to be quoteDivestiture(company.deal) alone, which priced
        //  off the EBIT recorded on the day of the purchase - a number
        //  advanceDeal never touches. So a subsidiary the player grew for
        //  fifty years sold for exactly what it would have on day one.
        //
        //  The second argument is what makes the exit follow the valuation
        //  they have been managing. A caller that drops it silently goes
        //  back to the frozen price, so this checks it is passed.
        // ------------------------------------------------------------
        expect(attempt).toMatch(/quoteDivestiture\(\s*company\.deal,\s*company\.valuation\s*\)/);
        expect(attempt).toMatch(/if \(quote\?\.locked\)/);
        // And it pays the NET, not the asking price.
        expect(attempt).toMatch(/askingPrice \* \(1 - commission\)/);
        expect(attempt).not.toMatch(/setCompanyCapital\(companyCapital \+ askingPrice\)/);
    });

    it('and the other one refuses inside the lock too', () => {
        const store = read('features', 'finance', 'stores', 'useCorporateFinanceStore.ts');
        const sell = store.slice(store.indexOf('sellSubsidiary: (id, priceMultiple)'));
        expect(sell).toMatch(/priceMultiple === undefined && quote\?\.locked/);
    });

    it('and a story offer is exempt, because the player did not go looking for it', () => {
        // When a scene has somebody arrive with a bid, that bid is the
        // fiction. `priceMultiple` is what only the story passes.
        const sink = read('core', 'story', 'gameSink.ts');
        expect(sink).toMatch(/sellSubsidiary\(company, priceMultiple\)/);
    });

    it('and the exemption really works, through the real store', () => {
        // Asserted end to end rather than by reading the guard, because "the
        // condition mentions priceMultiple" and "a locked holding actually
        // sells when a scene offers for it" are different claims.
        const {
            useCorporateFinanceStore,
        } = require('../../features/finance/stores/useCorporateFinanceStore');
        const { useStatsStore } = require('../store/useStatsStore');

        useCorporateFinanceStore.setState({ subsidiaries: [] });
        useStatsStore.getState().setCompanyCapital(1e13);
        useCorporateFinanceStore.getState().executeAcquisition({
            target: { id: 'locked_co', name: 'Locked Co', marketCap: 1_000_000_000, risk: 'Low' },
            hostile: false, financing: 'cash',
        });

        const held = () =>
            useCorporateFinanceStore.getState().subsidiaries.some((s: any) => s.id === 'locked_co');

        // The player cannot.
        useCorporateFinanceStore.getState().sellSubsidiary('locked_co');
        expect(held()).toBe(true);

        // A scene can.
        useCorporateFinanceStore.getState().sellSubsidiary('locked_co', 1.25);
        expect(held()).toBe(false);
    });

    it('and the screen prices off the same quote rather than off what you paid', () => {
        const src = read('components', 'MyCompany', 'Actions', 'SellCompanyModal.tsx');
        // Same call, same reason. See the note above.
        expect(src).toMatch(/quoteDivestiture\(\s*company\.deal,\s*company\.valuation\s*\)/);
        expect(src).not.toMatch(/setAskingPrice\(company\.valuation\)/);
        expect(src).toMatch(/const netProceeds = Math\.max\(0, askingPrice \* \(1 - commission\)\)/);
    });

    it('and it says the commission out loud, in both languages, without a dash', () => {
        const src = read('components', 'MyCompany', 'Actions', 'SellCompanyModal.tsx');
        expect(src).toMatch(/t\('action\.saleCommission'/);
        expect(src).toMatch(/t\('action\.saleLocked'/);
        expect(src).toMatch(/disabled=\{locked\}/);
        for (const f of ['tr', 'en'] as const) {
            for (const k of ['action.saleCommission', 'action.saleLocked']) {
                const line = read('core', 'i18n', `${f}.ts`)
                    .split('\n').find((l: string) => l.includes(`'${k}'`));
                expect(`${f}:${k}:${line}`).toContain(k);
                expect(line).not.toMatch(/[—–]/);
                expect(line!.replace(/^.*?':/, '')).not.toMatch(/ - /);
            }
        }
    });

    it('and the alert announces what landed, not what was agreed', () => {
        const src = read('components', 'MyCompany', 'Actions', 'SellCompanyModal.tsx');
        expect(src).toMatch(/const got = result\.price \?\? netProceeds/);
        expect(src).not.toMatch(/ToastAndroid\.show\(`Sold for \$\{formatMoney\(askingPrice\)\}/);
    });
});
