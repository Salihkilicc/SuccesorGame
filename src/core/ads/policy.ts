// src/core/ads/policy.ts
//
// ============================================================================
//  WHEN AN AD IS ALLOWED TO INTERRUPT, AND NOTHING ELSE
// ============================================================================
//
//  No SDK, no React, no store. Every rule about advertising in this game is a
//  pure function of a plain state object, and the only thing the rest of the
//  app may ask is `decide()`.
//
//  ---------------------------------------------------------------------------
//  WHY THIS EXISTS BEFORE THE SDK DOES
//  ---------------------------------------------------------------------------
//  The tempting order is: install AdMob, get an ad showing, then write the
//  rules around it. That is this repository's signature failure wearing a new
//  hat - "correct data that nothing reads", except here the data is a policy
//  and what fails to read it is the ad that fires anyway.
//
//  This file can be tested to exhaustion today, with no account, no key and no
//  network. When the SDK arrives, the only thing that changes is who shows the
//  ad; nothing here moves.
//
//  ---------------------------------------------------------------------------
//  THE RULES, AS HE GAVE THEM
//  ---------------------------------------------------------------------------
//    "iki kere next quartera basinca cikabilmesine okayim aslinda veya 4 kere"
//    then, settled:  every FOURTH quarter advance. A counter, not the in-game
//    calendar - it asks how many times the player pressed, which is the thing
//    that actually paces a session.
//
//    "pokerden cikinca reklam cikabilir"
//    Leaving the poker table always fires one, on its own, and resets the
//    casino clock behind it.
//
//    "genel olarak her 5 dakikada bir olsun kumarhane icerisindeyken ve de
//     eger cok tiklanirsa bu dussun"
//    Inside the casino, an interval rather than an event - but the interval
//    SHRINKS with how hard the player is playing. "her tiklama biraz dussun
//    cok degil ama dussun".
//
//    "reklamsizi satmaliyim orasi kesin"
//    Owning the ad-free version silences all of the above, and only those.
//    Rewarded ads are a separate thing the player opts into, and buying peace
//    from interruptions is not asking to be locked out of a reward.
// ============================================================================

/** Everything that can cause an ad. Named so a call site reads as a sentence. */
export type AdTrigger =
    | 'quarterAdvanced'
    | 'leftPokerTable'
    | 'casinoTick'
    | 'datePressed';

export type AdState = {
    /** The purchase. One flag, and it outranks every rule below. */
    adFree: boolean;

    /** How many quarter advances since the last ad from that trigger. */
    quartersSinceAd: number;

    /** How many times the date button has been pressed since the last ad. */
    datePressesSinceAd: number;

    /** Milliseconds spent inside the casino since the last ad. */
    casinoMsSinceAd: number;

    /** Bets, spins, hits, presses - anything the player did in the casino. */
    casinoTapsSinceAd: number;
};

export const emptyAdState = (): AdState => ({
    adFree: false,
    quartersSinceAd: 0,
    datePressesSinceAd: 0,
    casinoMsSinceAd: 0,
    casinoTapsSinceAd: 0,
});

// ---------------------------------------------------------------------------
//  THE NUMBERS, EACH WITH ITS REASON
// ---------------------------------------------------------------------------

/**
 * Every fourth press of Advance Quarter.
 *
 * He offered two and four and chose four: "her sene reklam ciksin". Four
 * quarters is one year of company time, so the ad lands on an anniversary
 * rather than in the middle of a decision.
 */
export const QUARTERS_PER_AD = 4;

/**
 * The third press of the date button, not the first.
 *
 * "3 kere basinca 3. de ciksin". The first two are free because a player who
 * opens the screen and changes their mind has not consumed anything.
 */
export const DATE_PRESSES_PER_AD = 3;

/**
 * Five minutes in the casino, before any impatience is counted.
 *
 * An interval rather than an event, because the casino is the one place in
 * this game with no natural act break: a player can sit at a slot machine for
 * an hour and never "finish" anything.
 */
export const CASINO_BASE_MS = 5 * 60 * 1000;

/**
 * What one tap takes off that interval.
 *
 * "her tiklama biraz dussun cok degil ama dussun", so this is derived rather
 * than picked: a heavy casino session is on the order of a hundred actions in
 * five minutes - a spin every three seconds. At one second each, a hundred
 * taps brings five minutes down to three and a bit. Felt, and not punitive.
 */
export const CASINO_MS_PER_TAP = 1000;

