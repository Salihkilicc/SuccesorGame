// src/core/market/droughtCap.test.ts
//
// ============================================================================
//  TWENTY POINTS OFF A CEILING OF TWENTY TWO IS NOT A PENALTY
// ============================================================================
//
//  Found while measuring the category gate. A tier one company with the
//  marketing budget at three times the benchmark, over forty quarters:
//
//      no sponsorship   95 points in q10, then 88, 64, 35, 22
//      one kept live    95 to 112 the whole way, never below 95
//
//  The drought cap was a flat 20 index points and tier one's brand ceiling is
//  22. So a full drought took the ceiling to 2, and there was nothing a
//  player could do about it from inside that tier: the offers you can sign
//  are gated on company value, and a company whose brand is being held at 2
//  is not growing into the next bracket.
//
//  It is also what shut the category gate permanently. The gate is a share of
//  the ceiling, and the drought was eating almost all of the ceiling.
//
//  A share of the ceiling instead, so it costs the same FRACTION at every
//  tier. The severity per quarter is untouched; what moved is where it stops.
// ============================================================================

import {
    droughtPenalty,
    DROUGHT_GRACE_QUARTERS,
    DROUGHT_PENALTY_PER_QUARTER,
    DROUGHT_PENALTY_CAP,
    DROUGHT_PENALTY_CAP_RATIO,
} from './sponsorship';
import { getTier } from './capacity';

const forever = DROUGHT_GRACE_QUARTERS + 500;

describe('how far a drought can go', () => {
    it('never takes more than a fraction of the ceiling it is eating', () => {
        for (const tier of [1, 3, 5, 8]) {
            const ceiling = getTier(tier).brandCeiling;
            expect(droughtPenalty(forever, ceiling))
                .toBeCloseTo(ceiling * DROUGHT_PENALTY_CAP_RATIO, 6);
        }
    });

    it('and at tier one that is about three, where it used to be twenty', () => {
        // THE DEFECT, as one number. A ceiling of 22 minus 20 is 2.
        const ceiling = getTier(1).brandCeiling;
        expect(ceiling).toBe(22);
        expect(DROUGHT_PENALTY_CAP).toBe(20);          // what it used to be, flat
        expect(droughtPenalty(forever, ceiling)).toBeCloseTo(3.3, 6);
    });

    it('and a company that never signs anything is not capped by it', () => {
        // WHY IT CAME DOWN A SECOND TIME. At two fifths, every dry sixty
        // quarter run measured had its brand pinned at the reduced ceiling
        // for the whole run - 15.6 index at tier two, whatever the player
        // did. That is a subscription, not a penalty.
        for (const tier of [1, 2, 3, 5, 8]) {
            const ceiling = getTier(tier).brandCeiling;
            expect(ceiling - droughtPenalty(forever, ceiling)).toBeGreaterThan(ceiling * 0.8);
        }
    });

    it('and it always leaves most of the ceiling standing', () => {
        // The rule that would have caught the original: whatever the tier, a
        // company that never signs anything still has a brand it can work
        // with. A slow game over is not a mechanic.
        for (const tier of [1, 2, 3, 4, 5, 6, 7, 8]) {
            const ceiling = getTier(tier).brandCeiling;
            expect(ceiling - droughtPenalty(forever, ceiling)).toBeGreaterThan(ceiling * 0.5);
        }
    });

    it('and it still hurts more in absolute terms the bigger you are', () => {
        const small = droughtPenalty(forever, getTier(1).brandCeiling);
        const large = droughtPenalty(forever, getTier(8).brandCeiling);
        expect(large).toBeGreaterThan(small);
    });
});

describe('and everything else about it is unchanged', () => {
    it('the grace period still costs nothing', () => {
        const ceiling = getTier(1).brandCeiling;
        expect(droughtPenalty(0, ceiling)).toBe(0);
        expect(droughtPenalty(DROUGHT_GRACE_QUARTERS, ceiling)).toBe(0);
        expect(droughtPenalty(DROUGHT_GRACE_QUARTERS + 1, ceiling))
            .toBeCloseTo(DROUGHT_PENALTY_PER_QUARTER, 6);
    });

    it('and it still builds a quarter at a time until it caps', () => {
        const ceiling = getTier(8).brandCeiling;
        const at = (q: number) => droughtPenalty(DROUGHT_GRACE_QUARTERS + q, ceiling);
        expect(at(2)).toBeGreaterThan(at(1));
        expect(at(10)).toBeGreaterThan(at(2));
    });

    it('and a negative or missing count is not a bonus', () => {
        expect(droughtPenalty(-5, 22)).toBe(0);
        expect(droughtPenalty(undefined as any, 22)).toBe(0);
    });

    it('and with no ceiling to hand it falls back to the flat cap', () => {
        expect(droughtPenalty(forever)).toBe(DROUGHT_PENALTY_CAP);
        expect(droughtPenalty(forever, 0)).toBe(DROUGHT_PENALTY_CAP);
    });
});

describe('the wiring', () => {
    const fs = require('fs');
    const path = require('path');

    it('the store reads the tier, rather than every caller having to know one', () => {
        // `penalty()` is called from the tick and from the screens. Passing
        // the ceiling in at each call site would be four places to forget.
        const src = fs.readFileSync(
            path.join(__dirname, '..', 'store', 'useSponsorshipStore.ts'), 'utf8',
        );
        expect(src).toMatch(/getTier\(useStatsStore\.getState\(\)\.facilityTier\)\.brandCeiling/);
        expect(src).toMatch(/droughtPenalty\(get\(\)\.quartersWithout, ceiling\)/);
    });
});
