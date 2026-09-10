// src/features/casino/logic/holdToRepeat.test.ts
//
// ============================================================================
//  ONE CHIP PER HOLD, AND A STACK IS NOT ONE CHIP
// ============================================================================
//
//  Holding a position took a chip back, which was the fix. Reported as taking
//  only ONE: `onLongPress` is a single event, so nine chips on a number meant
//  pressing and holding nine times.
//
//  Which is the same shape as the bug the hold was written to cure. CLEAR took
//  the whole table down and was too blunt; a hold that lifts exactly one chip
//  is too fine. The gesture the hand already knows is the stepper: it repeats
//  while held, and it speeds up.
// ============================================================================

import {
    HOLD_FASTEST_MS,
    HOLD_FIRST_MS,
    HOLD_RAMP,
    holdDelayFor,
} from './useHoldToRepeat';

describe('the repeat starts separable and ends quick', () => {
    it('the first gap is slow enough to stop on one chip', () => {
        expect(holdDelayFor(0)).toBe(HOLD_FIRST_MS);
        expect(HOLD_FIRST_MS).toBeGreaterThan(200);
    });

    it('and it never gets faster than a finger can react to', () => {
        for (let n = 0; n <= 40; n++) {
            expect({ n, ms: holdDelayFor(n) >= HOLD_FASTEST_MS }).toEqual({ n, ms: true });
        }
        expect(HOLD_FASTEST_MS).toBeGreaterThan(50);
    });

    it('and it only ever shortens', () => {
        // ------------------------------------------------------------------
        //  MONOTONIC, WHICH IS WHAT MAKES IT PREDICTABLE
        // ------------------------------------------------------------------
        //  A ramp that wobbled would be worse than a flat repeat: the hand
        //  learns the rhythm in the first three ticks and holds for the rest
        //  on that expectation.
        // ------------------------------------------------------------------
        for (let n = 1; n <= 20; n++) {
            expect({ n, ok: holdDelayFor(n) <= holdDelayFor(n - 1) }).toEqual({ n, ok: true });
        }
    });

    it('and it is at full speed by the sixth', () => {
        expect(holdDelayFor(HOLD_RAMP)).toBe(HOLD_FASTEST_MS);
        expect(holdDelayFor(HOLD_RAMP + 50)).toBe(HOLD_FASTEST_MS);
    });

    it('and nonsense does not produce a negative timer', () => {
        for (const n of [-1, -99, NaN, 0.4]) {
            const ms = holdDelayFor(n as number);
            expect({ n, ms: ms >= HOLD_FASTEST_MS && ms <= HOLD_FIRST_MS })
                .toEqual({ n, ms: true });
        }
    });
});

describe('and a whole stack comes off in a reasonable hold', () => {
    /** How long it takes to lift n chips, counting the long press itself. */
    const holdFor = (chips: number) => {
        let ms = 0;
        for (let i = 1; i < chips; i++) ms += holdDelayFor(i - 1);
        return ms;
    };

    it('three chips is under a second, so a small mistake is quick to undo', () => {
        expect(holdFor(3)).toBeLessThan(1000);
    });

    it('and twenty is under two, so a big one is not a chore', () => {
        // ------------------------------------------------------------------
        //  THE NUMBER THAT MADE THIS WORTH DOING
        // ------------------------------------------------------------------
        //  At a flat 260ms twenty chips is five seconds of holding, which is
        //  long enough that a player lets go and presses CLEAR instead - and
        //  CLEAR taking the whole table down is the thing this replaced.
        // ------------------------------------------------------------------
        expect(holdFor(20)).toBeLessThan(2000);
        // And a flat first gap really would have been too slow, or the ramp
        // is solving a problem nobody had.
        expect(HOLD_FIRST_MS * 19).toBeGreaterThan(4000);
    });
});
