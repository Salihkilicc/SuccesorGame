// src/core/ads/admob.ts
//
// ============================================================================
//  THE ONLY PLACE ADMOB IS NAMED
// ============================================================================
//
//  It registers ONE function with the gate and then has nothing further to do
//  with the game. No screen imports this file; no screen can.
//
//  Required lazily for the same reason billing.ts is: until `npm install` and
//  `pod install` have run, `react-native-google-mobile-ads` does not exist,
//  and a static import of a missing native module is a blank app rather than a
//  missing feature. Before the install this file registers nothing and the
//  gate keeps its no-op; after it, nothing here changes.
//
//  ---------------------------------------------------------------------------
//  WHY THE AD IS LOADED BEFORE IT IS NEEDED
//  ---------------------------------------------------------------------------
//  An interstitial has to be fetched over the network before it can be shown,
//  which takes seconds. Requesting one at the moment the player earns it means
//  the game freezes, or the ad arrives after the player has moved on and
//  interrupts something unrelated.
//
//  So one is kept loaded at all times and the next is requested the moment the
//  current one is closed. `show()` then either has an ad ready or gives up
//  immediately, and giving up immediately is the correct behaviour: the gate
//  treats a failure as a consumed turn, and the player never waits.
// ============================================================================

import { NativeModules, TurboModuleRegistry } from 'react-native';

import { ADMOB_TEST_INTERSTITIAL, interstitialUnitId } from './config';
import { noteAdEvent, noteAdUnit } from './diagnostics';
import { setAdPresenter } from './gate';

// ============================================================================
//  ASK WHETHER THE NATIVE SIDE IS THERE BEFORE TOUCHING THE JAVASCRIPT
// ============================================================================
//  The first version of this file simply wrapped `require` in a try/catch and
//  assumed that was enough. It is not, and a red screen on a device proved it:
//
//      TurboModuleRegistry.getEnforcing(...): 'RNGoogleMobileAdsModule'
//      could not be found.
//        at ads (admob.ts:41)
//
//  That line IS inside the try. The catch never ran, because Metro's own
//  require does this in development:
//
//      metro-runtime/src/polyfills/require.js:178
//        function guardedLoadModule(moduleId, module) {
//          try { returnValue = loadModuleImplementation(...); }
//          catch (e) { global.ErrorUtils.reportFatalError(e); }
//          return returnValue;
//        }
//
//  It swallows the error, raises the red box, and returns `undefined`. So by
//  the time control reaches my catch there is nothing left to catch, and the
//  player has already seen a crash screen.
//
//  The fix is to never load the package at all when the native half is
//  missing. `TurboModuleRegistry.get` is the non-throwing sibling of
//  `getEnforcing`: it answers the question instead of asserting the answer.
//
//  WHEN THIS HAPPENS, and it is not exotic: the app on the device was built
//  BEFORE `npm install` added the library. Metro then serves fresh JavaScript
//  into a stale binary. Every native dependency added from now on has this
//  same window, and a rebuild is what closes it.
// ============================================================================

/** The name the Android and iOS sides register under. */
const NATIVE_MODULE = 'RNGoogleMobileAdsModule';

const nativeSideIsPresent = (): boolean => {
    // The new architecture's registry first, the old bridge second. Which one
    // answers depends on the app's architecture, so both are asked rather
    // than guessed at.
    try {
        if (TurboModuleRegistry?.get?.(NATIVE_MODULE)) return true;
    } catch { /* an older RN without .get; fall through to NativeModules */ }
    return !!(NativeModules as unknown as Record<string, unknown>)[NATIVE_MODULE];
};

let mod: any = null;
let looked = false;

const ads = (): any => {
    if (looked) return mod;
    looked = true;

    if (!nativeSideIsPresent()) {
        mod = null;
        noteAdEvent(`${NATIVE_MODULE} is not in this binary`);
        if (__DEV__) {
            console.log(
                `[ads] ${NATIVE_MODULE} is not in this binary. ` +
                'The app needs a native rebuild, not a Metro reload.',
            );
        }
        return mod;
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        mod = require('react-native-google-mobile-ads');
    } catch {
        // Kept for the case the check above passes and the package is still
        // broken. It cannot catch a missing native module - see the note.
        mod = null;
        if (__DEV__) console.log('[ads] the advertising package would not load');
    }
    return mod;
};

export const isAdSdkAvailable = (): boolean => ads() !== null;

/** The ad waiting in the wings, or null while one is being fetched. */
let loaded: any = null;
let loading = false;

