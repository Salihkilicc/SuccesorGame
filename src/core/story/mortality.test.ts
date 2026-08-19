// src/core/story/mortality.test.ts
//
// ============================================================================
//  THE CURVE, MEASURED RATHER THAN REASONED ABOUT
// ============================================================================
//
//  The shape of a hazard curve is not something anybody estimates correctly by
//  reading the constants. Two per cent a year sounds negligible and is not,
//  because it doubles, and because it is rolled four times a year for fifty
//  years. The only way to know what these numbers do to a run is to run a
//  hundred thousand of them.
//
//  So the headline test simulates lives and asserts on the DISTRIBUTION. The
//  figures in mortality.ts's header comment come from here, which is the point:
//  if somebody tunes a constant, this file tells them what they did to the rest
//  of it rather than letting them find out from a player.
// ============================================================================

import {
    annualHazard,
    quarterlyHazard,
    diesThisQuarter,
    successorFor,
    MORTALITY_START_AGE,
    MORTALITY_CERTAIN_AGE,
    MORTALITY_BASE,
    MORTALITY_DOUBLING_YEARS,
    SUCCESSION_AGE,
    type Candidate,
} from './mortality';

describe('the shape of it', () => {
    it('is flat at zero until the start age', () => {
        // A player who dies at forty for no reason has had the run taken
        // away, not ended.
        expect(annualHazard(20)).toBe(0);
        expect(annualHazard(MORTALITY_START_AGE - 1)).toBe(0);
        expect(annualHazard(MORTALITY_START_AGE)).toBeCloseTo(MORTALITY_BASE, 6);
    });

    it('and doubles on schedule after it', () => {
        // The whole reason it is a curve rather than a threshold.
        expect(annualHazard(MORTALITY_START_AGE + MORTALITY_DOUBLING_YEARS))
            .toBeCloseTo(MORTALITY_BASE * 2, 6);
        expect(annualHazard(MORTALITY_START_AGE + MORTALITY_DOUBLING_YEARS * 3))
            .toBeCloseTo(MORTALITY_BASE * 8, 6);
    });

    it('and stops, because a tail means somebody runs a company at a hundred and twelve', () => {
        expect(annualHazard(MORTALITY_CERTAIN_AGE)).toBe(1);
        expect(annualHazard(MORTALITY_CERTAIN_AGE + 40)).toBe(1);
        expect(quarterlyHazard(MORTALITY_CERTAIN_AGE)).toBe(1);
    });

    it('and nonsense in does not kill anybody', () => {
        expect(annualHazard(NaN)).toBe(0);
        expect(annualHazard(-10)).toBe(0);
    });
});

describe('a quarter is not a year divided by four', () => {
    it('so the quarterly rate is the survival conversion', () => {
        // Four rolls of h/4 UNDERSHOOT, because two of them landing in the
        // same year only kills you once. So the honest quarterly rate is
        // LARGER than a quarter of the annual one, which is the opposite of
        // what it looks like it should be and is why this is a function
        // rather than a division at the call site.
        const annual = annualHazard(80);
        const q = quarterlyHazard(80);
        expect(q).toBeGreaterThan(annual / 4);

        // What the naive version would actually have produced.
        const naive = 1 - Math.pow(1 - annual / 4, 4);
        expect(naive).toBeLessThan(annual);

        // And four of the real ones add back up to the year exactly.
        expect(1 - Math.pow(1 - q, 4)).toBeCloseTo(annual, 10);
    });

    it('and the die decides, not the function', () => {
        // Injected, so this test is about the rule rather than about luck.
        expect(diesThisQuarter(80, () => 0)).toBe(true);
        expect(diesThisQuarter(80, () => 0.999)).toBe(false);
        expect(diesThisQuarter(30, () => 0)).toBe(false);
    });
});

// ============================================================================
//  A HUNDRED THOUSAND LIVES
// ============================================================================
describe('what it actually does to a run', () => {
    const N = 100_000;
    const deaths: number[] = [];

    beforeAll(() => {
        for (let i = 0; i < N; i++) {
            let age = 20;
            let dead = false;
            while (!dead) {
                for (let q = 0; q < 4 && !dead; q++) {
                    if (diesThisQuarter(age)) { deaths.push(age); dead = true; }
                }
                if (!dead) age++;
            }
        }
        deaths.sort((a, b) => a - b);
    });

    const percentile = (p: number) => deaths[Math.floor(N * p)];

    it('everybody dies, and nobody dies young', () => {
        expect(deaths.length).toBe(N);
        expect(deaths[0]).toBeGreaterThanOrEqual(MORTALITY_START_AGE);
        expect(deaths[N - 1]).toBeLessThanOrEqual(MORTALITY_CERTAIN_AGE);
    });

    it('and the median is a life rather than a career', () => {
        // 72. Starting at 20, that is fifty-two years, or two hundred and
        // eight quarters. If this ever needs to be shorter, move
        // MORTALITY_START_AGE and read the numbers below again.
        expect(percentile(0.5)).toBeGreaterThanOrEqual(70);
        expect(percentile(0.5)).toBeLessThanOrEqual(74);
    });

    it('and the lucky quarter get a good while longer', () => {
        expect(percentile(0.75)).toBeGreaterThanOrEqual(76);
        expect(percentile(0.75)).toBeLessThanOrEqual(80);
    });

    it('while one in twenty sees eighty-five', () => {
        // The tail is what stops the last stretch being a countdown. It has
        // to be long enough to be worth hoping for.
        expect(percentile(0.95)).toBeGreaterThanOrEqual(83);
        expect(percentile(0.95)).toBeLessThanOrEqual(87);
    });

    it('and the whole point: you cannot know when', () => {
        // The spread between the first and the last percent. A succession
        // planned on a schedule is a chore; this is what makes it a
        // decision.
        expect(percentile(0.99) - percentile(0.01)).toBeGreaterThan(20);
    });
});

// ============================================================================
//  AND WHO IS LEFT
// ============================================================================
describe('who takes over', () => {
    const kid = (id: string, age: number): Candidate => ({ id, age });

    it('nobody, when nobody is old enough', () => {
        // This has to be possible or naming a successor costs nothing.
        expect(successorFor([kid('a', 4), kid('b', SUCCESSION_AGE - 1)], null)).toBeNull();
        expect(successorFor([], null)).toBeNull();
        expect(successorFor([], 'a')).toBeNull();
    });

    it('and the one you named, which is the whole reward for naming anybody', () => {
        const heir = successorFor([kid('a', 40), kid('b', 22)], 'b');
        expect(heir?.id).toBe('b');
    });

    it('and the eldest when you never got round to it', () => {
        // Not a punishment. It is what happens when you leave it to be
        // decided for you, and the siblings will have views about it.
        expect(successorFor([kid('a', 22), kid('b', 40), kid('c', 31)], null)?.id).toBe('b');
    });

    it('and the eldest when the one you named is a child', () => {
        // A designated successor who is nine does not take the company. The
        // filter runs first, deliberately.
        expect(successorFor([kid('a', 30), kid('b', 9)], 'b')?.id).toBe('a');
    });

    it('and the eldest when the one you named is not in the family any more', () => {
        expect(successorFor([kid('a', 30)], 'gone')?.id).toBe('a');
    });

    it('and the same answer every time it is asked', () => {
        // An inheritance that comes out differently on a reload is not an
        // inheritance. Equal ages resolve by position, not by chance.
        const twins = [kid('a', 30), kid('b', 30)];
        for (let i = 0; i < 20; i++) expect(successorFor(twins, null)?.id).toBe('a');
    });
});
