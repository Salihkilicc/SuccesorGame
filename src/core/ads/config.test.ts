// src/core/ads/config.test.ts
//
// ============================================================================
//  THE IDENTIFIERS THAT LIVE IN THREE FILES AT ONCE
// ============================================================================
//
//  The AdMob App ID is written in AndroidManifest.xml, in Info.plist, and in
//  config.ts. Only the first two are ever READ - the SDK takes it from the
//  native side before any JavaScript runs - so the TypeScript copy is the one
//  that can quietly go stale, exactly like app.json's applicationId did.
//
//  androidBoot.test.ts pins that pair for the bundle id. This is the same
//  check for the advertising pair, plus the permission whose absence does not
//  fail, it just halves the fill rate.
// ============================================================================

import fs from 'fs';
import path from 'path';

import {
    ADMOB_APP_ID,
    ADMOB_INTERSTITIAL,
    ADMOB_TEST_INTERSTITIAL,
    AD_FREE_ENTITLEMENT,
    AD_FREE_OFFERING,
    AD_FREE_PACKAGE,
    AD_FREE_PRODUCT_ID,
    REVENUECAT_KEY,
    interstitialUnitId,
    revenueCatKey,
} from './config';

const ROOT = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel: string) => fs.existsSync(path.join(ROOT, rel));

const MANIFEST = 'android/app/src/main/AndroidManifest.xml';
const PLIST = 'ios/Succesor/Info.plist';

describe('the app id in the typescript is the app id the sdk reads', () => {
    const itAndroid = exists(MANIFEST) ? it : it.skip;
    const itIos = exists(PLIST) ? it : it.skip;

    it('app.json is the one source, for both platforms', () => {
        // ------------------------------------------------------------------
        //  MEASURED FROM THE LIBRARY, NOT FROM A GUIDE
        // ------------------------------------------------------------------
        //  The first attempt wrote the id straight into AndroidManifest.xml,
        //  which is what every AdMob guide says and what the bare Google SDK
        //  wants. This library does not work that way:
        //
        //    node_modules/react-native-google-mobile-ads/android/build.gradle
        //      appJSONGoogleMobileAdsAppIDString =
        //        rootProject.ext.googleMobileAdsJson.getStringValue("android_app_id", "")
        //
        //    node_modules/react-native-google-mobile-ads/ios_config.sh
        //      _IOS_APP_ID=$(getJsonKeyValue "$_JSON_OUTPUT_RAW" "ios_app_id")
        //      _PLIST_ENTRY_KEYS+=("GADApplicationIdentifier")
        //
        //  It declares the meta-data in its OWN manifest as a placeholder and
        //  fills it from app.json, and it writes the iOS plist key from the
        //  same block through a CocoaPods script phase. So app.json feeds
        //  both, and a hand-written manifest entry is a merger conflict.
        // ------------------------------------------------------------------
        const app = JSON.parse(read('app.json'));
        const block = app['react-native-google-mobile-ads'];
        expect(block).toBeDefined();
        expect(block.android_app_id).toBe(ADMOB_APP_ID.android);
        expect(block.ios_app_id).toBe(ADMOB_APP_ID.ios);
    });

    itAndroid('and the app manifest does not declare it a second time', () => {
        // The library's manifest already has this name. A live copy here
        // fails the merge, and the error names tools:replace rather than the
        // cause. The shelved block in AndroidManifest.xml keeps the reason.
        const live = read(MANIFEST)
            .replace(/<!--[\s\S]*?-->/g, '');
        expect(live).not.toContain('com.google.android.gms.ads.APPLICATION_ID');
    });

    it('and the ios pod is linked the way this project links everything', () => {
        // ------------------------------------------------------------------
        //  A DYNAMIC WRAPPER AROUND A STATIC SDK DOES NOT INSTALL
        // ------------------------------------------------------------------
        //  RNGoogleMobileAds.podspec defaults `static_framework` to false,
        //  and ios/Podfile uses `use_frameworks! :linkage => :static`. Left
        //  alone, `pod install` refuses with "transitive dependencies that
        //  include statically linked binaries" - a message that names neither
        //  the pod nor the switch that fixes it.
        //
        //  Pinned because it is one line in a file nobody reads twice, and
        //  its absence costs an afternoon.
        // ------------------------------------------------------------------
        const podfile = 'ios/Podfile';
        if (!exists(podfile)) return;
        const src = read(podfile);
        expect(src).toContain('$RNGoogleMobileAdsAsStaticFramework = true');
        // Before the target block, or the podspec has already been read.
        expect(src.indexOf('$RNGoogleMobileAdsAsStaticFramework'))
            .toBeLessThan(src.indexOf("target 'Succesor' do"));
    });

    itIos('and ios also carries it in the source plist, in agreement', () => {
        // The build script overwrites this at compile time from app.json, so
        // the two can never reach a device disagreeing. It is kept and pinned
        // anyway: a source plist that says something different from the
        // shipped one is a trap for whoever reads it next.
        expect(read(PLIST)).toContain(
            `<key>GADApplicationIdentifier</key>\n\t<string>${ADMOB_APP_ID.ios}</string>`,
        );
    });

    itAndroid('and the advertising id is declared, or the fill rate halves', () => {
        // ------------------------------------------------------------------
        //  THE ONE THAT DOES NOT FAIL, IT JUST EARNS LESS
        // ------------------------------------------------------------------
        //  Missing on Android 13 and up, the SDK does not crash and does not
        //  warn. It serves non-personalised ads, which fill at a fraction of
        //  the rate. There is no symptom to notice and nothing in the log to
        //  find, which is why it is pinned here rather than trusted.
        // ------------------------------------------------------------------
        expect(read(MANIFEST)).toContain('com.google.android.gms.permission.AD_ID');
    });
});

