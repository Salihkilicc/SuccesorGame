// src/core/luxury/upkeep.test.ts
//
// ============================================================================
//  THE REPAIR BUTTON WAS A FIVE TO ONE RETURN
// ============================================================================
//
//  Found while turning the maintenance cost on, which is the only reason it
//  was found: the exploit was unreachable because NOTHING DECAYS CONDITION,
//  so the repair button never appeared and nobody had a reason to price it.
//
//      conditionFactor = 0.5 + 0.5 * (condition / 100)     // in the hook
//      repairCost      = price * (100 - condition) / 1000  // also in the hook
//
//  Two formulas, forty lines apart, never compared. Restoring an asset from
//  50 to 100 costs 5% of its price and puts back 25% of its price.
//
//  The first test below is that number. It fails on the old formula.
//
//  ---------------------------------------------------------------------------
//  WHY THE RULE IS AN INEQUALITY AND NOT A TUNED PAIR
//  ---------------------------------------------------------------------------
//  The old pair could have been fixed by moving the 1000 to a 200 and moving
//  on, and it would have drifted back the first time either curve was touched
//  - which is the same failure that produced it. So the repair is now PRICED
//  OFF the value it restores, and the only free parameter is how much worse
//  than break even it is. It cannot become profitable without somebody
//  deliberately setting a constant below one, and the test says so.
// ============================================================================

import {
    CONDITION_FLOOR, DECAY_PER_QUARTER, NEGLECT_MULTIPLE, QUARTERS_PER_YEAR,
    REPAIR_LOSS, UPKEEP_RATE, annualUpkeep, decayed, portfolioUpkeepQuarterly,
    quarterlyUpkeep, repairCost, repairNetLoss, valueAt,
    type LuxuryCategory,
} from './upkeep';
import { ITEMS } from '../../features/shopping/data/shoppingRegistry';

const CATEGORIES = Object.keys(UPKEEP_RATE) as LuxuryCategory[];

describe('a repair never makes money', () => {
    it('restoring a wreck costs more than the wreck gains', () => {
        // THE DEFECT, at the exact numbers it was found with. On the old
        // formula this was 5,000,000 against 25,000,000.
        const PRICE = 100_000_000;
        const gain = valueAt(PRICE, 100) - valueAt(PRICE, 50);
        expect(gain).toBe(25_000_000);
        expect(repairCost(PRICE, 50, 100)).toBeGreaterThan(gain);
    });

    it('and that holds at every condition, on every item in the catalogue', () => {
        // Not a spot check. The old bug survived because one pair of numbers
        // was looked at and the curve was not.
        for (const item of ITEMS) {
            for (let from = 0; from < 100; from += 5) {
                const gain = valueAt(item.price, 100) - valueAt(item.price, from);
                const cost = repairCost(item.price, from, 100);
                expect([item.id, from, cost >= gain]).toEqual([item.id, from, true]);
            }
        }
    });

    it('and the loss is stated so a screen can be honest about it', () => {
        const PRICE = 100_000_000;
        // Restores 25M, costs 35M, so it is a 10M decision and not a 25M gift.
        expect(repairNetLoss(PRICE, 50, 100)).toBeCloseTo(10_000_000, 0);
    });

    it('and asking to repair downwards is free and does nothing', () => {
        // Or the sign flips and the loss becomes a payout.
        expect(repairCost(100_000_000, 100, 50)).toBe(0);
        expect(repairNetLoss(100_000_000, 100, 50)).toBe(0);
    });

    it('and the constant that decides this cannot be at break even by accident', () => {
        // The one free parameter. Anything at or below 1 is the old bug back.
        expect(REPAIR_LOSS).toBeGreaterThan(1);
    });
});

describe('and doing nothing is the expensive option', () => {
    it('condition falls on its own, even when the bill is paid', () => {
        // Or there is no reason to look at the screen ever again.
        for (const c of CATEGORIES) {
            expect([c, decayed(100, c, 4, true) < 100]).toEqual([c, true]);
        }
    });

    it('and it falls four times faster when the bill is not', () => {
        // THE REASON THE PLAYER CARES ABOUT THE UPKEEP LINE. Without this,
        // not paying is free and the whole system is a tax.
        // Compared with a tolerance rather than exactly: 1.2 * 8 is
        // 9.600000000000001 in binary floating point, and a strict equality
        // here failed on the boats alone. The tolerance is a millionth of a
        // condition point, which is far below anything the game can show.
        for (const c of CATEGORIES) {
            const kept = 100 - decayed(100, c, 8, true);
            const left = 100 - decayed(100, c, 8, false);
            expect([c, Math.abs(left - kept * NEGLECT_MULTIPLE) < 1e-6])
                .toEqual([c, true]);
        }
    });

    it('and a neglected car is scrap inside a decade', () => {
        // The claim in the module header, checked rather than asserted.
        // Eight years is 32 quarters at 0.8 x 4 a quarter.
        expect(decayed(100, 'VEHICLE', 32, false)).toBe(0);
        expect(decayed(100, 'VEHICLE', 40, true)).toBeGreaterThan(60);
    });

    it('and nothing decays past a wreck or above mint', () => {
        expect(decayed(100, 'MARINE', 10_000, false)).toBe(0);
        expect(decayed(100, 'WATCH', 0, true)).toBe(100);
        expect(decayed(200, 'WATCH', 0, true)).toBe(100);
    });

    it('and a category nobody thought of costs nothing and rots not at all', () => {
        // Rather than NaN through the whole personal economy. A new category
        // should show up as a missing rate, not as a broken quarter.
        expect(annualUpkeep({ price: 1_000_000, category: 'SPACECRAFT' })).toBe(0);
        expect(decayed(80, 'SPACECRAFT', 40, false)).toBe(80);
    });
});

