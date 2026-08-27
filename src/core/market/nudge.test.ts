// src/core/market/nudge.test.ts
//
// ============================================================================
//  THE STEPPER MOVED BY THE FACTORY, NOT BY THE NUMBER
// ============================================================================
//
//  Reported as "the production plus and minus jump by enormous amounts, 15k
//  straight to 55k".
//
//      unitStep = max(1, round(maxUnits * 0.05))
//
//  Five per cent of MAX CAPACITY. So the step belonged to the factory rather
//  than to the number under your thumb: on a line that can do 800,000 a
//  quarter, every tap moved 40,000 whether you sat at 15,000 or at 700,000.
//  Near the bottom of the range the control had about three usable positions,
//  and 15,000 -> 55,000 is exactly one tap of it.
//
//  A tenth of the CURRENT value now, floored at a thousand, so it takes
//  roughly the same number of taps to cross any part of the range. That is
//  what "smooth" means for a stepper.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    nudgeStep, nudgeUnits, NUDGE_MIN_STEP, NUDGE_RATIO,
    holdNudge, holdFraction,
    HOLD_TICK_MS, HOLD_RAMP_MS, HOLD_START_FRACTION, HOLD_MAX_FRACTION,
} from './production';

const MAX = 800_000;

describe('how far one tap moves', () => {
    it('is a tenth of where you are, not a slice of the factory', () => {
        // THE DEFECT, as the two numbers in the report. The old step at this
        // capacity was 40,000, so 15,000 went to 55,000 in one tap.
        expect(Math.round(MAX * 0.05)).toBe(40_000);
        expect(nudgeUnits(15_000, 1, MAX)).toBe(16_500);
    });

    it('and it does not change when the factory gets bigger', () => {
        // The same position on a workshop and on a megafactory moves the same
        // distance, which is the whole point.
        expect(nudgeUnits(15_000, 1, 20_000_000)).toBe(nudgeUnits(15_000, 1, 20_000));
    });

    it('and it grows with the number, so the top of the range is not forty taps', () => {
        expect(nudgeStep(700_000)).toBe(70_000);
        expect(nudgeStep(15_000)).toBe(1_500);
    });

    it('and never gets so small the control stops being usable', () => {
        // A tenth of 200 is 20. Crossing the low end at 20 a tap is not a
        // control, it is a chore.
        expect(nudgeStep(0)).toBe(NUDGE_MIN_STEP);
        expect(nudgeStep(200)).toBe(NUDGE_MIN_STEP);
        expect(NUDGE_RATIO).toBeCloseTo(0.10, 6);
    });

    it('and takes a similar number of taps to cross any decade', () => {
        // The measurement behind "smooth". Ten per cent per tap means the
        // count between any two values in a ratio is the same, wherever they
        // sit - which the old fixed step could not manage by construction.
        const taps = (from: number, to: number) => {
            let v = from, n = 0;
            while (v < to && n < 500) { v = nudgeUnits(v, 1, MAX); n++; }
            return n;
        };
        const low = taps(20_000, 40_000);
        const high = taps(200_000, 400_000);
        expect(Math.abs(low - high)).toBeLessThanOrEqual(1);
    });
});

