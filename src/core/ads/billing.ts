// src/core/ads/billing.ts
//
// ============================================================================
//  THE PURCHASE, AND THE ONLY PLACE REVENUECAT IS NAMED
// ============================================================================
//
//  Three things use this: the settings screen buys, the settings screen
//  restores, and the app asks once at launch what this person already owns.
//  Everything else in the game reads `useIdentityStore().adFree` and never
//  learns that a store exists.
//
//  ---------------------------------------------------------------------------
//  WHY `require` AND NOT `import`
//  ---------------------------------------------------------------------------
//  `react-native-purchases` is a native module. Until `npm install` and
//  `pod install` have run on his machine it is not in node_modules at all, and
//  a static import of a missing module is a Metro error that stops the app
//  from opening - not a degraded feature, a blank screen.
//
//  So it is required lazily inside a try. Before the install, every function
//  here reports honestly that billing is unavailable and the game runs exactly
//  as it does today. After the install, nothing in this file changes.
//
//  That also means the SDK is never loaded by the test runner, which is why
//  the purchase can be reasoned about without one.
//
//  ---------------------------------------------------------------------------
//  WHAT IS DELIBERATELY NOT HERE
//  ---------------------------------------------------------------------------
//  No price formatting, no alert text, no navigation. Those belong to the
//  screen. This file answers three questions and writes one boolean.
// ============================================================================

import { NativeModules, TurboModuleRegistry } from 'react-native';

import { useIdentityStore } from '../store/useIdentityStore';
import {
    AD_FREE_ENTITLEMENT,
    AD_FREE_OFFERING,
    AD_FREE_PACKAGE,
    AD_FREE_PRODUCT_ID,
    revenueCatKey,
} from './config';
import { noteBillingFailure, noteConfigMismatch, noteEntitlements } from './diagnostics';
import { resetAdPacing } from './gate';

/**
 * The name RNPurchasesModule.java registers under. Read from the library:
 *
 *     node_modules/react-native-purchases/android/.../RNPurchasesModule.java:66
 *       public String getName() { return "RNPurchases"; }
 */
const NATIVE_MODULE = 'RNPurchases';

/**
 * Is the native half of the purchase library actually in this binary?
 *
 * Asked BEFORE requiring the package, for the reason written out at length in
 * admob.ts: Metro's development `require` reports a module-init failure to the
 * red screen and returns undefined WITHOUT throwing, so a try/catch around the
 * require cannot protect anybody. The only way not to crash is not to load it.
 *
 * The usual cause is a binary built before `npm install` ran. A rebuild fixes
 * it; a Metro reload does not.
 */
const nativeSideIsPresent = (): boolean => {
    try {
        if (TurboModuleRegistry?.get?.(NATIVE_MODULE)) return true;
    } catch { /* older RN; fall through */ }
    return !!(NativeModules as unknown as Record<string, unknown>)[NATIVE_MODULE];
};

/**
 * What a call into the store can come back as.
 *
 * `cancelled` is its own outcome rather than an error, because the player
 * pressing Back out of the payment sheet is not a failure and must never be
 * shown as one. That single distinction is most of what makes a purchase flow
 * feel broken or not.
 */
export type BillingResult =
    | { ok: true; adFree: boolean }
    | { ok: false; reason: 'cancelled' | 'unavailable' | 'nothingToRestore' | 'error'; message?: string };

/** The SDK, or null when it is not installed. Resolved once, lazily. */
let sdk: any = null;
let looked = false;

const purchases = (): any => {
    if (looked) return sdk;
    looked = true;

    if (!nativeSideIsPresent()) {
        sdk = null;
        if (__DEV__) {
            console.log(
                `[billing] ${NATIVE_MODULE} is not in this binary. ` +
                'The app needs a native rebuild, not a Metro reload.',
            );
        }
        return sdk;
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require('react-native-purchases');
        sdk = mod?.default ?? mod;
    } catch {
        sdk = null;
        if (__DEV__) console.log('[billing] the purchase package would not load');
    }
    return sdk;
};

