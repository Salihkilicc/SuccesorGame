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
    shouldWarnDrought,
    DROUGHT_GRACE_QUARTERS,
    DROUGHT_PENALTY_PER_QUARTER,
    DROUGHT_PENALTY_CAP,
    DROUGHT_PENALTY_CAP_RATIO,
    DROUGHT_WARN_EVERY,
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

// ============================================================================
//  AND THE WARNING IS NOT WALLPAPER
// ============================================================================
//  It fired on every quarter the penalty was biting. A modal that appears
//  every single quarter is not a warning: the player learns the gesture that
//  dismisses it and stops reading the words, which is worse than not showing
//  it, because now the game believes it has told them.
// ============================================================================
describe('when the drought warning shows', () => {
    const dry = (q: number) => shouldWarnDrought(q, false);

    it('never while a deal is live, whatever the counter says', () => {
        expect(shouldWarnDrought(DROUGHT_GRACE_QUARTERS + 1, true)).toBe(false);
        expect(shouldWarnDrought(999, true)).toBe(false);
    });

    it('and never during the grace period, because nothing is being taken yet', () => {
        // A warning that fires before there is a cost teaches the player that
        // the warning does not mean much.
        //
        // AND THIS TEST DOES NOT GUARD THE `overBy < 1` LINE, which the probe
        // found: removing it leaves everything green, because `overBy` is
        // clamped at zero and `(0 - 1) % 3` is -1 rather than 0, so the
        // modulo excludes the grace period on its own. The line stays as the
        // readable statement of the rule and because it is what would hold if
        // the cadence were ever one, but it is belt over braces and saying so
        // is better than implying it is load bearing.
        for (let q = 0; q <= DROUGHT_GRACE_QUARTERS; q++) {
            expect(dry(q)).toBe(false);
            expect(droughtPenalty(q, 22)).toBe(0);
        }
    });

    it('but on the first quarter it bites, which is the one that matters', () => {
        expect(dry(DROUGHT_GRACE_QUARTERS + 1)).toBe(true);
        expect(droughtPenalty(DROUGHT_GRACE_QUARTERS + 1, 22)).toBeGreaterThan(0);
    });

    it('and then every third quarter, not every one', () => {
        const shown: number[] = [];
        for (let over = 1; over <= 12; over++) {
            if (dry(DROUGHT_GRACE_QUARTERS + over)) shown.push(over);
        }
        expect(shown).toEqual([1, 4, 7, 10]);
        expect(DROUGHT_WARN_EVERY).toBe(3);
    });

    it('and that is a third of the quarters it used to take, measured', () => {
        let old = 0, now = 0;
        for (let over = 1; over <= 30; over++) {
            const q = DROUGHT_GRACE_QUARTERS + over;
            if (droughtPenalty(q, 22) > 0) old++;
            if (dry(q)) now++;
        }
        expect(old).toBe(30);
        expect(now).toBe(10);
    });

    it('and rubbish in does not produce a warning', () => {
        expect(dry(undefined as any)).toBe(false);
        expect(dry(-5)).toBe(false);
    });
});

describe('and the modal quotes the number the engine is applying', () => {
    const fs = require('fs');
    const path = require('path');

    it('by passing the tier ceiling, not the flat fallback', () => {
        // The screen called droughtPenalty with one argument, so it showed
        // the flat 20 cap while the engine was applying three twentieths of
        // the tier ceiling. Two numbers for one fact, on the screen whose
        // whole job is naming it.
        const src = fs.readFileSync(
            path.join(__dirname, '..', '..', 'screens', 'Home', 'HomeScreen.tsx'), 'utf8',
        );
        // Non greedy to `.brandCeiling` on purpose: the tier expression has a
        // `getState()` inside it, so a `[^)]*` class stops at the wrong one.
        expect(src).toMatch(/droughtPenalty\(\s*sponsorQuartersWithout,\s*getTier\([\s\S]*?\.brandCeiling,?\s*\)/);
    });

    it('and the cadence comes from the engine rather than the screen', () => {
        const src = fs.readFileSync(
            path.join(__dirname, '..', '..', 'screens', 'Home', 'HomeScreen.tsx'), 'utf8',
        );
        expect(src).toMatch(/shouldWarnDrought\(qWithout, !!active\)/);
        expect(src).not.toMatch(/penalty > 0\) \{\s*setSponsorWarningVisible/);
    });
});
