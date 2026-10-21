// src/core/ads/tracking.ts
//
// ============================================================================
//  THE iOS TRACKING PROMPT, AND THE ONE THING EVERYBODY GETS WRONG ABOUT IT
// ============================================================================
//
//  Info.plist has carried NSUserTrackingUsageDescription since the advertising
//  work started. Nothing ever asked the question, so the string sat there
//  describing a prompt that never appeared: correct data that nothing reads,
//  which is this codebase's signature failure.
//
//  Without the permission the SDK still serves advertisements. They are
//  non-personalised, and they fill at a fraction of the rate. Nothing errors
//  and nothing logs; the only symptom is less money, months later.
//
//  ---------------------------------------------------------------------------
//  ASKING TOO EARLY IS THE SAME AS NOT ASKING
//  ---------------------------------------------------------------------------
//  iOS will not present the tracking alert unless the application is ACTIVE.
//  Called during launch, while the window is still coming up, the request
//  returns immediately with the status unchanged and NO dialog is shown. No
//  exception, no warning. The app believes it asked; the person was never
//  asked; the status stays `not-determined` forever, because it is only asked
//  once and this counted as the once.
//
//  That is why everything below waits for AppState to be `active` first. It is
//  the entire reason this file is more than two lines.
//
//  ---------------------------------------------------------------------------
//  AND WHY THE ADVERTISING SDK WAITS FOR IT
//  ---------------------------------------------------------------------------
//  The IDFA is read when a request is built. An interstitial requested before
//  the answer arrives is a non-personalised one whatever the person then taps,
//  and `admob.ts` preloads one the moment it initialises. So bootstrap runs
//  this first and starts the advertising SDK afterwards.
//
//  Bounded, though. A prompt nobody answers must not mean a game that never
//  shows an advertisement again, so there is a timeout and the ads start
//  regardless once it expires.
//
//  ---------------------------------------------------------------------------
//  ON THE PACKAGE
//  ---------------------------------------------------------------------------
//  `react-native-tracking-transparency` 0.1.2, published 2022. It is small and
//  it is unmaintained, which is a real cost accepted deliberately: the
//  alternative was a hand-written native module and an Xcode target edit.
//
//  It is required LAZILY and behind a presence check, exactly like admob.ts
//  and billing.ts, for the reason written out at length in those files: Metro
//  reports a module-init failure to the red screen and returns undefined
//  WITHOUT throwing, so a try/catch around the require cannot protect anybody.
//  If this package one day fails to build, the game keeps running and the ads
//  stay non-personalised. It cannot take the app down.
// ============================================================================

import { AppState, NativeModules, Platform, TurboModuleRegistry } from 'react-native';

import { noteTracking } from './diagnostics';

/**
 * What the library can answer.
 *
 * Copied from its README rather than remembered:
 *   unavailable    not an iOS 14+ device. Android is always this.
 *   denied         asked and refused
 *   authorized     asked and allowed
 *   restricted     cannot be asked, device policy
 *   not-determined never asked
 */
export type TrackingStatus =
    | 'unavailable' | 'denied' | 'authorized' | 'restricted' | 'not-determined';

/**
 * The names the native half might register under.
 *
 * ---------------------------------------------------------------------------
 *  A LIST RATHER THAN A CONSTANT, AND THE TEST CLOSES IT
 * ---------------------------------------------------------------------------
 *  admob.ts and billing.ts each name exactly one module, read out of the
 *  library's own source. That could not be done here: the package was not
 *  installed when this file was written, so the real name was not measurable
 *  and guessing one would have been a check that passes because it is not
 *  looking.
 *
 *  So every plausible name is tried, and trackingGuard.test.ts reads the
 *  installed package once it exists and fails if the real name is not in this
 *  list. The unknown is recorded as an unknown and then closed by measurement.
 * ---------------------------------------------------------------------------
 */
const NATIVE_MODULE_CANDIDATES = [
    'RNTrackingTransparency',
    'TrackingTransparency',
    'RNTracking',
];

/** How long to wait for the app to come to the foreground before giving up. */
const ACTIVE_TIMEOUT_MS = 10_000;