/** True once the package exists. The settings screen uses it to explain why. */
export const isBillingAvailable = (): boolean => purchases() !== null;

/**
 * Read the entitlement out of whatever RevenueCat handed back.
 *
 * ---------------------------------------------------------------------------
 *  ONE PARSER, USED BY ALL THREE PATHS
 * ---------------------------------------------------------------------------
 *  Configure, purchase and restore each return customer info in a slightly
 *  different wrapper. Three copies of this line is three chances for one of
 *  them to check the wrong field - and the one that would be wrong is the one
 *  nobody tests, restore, which is the path a paying customer takes on their
 *  second device.
 * ---------------------------------------------------------------------------
 */
const entitled = (customerInfo: any): boolean => {
    const active = customerInfo?.entitlements?.active ?? {};
    const known = customerInfo?.entitlements?.all ?? {};

    // The ordinary case, and the only one that should ever happen.
    if (active[AD_FREE_ENTITLEMENT]) return true;

    // ----------------------------------------------------------------------
    //  WHEN THE NAME IN config.ts IS NOT A NAME THIS PROJECT HAS
    // ----------------------------------------------------------------------
    //  A wrong identifier is invisible from every side. The purchase goes
    //  through, Google Play answers "you already own this item", the
    //  RevenueCat dashboard shows the entitlement ACTIVE, and this function
    //  still returns false, because it is looking up a key that does not
    //  exist. Nothing throws. The player has paid and keeps seeing ads.
    //
    //  That has now happened once, and it cost most of a day to tell apart
    //  from an unattached product, which looks identical from the outside.
    //
    //  So: if the identifier being asked for is not among the entitlements
    //  this project DEFINES, the question being asked is broken rather than
    //  the answer. In that case fall back to "does this customer hold any
    //  active entitlement at all", which for a game that sells exactly one
    //  thing is the same question asked in a way that cannot be misspelled.
    //
    //  DELIBERATELY NARROW. If the named identifier DOES exist in the project
    //  and simply is not active, that is a real "they do not own it" and no
    //  fallback runs. The fallback fires only on a configuration fault, and
    //  it records itself loudly so the fault gets fixed rather than papered
    //  over: see the ad diagnostics panel.
    //
    //  IF A SECOND ENTITLEMENT IS EVER SOLD, this must be revisited. With two
    //  products and a misconfigured name, holding either would grant ad free.
    //  That is acceptable today because there is one, and the alternative is
    //  a silent failure that takes money.
    // ----------------------------------------------------------------------
    const namedIsDefined = Object.prototype.hasOwnProperty.call(known, AD_FREE_ENTITLEMENT);
    if (namedIsDefined) return false;

    // ----------------------------------------------------------------------
    //  FIRST, THE MISTAKE THAT ACTUALLY HAPPENED: CASE
    // ----------------------------------------------------------------------
    //  config.ts said `premium`; the dashboard defines `Premium`. Read aloud
    //  they are the same word. Read by `===` they are different keys, and the
    //  result is a paying customer who keeps seeing advertisements.
    //
    //  Checked BEFORE the broad fallback below, because it is far more
    //  precise: it grants only when the SAME name is held in different case,
    //  rather than on any entitlement at all.
    // ----------------------------------------------------------------------
    const wanted = AD_FREE_ENTITLEMENT.toLowerCase();
    const sameNameDifferentCase = Object.keys(active).find(k => k.toLowerCase() === wanted);
    if (sameNameDifferentCase) {
        noteConfigMismatch(AD_FREE_ENTITLEMENT, [sameNameDifferentCase], Object.keys(known));
        return true;
    }

    const anyActive = Object.keys(active);
    if (anyActive.length === 0) return false;

    noteConfigMismatch(AD_FREE_ENTITLEMENT, anyActive, Object.keys(known));
    return true;
};

