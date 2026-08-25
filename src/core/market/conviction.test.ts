// src/core/market/conviction.test.ts
//
// ============================================================================
//  A CONVICTION HAS TO STILL BE THERE IN TWO YEARS
// ============================================================================
//
//  `fbiGuilty` is meant to poison everything after it. The failure mode is not
//  that it does nothing visible on the day - the verdict takes 25 points of
//  brand and everybody notices. It is that six quarters later the company is
//  exactly where a clean one would be and nothing ever said so.
//
//  THE FIRST VERSION DID EXACTLY THAT. A per-quarter drain of 1.5 on the brand
//  VALUE, applied in the tick. Measured over four quarters: convicted 21.5,
//  clean 21.3. Brand mean-reverts towards a target every tick, so subtracting
//  from the value is pulled straight back out - the same mistake as writing a
//  divestiture price with no anchor behind it.
//
//  The penalty is on the CEILING now, and this file is the measurement that
//  says so. It runs two identical companies for two years and compares.
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
import { indexToPoints } from './brand';
import { useStoryStore, initialStoryState } from '../store/useStoryStore';
import { useSponsorshipStore } from '../store/useSponsorshipStore';
import { updateBrand } from './attraction';
import { CONVICTION_CEILING_PENALTY } from '../story/state';

const runYears = async (guilty: boolean, quarters: number): Promise<number> => {
    useGameStore.setState({ ...initialGameState, _hasHydrated: true, currentMonth: 121, age: 55 });
    useStatsStore.setState({
        ...initialStatsState, _hasHydrated: true,
        companyCapital: 500_000_000,
        // The two fields are DIFFERENT SCALES and this fixture set them to
        // the same number, which is how the muddle stayed invisible:
        // `brandValue` is the 0-100 index, `brandByCategory` is points, and
        // 60 of index is 259.8 of points. See core/market/brand.indexToPoints.
        brandValue: 60,
        brandByCategory: { Consumer: indexToPoints(60) },
    } as any);
    useStoryStore.setState({ ...initialStoryState, _hasHydrated: true });
    // ONE VARIABLE. The sponsorship drought is also a ceiling penalty and it
    // starts biting at twelve quarters, so without a live deal both companies
    // get squeezed towards the same floor and the twelve-quarter comparison
    // below measures the drought rather than the conviction. Found when this
    // file started failing the moment sponsorships landed.
    useSponsorshipStore.getState().reset();
    useSponsorshipStore.getState().sign('spon-g-1');
    if (guilty) useStoryStore.getState().raise('fbiGuilty');
    for (let q = 0; q < quarters; q++) await useGameStore.getState().advanceMonth(3);
    return useStatsStore.getState().brandValue ?? 0;
};

describe('the ceiling penalty is durable, which a drain was not', () => {
    it('lowers the ceiling rather than the value', () => {
        // Read off the pure function, so the claim does not depend on a tick.
        const input = {
            currentBrand: 90,
            unitsSold: 100_000,
            unmetDemand: 0,
            marketingSpend: 10_000_000,
            marketingBenchmarkTotal: 1_000_000,
            averageQuality: 5,
            brandCeiling: 95,
            brandFloor: 20,
        };
        const clean = updateBrand(input);
        const convicted = updateBrand({ ...input, ceilingPenalty: CONVICTION_CEILING_PENALTY });
        expect(convicted.ceiling).toBe(clean.ceiling - CONVICTION_CEILING_PENALTY);
        expect(convicted.newBrand).toBeLessThan(clean.newBrand);
    });

    it('and the floor comes down with it, so it cannot be parked under', () => {
        // Otherwise a convicted company simply sits on its tier's floor and
        // the penalty is invisible at every level except the very top.
        const input = {
            currentBrand: 22,
            unitsSold: 0,
            unmetDemand: 500_000,
            marketingSpend: 0,
            marketingBenchmarkTotal: 5_000_000,
            averageQuality: 1,
            brandCeiling: 95,
            brandFloor: 20,
        };
        const clean = updateBrand(input);
        const convicted = updateBrand({ ...input, ceilingPenalty: CONVICTION_CEILING_PENALTY });
        expect(convicted.newBrand).toBeLessThan(clean.newBrand);
    });

    it('no penalty means exactly what it meant before, so nothing else moved', () => {
        const input = {
            currentBrand: 50,
            unitsSold: 50_000,
            unmetDemand: 0,
            marketingSpend: 2_000_000,
            marketingBenchmarkTotal: 2_000_000,
            averageQuality: 3,
            brandCeiling: 80,
            brandFloor: 15,
        };
        expect(updateBrand(input)).toEqual(updateBrand({ ...input, ceilingPenalty: 0 }));
    });
});

describe('and it is still there two years later', () => {
    it('two identical companies, one convicted, eight quarters apart', async () => {
        // THE MEASUREMENT THE FIRST DESIGN FAILED. A drain gave 21.5 against
        // 21.3 - noise. This is the same comparison, run twice as long.
        const clean = await runYears(false, 8);
        const convicted = await runYears(true, 8);
        expect(convicted).toBeLessThan(clean);
        // ----------------------------------------------------------------
        //  AND BY AN AMOUNT SOMEBODY WOULD NOTICE
        // ----------------------------------------------------------------
        //  This said 2, and it passed on a gap of 0.94 - because the fixture
        //  and the engine were both muddling the index with the points, and
        //  a threshold in the wrong unit is not a threshold. Two points of a
        //  433 point scale is not something anybody notices.
        //
        //  Measured on the corrected scale: 21.1 against 12.9 at eight
        //  quarters. Five is well inside that and leaves room for tuning
        //  without rewriting the claim.
        // ----------------------------------------------------------------
        expect(clean - convicted).toBeGreaterThan(5);
    }, 20_000);

    it('and it is still substantial after three years', async () => {
        // NOT "the gap never narrows", which is what this test claimed first
        // and which is not true of the model. Both companies are pulled
        // towards their own ceiling or their own floor, and the TRANSIENT
        // between those two states can widen or narrow - measured, the gap
        // ran 12.5 at four quarters and 6.9 at twelve as both settled.
        //
        // The claim that is true, and the one worth pinning: three years
        // later a convicted company is still visibly behind, which a decaying
        // subtraction would not have managed at all.
        const cleanLong = await runYears(false, 12);
        const convictedLong = await runYears(true, 12);

        expect(convictedLong).toBeLessThan(cleanLong);
        // 16.5 against 9.0, so the gap narrows from 8.2 to 7.6 as both
        // settle - exactly the transient the comment above describes, and
        // now visible in a unit where the numbers mean something.
        expect(cleanLong - convictedLong).toBeGreaterThan(4);
    }, 30_000);
});
