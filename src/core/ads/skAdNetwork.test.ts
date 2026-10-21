// src/core/ads/skAdNetwork.test.ts
//
// ============================================================================
//  THE FIFTY IDENTIFIERS THAT DECIDE WHETHER AN INSTALL IS ATTRIBUTED
// ============================================================================
//
//  Reported by the SDK on a real iPhone:
//
//      <Google> 50 required SKAdNetwork identifier(s) missing from Info.plist
//
//  SKAdNetwork is how Apple lets an ad network learn that an advertisement it
//  showed led to an install, without an IDFA. Without these entries the
//  install is simply not attributed: no error, no failed request, nothing at
//  runtime except a warning nobody reads. The cost is paid by the advertiser
//  who will not bid as much, which arrives months later as a lower rate.
//
//  ---------------------------------------------------------------------------
//  WHY THEY LIVE IN app.json AND NOT IN Info.plist
//  ---------------------------------------------------------------------------
//  Measured from the library rather than taken from a guide:
//
//      node_modules/react-native-google-mobile-ads/ios_config.sh:121
//        # config.sk_ad_network_items
//        _PLIST_ENTRY_KEYS+=("SKAdNetworkItems:$i:SKAdNetworkIdentifier")
//
//  A CocoaPods script phase reads app.json and writes the array into the built
//  Info.plist, exactly as it already does for GADApplicationIdentifier. Writing
//  them into the source plist by hand would give two lists that can disagree,
//  and the one that ships is not the one anybody reads.
//
//  ---------------------------------------------------------------------------
//  AND WHY THIS FILE EXISTS
//  ---------------------------------------------------------------------------
//  The list is not ours, it changes, and Google says so: "these identifiers
//  are subject to change and should be updated regularly". The library ships
//  the current list in its own documentation, so this compares the two and
//  goes red when a library upgrade brings a different one. That turns a silent
//  slow decay into a failing test on the day the package moves.
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..', '..');
const DOCS = 'node_modules/react-native-google-mobile-ads/docs/index.mdx';

const app = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
const ours: string[] = app['react-native-google-mobile-ads']?.sk_ad_network_items ?? [];

describe('the identifiers we ship', () => {
    it('there are fifty of them, which is what the device asked for', () => {
        // The warning names the number. If a future list is a different
        // length that is fine and this line moves with it, deliberately.
        expect(ours).toHaveLength(50);
    });

    it('every one is a well formed skadnetwork identifier', () => {
        // A typo here does not fail anything. It is silently ignored and that
        // one network stops attributing.
        for (const id of ours) {
            expect(id).toMatch(/^[a-z0-9]+\.skadnetwork$/);
        }
    });

    it('and none is listed twice', () => {
        expect(new Set(ours).size).toBe(ours.length);
    });

    it('and they sit beside the app ids, in the block the build script reads', () => {
        // ios_config.sh looks inside the `react-native-google-mobile-ads` key.
        // Anywhere else in app.json and they are simply not read.
        const block = app['react-native-google-mobile-ads'];
        expect(block.ios_app_id).toBeDefined();
        expect(block.sk_ad_network_items).toBe(ours);
    });
});

describe('and they match what the installed library advises', () => {
    const docs = path.join(ROOT, DOCS);
    const itDocs = fs.existsSync(docs) ? it : it.skip;

    itDocs('the list in app.json is the list in the library documentation', () => {
        // ------------------------------------------------------------------
        //  THE LIST IS NOT OURS AND IT EXPIRES
        // ------------------------------------------------------------------
        //  Copied once and forgotten, it rots quietly: networks are added and
        //  removed and the only symptom is a slowly falling rate. Comparing
        //  against the installed package means a `npm update` that changes the
        //  advice fails here instead of failing in the revenue report.
        // ------------------------------------------------------------------
        const src = fs.readFileSync(docs, 'utf8');
        const block = src.match(/"sk_ad_network_items":\s*\[(.*?)\]/s);
        expect(block).not.toBeNull();

        const advised = [...block![1].matchAll(/"([a-z0-9]+\.skadnetwork)"/g)].map(m => m[1]);
        expect(advised.length).toBeGreaterThan(0);
        expect(ours).toEqual(advised);
    });
});