/**
 * Say out loud what the store actually granted.
 *
 * ---------------------------------------------------------------------------
 *  THE ONE FAILURE IN THIS FILE THAT IS COMPLETELY SILENT
 * ---------------------------------------------------------------------------
 *  If AD_FREE_ENTITLEMENT does not match the identifier in the dashboard, every
 *  call here SUCCEEDS. No exception, no error code, no failed request. The
 *  purchase completes, the charge is real, and `entitled()` returns false for
 *  the rest of the customer's life. There is nothing to notice.
 *
 *  This is what noticing looks like: record the names that came back next to
 *  the name being looked for. It turns the worst bug available on this path
 *  into a line somebody can read off the screen.
 * ---------------------------------------------------------------------------
 */
const reportEntitlements = (customerInfo: any, where: 'launch' | 'purchase' | 'restore'): void => {
    // ----------------------------------------------------------------------
    //  RECORDED IN EVERY BUILD, PRINTED ONLY IN DEVELOPMENT
    // ----------------------------------------------------------------------
    //  The first version of this function returned early when `__DEV__` was
    //  false, which switched it off in the ONLY build where a purchase can be
    //  made at all: Google Play Billing needs an app installed from Play, and
    //  that app is a release build. The diagnostic was absent exactly when it
    //  was needed, and the question took a dashboard, an adb command and a
    //  guess instead.
    //
    //  So the recording is unconditional and reachable from the admin panel;
    //  only the console line is tied to __DEV__.
    // ----------------------------------------------------------------------
    noteEntitlements(where, AD_FREE_ENTITLEMENT, customerInfo);

    if (!__DEV__) return;
    const active = Object.keys(customerInfo?.entitlements?.active ?? {});
    const all = Object.keys(customerInfo?.entitlements?.all ?? {});
    if (active.includes(AD_FREE_ENTITLEMENT)) return;
    console.log(
        `[billing] ${where}: looking for '${AD_FREE_ENTITLEMENT}', ` +
        `active=[${active.join(', ')}] known=[${all.join(', ')}]. ` +
        (all.length && !all.includes(AD_FREE_ENTITLEMENT)
            ? 'That identifier does not exist in this RevenueCat project. Check config.ts against the dashboard.'
            : 'Nothing owned yet, which is normal before a purchase.'),
    );
};

/** Write what the store said into the one flag the game reads. */
const record = (customerInfo: any, where: 'launch' | 'purchase' | 'restore'): boolean => {
    reportEntitlements(customerInfo, where);
    const adFree = entitled(customerInfo);
    useIdentityStore.getState().applyEntitlement(adFree);
    if (adFree) resetAdPacing();
    return adFree;
};

/**
 * Start RevenueCat and find out what this person already owns.
 *
 * Called once, from the app's bootstrap. Safe to call again; RevenueCat
 * tolerates a repeat configure and the entitlement read is idempotent.
 */
export const initBilling = async (): Promise<BillingResult> => {
    const P = purchases();
    if (!P) return { ok: false, reason: 'unavailable' };

    try {
        P.configure({ apiKey: revenueCatKey() });

        // ------------------------------------------------------------------
        //  A COLD START MUST NOT WAIT ON THE NETWORK TO KNOW THIS
        // ------------------------------------------------------------------
        //  The local mirror in useIdentityStore has already rehydrated by the
        //  time this runs, so a paying player is ad free from the first frame
        //  whatever happens below. This call CORRECTS that mirror; it is not
        //  what establishes it.
        //
        //  Which is why a failure here is swallowed rather than surfaced. No
        //  network means the last known answer stands, and the last known
        //  answer is right almost always.
        // ------------------------------------------------------------------
        const info = await P.getCustomerInfo();
        return { ok: true, adFree: record(info, 'launch') };
    } catch (e: any) {
        noteBillingFailure('launch', e?.message ?? 'unknown');
        if (__DEV__) console.warn('[billing] could not reach the store at launch', e);
        return { ok: false, reason: 'error', message: e?.message };
    }
};

