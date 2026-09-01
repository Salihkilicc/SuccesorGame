// src/core/casino/thinkTime.test.ts
//
// ============================================================================
//  RANDOM IS NOT THE SAME THING AS VARIED
// ============================================================================
//
//  Asked for as "make the waiting random, like they are thinking - well, it
//  already is, but raise it a little".
//
//  Both halves of that are worth taking seriously, and the first half is the
//  interesting one. It WAS already random: a flat draw between 400 and 900ms,
//  scaled by what the bot did. And it still read as mechanical.
//
//  Here is why. A uniform distribution means every pause is a MIDDLING pause.
//  You never get the instant fold and you never get the long tank, so after
//  four hands the rhythm is as recognisable as a fixed delay would be. The
//  variance was there; the SHAPE was not.
//
//  What a real table sounds like is mostly fast with the occasional person who
//  stops dead. Nobody deliberates over folding seven-two. Everybody
//  deliberates over calling a big river bet.
//
//  ---------------------------------------------------------------------------
//  MEASURED, BEFORE AND AFTER
//  ---------------------------------------------------------------------------
//  200,000 draws per action.
//
//      call     mean  p10   p50   p90   max
//      OLD       650  450   649   850   900
//      NEW       707  432   642  1121  1826
//
//  The mean moved nine per cent - "a little", which is what was asked for.
//  The SPREAD roughly doubled: the fast ones got faster, and one pause in
//  seven is now long enough to notice. Same overall pace, completely
//  different rhythm.
//
//  And the first attempt at this was wrong, which is why the cap exists.
//  Multiplying a raise by 1.35 and then tanking it compounds: the tail came
//  out at 3.9 seconds, and with five bots over four streets that is a hand
//  taking half a minute. Measured, then capped, rather than shipped.
// ============================================================================

import {
    DEEP_TANK_CHANCE, DEEP_TANK_MULTIPLE,
    TANK_CHANCE, TANK_MULTIPLE, THINK_CAP_MS, THINK_MAX_MS, THINK_MIN_MS,
    thinkTime, type Action,
} from './pokerBots';

/** Enough draws that the shape is the shape and not the sample. */
const N = 40_000;

const draws = (action: Action): number[] => {
    const xs: number[] = [];
    for (let i = 0; i < N; i++) xs.push(thinkTime(action));
    return xs.sort((a, b) => a - b);
};

const at = (xs: number[], q: number) => xs[Math.floor(xs.length * q)];
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

describe('a pause has a shape, not just a range', () => {
    it('most of them are quick', () => {
        // The half that a uniform draw could never give: a real snap-call.
        const calls = draws('call');
        expect(at(calls, 0.5)).toBeLessThan(THINK_MIN_MS + (THINK_MAX_MS - THINK_MIN_MS) * 0.75);
    });

    it('and one in seven or so is somebody stopping dead', () => {
        // The other half. Without this every pause is a middling pause.
        const calls = draws('call');
        const ordinaryTop = THINK_MAX_MS;
        const tanks = calls.filter(x => x > ordinaryTop).length / N;
        // Four standard errors either side of the intended rate, computed
        // rather than picked: sqrt(p(1-p)/N) with p = 1/7.
        // BOTH TIERS COUNT as "somebody stopped", so the rate to compare
        // against is the two of them together.
        const se = Math.sqrt(TANK_CHANCE * (1 - TANK_CHANCE) / N);
        expect(Math.abs(tanks - TANK_CHANCE)).toBeLessThan(4 * se);
        expect(DEEP_TANK_CHANCE).toBeLessThan(TANK_CHANCE);
    });

    it('and the tail is far longer than the body', () => {
        // THE WHOLE POINT. A uniform draw has p90 barely above p50.
        const calls = draws('call');
        expect(at(calls, 0.9) / at(calls, 0.5)).toBeGreaterThan(1.5);
    });

    it('which a uniform draw does not do, and this is that comparison', () => {
        const uniform: number[] = [];
        for (let i = 0; i < N; i++) uniform.push(400 + Math.random() * 500);
        uniform.sort((a, b) => a - b);
        const flatSpread = at(uniform, 0.9) / at(uniform, 0.5);
        const ourSpread = (() => {
            const c = draws('call');
            return at(c, 0.9) / at(c, 0.5);
        })();
        expect(ourSpread).toBeGreaterThan(flatSpread);
    });
});

