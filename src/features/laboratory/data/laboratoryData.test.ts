// src/features/laboratory/data/laboratoryData.test.ts
//
// ============================================================================
//  THE SCREEN AND THE ENGINE HAVE TO AGREE ABOUT RESEARCH
// ============================================================================
//
//  They did not, by a factor of between thirty and sixty.
//
//  The laboratory header showed "Target Output", computed as headcount x 10.
//  The engine awards `researchOutput(n)` - 600 x n^0.85 - when the quarter
//  closes. So a player looking at ten researchers was told they would produce
//  100 points and was then paid 4,247.
//
//  That is not a rounding difference. It is the one number somebody reads
//  before deciding whether to hire a research team at all, and it said the
//  answer was no.
//
//  The display formula is gone. This file is what stops another one being
//  written: any figure the laboratory shows must come from the function that
//  actually pays out.
// ============================================================================

import { calculateQuarterlyRP, calculateQuarterlyCost, RESEARCHER_ECONOMICS } from './laboratoryData';
import { researchOutput, RP_BASE_OUTPUT, RP_SCALING_EXPONENT } from '../../../core/market/workforce';

describe('what the laboratory screen promises', () => {
    it('is exactly what the quarter pays', () => {
        for (const n of [0, 1, 3, 10, 25, 100, 1_000]) {
            expect(calculateQuarterlyRP(n)).toBe(researchOutput(n));
        }
    });

    it('is not a flat rate per person, and cannot become one again', () => {
        // Doubling the team does NOT double the output - that is the whole
        // shape of the curve, and a per-head constant cannot express it.
        // If this ever passes, somebody has reintroduced linear research.
        const one = calculateQuarterlyRP(1);
        expect(calculateQuarterlyRP(2)).not.toBe(one * 2);
        expect(calculateQuarterlyRP(100)).not.toBe(one * 100);
    });

    it('and it really does still grow, so hiring is worth doing', () => {
        // Diminishing is not the same as pointless. Each of these is a real
        // increase or the lesson the tutorial is about to teach is a lie.
        let previous = 0;
        for (const n of [1, 2, 5, 10, 50, 200]) {
            const now = calculateQuarterlyRP(n);
            expect(now).toBeGreaterThan(previous);
            previous = now;
        }
    });

    it('the old constant is gone rather than merely unused', () => {
        // Left as a live field it would be one autocomplete away from being
        // multiplied by a headcount again.
        expect((RESEARCHER_ECONOMICS as Record<string, unknown>).RP_OUTPUT_PER_QUARTER)
            .toBeUndefined();
    });

    it('the curve is the engine\'s, stated in one place', () => {
        expect(calculateQuarterlyRP(1)).toBe(RP_BASE_OUTPUT);
        expect(calculateQuarterlyRP(10))
            .toBe(Math.floor(RP_BASE_OUTPUT * Math.pow(10, RP_SCALING_EXPONENT)));
    });
});

describe('what it costs', () => {
    it('is linear, because salary is', () => {
        // Unlike output. Two researchers cost twice as much and produce less
        // than twice as much, which is the entire decision the screen exists
        // to put in front of the player.
        expect(calculateQuarterlyCost(2)).toBe(calculateQuarterlyCost(1) * 2);
        expect(calculateQuarterlyRP(2)).toBeLessThan(calculateQuarterlyRP(1) * 2);
    });

    it('and nobody is paid for being nobody', () => {
        expect(calculateQuarterlyCost(0)).toBe(0);
        expect(calculateQuarterlyRP(0)).toBe(0);
    });
});