const nativeSideIsPresent = (): boolean =>
    NATIVE_MODULE_CANDIDATES.some(name => {
        try {
            if (TurboModuleRegistry?.get?.(name)) return true;
        } catch { /* older RN; fall through */ }
        return !!(NativeModules as unknown as Record<string, unknown>)[name];
    });

let mod: any = null;
let looked = false;

const tracking = (): any => {
    if (looked) return mod;
    looked = true;

    if (!nativeSideIsPresent()) {
        mod = null;
        if (__DEV__) {
            console.log(
                '[tracking] no tracking module in this binary. ' +
                'The app needs `npm install` and a native rebuild, not a Metro reload.',
            );
        }
        return mod;
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        mod = require('react-native-tracking-transparency');
    } catch {
        mod = null;
        if (__DEV__) console.log('[tracking] the tracking package would not load');
    }
    return mod;
};

/**
 * Resolve once the application is genuinely in the foreground.
 *
 * Resolves immediately when it already is, which is the common case by the
 * time bootstrap has finished asking the purchase server what this person
 * owns. Otherwise it listens, and gives up after ACTIVE_TIMEOUT_MS so that a
 * launch into the background cannot hold the advertising SDK forever.
 *
 * Returns whether the app actually became active, because "we timed out" and
 * "we are active" lead to different decisions above.
 */
const waitForActive = (timeoutMs = ACTIVE_TIMEOUT_MS): Promise<boolean> =>
    new Promise(resolve => {
        if (AppState.currentState === 'active') {
            resolve(true);
            return;
        }

        let settled = false;
        const finish = (active: boolean) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            try { subscription.remove(); } catch { /* already removed */ }
            resolve(active);
        };

        const timer = setTimeout(() => finish(false), timeoutMs);
        const subscription = AppState.addEventListener('change', next => {
            if (next === 'active') finish(true);
        });
    });

/**
 * Ask for tracking permission, once, at the right moment.
 *
 * Never throws. Returns the status the advertising SDK should proceed under,
 * and records it so the diagnostics panel can show what actually happened on
 * a device with no console.
 *
 * ---------------------------------------------------------------------------
 *  THE ORDER MATTERS AND EACH STEP EARNS ITS PLACE
 * ---------------------------------------------------------------------------
 *  1. Not iOS: there is nothing to ask. Android reads this as `unavailable`
 *     and the library would say the same, but asking a module that is not
 *     there is a needless round trip on every cold start.
 *  2. Read the CURRENT status first. If the person has already answered, the
 *     prompt will never show again and waiting for the foreground would be
 *     ten seconds of nothing before every advertisement.
 *  3. Only then wait for active, and only then ask.
 * ---------------------------------------------------------------------------
 */
export const requestTrackingIfNeeded = async (): Promise<TrackingStatus> => {
    if (Platform.OS !== 'ios') {
        noteTracking('unavailable', 'not ios');
        return 'unavailable';
    }

    const T = tracking();
    if (!T?.getTrackingStatus) {
        noteTracking('unavailable', 'module missing');
        return 'unavailable';
    }

    try {
        const current: TrackingStatus = await T.getTrackingStatus();
        if (current !== 'not-determined') {
            // Already answered, or cannot be asked. Nothing to do and nothing
            // to wait for.
            noteTracking(current, 'already settled');
            return current;
        }

        const becameActive = await waitForActive();
        if (!becameActive) {
            // Launched into the background and stayed there. Asking now would
            // burn the one prompt on a dialog nobody sees, so it is left for
            // the next launch.
            noteTracking('not-determined', 'app never became active, not asked');
            return 'not-determined';
        }

        const answer: TrackingStatus = await T.requestTrackingPermission();
        noteTracking(answer, 'asked');
        return answer;
    } catch (e: any) {
        noteTracking('unavailable', `failed: ${e?.message ?? 'unknown'}`);
        if (__DEV__) console.warn('[tracking] could not ask', e);
        return 'unavailable';
    }
};

/**
 * Whether behavioural targeting is permitted right now.
 *
 * `unavailable` counts as yes, and that is not a loophole: it means the device
 * has no tracking API to consult, which is every Android device and every
 * iPhone below iOS 14. On those, the platform's own rules apply and there is
 * no permission being ignored.
 */
export const trackingAllowed = (status: TrackingStatus): boolean =>
    status === 'authorized' || status === 'unavailable';
