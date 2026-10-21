// src/core/ads/gate.ts
//
// ============================================================================
//  THE ONLY DOOR. FOUR CALL SITES KNOCK ON IT AND NOTHING ELSE.
// ============================================================================
//
//  He asked for this in one sentence: "Reklam gosterim karari ve SDK'yi
//  tetikleme islemi SADECE bu dosyadan yapilmalidir." One place decides, one
//  place fires.
//
//  ---------------------------------------------------------------------------
//  WHY THAT IS THIS FILE AND NOT policy.ts
//  ---------------------------------------------------------------------------
//  policy.ts is a pure function of a plain object. That purity is not a style
//  preference; it is the reason seventeen tests can check every rule about
//  interrupting the player with no account, no key, no network and no phone.
//  Importing an advertising SDK into it would end that, and the rules would go
//  back to being checkable only by holding a device and waiting.
//
//  So the DECISION stays pure and this file is the only thing that acts on it.
//  A call site sees one function. It cannot see policy.ts, it cannot see the
//  SDK, it cannot see the purchase, and so it cannot get any of them wrong.
//
//  ---------------------------------------------------------------------------
//  AND WHY THE SDK IS BEHIND A SEAM
//  ---------------------------------------------------------------------------
//  `react-native-google-mobile-ads` is a native module. A test process cannot
//  load it, and until `npm install` has run on his machine it does not exist
//  at all. If this file imported it directly, then every test that touches a
//  call site would need a mock, the four call sites could not be wired until
//  the install finished, and "does the quarter button ask the gate" would be
//  a question answerable only by watching a phone.
//
//  Instead the SDK REGISTERS itself here at startup, and the default is a
//  presenter that does nothing. Everything below is therefore already true
//  and already tested today; ads/admob.ts arrives later and changes no line of
//  it.
// ============================================================================

import { useIdentityStore } from '../store/useIdentityStore';
import {
    decide,
    countCasinoTap as countTap,
    emptyAdState,
    type AdDecision,
    type AdState,
    type AdTrigger,
} from './policy';

/**
 * What actually puts an advertisement on the screen.
 *
 * Returns a promise so the gate can wait for the ad to be dismissed before
 * letting the caller carry on, which is what stops a quarterly report being
 * rendered underneath a full screen interstitial.
 */
export type AdPresenter = () => Promise<void>;

/**
 * The no-op the app runs with until the SDK registers.
 *
 * Deliberately not silent in development. A gate that shows nothing looks
 * exactly like a gate that decided not to show anything, and this project has
 * shipped two gates that were shut for reasons nobody could see from outside.
 */
const noPresenter: AdPresenter = async () => {
    if (__DEV__) {
        console.log('[ads] an ad was earned, but no presenter is registered yet');
    }
};

let present: AdPresenter = noPresenter;

/** Called once, by the SDK adapter, at startup. */
export const setAdPresenter = (presenter: AdPresenter): void => {
    present = presenter;
};

// ---------------------------------------------------------------------------
//  THE SECOND SEAM: OFFERING THE WAY OUT
// ---------------------------------------------------------------------------
//  Same shape as the presenter above and for the same reason. policy.ts
//  decides WHEN somebody is offered the purchase; it must not know that a
//  sheet exists, or the pure rules stop being testable without a device.
//
//  So whatever draws the offer registers itself here, and until it does the
//  default does nothing. Every rule below is therefore already true and
//  already tested today.
//
//  NOT AWAITED, unlike the ad. An advertisement has to finish before the
//  quarterly report is drawn underneath it; an offer is a card the player can
//  ignore, and blocking the game on somebody reading a sales pitch would be a
//  worse interruption than the advertisement it follows.
// ---------------------------------------------------------------------------

/** What puts the purchase offer on the screen. */
export type OfferPresenter = () => void;

const noOffer: OfferPresenter = () => {
    if (__DEV__) {
        console.log('[ads] an offer was earned, but nothing is registered to show it');
    }
};

let offer: OfferPresenter = noOffer;

/** Called once, by whatever owns the sheet. */
export const setOfferPresenter = (presenter: OfferPresenter): void => {
    offer = presenter;
};

