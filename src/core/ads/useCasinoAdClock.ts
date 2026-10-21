// src/core/ads/useCasinoAdClock.ts
//
// ============================================================================
//  THE ONE TRIGGER THAT IS NOT AN EVENT
// ============================================================================
//
//  "genel olarak her 5 dakikada bir olsun kumarhane icerisindeyken."
//
//  The other three triggers are things the player DOES: advance a quarter,
//  stand up from a table, finish a date. The casino has no equivalent, and
//  that is the point of it: somebody can sit at a slot machine for an hour
//  and never finish anything. So this one is a clock.
//
//  ---------------------------------------------------------------------------
//  WHY A HOOK AND NOT A LINE IN gate.ts
//  ---------------------------------------------------------------------------
//  gate.ts has no React in it, deliberately, so that every one of its rules is
//  testable in a plain node process. A timer that has to start when a screen
//  mounts and stop when it unmounts is React's job, so it lives here and calls
//  the same one door every other call site calls.
//
//  ---------------------------------------------------------------------------
//  AND WHY IT TICKS OFTEN AND COUNTS REAL TIME
//  ---------------------------------------------------------------------------
//  A single `setTimeout(5 minutes)` would be wrong twice over. It could not
//  shorten itself when the player started playing hard, which is half of what
//  he asked for, and a JavaScript timer does not run while the app is in the
//  background - so five minutes of wall clock with the phone in a pocket would
//  arrive as an ad the moment the app came back, having interrupted nothing.
//
//  Ticking every few seconds and adding the MEASURED elapsed time means the
//  interval is re-evaluated against the current tap count each time, and time
//  spent with the app closed is not counted, because these ticks did not run.
// ============================================================================

import { useEffect } from 'react';

import { adGate } from './gate';

/**
 * How often the clock reports in. Not how often an ad appears.
 *
 * Three seconds is short enough that a shortened interval takes effect while
 * the player is still playing, and long enough to be free.
 */
export const CASINO_TICK_MS = 3000;

/**
 * Run the casino clock for as long as the component is mounted.
 *
 * Mounted on the casino hub rather than on each game screen, so that walking
 * from the slot machines to the roulette table does not restart the clock -
 * the player has not left the casino, and the rule is about being inside it.
 *
 * @param active pass false to stop the clock without unmounting.
 */
export const useCasinoAdClock = (active = true): void => {
    useEffect(() => {
        if (!active) return;

        // The real elapsed time between ticks, not the interval we asked for.
        // A busy JavaScript thread, a long animation or a backgrounded app all
        // make the two differ, and the player's five minutes is measured by a
        // clock rather than by a count of how often we managed to wake up.
        let last = Date.now();

        const id = setInterval(() => {
            const now = Date.now();
            const elapsed = now - last;
            last = now;

            // ------------------------------------------------------------------
            //  TIME THE APP WAS NOT RUNNING IS NOT TIME IN THE CASINO
            // ------------------------------------------------------------------
            //  If the phone was locked for an hour, this interval did not fire
            //  for an hour and the next tick would otherwise hand the gate a
            //  single 3,600,000ms jump - an ad delivered to somebody who has
            //  just walked back in and done nothing yet.
            //
            //  Anything longer than a few missed ticks is treated as an
            //  absence rather than as play.
            // ------------------------------------------------------------------
            if (elapsed > CASINO_TICK_MS * 4) return;

            void adGate('casinoTick', elapsed);
        }, CASINO_TICK_MS);

        return () => clearInterval(id);
    }, [active]);
};