describe('and where it lands', () => {
    it('stops at the capacity ceiling rather than overshooting it', () => {
        expect(nudgeUnits(MAX, 1, MAX)).toBe(MAX);
        expect(nudgeUnits(MAX - 10, 1, MAX)).toBe(MAX);
    });

    it('and stops at zero rather than going negative', () => {
        expect(nudgeUnits(0, -1, MAX)).toBe(0);
        expect(nudgeUnits(500, -1, MAX)).toBe(0);
    });

    it('and a line with no capacity at all cannot be nudged up off zero', () => {
        expect(nudgeUnits(0, 1, 0)).toBe(0);
    });

    it('and rubbish in does not produce rubbish out', () => {
        expect(nudgeUnits(NaN as any, 1, MAX)).toBe(NUDGE_MIN_STEP);
        expect(nudgeUnits(-5000, 1, MAX)).toBe(NUDGE_MIN_STEP);
        expect(Number.isFinite(nudgeUnits(1000, 1, NaN as any))).toBe(true);
    });

    it('and up then down does not return you to the start, which is arithmetic', () => {
        // Written down rather than fixed. The second step is measured against
        // the bigger number, so it is larger. Making it reversible would mean
        // remembering where a run of taps began - state the button does not
        // have and a rule the player would have to be told.
        const up = nudgeUnits(15_000, 1, MAX);
        expect(nudgeUnits(up, -1, MAX)).toBe(14_850);

        // AND THE DRIFT IS THE SAME EVERYWHERE, WHICH I HAD WRONG. I wrote
        // "a fraction of a per cent at the top" and this measured exactly one
        // per cent at 700,000 as well as at 15,000. It is ratio squared, so
        // it does not depend on the number at all.
        const roundTrip = (v: number) => {
            const u = nudgeUnits(v, 1, 20_000_000);
            return Math.abs(nudgeUnits(u, -1, 20_000_000) - v) / v;
        };
        for (const v of [15_000, 100_000, 700_000, 5_000_000]) {
            expect(roundTrip(v)).toBeCloseTo(NUDGE_RATIO * NUDGE_RATIO, 4);
        }
    });
});

// ============================================================================
//  AND HOLDING IS NOT TAPPING VERY FAST
// ============================================================================
//  Reported as "when I hold it, it should not rise as if I had tapped. It
//  should go up little by little, and with acceleration".
//
//  The first hold applied the whole TAP step every 100ms. A tap is a tenth of
//  the value, so a hold compounded ten per cent ten times a second: 2.6x per
//  SECOND. The first tick was already a full tap and the second was bigger
//  than the first, so there was no slow part to aim with.
// ============================================================================

/** Where a hold has got to after this long, from this starting point. */
const held = (from: number, ms: number, max = 800_000, dir: 1 | -1 = 1) => {
    let v = from;
    for (let t = 0; t < ms; t += HOLD_TICK_MS) v = holdNudge(v, dir, max, t);
    return v;
};

describe('holding a stepper', () => {
    it('starts far smaller than a tap, which is the whole complaint', () => {
        // One tick of a hold against one tap, at the same value.
        const oneTick = holdNudge(15_000, 1, 800_000, 0) - 15_000;
        const oneTap = nudgeUnits(15_000, 1, 800_000) - 15_000;
        expect(oneTick).toBeLessThan(oneTap / 10);
    });

    it('and the first half second barely moves, so you can still aim', () => {
        // Measured. Under a tenth, which is what "azar azar" has to mean at a
        // control you are trying to land on a number with.
        expect(held(15_000, 500)).toBeLessThan(15_000 * 1.10);
        expect(held(15_000, 500)).toBeGreaterThan(15_000);
    });

    it('and it accelerates, so later seconds cover more than earlier ones', () => {
        const s1 = held(15_000, 1000) - 15_000;
        const s2 = held(15_000, 2000) - held(15_000, 1000);
        const s3 = held(15_000, 3000) - held(15_000, 2000);
        expect(s2).toBeGreaterThan(s1);
        expect(s3).toBeGreaterThan(s2);
    });

    it('and it crosses the whole range in a few seconds rather than instantly', () => {
        // The old behaviour reached the ceiling from 15,000 in about a second
        // and a half. Both ends matter: too fast is unusable, too slow is a
        // control nobody will hold.
        expect(held(15_000, 2000)).toBeLessThan(800_000);
        expect(held(15_000, 10_000)).toBe(800_000);
    });

    it('and the ramp stops ramping, rather than growing without end', () => {
        expect(holdFraction(0)).toBeCloseTo(HOLD_START_FRACTION, 6);
        expect(holdFraction(HOLD_RAMP_MS)).toBeCloseTo(HOLD_MAX_FRACTION, 6);
        expect(holdFraction(HOLD_RAMP_MS * 10)).toBeCloseTo(HOLD_MAX_FRACTION, 6);
        expect(holdFraction(-500)).toBeCloseTo(HOLD_START_FRACTION, 6);
    });

    it('and a tick is never worth a whole tap, even at full speed', () => {
        // Otherwise the hold is the old behaviour again at the far end.
        expect(HOLD_MAX_FRACTION).toBeLessThan(1);
        expect(HOLD_START_FRACTION).toBeLessThan(HOLD_MAX_FRACTION);
    });

    it('and a tick always moves something, so the start of a hold is not dead', () => {
        // A tenth of a tap at the floor is 30 units; floor(30 * 0.03) would be
        // zero without the guard, and a button that does nothing for the first
        // second reads as broken.
        expect(holdNudge(0, 1, 800_000, 0)).toBeGreaterThan(0);
        expect(holdNudge(5, 1, 800_000, 0)).toBeGreaterThan(5);
    });

    it('and it stops at both ends like the tap does', () => {
        expect(held(800_000, 5000)).toBe(800_000);
        expect(held(50_000, 20_000, 800_000, -1)).toBe(0);
    });

    it('and holding down comes back at the same shape it went up', () => {
        expect(held(200_000, 500, 800_000, -1)).toBeLessThan(200_000);
        expect(held(200_000, 500, 800_000, -1)).toBeGreaterThan(200_000 * 0.9);
    });
});

