// src/features/casino/logic/useHoldToRepeat.ts
//
// ============================================================================
//  A LONG PRESS FIRES ONCE, AND A STACK IS NOT ONE CHIP
// ============================================================================
//
//  Holding a position on the roulette table takes a chip back. Reported as
//  only ever taking ONE: `onLongPress` is a single event, so a player who had
//  laid nine chips on a number had to press and hold nine times.
//
//  Which is the same shape as the bug it was written to fix. CLEAR took the
//  whole table down and was too blunt; a hold that lifts exactly one chip is
//  too fine. The gesture the hand expects is the one every stepper on every
//  phone has: it repeats while you hold it, and it speeds up.
//
//  ---------------------------------------------------------------------------
//  THE ACCELERATION IS THE POINT, NOT A FLOURISH
//  ---------------------------------------------------------------------------
//  A fixed repeat has to choose between two players it cannot both serve: slow
//  enough to stop on the right chip, or fast enough to clear twenty. Starting
//  slow and shortening does both - the first few are separable, and by the
//  time somebody is still holding they have stopped counting and want it gone.
//
//  ---------------------------------------------------------------------------
//  AND IT STOPS WHEN THERE IS NOTHING LEFT
//  ---------------------------------------------------------------------------
//  `canRepeat` is asked before every tick rather than only at the start. A
//  timer that keeps firing into an empty position is how a finger left on the
//  screen ends up clearing the NEXT bet the player lays.
// ============================================================================

import { useCallback, useEffect, useRef } from 'react';

/** The first gap after the hold is recognised, in milliseconds. */
export const HOLD_FIRST_MS = 260;

/** The shortest it ever gets. Below this nobody can stop on a number. */
export const HOLD_FASTEST_MS = 70;

/** How many repeats it takes to get there. */
export const HOLD_RAMP = 6;

/**
 * The gap before repeat number `n`, counting the long press itself as zero.
 *
 * Pure, so the ramp can be read as a table rather than inferred from a
 * running finger.
 */
export const holdDelayFor = (n: number): number => {
    // `Math.max(0, Math.floor(NaN))` is NaN, and a NaN handed to setTimeout
    // fires immediately and forever. Caught by the test rather than in play,
    // which is the only reason it is not a runaway timer on somebody's phone.
    const step = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    if (step >= HOLD_RAMP) return HOLD_FASTEST_MS;
    const t = step / HOLD_RAMP;
    return Math.round(HOLD_FIRST_MS + (HOLD_FASTEST_MS - HOLD_FIRST_MS) * t);
};

type Options = {
    /** What one repeat does. Called for the long press and every tick after. */
    onRepeat: () => void;
    /**
     * Whether there is still anything to do.
     *
     * Asked before EVERY tick. Without it a finger resting on an emptied
     * position eats the next chip the player lays there.
     */
    canRepeat?: () => boolean;
};

/**
 * Handlers for a press that keeps going while it is held.
 *
 * Returns `onLongPress` and `onPressOut` to spread onto a Pressable. The
 * ordinary `onPress` is the caller's and is untouched: a tap still means what
 * it meant.
 */
export const useHoldToRepeat = ({ onRepeat, canRepeat }: Options) => {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const count = useRef(0);
    // Held in a ref so the running timer always calls the CURRENT closure.
    // Without this the repeat keeps a stale `bets` array and lifts chips that
    // are already gone.
    const latest = useRef({ onRepeat, canRepeat });
    latest.current = { onRepeat, canRepeat };

    const stop = useCallback(() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        count.current = 0;
    }, []);

    const tick = useCallback(() => {
        const { onRepeat: run, canRepeat: more } = latest.current;
        if (more && !more()) { stop(); return; }
        run();
        count.current += 1;
        timer.current = setTimeout(tick, holdDelayFor(count.current));
    }, [stop]);

    // A screen that unmounts mid hold - the player navigating away with a
    // finger down - must not leave a timer running against a dead component.
    useEffect(() => stop, [stop]);

    return {
        onLongPress: useCallback(() => { stop(); tick(); }, [stop, tick]),
        onPressOut: stop,
    };
};