/**
 * Find the one-off package inside the offering, or null if it is not there.
 *
 * Looks in three places, in order of how specific they are:
 *   1. the offering named in config, by its identifier
 *   2. whatever RevenueCat considers current, if the named one is missing
 *   3. the package named in config, then the first package of any kind
 *
 * Never throws. A failure here is not an error to report to the player, it is
 * a reason to take the other route in `purchaseAdFree`.
 */
const lifetimePackage = async (P: any): Promise<any> => {
    try {
        const offerings = await P.getOfferings();
        const offering = offerings?.all?.[AD_FREE_OFFERING] ?? offerings?.current;
        if (!offering) {
            const names = Object.keys(offerings?.all ?? {});
            noteBillingFailure(
                'offerings',
                `'${AD_FREE_OFFERING}' not found, dashboard has [${names.join(', ')}]`,
            );
            if (__DEV__) {
                console.log(
                    `[billing] offering '${AD_FREE_OFFERING}' not found; ` +
                    `the dashboard has [${names.join(', ')}]. Falling back to the product id.`,
                );
            }
            return null;
        }

        const packages: any[] = offering.availablePackages ?? [];
        // `$rc_lifetime` is where a non-consumable lands by default, but the
        // package can be renamed in the dashboard. The first package is a
        // reasonable second guess when there is only one, which there is.
        return packages.find(p => p?.identifier === AD_FREE_PACKAGE) ?? packages[0] ?? null;
    } catch (e: any) {
        noteBillingFailure('offerings', e?.message ?? 'unknown');
        if (__DEV__) console.log('[billing] offerings could not be fetched', e);
        return null;
    }
};

/**
 * What the store says this costs, in the player's own currency.
 *
 * ---------------------------------------------------------------------------
 *  NEVER FORMATTED HERE, AND NEVER GUESSED
 * ---------------------------------------------------------------------------
 *  `priceString` is produced by the store itself: the right currency symbol,
 *  on the right side of the number, with the right separator, for the account
 *  the person is actually signed in to. A player in Istanbul and a player in
 *  Berlin see different text and both are correct.
 *
 *  Building that string here would mean knowing the currency, the exchange
 *  rate, the local convention and the regional price the console set, and
 *  being wrong about any of them means showing somebody a price they will not
 *  be charged. So the number is read, never computed.
 *
 *  Measured from the SDK rather than remembered:
 *      @revenuecat/purchases-typescript-internal/dist/offerings.d.ts:91
 *        readonly priceString: string;   // "Formatted price of the item,
 *                                        //  including its currency sign"
 *
 *  ---------------------------------------------------------------------------
 *  NULL IS A REAL ANSWER AND HAS TO STAY ONE
 * ---------------------------------------------------------------------------
 *  Offline, or before the store has answered, there is no price. The caller
 *  shows the plain button rather than a zero, a dash or a guess: a wrong price
 *  on a button is worse than no price, because somebody will believe it.
 *
 *  Cached for the session once it arrives. The price is set in a console and
 *  can change, but not while somebody is looking at this screen, and asking
 *  the store on every render would be a network call per frame.
 * ---------------------------------------------------------------------------
 */
let cachedPrice: string | null = null;

export const adFreePrice = async (): Promise<string | null> => {
    if (cachedPrice) return cachedPrice;

    const P = purchases();
    if (!P) return null;

    try {
        // The same two routes as the purchase itself, in the same order, so
        // the price on the button is the price of the thing the button buys.
        // A cheaper shortcut here that read a different product would be the
        // one bug on this screen nobody would ever notice.
        const pkg = await lifetimePackage(P);
        const fromPackage = pkg?.product?.priceString;
        if (fromPackage) {
            cachedPrice = fromPackage;
            return cachedPrice;
        }

        const products = await P.getProducts([AD_FREE_PRODUCT_ID]);
        const fromProduct = products?.[0]?.priceString;
        if (fromProduct) {
            cachedPrice = fromProduct;
            return cachedPrice;
        }
        return null;
    } catch (e: any) {
        noteBillingFailure('price', e?.message ?? 'unknown');
        return null;
    }
};