/**
 * And the interval can never fall below this, however hard somebody plays.
 *
 * Without a floor the arithmetic degenerates: two hundred taps would reach
 * zero and the casino would become a slideshow of advertising, which is the
 * opposite of "biz bitlife degiliz ondan dolayi reklama bogamayiz".
 */
export const CASINO_MIN_MS = 3 * 60 * 1000;

/** How long the player may stay before the next casino ad, given their pace. */
export const casinoIntervalMs = (taps: number): number =>
    Math.max(CASINO_MIN_MS, CASINO_BASE_MS - Math.max(0, taps) * CASINO_MS_PER_TAP);

// ---------------------------------------------------------------------------
//  THE DECISION
// ---------------------------------------------------------------------------

export type AdDecision = {
    /** Show one. */
    show: boolean;
    /** The state to keep, with whatever counter this trigger moved. */
    next: AdState;
    /**
     * Why not, when not. Two gates in this codebase have shipped shut and
     * neither could be diagnosed from outside, so this one says its reason
     * out loud rather than being a silent false.
     */
    reason: 'shown' | 'adFree' | 'notYet';
};

/**
 * Advance the state by one event, and say whether that event earns an ad.
 *
 * Pure. Given the same state and trigger it returns the same answer, which is
 * what lets the whole policy be tested without a device.
 */
export const decide = (
    state: AdState,
    trigger: AdTrigger,
    /** Only `casinoTick` uses it: milliseconds since the last tick. */
    elapsedMs = 0,
): AdDecision => {
    // ----------------------------------------------------------------------
    //  THE PURCHASE OUTRANKS EVERYTHING, AND IT STILL COUNTS
    // ----------------------------------------------------------------------
    //  The counters keep moving for an ad-free player. It costs nothing and
    //  it means a refund, an expiry or a restore on another device does not
    //  land somebody in a state where the next ad is owed immediately.
    // ----------------------------------------------------------------------
    const counted = count(state, trigger, elapsedMs);
    if (state.adFree) return { show: false, next: counted, reason: 'adFree' };

    switch (trigger) {
        case 'quarterAdvanced':
            return counted.quartersSinceAd >= QUARTERS_PER_AD
                ? { show: true, next: { ...counted, quartersSinceAd: 0 }, reason: 'shown' }
                : { show: false, next: counted, reason: 'notYet' };

        case 'datePressed':
            return counted.datePressesSinceAd >= DATE_PRESSES_PER_AD
                ? { show: true, next: { ...counted, datePressesSinceAd: 0 }, reason: 'shown' }
                : { show: false, next: counted, reason: 'notYet' };

        // ------------------------------------------------------------------
        //  LEAVING THE TABLE IS ITS OWN EVENT, AND IT RESETS THE CLOCK
        // ------------------------------------------------------------------
        //  Always fires. A poker hand is the longest single thing in the
        //  casino and standing up from it is a real act break, which is the
        //  one moment an interruption is not an interruption.
        //
        //  It clears the casino timer as well, so a player who leaves poker
        //  and walks to the roulette table does not meet a second ad thirty
        //  seconds later because the interval had almost elapsed underneath.
        // ------------------------------------------------------------------
        case 'leftPokerTable':
            return {
                show: true,
                next: { ...counted, casinoMsSinceAd: 0, casinoTapsSinceAd: 0 },
                reason: 'shown',
            };

        case 'casinoTick':
            return counted.casinoMsSinceAd >= casinoIntervalMs(counted.casinoTapsSinceAd)
                ? { show: true, next: { ...counted, casinoMsSinceAd: 0, casinoTapsSinceAd: 0 }, reason: 'shown' }
                : { show: false, next: counted, reason: 'notYet' };
    }
};

/** Move the one counter this trigger is about. Nothing else changes. */
const count = (state: AdState, trigger: AdTrigger, elapsedMs: number): AdState => {
    switch (trigger) {
        case 'quarterAdvanced':
            return { ...state, quartersSinceAd: state.quartersSinceAd + 1 };
        case 'datePressed':
            return { ...state, datePressesSinceAd: state.datePressesSinceAd + 1 };
        case 'casinoTick':
            return { ...state, casinoMsSinceAd: state.casinoMsSinceAd + Math.max(0, elapsedMs) };
        case 'leftPokerTable':
            return state;
    }
};

/**
 * One casino action. Separate from `decide` because it never shows anything.
 *
 * A tap does not earn an ad, it only makes the next one arrive sooner, and
 * keeping that apart is what stops a bet ever being answered with a full
 * screen advertisement.
 */
export const countCasinoTap = (state: AdState): AdState =>
    ({ ...state, casinoTapsSinceAd: state.casinoTapsSinceAd + 1 });
