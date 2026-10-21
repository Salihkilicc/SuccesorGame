// src/core/ads/config.ts
//
// ============================================================================
//  THE SIX IDENTIFIERS, IN ONE PLACE, WITH NOTHING ELSE IN THE FILE
// ============================================================================
//
//  No SDK import, no React, no store. This is data, and it is separate from
//  policy.ts because the two change for completely different reasons: policy
//  changes when he changes his mind about how often to interrupt somebody,
//  this changes when a console hands out a new string.
//
//  ---------------------------------------------------------------------------
//  WHY THESE ARE IN THE REPOSITORY AND THE OTHER FOUR ARE NOT
//  ---------------------------------------------------------------------------
//  An AdMob App ID, an AdMob ad unit ID and a RevenueCat PUBLIC key are all
//  compiled into the shipped app. Anyone with the .aab can read them with
//  `strings`. Hiding them would protect nothing and would only mean the build
//  needs a secret to run, which is a real cost for no benefit.
//
//  The four that ARE secret never come near this repository: the Play service
//  account JSON and the App Store shared secret live in RevenueCat's dashboard
//  and are read by RevenueCat's servers, and the upload keystore and its
//  password live outside the working tree entirely - see the signing block in
//  android/app/build.gradle.
//
//  ---------------------------------------------------------------------------
//  ON THE TEST IDS
//  ---------------------------------------------------------------------------
//  Google publishes ad unit IDs that always fill, for everybody, with no
//  account. They are the right thing to use in development, because clicking
//  your OWN live ad is invalid traffic and grounds for suspension, and in
//  development an accidental click is not a matter of if.
// ============================================================================

import { Platform } from 'react-native';

/**
 * Pick the Android or the iOS value. One helper so the choice is made the same
 * way every time and `Platform.OS === 'android'` is not repeated six times.
 */
const byPlatform = <T,>(android: T, ios: T): T =>
    Platform.OS === 'android' ? android : ios;

// ---------------------------------------------------------------------------
//  ADMOB
// ---------------------------------------------------------------------------

/**
 * The application registration, one per store listing.
 *
 * Also written into AndroidManifest.xml and Info.plist, because the SDK reads
 * it from the NATIVE side at startup and never from JavaScript. The copy here
 * exists so a test can prove the three agree; nothing at runtime uses it.
 *
 * Note the separator: App IDs use `~`, ad unit IDs use `/`. Two strings that
 * differ by one character in the middle, and swapping them fails at runtime
 * with an unhelpful message.
 */
export const ADMOB_APP_ID = {
    android: 'ca-app-pub-9881104469619624~7205239960',
    ios: 'ca-app-pub-9881104469619624~3181787360',
} as const;

/** The live interstitial units. One per platform; all four triggers share it. */
export const ADMOB_INTERSTITIAL = {
    android: 'ca-app-pub-9881104469619624/6204992791',
    ios: 'ca-app-pub-9881104469619624/3024295683',
} as const;

/**
 * Google's public always-fill units. Not secrets and not ours.
 *
 * Documented at
 * https://developers.google.com/admob/android/test-ads
 */
export const ADMOB_TEST_INTERSTITIAL = {
    android: 'ca-app-pub-3940256099942544/1033173712',
    ios: 'ca-app-pub-3940256099942544/4411468910',
} as const;

/**
 * Which interstitial unit this build should ask for.
 *
 * ---------------------------------------------------------------------------
 *  TIED TO __DEV__, NOT TO A FLAG SOMEBODY HAS TO REMEMBER
 * ---------------------------------------------------------------------------
 *  A hand-set `USE_TEST_ADS` constant is one forgotten commit away from a
 *  development build serving live ads to the person developing it, and the
 *  consequence of that is a suspended AdMob account rather than a bug.
 *
 *  `__DEV__` is false in every release bundle by construction, so the live
 *  unit is reached exactly when the app is built to be shipped and never
 *  when it is built to be poked at.
 * ---------------------------------------------------------------------------
 */
export const interstitialUnitId = (): string =>
    __DEV__
        ? byPlatform(ADMOB_TEST_INTERSTITIAL.android, ADMOB_TEST_INTERSTITIAL.ios)
        : byPlatform(ADMOB_INTERSTITIAL.android, ADMOB_INTERSTITIAL.ios);

