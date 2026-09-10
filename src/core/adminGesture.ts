// src/core/adminGesture.ts
//
// ============================================================================
//  THE DOOR THAT IS THERE AND CANNOT BE FOUND BY ACCIDENT
// ============================================================================
//
//  Reported as "I took a build and there was no admin panel in settings". The
//  panel is there and the build was right: it is drawn behind `FEATURES.godMode`,
//  which is `__DEV__`, and a release build has no such section. Not disabled,
//  not greyed: not rendered.
//
//  Which was the correct call and the wrong trade. A cheat gated on the build
//  type is a cheat the person who owns the game cannot use on the device they
//  actually play on, and the obvious fix - turn the flag on - is the one that
//  ships a god mode button to the App Store the first time somebody forgets.
//
//  ---------------------------------------------------------------------------
//  SO IT IS A GESTURE, WHICH IS WHAT EVERY PHONE ALREADY DOES
//  ---------------------------------------------------------------------------
//  Seven taps on the version line at the bottom of Settings. Android has done
//  exactly this for its developer menu for fifteen years, which means it needs
//  no discovery and no label: the people who want it will try it, and nobody
//  else will ever tap a version number seven times.
//
//  It survives a release build, so it cannot be forgotten in the wrong state,
//  and it cannot be reached by a player wandering around.
//
//  ---------------------------------------------------------------------------
//  A WINDOW, BECAUSE OTHERWISE IT IS NOT A GESTURE
//  ---------------------------------------------------------------------------
//  Without one, seven taps spread over three separate visits to Settings adds
//  up to an unlock, which is indistinguishable from opening by itself. The
//  count resets if more than `TAP_WINDOW_MS` passes between two taps, so the
//  seven have to be one deliberate run.
//
//  PURE, and that is the point of the file. A tap counter living in component
//  state is a rule nothing can test: you would have to render a screen and
//  press it seven times to find out whether six ever opens it. Here the whole
//  rule is one function over a value.
// ============================================================================

/** How many taps open it. Seven, as on every Android phone. */
export const ADMIN_TAPS = 7;

/**
 * The longest gap allowed between two taps of the same run.
 *
 * Long enough not to punish a slow hand, short enough that nothing accumulates
 * across visits.
 */
export const TAP_WINDOW_MS = 1500;

export type TapState = {
    /** How many taps of the current run have landed. */
    count: number;
    /** When the last one landed, in milliseconds. */
    last: number;
};

export const NO_TAPS: TapState = { count: 0, last: 0 };

/**
 * The state after one more tap, and whether that tap opened the door.
 *
 * Returns the new state rather than mutating, so the caller can hold it
 * wherever it likes and this stays a value.
 *
 * `now` is injectable so the window can be tested without waiting.
 */
export const tap = (state: TapState, now: number): { state: TapState; unlocked: boolean } => {
    const prev = state ?? NO_TAPS;
    const at = Number.isFinite(now) ? now : 0;

    // A gap wider than the window starts the run again FROM THIS TAP, rather
    // than from nothing: a player who pauses and carries on should not have
    // to tap an eighth time.
    //
    // THE GAP MUST ALSO BE FORWARD, and the test found that it was not. The
    // check was `at - prev.last <= TAP_WINDOW_MS`, which is satisfied by every
    // NEGATIVE difference too - so a clock that moved backwards mid gesture
    // (a daylight saving change, a manual clock set, a device syncing time)
    // kept the run alive across any gap at all. Harmless here, since seven
    // taps are still seven taps, and wrong in the way that matters: the rule
    // said "one deliberate run" and the code said "one run, unless time went
    // strange, in which case anything".
    const gap = at - prev.last;
    const withinWindow = prev.count > 0 && gap >= 0 && gap <= TAP_WINDOW_MS;
    const count = withinWindow ? prev.count + 1 : 1;

    if (count >= ADMIN_TAPS) {
        // Cleared on unlock, so a second run of seven does not immediately
        // fire again off the tail of the first.
        return { state: NO_TAPS, unlocked: true };
    }
    return { state: { count, last: at }, unlocked: false };
};

/**
 * How many more taps are needed.
 *
 * Not shown to the player until they are close, which is the other half of
 * the Android gesture: silence until it is obviously deliberate, then a count.
 */
export const tapsRemaining = (state: TapState): number =>
    Math.max(0, ADMIN_TAPS - (state?.count ?? 0));

/** When to start telling them. Three from the end, so it reads as a countdown. */
export const HINT_FROM = 3;

/** Whether the countdown should be on screen at this point. */
export const shouldHint = (state: TapState): boolean => {
    const left = tapsRemaining(state);
    return left > 0 && left <= HINT_FROM;
};
