// src/core/ads/diagnostics.ts
//
// ============================================================================
//  WHAT THE STORE ACTUALLY SAID, VISIBLE ON THE DEVICE
// ============================================================================
//
//  This file exists because of one afternoon. A purchase went through, the
//  money moved, and the game kept showing advertisements. Three separate
//  things could have caused it and the device could report on none of them:
//
//    - the entitlement identifier in config.ts did not match the dashboard
//    - the product was never attached to the entitlement in the dashboard
//    - the binary on the phone was an older one that predated the fix
//
//  All three look identical from the outside: you pay, and nothing happens.
//  Telling them apart took a RevenueCat dashboard, an `adb` command and a
//  guess, and the guess was the part that could have gone wrong.
//
//  ---------------------------------------------------------------------------
//  WHY IT IS NOT BEHIND __DEV__
//  ---------------------------------------------------------------------------
//  Every other log in this folder is, and that was the mistake. `__DEV__` is
//  false in exactly the build where purchases can be tested at all, because
//  Google Play Billing needs an app installed from Play. So the diagnostics
//  were switched off precisely when they were needed, and the only build that
//  could answer the question was the only build that stayed silent.
//
//  This records in every build. It is reached through the admin panel, which
//  is seven taps on the version line, so a player will not find it by
//  accident and nothing here is rendered until they do.
//
//  ---------------------------------------------------------------------------
//  WHAT IT MUST NOT CONTAIN
//  ---------------------------------------------------------------------------
//  No API keys, no customer identifiers, no transaction or order numbers.
//  Entitlement and product identifiers are names of things, they are already
//  compiled into the binary, and they are the entire question. Anything that
//  identifies a PERSON is somebody else's business and does not belong on a
//  screen that can be photographed.
// ============================================================================

/** How many lines of history to keep. Bounded, because this runs forever. */
const LOG_LIMIT = 14;

export type AdDiagnostics = {
    /** The entitlement identifier the game is asking for. */
    lookingFor: string;
    /** What the customer holds right now, by name. */
    activeEntitlements: string[];
    /** Every entitlement this RevenueCat project defines. */
    knownEntitlements: string[];
    /** Which call produced the two lists above. */
    lastSource: 'launch' | 'purchase' | 'restore' | 'none';
    /** When, as a wall clock time. Null until something has answered. */
    lastSeenAt: number | null;
    /** Whether each native half is in this binary. Null before bootstrap. */
    billingSdk: boolean | null;
    adsSdk: boolean | null;
    /** The unit being requested, and whether it is Google's test one. */
    adUnit: string;
    usingTestUnit: boolean;
    /** The last thing the advertising SDK did, in a few words. */
    lastAdEvent: string;
    /**
     * The iOS tracking permission, and how it was arrived at.
     *
     * Null before anything has been asked. On Android this settles to
     * `unavailable` immediately, which is correct rather than a failure.
     */
    trackingStatus: string | null;
    trackingHow: string | null;
    /**
     * Set only when config.ts names an entitlement this project does not have.
     * Null is the healthy state and the panel says nothing when it is null.
     */
    configMismatch: string | null;
    /** Newest first. */
    log: string[];
};

const state: AdDiagnostics = {
    lookingFor: '',
    activeEntitlements: [],
    knownEntitlements: [],
    lastSource: 'none',
    lastSeenAt: null,
    billingSdk: null,
    adsSdk: null,
    adUnit: '',
    usingTestUnit: false,
    lastAdEvent: 'nothing yet',
    trackingStatus: null,
    trackingHow: null,
    configMismatch: null,
    log: [],
};