/**
 * Buy the ad-free version.
 *
 * Asks the store for the CURRENT product rather than trusting a cached price,
 * because the price is set in the console and can change between launches.
 */
export const purchaseAdFree = async (): Promise<BillingResult> => {
    const P = purchases();
    if (!P) return { ok: false, reason: 'unavailable' };

    try {
        // ------------------------------------------------------------------
        //  THE OFFERING FIRST, THE PRODUCT ID SECOND
        // ------------------------------------------------------------------
        //  Buying through the offering means the dashboard decides what is on
        //  sale. Buying by product id means this binary decides, which is one
        //  release per price change.
        //
        //  The fallback is NOT belt and braces for its own sake. Offerings are
        //  fetched from RevenueCat's servers and can be empty for reasons that
        //  have nothing to do with this player: a dashboard edit mid-flight, a
        //  cold cache, a network that answered the configure call and not this
        //  one. The product id is already known and the store can be asked
        //  directly, so a temporary server-side gap costs nothing.
        //
        //  Both paths buy the SAME product and RevenueCat grants the
        //  entitlement from its own records either way, so the two cannot
        //  diverge in what the player ends up owning.
        // ------------------------------------------------------------------
        const pkg = await lifetimePackage(P);
        if (pkg) {
            const result = await P.purchasePackage(pkg);
            return { ok: true, adFree: record(result?.customerInfo, 'purchase') };
        }

        const products = await P.getProducts([AD_FREE_PRODUCT_ID]);
        const product = products?.[0];
        if (!product) {
            // Almost always a console problem rather than a code one: the
            // product is still a draft, or the build has not been uploaded to
            // the track the tester is on.
            return { ok: false, reason: 'unavailable' };
        }

        const result = await P.purchaseStoreProduct(product);
        return { ok: true, adFree: record(result?.customerInfo, 'purchase') };
    } catch (e: any) {
        // ------------------------------------------------------------------
        //  BACKING OUT OF THE PAYMENT SHEET IS NOT AN ERROR
        // ------------------------------------------------------------------
        //  RevenueCat raises it as one, with `userCancelled` set. Shown as a
        //  failure it reads as "something went wrong with your payment",
        //  which is alarming and false, and it is the single most common way
        //  this button ends.
        // ------------------------------------------------------------------
        if (e?.userCancelled) {
            noteBillingFailure('purchase', 'cancelled by the player');
            return { ok: false, reason: 'cancelled' };
        }
        noteBillingFailure('purchase', e?.message ?? 'unknown');
        if (__DEV__) console.warn('[billing] purchase failed', e);
        return { ok: false, reason: 'error', message: e?.message };
    }
};

/**
 * Give somebody back what they already paid for.
 *
 * ---------------------------------------------------------------------------
 *  APPLE REQUIRES THIS BUTTON TO EXIST
 * ---------------------------------------------------------------------------
 *  An app selling a non-consumable without a visible restore control is
 *  rejected in review, and quite right: without it, a new phone means buying
 *  the same thing twice.
 * ---------------------------------------------------------------------------
 */
export const restorePurchases = async (): Promise<BillingResult> => {
    const P = purchases();
    if (!P) return { ok: false, reason: 'unavailable' };

    try {
        const info = await P.restorePurchases();
        const adFree = record(info, 'restore');
        // Told apart on purpose. "Restored" and "there was nothing to
        // restore" are different pieces of news, and a screen that says the
        // first when it means the second leaves somebody believing they are
        // ad free until the next advertisement says otherwise.
        return adFree ? { ok: true, adFree } : { ok: false, reason: 'nothingToRestore' };
    } catch (e: any) {
        noteBillingFailure('restore', e?.message ?? 'unknown');
        if (__DEV__) console.warn('[billing] restore failed', e);
        return { ok: false, reason: 'error', message: e?.message };
    }
};