/** Whether anything can actually show an offer right now. */
export const hasOfferPresenter = (): boolean => offer !== noOffer;

/** Whether anything is actually able to show an ad right now. */
export const hasAdPresenter = (): boolean => present !== noPresenter;

// ---------------------------------------------------------------------------
//  THE PACING COUNTERS
// ---------------------------------------------------------------------------
//  Module state rather than a persisted store, on purpose.
//
//  These are the counters that say how long it has been, and they are allowed
//  to reset when the app is killed: the worst a reset can do is give the
//  player a slightly longer gap, which is the forgiving direction. Persisting
//  them would buy nothing and would add a fifth thing a new game has to
//  remember not to wipe.
//
//  `adFree` is emphatically NOT here. It is money, it lives in
//  useIdentityStore next to the player's own name, and it is read fresh on
//  every decision so that a purchase, a restore or a refund takes effect on
//  the very next trigger without anything having to be re-registered.
// ---------------------------------------------------------------------------
let counters: AdState = emptyAdState();

/** The state `decide()` sees: the live counters, plus the live purchase. */
const currentState = (): AdState => ({
    ...counters,
    adFree: useIdentityStore.getState().adFree === true,
});

/**
 * Knock on the door.
 *
 * Every one of the four call sites is one line of this and nothing else. The
 * decision is recorded whether or not an ad appears, so a trigger always
 * advances its own counter exactly once.
 *
 * ---------------------------------------------------------------------------
 *  IT NEVER THROWS AND IT NEVER BLOCKS THE GAME
 * ---------------------------------------------------------------------------
 *  An ad failing to load, a network timeout, an SDK that was never
 *  initialised: none of those are reasons the player should fail to advance a
 *  quarter or fail to leave a poker table. The advertisement is the least
 *  important thing happening at any of these four moments, and it is treated
 *  that way.
 *
 *  A failed presentation still consumes the counter. That is the forgiving
 *  choice rather than an oversight: retrying on the next trigger would mean a
 *  player with a bad connection meets the ad attempt every single time.
 * ---------------------------------------------------------------------------
 */
export const adGate = async (
    trigger: AdTrigger,
    elapsedMs = 0,
): Promise<AdDecision> => {
    const decision = decide(currentState(), trigger, elapsedMs);

    // Kept before the await, so two triggers that overlap cannot both read the
    // pre-ad counter and both decide to show one.
    counters = decision.next;

    if (decision.show) {
        try {
            await present();
        } catch (e) {
            if (__DEV__) console.warn('[ads] the presenter failed, carrying on', e);
        }
    }

    // ------------------------------------------------------------------
    //  AFTER THE ADVERTISEMENT, NOT INSTEAD OF IT
    // ------------------------------------------------------------------
    //  The await above is what puts this on the far side of the full
    //  screen ad. Offering the purchase while the advertisement is still
    //  up would be a sales pitch behind somebody else's video, which is
    //  both useless and the sort of thing a store takes an app down for.
    //
    //  Wrapped, because a throw here would reach a call site that only
    //  wanted to advance a quarter. The offer is the least important
    //  thing happening at this moment and is treated that way.
    // ------------------------------------------------------------------
    if (decision.offer) {
        try {
            offer();
        } catch (e) {
            if (__DEV__) console.warn('[ads] the offer failed, carrying on', e);
        }
    }

    return decision;
};

/**
 * One casino action. Shortens the wait; can never itself produce an ad.
 *
 * Separate from `adGate` because it has no decision in it at all, and because
 * pressing Bet must never be answered with a full screen advertisement.
 */
export const countCasinoTap = (): void => {
    counters = countTap(counters);
};

/** What the counters are, for tests and for the dev panel. Read only. */
export const adPacingSnapshot = (): AdState => currentState();

/**
 * Put the pacing back to zero.
 *
 * For tests, and for the moment the player buys the ad-free version: leaving a
 * counter at three when somebody has just paid means that if they ever refund,
 * the very next quarter is an ad. Not a real harm, but free to avoid.
 *
 * It does NOT touch `adFree`, which is not ours to reset.
 */
export const resetAdPacing = (): void => {
    counters = emptyAdState();
};
