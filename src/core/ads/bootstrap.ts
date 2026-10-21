// src/core/ads/bootstrap.ts
//
// ============================================================================
//  ONE LINE FOR App.tsx TO CALL
// ============================================================================
//
//  Two SDKs, two initialisations, one function. App.tsx should not have to
//  know that there are two, nor in what order, nor what to do when one of them
//  is missing.
//
//  ORDER MATTERS, AND ONLY IN ONE DIRECTION. Billing first, so that a paying
//  player's entitlement is confirmed before the advertising SDK has anything
//  loaded to show. Getting this backwards would not show an ad to a paying
//  player - the gate reads the LOCAL mirror, which rehydrated before either of
//  these ran - but it costs nothing to be right.
//
//  Nothing here throws and nothing here blocks. A game that cannot open
//  because an advertising network is unreachable would be a far worse bug than
//  any it was added to solve.
// ============================================================================

import { initAds } from './admob';
import { initBilling } from './billing';
import { noteSdkPresence } from './diagnostics';
import { requestTrackingIfNeeded, trackingAllowed } from './tracking';

/**
 * Bring advertising and purchases up. Fire and forget.
 *
 * Returns what actually started, for the dev log and for a settings screen
 * that wants to explain why a button is disabled.
 */
export const bootstrapAds = async (): Promise<{
    billing: boolean;
    ads: boolean;
    personalised: boolean;
}> => {
    const billing = await initBilling().then(r => r.ok).catch(() => false);

    // ------------------------------------------------------------------
    //  TRACKING BEFORE ADVERTISING, AND NOT THE OTHER WAY ROUND
    // ------------------------------------------------------------------
    //  initAds preloads an interstitial the moment it finishes, and the
    //  IDFA is read when a request is BUILT. An advertisement requested
    //  before the answer arrives is a non-personalised one whatever the
    //  person then taps, so the first one of the session would always be
    //  the cheap kind.
    //
    //  This waits for the app to be in the foreground, which is the only
    //  state in which iOS will present the alert at all. It is bounded:
    //  see ACTIVE_TIMEOUT_MS in tracking.ts. A prompt nobody answers must
    //  not mean a game that never shows an advertisement again.
    // ------------------------------------------------------------------
    const status = await requestTrackingIfNeeded().catch(() => 'unavailable' as const);
    const personalised = trackingAllowed(status);

    const ads = await initAds(personalised).catch(() => false);

    // Recorded unconditionally: this pair is the first thing worth knowing
    // when a device shows advertisements it should not, and the release build
    // where that happens has no console anybody can read.
    noteSdkPresence(billing, ads);

    if (__DEV__) {
        console.log(
            `[ads] bootstrap: billing=${billing} ads=${ads} ` +
            `tracking=${status} personalised=${personalised}`,
        );
    }
    return { billing, ads, personalised };
};
