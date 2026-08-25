// src/core/market/brandStored.test.ts
//
// ============================================================================
//  WHAT THE QUARTERLY TICK LEAVES IN `stats.brandValue`
// ============================================================================
//
//  brandUnits.test.ts pins the ARITHMETIC of the two scales. This file pins the
//  one thing that file cannot see: which of the two ends up in the field that
//  six modules and the screen read.
//
//  ---------------------------------------------------------------------------
//  AND IT EXISTS BECAUSE A PROBE PASSED
//  ---------------------------------------------------------------------------
//  After the fix I reverted `brandValue: brandIdx` back to `brandValue:
//  corporateQ` - the original defect, exactly - and every one of the forty
//  seven tests around it stayed green.
//
//  The reason is worth writing down. The tick no longer READS that field: it
//  derives brand from `brandByCategory`, which is where brand actually lives.
//  So storing the wrong unit there is invisible to the engine and breaks only
//  the things downstream of it - attraction, hiring pull, valuation multiples,
//  contract partners, the facility ceilings and the number on the screen. All
//  of which clamp at 100, so past 2.31% market share they simply sat at their
//  maximum and said nothing.
//
//  A bug with no reader inside the system that produces it is exactly the kind
//  this codebase keeps shipping. The rule below is behavioural: run real
//  quarters, then check the unit of what was stored.
// ============================================================================

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn(async () => null),
        setItem: jest.fn(async () => { }),
        removeItem: jest.fn(async () => { }),
    },
}));

import { useGameStore, initialGameState } from '../store/useGameStore';
import { useStatsStore, initialStatsState } from '../store/useStatsStore';
import { useStoryStore, initialStoryState } from '../store/useStoryStore';
import { brandIndex, corporateBrandFrom, indexToPoints } from './brand';

const runQuarters = async (quarters: number) => {
    useGameStore.setState({ ...initialGameState, _hasHydrated: true, currentMonth: 121, age: 55 });
    useStatsStore.setState({
        ...initialStatsState, _hasHydrated: true,
        companyCapital: 500_000_000,
        // The index and the points it corresponds to. Two scales, written
        // consistently - see the note in wiring.test.ts about what a fixture
        // that muddles them costs.
        brandValue: 60,
        brandByCategory: { Consumer: indexToPoints(60) },
    } as any);
    useStoryStore.setState({ ...initialStoryState, _hasHydrated: true });
    for (let q = 0; q < quarters; q++) await useGameStore.getState().advanceMonth(3);
    return useStatsStore.getState();
};

describe('after a quarter closes, the stored brand', () => {
    it('is on the 0-100 scale its readers expect', async () => {
        const s = await runQuarters(2);
        expect(s.brandValue).toBeGreaterThanOrEqual(0);
        expect(s.brandValue).toBeLessThanOrEqual(100);
    }, 20_000);

    it('and is exactly the index of the points it came from', async () => {
        // Not "roughly on the right scale". The stored value has one correct
        // answer and it is derivable from the categories, which is where the
        // engine keeps brand.
        const s = await runQuarters(2);
        const fromCategories = brandIndex(corporateBrandFrom(s.brandByCategory || {}));
        expect(s.brandValue).toBeCloseTo(fromCategories, 6);
    }, 20_000);

    it('and the categories it came from are NOT on that scale', async () => {
        // The other half of the same claim. If both were 0-100 the rule above
        // would pass on a codebase that had lost the points scale entirely,
        // which would be a different bug wearing this fix as a disguise.
        const s = await runQuarters(4);
        const points = corporateBrandFrom(s.brandByCategory || {});
        expect(points).toBeGreaterThan(s.brandValue!);
    }, 20_000);

    it('and the change it reports is in the same unit as the value', async () => {
        // ----------------------------------------------------------------
        //  "DIGER QUARTER BRAND VALUE DUSUYOR"
        // ----------------------------------------------------------------
        //  It fell every quarter by an amount the player could not account
        //  for. On the points scale a small wobble in market share is a large
        //  number - 43.3 points per point of share - so an ordinary quarter
        //  looked like a collapse, and it drowned everything the player had
        //  actually done.
        //
        //  `brandChange` is what the report shows. It has to be the same
        //  scale as the figure beside it, or the two contradict each other on
        //  the same row.
        //
        //  ----------------------------------------------------------------
        //  AND THIS IS NOT THE RULE I FIRST WROTE
        //  ----------------------------------------------------------------
        //  That one ran three quarters twice and asserted the same answer.
        //  It failed by 0.2, because the tick has randomness in it - events
        //  fire, the market moves. A rule that assumes a deterministic engine
        //  is a rule that will fail on a Tuesday for no reason, so it is gone
        //  rather than loosened into a tolerance nobody could justify.
        // ----------------------------------------------------------------
        const s = await runQuarters(2);
        expect(Math.abs(s.brandChange ?? 0)).toBeLessThanOrEqual(100);
        // And it agrees with the value it sits beside: adding the change back
        // has to land inside the scale too, which a points sized change would
        // not.
        const before = (s.brandValue ?? 0) - (s.brandChange ?? 0);
        expect(before).toBeGreaterThanOrEqual(-1);
        expect(before).toBeLessThanOrEqual(101);
    }, 20_000);
});