describe('and the bill is a share of what the thing cost', () => {
    it('every category has a rate, and none of them is free or ruinous', () => {
        for (const c of CATEGORIES) {
            expect([c, UPKEEP_RATE[c] > 0]).toEqual([c, true]);
            expect([c, UPKEEP_RATE[c] < 0.1]).toEqual([c, true]);
        }
    });

    it('and the rates match the ones somebody already wrote down', () => {
        // The four anchors in the shelved LuxoNet catalogue, which is the only
        // place in this project anybody priced maintenance per item. Within a
        // tenth of a per cent, or these numbers are just taste.
        const anchors: Array<[LuxuryCategory, number, number]> = [
            ['VEHICLE', 85_000, 3_900_000],
            ['REAL_ESTATE', 420_000, 48_500_000],
            ['AIRCRAFT', 1_400_000, 78_000_000],
            ['WATCH', 12_000, 4_200_000],
        ];
        for (const [cat, cost, value] of anchors) {
            expect([cat, Math.abs(UPKEEP_RATE[cat] - cost / value) < 0.001])
                .toEqual([cat, true]);
        }
    });

    it('and a boat costs more to keep than a watch, by a lot', () => {
        // The ordering is the design. Salt water, then engines, then things
        // that sit in a vault.
        expect(UPKEEP_RATE.MARINE).toBeGreaterThan(UPKEEP_RATE.AIRCRAFT);
        expect(UPKEEP_RATE.AIRCRAFT).toBeGreaterThan(UPKEEP_RATE.REAL_ESTATE);
        expect(UPKEEP_RATE.JEWELRY).toBeGreaterThan(UPKEEP_RATE.WATCH);
        expect(DECAY_PER_QUARTER.MARINE).toBeGreaterThan(DECAY_PER_QUARTER.WATCH);
    });

    it('and a quarter is a year over four', () => {
        const item = { price: 40_000_000, category: 'REAL_ESTATE' };
        expect(quarterlyUpkeep(item) * QUARTERS_PER_YEAR).toBe(annualUpkeep(item));
    });

    it('and a collection costs the sum of its parts', () => {
        const three = ITEMS.slice(0, 3);
        expect(portfolioUpkeepQuarterly(three))
            .toBeCloseTo(three.reduce((s, i) => s + quarterlyUpkeep(i), 0), 6);
        expect(portfolioUpkeepQuarterly([])).toBe(0);
    });
});

// ============================================================================
//  AND THE SIZE OF IT, WHICH IS THE PART THAT IS A DESIGN DECISION
// ============================================================================
//
//  A maintenance system that costs nothing is a chore, and one that cannot be
//  paid is a wall. These pin the two ends so that a later tweak to a rate has
//  to answer for what it does to the whole catalogue rather than to one item.
// ============================================================================

describe('and the whole shop costs a real amount to keep', () => {
    it('holding everything runs at between one and two per cent a year', () => {
        const value = ITEMS.reduce((s, i) => s + i.price, 0);
        const upkeep = ITEMS.reduce((s, i) => s + annualUpkeep(i), 0);
        const share = upkeep / value;
        expect(share).toBeGreaterThan(0.01);
        expect(share).toBeLessThan(0.02);
    });

    it('and the median item costs more per quarter than the founder earns', () => {
        // $45,000 a quarter is CEO_BASE_SALARY_QUARTERLY. Deliberate: at this
        // end of the game the salary is not what buys these things, and upkeep
        // is what makes a purchase a commitment rather than a receipt.
        const sorted = [...ITEMS].sort((a, b) => a.price - b.price);
        const median = sorted[Math.floor(sorted.length / 2)];
        expect(quarterlyUpkeep(median)).toBeGreaterThan(45_000);
    });

    it('and the cheapest things in the shop are still affordable to keep', () => {
        // The other end. A ring should not carry a bill that reads like a
        // yacht's, or the bottom of the catalogue is unusable.
        const sorted = [...ITEMS].sort((a, b) => a.price - b.price);
        for (const item of sorted.slice(0, 10)) {
            expect([item.id, quarterlyUpkeep(item) < 45_000])
                .toEqual([item.id, true]);
        }
    });
});

describe('and a wreck is still worth something', () => {
    it('condition moves the top half of the price and no more', () => {
        expect(valueAt(100, 100)).toBe(100);
        expect(valueAt(100, 0)).toBe(100 * CONDITION_FLOOR);
        expect(valueAt(100, 50)).toBe(75);
    });

    it('and nonsense in gives a number out', () => {
        expect(valueAt(NaN, 50)).toBe(0);
        expect(valueAt(100, NaN)).toBe(100);
        expect(Number.isFinite(annualUpkeep({ price: NaN, category: 'MARINE' }))).toBe(true);
    });
});