describe('the wiring', () => {
    const src = fs.readFileSync(
        path.join(__dirname, '..', '..', 'features', 'products', 'components', 'ProductModals.tsx'),
        'utf8',
    );

    it('both steppers go through the one move', () => {
        expect(src).toMatch(/onPress=\{\(\) => bumpProduction\(1\)\}/);
        expect(src).toMatch(/onPress=\{\(\) => bumpProduction\(-1\)\}/);
        // And the old factory-sized step is gone from the live code.
        expect(src).not.toMatch(/^\s*const unitStep = Math/m);
        expect(src).not.toMatch(/productionUnits [-+] unitStep/);
    });

    it('and the move is a functional setState, so the hold reads the CURRENT value', () => {
        // The bug this would have caught: capturing `productionUnits` in the
        // closure makes every repeat of a hold add the same amount, which is
        // the flat step again by another route.
        expect(src).toMatch(/setProductionUnits\(v => nudgeUnits\(v, direction, maxUnits\)\)/);
    });

    it('and holding either button repeats it', () => {
        expect(src).toMatch(/onLongPress=\{holdUp\.start\}/);
        expect(src).toMatch(/onPressOut=\{holdUp\.stop\}/);
        expect(src).toMatch(/onLongPress=\{holdDown\.start\}/);
        expect(src).toMatch(/onPressOut=\{holdDown\.stop\}/);
    });

    it('and the repeat is cleared on unmount, not only on lifting a finger', () => {
        // An interval that outlives the screen keeps calling setState on a
        // component that is gone. `onPressOut` does not fire if the modal is
        // closed mid press.
        expect(src).toMatch(/useEffect\(\(\) => stop, \[stop\]\)/);
        expect(src).toMatch(/clearInterval\(timer\.current\)/);
    });

    it('and a second start cannot leak the first interval', () => {
        // Two intervals on one button is a stepper that runs at double speed
        // and never stops.
        expect(src).toMatch(/const start = useCallback\(\(\) => \{\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n\s*stop\(\);/);
    });

    it('and the repeat interval is the hundred milliseconds it was asked for', () => {
        expect(HOLD_TICK_MS).toBe(100);
        expect(src).toMatch(/HOLD_TICK_MS,\s*\)/);
    });

    it('and the hold uses the HOLD step, not the tap step', () => {
        // The rule that would have caught the report. Reusing `nudgeUnits` in
        // the repeat is what made holding feel like tapping very fast.
        expect(src).toMatch(/holdNudge\(v, 1, maxUnits, ms\)/);
        expect(src).toMatch(/holdNudge\(v, -1, maxUnits, ms\)/);
        expect(src).not.toMatch(/useHoldRepeat\(\(\) => bumpProduction/);
    });

    it('and the tick is told how long the finger has been down', () => {
        // Without the elapsed time there is no ramp, and without a ramp there
        // is no acceleration - only a smaller flat step.
        expect(src).toMatch(/const startedAt = useRef\(0\)/);
        expect(src).toMatch(/startedAt\.current = Date\.now\(\)/);
        expect(src).toMatch(/latest\.current\(Date\.now\(\) - startedAt\.current\)/);
    });
});