/** hh:mm:ss, because a date on this screen would be noise. */
const clock = (at: number): string => {
    const d = new Date(at);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const write = (line: string): void => {
    state.log = [`${clock(Date.now())}  ${line}`, ...state.log].slice(0, LOG_LIMIT);
};

/**
 * Record what a customer info object contained.
 *
 * ---------------------------------------------------------------------------
 *  THE THREE LISTS SIDE BY SIDE ARE THE WHOLE DIAGNOSIS
 * ---------------------------------------------------------------------------
 *  looking for `premium`, active [], known [premium]
 *      the identifier is right and this customer owns nothing. Either they
 *      have not bought it, or the product is not attached to the entitlement
 *      in the dashboard. RevenueCat's Customers page tells the two apart.
 *
 *  looking for `ad_free`, active [], known [premium]
 *      the identifier in config.ts is wrong. This is what shipped once.
 *
 *  looking for `premium`, active [premium]
 *      the store side is correct and any remaining fault is in the game.
 * ---------------------------------------------------------------------------
 */
export const noteEntitlements = (
    source: 'launch' | 'purchase' | 'restore',
    lookingFor: string,
    customerInfo: any,
): void => {
    const active = Object.keys(customerInfo?.entitlements?.active ?? {});
    const known = Object.keys(customerInfo?.entitlements?.all ?? {});

    state.lookingFor = lookingFor;
    state.activeEntitlements = active;
    state.knownEntitlements = known;
    state.lastSource = source;
    state.lastSeenAt = Date.now();

    write(
        `${source}: want '${lookingFor}' ` +
        `active=[${active.join(', ')}] known=[${known.join(', ')}]`,
    );
};

/**
 * Record that the identifier in config.ts is not one this project defines.
 *
 * The loudest thing this file can say. It means a customer WAS granted ad free
 * on a name the code does not know, and `entitled()` only worked because it
 * fell back. The game is correct for that player and the configuration is
 * still wrong, which is the state most likely to be forgotten.
 */
export const noteConfigMismatch = (
    lookingFor: string,
    activeInstead: string[],
    defined: string[],
): void => {
    state.configMismatch =
        `config.ts asks for '${lookingFor}', which this project does not define. ` +
        `Granted from [${activeInstead.join(', ')}] instead. ` +
        `Defined here: [${defined.join(', ')}].`;
    write(`CONFIG MISMATCH: '${lookingFor}' is not defined, used [${activeInstead.join(', ')}]`);
};

/**
 * Record the tracking permission and the route taken to it.
 *
 * `how` is the half that matters. A status of `not-determined` means one of
 * two completely different things: the person has not been asked yet, or the
 * app asked at a moment when iOS refuses to present the alert and silently
 * consumed the only chance. Without the second field those look identical on
 * this screen, which is the same trap the entitlement lists were built to
 * avoid.
 */
export const noteTracking = (status: string, how: string): void => {
    state.trackingStatus = status;
    state.trackingHow = how;
    write(`tracking: ${status} (${how})`);
};

/** Record that a call into the store failed, with the reason it gave. */
export const noteBillingFailure = (source: string, message: string): void => {
    write(`${source} failed: ${message}`);
};

/** Record which native halves answered, once, at bootstrap. */
export const noteSdkPresence = (billing: boolean, ads: boolean): void => {
    state.billingSdk = billing;
    state.adsSdk = ads;
    write(`bootstrap: billing=${billing} ads=${ads}`);
};

/** Record which unit is being asked for, and whether it is the test one. */
export const noteAdUnit = (unit: string, isTest: boolean): void => {
    state.adUnit = unit;
    state.usingTestUnit = isTest;
};

/** Record the last thing the advertising SDK did. */
export const noteAdEvent = (event: string): void => {
    state.lastAdEvent = event;
    write(`ad: ${event}`);
};

/** A copy, so nothing that reads this can change it. */
export const readDiagnostics = (): AdDiagnostics => ({
    ...state,
    activeEntitlements: [...state.activeEntitlements],
    knownEntitlements: [...state.knownEntitlements],
    log: [...state.log],
});

/** For tests. Never called by the app. */
export const resetDiagnostics = (): void => {
    state.lookingFor = '';
    state.activeEntitlements = [];
    state.knownEntitlements = [];
    state.lastSource = 'none';
    state.lastSeenAt = null;
    state.billingSdk = null;
    state.adsSdk = null;
    state.adUnit = '';
    state.usingTestUnit = false;
    state.lastAdEvent = 'nothing yet';
    state.trackingStatus = null;
    state.trackingHow = null;
    state.configMismatch = null;
    state.log = [];
};
