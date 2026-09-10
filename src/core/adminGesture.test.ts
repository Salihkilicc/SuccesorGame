// src/core/adminGesture.test.ts
//
// ============================================================================
//  A DOOR THAT IS THERE, AND THAT NOBODY FINDS BY ACCIDENT
// ============================================================================
//
//  Reported as "I took a build and there was no admin panel in settings". The
//  panel was there and the build was right: the section is drawn behind
//  `FEATURES.godMode`, which is `__DEV__`, so a release build never renders it.
//
//  The two obvious answers are both bad. Leaving it means the person who owns
//  the game cannot use it on the device they play on. Turning the flag on
//  means god mode ships the first time somebody forgets to turn it off, and
//  nothing would report that until a player found it.
//
//  So it is a gesture, and the gesture is a value. Seven taps with a window
//  between them is a rule about a number, and a rule about a number belongs in
//  a function rather than in component state - otherwise the only way to find
//  out whether six taps opens it is to render a screen and press it six times.
// ============================================================================

import {
    ADMIN_TAPS, TAP_WINDOW_MS, HINT_FROM, NO_TAPS,
    tap, tapsRemaining, shouldHint,
} from './adminGesture';

/** Tap n times, `gap` milliseconds apart, from a clean state. */
const run = (n: number, gap = 200) => {
    let state = NO_TAPS;
    let opened = 0;
    let now = 1_000_000;
    for (let i = 0; i < n; i++) {
        now += gap;
        const r = tap(state, now);
        state = r.state;
        if (r.unlocked) opened += 1;
    }
    return { state, opened };
};

describe('seven taps open it and six do not', () => {
    it('six is not enough', () => {
        expect(run(ADMIN_TAPS - 1).opened).toBe(0);
    });

    it('and the seventh is', () => {
        expect(run(ADMIN_TAPS).opened).toBe(1);
        expect(ADMIN_TAPS).toBe(7);
    });

    it('and it opens once, not once per tap after', () => {
        // Otherwise a finger resting on the line reopens it every 200ms,
        // which on a real screen means the panel flickering back after it has
        // been dismissed.
        expect(run(ADMIN_TAPS * 2).opened).toBe(2);
        expect(run(ADMIN_TAPS + 3).opened).toBe(1);
    });

    it('and it starts closed, from nothing', () => {
        expect(run(0).opened).toBe(0);
        expect(NO_TAPS.count).toBe(0);
    });
});

describe('and it has to be one run of taps', () => {
    it('a long pause between two taps starts again', () => {
        // ------------------------------------------------------------------
        //  WITHOUT THIS IT IS NOT A GESTURE
        // ------------------------------------------------------------------
        //  Six taps today and one tomorrow would open the panel, which is
        //  indistinguishable from it opening by itself. The window is what
        //  makes seven taps a decision rather than an accumulation.
        // ------------------------------------------------------------------
        expect(run(ADMIN_TAPS, TAP_WINDOW_MS + 1).opened).toBe(0);
    });

    it('and a pause resets the count to one rather than to zero', () => {
        // The tap that broke the window is still a tap. Charging the player
        // an eighth press for pausing would be the rule being pedantic at
        // them.
        let state = NO_TAPS;
        let now = 0;
        for (let i = 0; i < 3; i++) { now += 100; state = tap(state, now).state; }
        expect(state.count).toBe(3);
        now += TAP_WINDOW_MS + 50;
        state = tap(state, now).state;
        expect(state.count).toBe(1);
    });

    it('and a slow but steady hand still opens it', () => {
        // Right at the edge of the window, seven times. A gesture that only
        // works at speed excludes the person most likely to want it.
        expect(run(ADMIN_TAPS, TAP_WINDOW_MS).opened).toBe(1);
    });
});

describe('and it says nothing until it is obviously deliberate', () => {
    it('silent for the first taps', () => {
        for (let n = 0; n <= ADMIN_TAPS - HINT_FROM - 1; n++) {
            expect({ n, hint: shouldHint(run(n).state) }).toEqual({ n, hint: false });
        }
    });

    it('and counts down over the last three', () => {
        const seen: number[] = [];
        for (let n = ADMIN_TAPS - HINT_FROM; n < ADMIN_TAPS; n++) {
            const s = run(n).state;
            expect({ n, hint: shouldHint(s) }).toEqual({ n, hint: true });
            seen.push(tapsRemaining(s));
        }
        expect(seen).toEqual([3, 2, 1]);
    });

    it('and never after it has opened', () => {
        // The count is cleared on unlock, so a stale "1 more" cannot sit
        // under a panel that is already on screen.
        const { state } = run(ADMIN_TAPS);
        expect(shouldHint(state)).toBe(false);
        expect(tapsRemaining(state)).toBe(ADMIN_TAPS);
    });
});

describe('and nonsense does not open it', () => {
    it('a clock that goes backwards', () => {
        // `Date.now()` can move backwards across a daylight saving change or
        // a manual clock set. It must not become an unlock.
        let state = NO_TAPS;
        let opened = 0;
        for (const now of [5000, 4000, 3000, 2000, 1000, 0, -1000]) {
            const r = tap(state, now);
            state = r.state;
            if (r.unlocked) opened += 1;
        }
        expect(opened).toBe(0);
    });

    it('and NaN, which is what a missing timestamp arrives as', () => {
        const r = tap(NO_TAPS, NaN);
        expect(r.unlocked).toBe(false);
        expect(Number.isFinite(r.state.last)).toBe(true);
    });

    it('and a state that was never initialised', () => {
        expect(tap(undefined as never, 1000).unlocked).toBe(false);
        expect(tapsRemaining(undefined as never)).toBe(ADMIN_TAPS);
        expect(shouldHint(undefined as never)).toBe(false);
    });
});
