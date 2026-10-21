// src/core/androidPermissions.test.ts
//
// ============================================================================
//  A PERMISSION IS A PROMISE, AND THIS ONE WAS NOT KEPT
// ============================================================================
//
//  The app declared ACCESS_COARSE_LOCATION on Android and
//  NSLocationWhenInUseUsageDescription on iOS. The only code that ever used
//  either is `features/life/hooks/useWeatherLogic.ts`, reached from
//  `WeatherScreen`, inside the `life` module - and `life` has been false in
//  core/featureFlags.ts for a long time.
//
//  So the app asked two operating systems for the right to read somebody's
//  location in order to run code no player can reach.
//
//  WHY THAT IS NOT A HARMLESS LEFTOVER
//  ---------------------------------------------------------------------------
//    - Play Console's Data Safety form has to agree with the manifest. A
//      declared permission with no matching disclosure is a mismatch.
//    - Apple's privacy label would be wrong whichever way it was filled in.
//    - A privacy policy saying location is not collected is contradicted by
//      the manifest; one saying it is would be a lie about an app that never
//      asks. There is no honest document to write while both are true.
//
//  This file ties the permission to the flag, in both directions, so the two
//  cannot drift apart again - including on the day somebody switches the life
//  module back on and wonders why the weather screen is empty.
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..');
const MANIFEST = 'android/app/src/main/AndroidManifest.xml';
const PLIST = 'ios/Succesor/Info.plist';

const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel: string) => fs.existsSync(path.join(ROOT, rel));

/** The manifest with comments stripped: a shelved line is not a declaration. */
const liveManifest = (): string => read(MANIFEST).replace(/<!--[\s\S]*?-->/g, '');

/** Is the module that wants location switched on? */
const lifeEnabled = (): boolean =>
    !/^\s*life:\s*false/m.test(read('src/core/featureFlags.ts'));

describe('location', () => {
    it('is declared on android only while the life module is on', () => {
        const declared = liveManifest().includes('ACCESS_COARSE_LOCATION');
        expect(declared).toBe(lifeEnabled());
    });

    const itIos = exists(PLIST) ? it : it.skip;

    itIos('and asked for on ios only while the life module is on', () => {
        const declared = read(PLIST).includes('NSLocationWhenInUseUsageDescription');
        expect(declared).toBe(lifeEnabled());
    });

    it('and nothing outside the life module reaches for it', () => {
        // ------------------------------------------------------------------
        //  THE CHECK THAT MAKES THE TWO ABOVE MEAN SOMETHING
        // ------------------------------------------------------------------
        //  Tying the manifest to one flag is only correct while that flag is
        //  the only thing that wants location. A second caller somewhere else
        //  would be permanently broken by the line above and nothing would
        //  say why.
        // ------------------------------------------------------------------
        const callers: string[] = [];
        const walk = (dir: string) => {
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, e.name);
                if (e.isDirectory()) { walk(full); continue; }
                if (!/\.tsx?$/.test(e.name) || /\.test\.tsx?$/.test(e.name)) continue;
                const src = fs.readFileSync(full, 'utf8')
                    .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
                if (/Geolocation|getCurrentPosition/.test(src)) {
                    callers.push(path.relative(path.join(ROOT, 'src'), full));
                }
            }
        };
        walk(path.join(ROOT, 'src'));
        for (const c of callers) expect(c.startsWith(path.join('features', 'life'))).toBe(true);
    });
});

describe('and the permissions that ARE declared each have a reason', () => {
    it('internet, and the advertising id', () => {
        // AD_ID is the one whose absence does not fail, it just halves the
        // fill rate on Android 13 and up. See core/ads/config.test.ts.
        const live = liveManifest();
        expect(live).toContain('android.permission.INTERNET');
        expect(live).toContain('com.google.android.gms.permission.AD_ID');
    });

    it('and there are no others', () => {
        // ------------------------------------------------------------------
        //  THE LIST IS THE DISCLOSURE
        // ------------------------------------------------------------------
        //  Every permission here has to be answered for twice: once in Play
        //  Console's Data Safety form and once in the privacy policy. A new
        //  one arriving quietly - from a library's merged manifest, or from a
        //  feature somebody added in a hurry - is a document that stops being
        //  true without anybody editing it.
        // ------------------------------------------------------------------
        const declared = Array.from(liveManifest().matchAll(/android:name="([^"]+)"\s*\/>/g))
            .map(m => m[1])
            .filter(n => n.includes('permission'));
        expect(declared.sort()).toEqual([
            'android.permission.INTERNET',
            'com.google.android.gms.permission.AD_ID',
        ]);
    });
});