// ---------------------------------------------------------------------------
//  REVENUECAT
// ---------------------------------------------------------------------------

/** The public SDK keys. Safe to ship; they can only read and buy, not admin. */
export const REVENUECAT_KEY = {
    android: 'goog_tiVMVCgGZHDbgGwgHzvAeFGUnfw',
    ios: 'appl_zJysqXXbxbSrsPawzdNpszVSlTq',
} as const;

export const revenueCatKey = (): string =>
    byPlatform(REVENUECAT_KEY.android, REVENUECAT_KEY.ios);

/**
 * The entitlement the game asks about, and the product that grants it.
 *
 * ---------------------------------------------------------------------------
 *  THE GAME ASKS ABOUT THE ENTITLEMENT. ONLY THE PURCHASE BUTTON NAMES THE
 *  PRODUCT.
 * ---------------------------------------------------------------------------
 *  This is the whole reason RevenueCat is here rather than a raw billing
 *  library. If a second package is added later, or the price changes, or a
 *  launch discount is run as its own product, every one of those is attached
 *  to the entitlement in the dashboard and NO code changes.
 *
 *  ---------------------------------------------------------------------------
 *  THE CONSTANT IS NAMED FOR THE CONCEPT. THE VALUE IS THE DASHBOARD'S STRING.
 *  ---------------------------------------------------------------------------
 *  These were both `ad_free` until the dashboard was actually filled in, and
 *  the entitlement there was created as `premium`. The mismatch would not have
 *  failed loudly: `getCustomerInfo()` would have returned successfully, the
 *  purchase would have gone through, the money would have been taken, and
 *
 *      customerInfo.entitlements.active['ad_free']
 *
 *  would have been `undefined` forever. Correct data that nothing reads, with
 *  a real charge on the other end of it.
 *
 *  So the constant keeps the name the game thinks in and carries the string
 *  the dashboard issues. Renaming the constant to AD_FREE_PREMIUM would spread
 *  a dashboard decision across every call site, which is the thing this file
 *  exists to prevent.
 *
 *  ---------------------------------------------------------------------------
 *  THE CAPITAL P IS NOT A TYPO. IT IS THE WHOLE BUG.
 *  ---------------------------------------------------------------------------
 *  This was `ad_free`, then `premium`, and both were wrong. The dashboard
 *  defines `Premium`. The device said so in the end, in three lines:
 *
 *      Asked for   premium
 *      Held        Premium
 *      Defined     Premium
 *
 *  A single letter of case. Read aloud the two are the same word, read by
 *  `===` they are different keys, and the failure it produces is the silent
 *  one: purchase succeeds, Google Play says "you already own this item",
 *  RevenueCat shows the entitlement active, and the game shows advertisements
 *  to somebody who paid. No exception is thrown anywhere along that path.
 *
 *  DO NOT "TIDY" THE CASE OF THIS STRING. It is not a naming convention, it
 *  is a foreign key into somebody else's database.
 * ---------------------------------------------------------------------------
 */
export const AD_FREE_ENTITLEMENT = 'Premium';
export const AD_FREE_PRODUCT_ID = 'ad_free';

/**
 * The offering and the package inside it.
 *
 * ---------------------------------------------------------------------------
 *  WHY BUY THROUGH AN OFFERING RATHER THAN BY PRODUCT ID
 * ---------------------------------------------------------------------------
 *  `getProducts(['ad_free'])` works and was what this file used first. It asks
 *  the store for one hard-coded product, which means the product id is a
 *  decision frozen into the binary: a price experiment, a regional package or
 *  a launch discount all need a new release.
 *
 *  An offering is the dashboard's answer to "what should this person be shown
 *  right now". Pointing `default` at a different package changes what is sold
 *  without a build. That is the same indirection as the entitlement above, one
 *  level down.
 *
 *  `$rc_lifetime` is RevenueCat's reserved identifier for a one-off permanent
 *  purchase, not a name chosen here. A non-consumable placed in an offering
 *  lands in that slot by default.
 *
 *  The product id is KEPT as the fallback path, not deleted. See billing.ts.
 * ---------------------------------------------------------------------------
 */
export const AD_FREE_OFFERING = 'default';
export const AD_FREE_PACKAGE = '$rc_lifetime';
