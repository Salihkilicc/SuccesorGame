// src/features/assets/observations.test.ts
//
// ============================================================================
//  THE REPORT SAID THE SAME FIVE THINGS FOR FIFTEEN YEARS
// ============================================================================
//
//  Reported as some of the quarterly warnings feeling meaningless and
//  possibly outdated. Measured over sixty real quarters, before touching
//  anything: thirty one warnings are written, SIX ever fired, and five of
//  those fired on 93 to 100 per cent of quarters.
//
//      60/60  you ran out of stock
//      60/60  healthy quarter
//      59/60  the demand you could not serve has left a lasting mark
//      59/60  the way back is one thing and it is slow
//      56/60  your marketing budget is X
//
//  A warning that appears on fifty nine quarters out of sixty is wallpaper.
//  And the top two contradicted each other on the SAME report: running out of
//  stock is what makes sell-through a hundred per cent, so the page complained
//  about the shortage and congratulated the player for it in one breath.
//
//  Measured after: 290 lines became 64 over the same sixty quarters, 42 of
//  those reports say nothing at all, and every fourth one gives the whole
//  picture again.
// ============================================================================

import {
    ALWAYS_WORTH_REPEATING,
    buildObservations,
} from './screens/QuarterlyReportModal';
import type { QuarterReport } from '../../core/reportTypes';

/** A quarter with nothing wrong with it. */
const clean = (over: Partial<QuarterReport> = {}): QuarterReport => ({
    periodLabel: 'Q2 · Year 3',
    unitsProduced: 1_000,
    unitsSold: 900,
    sellThrough: 90,
    totalMarketDemand: 1_000,
    totalUnmetDemand: 0,
    netProfit: 100_000,
    netMargin: 12,
    revenue: 1_000_000,
    grossMargin: 45,
    employeeMorale: 80,
    layoffs: 0,
    researchGained: 0,
    products: [],
    ...over,
} as never as QuarterReport);

const keys = (r: QuarterReport, prev?: QuarterReport | null) =>
    buildObservations(r, prev).map(n => n.key);

describe('a shortage is not a healthy quarter', () => {
    it('and the report no longer says both at once', () => {
        const starved = clean({ totalUnmetDemand: 400, sellThrough: 100 });
        const said = keys(starved);
        expect(said).toContain('obs.youRanOutOf');
        expect(said).not.toContain('obs.healthyQuarterVSell');
    });

    it('but a quarter that really was healthy still gets its line', () => {
        expect(keys(clean({ sellThrough: 88 }))).toContain('obs.healthyQuarterVSell');
    });
});

describe('a thing is said when it starts, not every quarter after', () => {
    it('the first time it is new, so it is said', () => {
        const bad = clean({ totalUnmetDemand: 400 });
        expect(keys(bad)).toContain('obs.youRanOutOf');
    });

    it('and the second time it is not', () => {
        const bad = clean({ totalUnmetDemand: 400 });
        expect(keys(bad, bad)).not.toContain('obs.youRanOutOf');
    });

    it('and when it clears and comes back, it is news again', () => {
        const bad = clean({ totalUnmetDemand: 400 });
        const fine = clean({ totalUnmetDemand: 0 });
        expect(keys(bad, fine)).toContain('obs.youRanOutOf');
    });

    it('and with no previous quarter everything is new', () => {
        // The first report of a run, and every save written before this.
        const bad = clean({ totalUnmetDemand: 400, layoffs: 30 });
        expect(keys(bad, null).length).toBeGreaterThan(1);
        expect(keys(bad, undefined).length).toBeGreaterThan(1);
    });
});

describe('and once a year the whole picture comes back', () => {
    it('Q4 restates what is still true', () => {
        const bad = clean({ totalUnmetDemand: 400, periodLabel: 'Q4 · Year 3' });
        const same = clean({ totalUnmetDemand: 400, periodLabel: 'Q3 · Year 3' });
        // Suppressed in Q3, restated in Q4, for the identical situation.
        expect(keys(same, same)).not.toContain('obs.youRanOutOf');
        expect(keys(bad, same)).toContain('obs.youRanOutOf');
    });

    it('and a year end with nothing wrong is still quiet', () => {
        const ok = clean({ periodLabel: 'Q4 · Year 3' });
        expect(keys(ok, ok)).not.toContain('obs.youRanOutOf');
    });
});

describe('except the ones that are counting down', () => {
    it('those repeat, because the count is the point', () => {
        // A player who stops being told how many quarters are left has not
        // stopped running out of them.
        expect(ALWAYS_WORTH_REPEATING.has('obs.insolvencyCountdown')).toBe(true);
        expect(ALWAYS_WORTH_REPEATING.has('obs.insolvencyLastCall')).toBe(true);
        expect(ALWAYS_WORTH_REPEATING.has('obs.covenantBreach')).toBe(true);
    });

    it('and nothing ordinary is on that list', () => {
        expect(ALWAYS_WORTH_REPEATING.has('obs.youRanOutOf')).toBe(false);
        expect(ALWAYS_WORTH_REPEATING.has('obs.healthyQuarterVSell')).toBe(false);
        expect(ALWAYS_WORTH_REPEATING.size).toBeLessThan(6);
    });
});

describe('and every line can be told apart from every other', () => {
    it('each carries a key, or suppression would drop the wrong one', () => {
        const busy = clean({
            totalUnmetDemand: 400, layoffs: 30, grossMargin: 5,
            employeeMorale: 20, researchGained: 40,
        });
        const notes = buildObservations(busy);
        expect(notes.length).toBeGreaterThan(2);
        for (const n of notes) {
            expect(typeof n.key).toBe('string');
            expect(n.key.length).toBeGreaterThan(0);
        }
        // Two lines sharing a key would silence each other.
        expect(new Set(notes.map(n => n.key)).size).toBe(notes.length);
    });
});