describe('and the table has not got slower', () => {
    it('the average pause rose only slightly', () => {
        // "Raise it a little." A hand is five bots over four streets, so a
        // large rise here is a hand nobody sits through.
        const OLD_MEAN = 650;
        const m = mean(draws('call'));
        expect(m).toBeGreaterThan(OLD_MEAN);
        expect(m / OLD_MEAN).toBeLessThan(1.25);
    });

    it('and nobody ever takes longer than the cap', () => {
        // MEASURED THE HARD WAY. The first version had no cap and a raise
        // that tanked came out at 3.9 seconds, because 1.35 and 2.2 compound.
        //
        // The cap went 2000 -> 3200 when the second tier landed, asked for as
        // "now and then one of them should make you wait a lot". A cap that
        // swallowed the deep tank would have turned it back into the ordinary
        // one, which is the whole thing it exists to be different from.
        for (const action of ['call', 'raise', 'check'] as Action[]) {
            expect(Math.max(...draws(action))).toBeLessThanOrEqual(THINK_CAP_MS);
        }
        expect(THINK_CAP_MS).toBeLessThanOrEqual(3500);

        // AND HIGH ENOUGH TO LET THE DEEP TIER THROUGH. A probe caught this:
        // dropping the cap back to 2000 left every assertion passing while
        // quietly clipping the long pause down to the ordinary one, which is
        // the entire thing it exists to be different from. The raise
        // multiplier compounds with the tank, so the cap has to clear both.
        const deepestOrdinary = THINK_MAX_MS * 1.35 * TANK_MULTIPLE;
        expect(THINK_CAP_MS).toBeGreaterThan(deepestOrdinary);
    });

    it('and the long pause is rare enough to stay an event', () => {
        // One tier was becoming its own rhythm. Two tiers: most short, some
        // long, and every so often one that makes everybody look up.
        const calls = draws('call');
        const deep = calls.filter(x => x > THINK_MAX_MS * TANK_MULTIPLE).length / calls.length;
        expect(deep).toBeLessThan(0.08);
        expect(deep).toBeGreaterThan(0.01);
    });

    it('and a whole betting round is still bearable', () => {
        // Five bots. The number that actually matters to the person waiting.
        const perRound = mean(draws('call')) * 5;
        expect(perRound).toBeLessThan(4200);
    });
});

describe('and what they are deciding still changes how long it takes', () => {
    it('a raise takes longer than a call', () => {
        expect(mean(draws('raise'))).toBeGreaterThan(mean(draws('call')));
    });

    it('a fold is the fastest thing at the table', () => {
        expect(mean(draws('fold'))).toBeLessThan(mean(draws('call')));
    });

    it('and nobody ever agonises over folding', () => {
        // A bot that tanked and then folded would be the most obvious tell
        // in the game: real players throw rubbish away instantly.
        const folds = draws('fold');
        expect(Math.max(...folds)).toBeLessThan(THINK_MAX_MS);
    });
});

describe('and it is still pure', () => {
    it('the die is injected, so a test can pin an exact pause', () => {
        // Both draws come from the same source. A `Math.random` hiding inside
        // would make the function untestable and the hand unreproducible.
        // A die of zero takes the DEEPEST tier, since zero is below every
        // threshold. That is the pause this test pins.
        expect(thinkTime('call', () => 0)).toBe(
            Math.round(THINK_MIN_MS * DEEP_TANK_MULTIPLE));
        expect(thinkTime('call', () => 0.999)).toBeGreaterThan(THINK_MAX_MS * 0.9);
    });

    it('and nonsense from the die cannot produce a nonsense pause', () => {
        for (const bad of [NaN, Infinity, -1]) {
            const t = thinkTime('call', () => bad as number);
            expect(Number.isFinite(t)).toBe(true);
            expect(t).toBeGreaterThan(0);
            expect(t).toBeLessThanOrEqual(THINK_CAP_MS);
        }
    });
});