/**
 * Whether behavioural targeting is permitted, decided once at bootstrap.
 *
 * ---------------------------------------------------------------------------
 *  THE INITIALISER HERE IS NOT THE DEFAULT. THE PARAMETER IS.
 * ---------------------------------------------------------------------------
 *  `initAds` assigns this on every call, so the value written on this line is
 *  overwritten before any advertisement is requested and changing it changes
 *  nothing. The default that actually decides anything is
 *  `initAds(personalised = false)` further down, and that is where the test
 *  and the probe belong.
 *
 *  Worth saying out loud because the first version of this comment claimed the
 *  opposite. A probe was run against THIS line, it did not go red, and the
 *  reason was not that the behaviour was unguarded but that the line does not
 *  feed the behaviour at all. An explanation that names the wrong lever sends
 *  the next person to the wrong place.
 *
 *  It is still initialised to the safe value, for the window between module
 *  load and the first initAds call: if anything requested an advertisement in
 *  that window it would be non-personalised, which respects a refusal that has
 *  not been read yet.
 * ---------------------------------------------------------------------------
 */
let personalisedAllowed = false;

const requestNext = (): void => {
    const M = ads();
    if (!M || loading) return;

    const { InterstitialAd, AdEventType } = M;
    loading = true;

    const unit = interstitialUnitId();
    // Recorded on every request rather than once, because the answer changes
    // between a development build and a release one and the whole point of
    // showing it is to catch a release build serving Google's test unit or a
    // development build serving the live one.
    noteAdUnit(unit, Object.values(ADMOB_TEST_INTERSTITIAL).includes(unit as never));
    noteAdEvent('requesting one');

    const ad = InterstitialAd.createForAdRequest(unit, {
        // ------------------------------------------------------------------
        //  THE FLAG IS INVERTED, WHICH IS THE EASIEST LINE HERE TO GET WRONG
        // ------------------------------------------------------------------
        //  `requestNonPersonalizedAdsOnly: true` means DO NOT personalise.
        //  So permission granted has to become `false`. Reading it the other
        //  way round would serve targeted advertisements to somebody who
        //  refused, which is a privacy failure rather than a revenue one, and
        //  nothing in the SDK would complain.
        // ------------------------------------------------------------------
        requestNonPersonalizedAdsOnly: !personalisedAllowed,
    });

    const done = ad.addAdEventListener(AdEventType.LOADED, () => {
        loaded = ad;
        loading = false;
        noteAdEvent('one is loaded and waiting');
        done();
    });

    const failed = ad.addAdEventListener(AdEventType.ERROR, (e: unknown) => {
        // No fill is an ordinary outcome, not a bug. It happens constantly on
        // a new account with no history, and it must not be noisy.
        noteAdEvent(`no fill: ${(e as any)?.message ?? 'no reason given'}`);
        if (__DEV__) console.log('[ads] no ad this time', e);
        loaded = null;
        loading = false;
        failed();
    });

    ad.load();
};

/**
 * Start the SDK and hand the gate something that can show an ad.
 *
 * Called once from bootstrap. Everything past this point goes through
 * `adGate`, including whether an ad is allowed at all - this function is not
 * asked and does not check.
 *
 * `personalised` is the answer to the iOS tracking prompt, resolved before
 * this runs. See bootstrap.ts for why the order is that way round: the IDFA
 * is read when a request is BUILT, and this function builds one immediately.
 */
export const initAds = async (personalised = false): Promise<boolean> => {
    personalisedAllowed = personalised;

    const M = ads();
    if (!M) return false;

    try {
        const mobileAds = M.default;
        await mobileAds().initialize();

        setAdPresenter(async () => {
            const ad = loaded;

            // Nothing ready. The gate has already consumed the counter, which
            // means the player gets a longer gap rather than a wait - the
            // forgiving direction, and deliberate. See gate.ts.
            if (!ad) {
                noteAdEvent('earned one, but none was ready');
                requestNext();
                return;
            }

            loaded = null;
            noteAdEvent('showing one');

            await new Promise<void>(resolve => {
                const { AdEventType } = M;
                let settled = false;
                const finish = () => {
                    if (settled) return;
                    settled = true;
                    // The next one starts loading as this one closes, so the
                    // following trigger has something ready.
                    requestNext();
                    resolve();
                };

                const closed = ad.addAdEventListener(AdEventType.CLOSED, () => { closed(); finish(); });
                const errored = ad.addAdEventListener(AdEventType.ERROR, () => { errored(); finish(); });

                try {
                    ad.show();
                } catch (e) {
                    if (__DEV__) console.warn('[ads] could not show', e);
                    finish();
                }
            });
        });

        // Fetch the first one now, so the player's first earned ad is not the
        // one that has to wait for the network.
        requestNext();
        return true;
    } catch (e: any) {
        noteAdEvent(`the sdk did not start: ${e?.message ?? 'unknown'}`);
        if (__DEV__) console.warn('[ads] the sdk did not start', e);
        return false;
    }
};