describe('an app id is not an ad unit id', () => {
    it('app ids carry a tilde and unit ids carry a slash', () => {
        // The two are the same length, share a prefix, and differ by one
        // character in the middle. Swapped, the SDK fails at runtime with a
        // message that does not mention either.
        for (const id of Object.values(ADMOB_APP_ID)) {
            expect([id, id.includes('~'), id.includes('/')]).toEqual([id, true, false]);
        }
        for (const id of [
            ...Object.values(ADMOB_INTERSTITIAL),
            ...Object.values(ADMOB_TEST_INTERSTITIAL),
        ]) {
            expect([id, id.includes('/'), id.includes('~')]).toEqual([id, true, false]);
        }
    });

    it('and every admob id belongs to a publisher', () => {
        for (const id of [...Object.values(ADMOB_APP_ID), ...Object.values(ADMOB_INTERSTITIAL)]) {
            expect(id.startsWith('ca-app-pub-')).toBe(true);
        }
    });
});

describe('a development build cannot serve a live advertisement', () => {
    it('__DEV__ chooses google\'s public test unit', () => {
        // ------------------------------------------------------------------
        //  BECAUSE THE PENALTY IS NOT A BUG, IT IS A SUSPENDED ACCOUNT
        // ------------------------------------------------------------------
        //  Clicking your own live ad is invalid traffic. In development an
        //  accidental click is not a question of if. Tying the choice to
        //  __DEV__ rather than to a hand-set constant means there is no
        //  commit anybody can forget.
        // ------------------------------------------------------------------
        expect(__DEV__).toBe(true); // jest runs as a development bundle
        expect(Object.values(ADMOB_TEST_INTERSTITIAL)).toContain(interstitialUnitId());
        expect(Object.values(ADMOB_INTERSTITIAL)).not.toContain(interstitialUnitId());
    });

    it('and the live unit is reachable, so the release build has one to use', () => {
        // Guards the opposite mistake: a test id pasted into both slots would
        // make the test above pass and earn nothing forever.
        expect(ADMOB_INTERSTITIAL.android).not.toBe(ADMOB_TEST_INTERSTITIAL.android);
        expect(ADMOB_INTERSTITIAL.ios).not.toBe(ADMOB_TEST_INTERSTITIAL.ios);
    });
});

describe('revenuecat', () => {
    it('the two keys are the two platforms, not one pasted twice', () => {
        expect(REVENUECAT_KEY.android).not.toBe(REVENUECAT_KEY.ios);
        // RevenueCat prefixes its public keys by store. A `goog_` key in the
        // iOS slot configures the SDK against the wrong project and every
        // purchase fails with an error about an unknown app.
        expect(REVENUECAT_KEY.android.startsWith('goog_')).toBe(true);
        expect(REVENUECAT_KEY.ios.startsWith('appl_')).toBe(true);
        expect(typeof revenueCatKey()).toBe('string');
    });

    it('and no secret key is in the repository', () => {
        // Public keys are compiled into the shipped app and are readable with
        // `strings`. SECRET keys are the ones that can refund and delete, and
        // RevenueCat prefixes those `sk_`. One belongs here; the other must
        // never.
        expect(read('src/core/ads/config.ts')).not.toMatch(/['"]sk_[A-Za-z0-9]/);
    });

    it('the game asks about an entitlement, and only the button names a product', () => {
        // ------------------------------------------------------------------
        //  THE ENTITLEMENT AND THE PRODUCT ARE DIFFERENT STRINGS ON PURPOSE
        // ------------------------------------------------------------------
        //  This test used to assert both were `ad_free`, which was true only
        //  because the dashboard had not been filled in yet. The entitlement
        //  was created as `premium`.
        //
        //  Pinned, and pinned SEPARATELY, because the failure mode has no
        //  symptom: a wrong entitlement identifier does not error, it just
        //  makes every purchase grant nothing. Whoever edits the dashboard
        //  next has to come here, and this line is how they find out.
        // ------------------------------------------------------------------
        expect(AD_FREE_ENTITLEMENT).toBe('Premium');
        expect(AD_FREE_PRODUCT_ID).toBe('ad_free');
    });

    it('and the capital P is asserted on its own, because that was the bug', () => {
        // ------------------------------------------------------------------
        //  READ OFF A DEVICE, NOT REPORTED AND NOT GUESSED
        // ------------------------------------------------------------------
        //  Two wrong values shipped before this one: `ad_free`, then
        //  `premium`. The dashboard defines `Premium`. The diagnostics panel
        //  is what finally said so:
        //
        //      Asked for   premium
        //      Held        Premium
        //      Defined     Premium
        //
        //  A lowercasing "tidy-up" of this constant would reintroduce a bug
        //  that takes money and shows advertisements anyway, with nothing
        //  thrown and nothing logged. This line is here to make that edit
        //  fail loudly instead.
        // ------------------------------------------------------------------
        expect(AD_FREE_ENTITLEMENT[0]).toBe('P');
        expect(AD_FREE_ENTITLEMENT).not.toBe(AD_FREE_ENTITLEMENT.toLowerCase());
    });

    it('and the offering coordinates match the dashboard', () => {
        // `$rc_lifetime` is RevenueCat's reserved identifier for a one-off
        // permanent purchase. The leading `$` is part of it and is not a typo.
        expect(AD_FREE_OFFERING).toBe('default');
        expect(AD_FREE_PACKAGE).toBe('$rc_lifetime');
    });
});
