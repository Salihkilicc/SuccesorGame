// src/core/market/ceilingResistance.test.ts
//
// ============================================================================
//  THE CEILING RESISTS RATHER THAN STOPS
// ============================================================================
//
//  It was a hard clamp: `min(ceiling, ...)`. A company that reached its tier's
//  ceiling sat on exactly that number, quarter after quarter, and the only
//  thing that ever moved it was a building project. Measured over one run,
//  brand was EXACTLY the ceiling at every tier from two onwards.
//
//  Reported as "is it not boring, brand playing on the ceiling all the time",
//  and asked for as "it should get harder and harder to climb, but it should
//  be possible - give the player the excitement of being able to climb".
// ============================================================================

import fs from 'fs';
import path from 'path';
import { resistedGain, updateBrand, CEILING_RESISTANCE, BRAND_MAX_INDEX } from './attraction';

describe('a gain that would take you past the ceiling', () => {
    it('lands in full up to the ceiling, so arriving still feels like arriving', () => {
        // Everything below the line is free, INCLUDING the gain that lands
        // exactly on it. I wrote this expecting 4 from 18 to be shaved and it
        // is not: 18 + 4 is 22, which is arriving, not overshooting.
        expect(resistedGain(3, 18, 22)).toBe(3);
        expect(resistedGain(4, 18, 22)).toBe(4);
        // A fifth point is the first one that costs.
        expect(resistedGain(5, 18, 22)).toBeGreaterThan(4);
        expect(resistedGain(5, 18, 22)).toBeLessThan(5);
    });

    it('and only the part above it is resisted, which was the first bug', () => {
        // THE FIRST VERSION resisted the WHOLE gain whenever it would land
        // above the ceiling, so a company at 18.3 with a gain of 4 had all
        // four points damped even though 3.7 were still under the line.
        // Measured, it settled at 18.3 to 18.8 and OSCILLATED - below the
        // ceiling it was meant to be pushing past, and worse than the clamp
        // it replaced.
        const landed = resistedGain(4, 18.3, 22);
        expect(landed).toBeGreaterThan(3.7);
        expect(18.3 + landed).toBeGreaterThan(22);
    });

    it('and the further above you already are, the less of it lands', () => {
        const at = (current: number) => resistedGain(2, current, 22);
        expect(at(22)).toBeGreaterThan(at(25));
        expect(at(25)).toBeGreaterThan(at(30));
        expect(at(30)).toBeGreaterThan(at(44));
    });

    it('and a bigger push in one quarter buys proportionally less', () => {
        // Reaching further costs more per point, so a budget cannot be
        // converted into height in a single quarter.
        const perPoint = (gain: number) => resistedGain(gain, 22, 22) / gain;
        expect(perPoint(1)).toBeGreaterThan(perPoint(4));
        expect(perPoint(4)).toBeGreaterThan(perPoint(16));
    });

    it('but it never reaches zero, which is the whole point of the change', () => {
        // There is always another tenth of a point available to somebody who
        // wants it badly enough. A resistance that hits zero is a clamp.
        for (const current of [22, 40, 80, 200]) {
            expect(resistedGain(2, current, 22)).toBeGreaterThan(0);
        }
    });

    it('and a loss is never resisted, because falling back should be quick', () => {
        // The factory reasserting itself is not something to slow down.
        expect(resistedGain(-3, 40, 22)).toBe(-3);
        expect(resistedGain(-3, 10, 22)).toBe(-3);
    });

    it('and rubbish in does not produce rubbish out', () => {
        expect(resistedGain(2, 10, 0)).toBe(2);
        expect(resistedGain(0, 10, 22)).toBe(0);
        expect(Number.isFinite(resistedGain(2, NaN, 22))).toBe(true);
    });
});

describe('and the clamp is gone', () => {
    it('so brand really can sit above the tier ceiling', () => {
        // THE DEFECT, as one assertion. This was impossible.
        let b = 18;
        for (let q = 0; q < 20; q++) {
            b = updateBrand({
                currentBrand: b, unitsSold: 100_000, unmetDemand: 0,
                marketingSpend: 4_000_000, marketingBenchmarkTotal: 1_000_000,
                averageQuality: 5, brandCeiling: 22, brandFloor: 5,
            }).newBrand;
        }
        expect(b).toBeGreaterThan(22);
    });

    it('but the index is still an index, whatever the ceiling says', () => {
        // Six modules read this as 0-100. The ceiling stopped being a wall;
        // the scale did not.
        expect(BRAND_MAX_INDEX).toBe(100);
        let b = 90;
        for (let q = 0; q < 40; q++) {
            b = updateBrand({
                currentBrand: b, unitsSold: 100_000, unmetDemand: 0,
                marketingSpend: 50_000_000, marketingBenchmarkTotal: 1_000_000,
                averageQuality: 5, brandCeiling: 22, brandFloor: 5,
            }).newBrand;
        }
        expect(b).toBeLessThanOrEqual(100);
    });

    it('and it still says WHY it is slowing down, so the screen can explain', () => {
        const r = updateBrand({
            currentBrand: 30, unitsSold: 100_000, unmetDemand: 0,
            marketingSpend: 4_000_000, marketingBenchmarkTotal: 1_000_000,
            averageQuality: 5, brandCeiling: 22, brandFloor: 5,
        });
        expect(r.reasons).toContain('capped by facility tier');
    });
});

describe('the wiring', () => {
    const read = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8');

    it('the hard clamp is really gone, not just bypassed', () => {
        const src = read('core', 'market', 'attraction.ts');
        expect(src).not.toMatch(/Math\.min\(ceiling, floored\)/);
        expect(src).toMatch(/resistedGain\(/);
    });

    it('and the earned floor comes down with a penalty, or a conviction stops biting', () => {
        // Found the moment the clamp went: with the ceiling only resisting,
        // a company that had once touched 200 points sat on 200 whatever the
        // verdict, and two identical companies - one convicted - landed on
        // exactly the same number again.
        expect(read('core', 'store', 'useGameStore.ts'))
            .toMatch(/- indexToPoints\(ceilingPenalty\)/);
    });

    it('and the resistance is one named constant, not a number in a formula', () => {
        expect(CEILING_RESISTANCE).toBeGreaterThan(0);
        expect(read('core', 'market', 'attraction.ts'))
            .toMatch(/CEILING_RESISTANCE \* \(startedOver \+ reach\)/);
    });
});
