// src/core/appVersion.test.ts
//
// ============================================================================
//  A VERSION NUMBER THAT LIES IS WORSE THAN NONE
// ============================================================================
//
//  The About row said "Successor OS v1.0.0" from versionCode 1 through 5,
//  because it was a frozen string in the i18n file. During the purchase work
//  that cost real time twice: a fix shipped, the old binary was still on the
//  device, and there was no way to tell the two apart short of
//  `adb shell dumpsys package`. The screen that should have answered the
//  question was the screen that could not.
//
//  Then it showed Android's numbers on BOTH platforms, so an iPhone running
//  Info.plist 0.0.1 confidently announced "v1.0.3 (6)". That is the same fault
//  wearing a better disguise: a stale string at least looks suspicious, a
//  precise wrong number does not.
//
//  Four constants now, two per platform, each pinned to the file that actually
//  builds it.
// ============================================================================

import fs from 'fs';
import path from 'path';

import {
    ANDROID_VERSION_CODE,
    ANDROID_VERSION_NAME,
    IOS_BUILD_NUMBER,
    IOS_VERSION_NAME,
    appBuildNumber,
    appVersionLabel,
    appVersionName,
} from './appVersion';

const ROOT = path.join(__dirname, '..', '..');
const GRADLE = 'android/app/build.gradle';
const PLIST = 'ios/Succesor/Info.plist';

const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel: string) => fs.existsSync(path.join(ROOT, rel));

/** build.gradle with `//` comments stripped, so prose is never the evidence. */
const gradle = (): string =>
    read(GRADLE).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');

/** The string under a plist key, or null. */
const plistValue = (key: string): string | null => {
    const m = read(PLIST).match(
        new RegExp(`<key>${key}</key>\\s*\\n\\s*<string>([^<]*)</string>`),
    );
    return m ? m[1] : null;
};

describe('android shows what android built', () => {
    it('versionName matches build.gradle', () => {
        const m = gradle().match(/versionName\s+"([^"]+)"/);
        expect(m).not.toBeNull();
        expect(m![1]).toBe(ANDROID_VERSION_NAME);
    });

    it('versionCode matches build.gradle', () => {
        // ------------------------------------------------------------------
        //  THE NUMBER THAT IDENTIFIES A PARTICULAR UPLOAD
        // ------------------------------------------------------------------
        //  versionName does not move on every upload; two uploads of the same
        //  content share one. versionCode moves on every upload and is burned
        //  BY the upload rather than by the release, so an abandoned bundle
        //  still consumes its number. It is therefore the only thing that
        //  names one binary, and the only useful answer to "is this the build
        //  with the fix in it".
        // ------------------------------------------------------------------
        const m = gradle().match(/versionCode\s+(\d+)/);
        expect(m).not.toBeNull();
        expect(Number(m![1])).toBe(ANDROID_VERSION_CODE);
    });
});

describe('ios shows what ios built', () => {
    const itIos = exists(PLIST) ? it : it.skip;

    itIos('CFBundleShortVersionString matches Info.plist', () => {
        expect(plistValue('CFBundleShortVersionString')).toBe(IOS_VERSION_NAME);
    });

    itIos('CFBundleVersion matches Info.plist', () => {
        expect(plistValue('CFBundleVersion')).toBe(IOS_BUILD_NUMBER);
    });

    itIos('and the build number is a string, because Apple allows 1.2.3', () => {
        // Android's is an integer and Apple's is not. Typing this as a number
        // would quietly turn "1.2" into 1.2 and "1.0.1" into NaN.
        expect(typeof IOS_BUILD_NUMBER).toBe('string');
    });
});

describe('and the two platforms are not confused with each other', () => {
    it('the label is built from platform functions, not a fixed pair', () => {
        // Under Jest, Platform.OS is 'ios'. That is the point of asserting it
        // this way round: the test process is the platform that was WRONG
        // before, so if the split is ever collapsed back to one pair of
        // constants, this goes red rather than passing by luck.
        expect(appVersionName()).toBe(IOS_VERSION_NAME);
        expect(appBuildNumber()).toBe(IOS_BUILD_NUMBER);
        expect(appVersionLabel()).toBe(`${IOS_VERSION_NAME} (${IOS_BUILD_NUMBER})`);
    });

    it('and the label carries both parts', () => {
        // The marketing version alone is not enough, for the reason above.
        const label = appVersionLabel();
        expect(label).toContain(appVersionName());
        expect(label).toContain(appBuildNumber());
    });
});

describe('the about row is no longer frozen', () => {
    it('the string takes the version as a parameter', () => {
        // Hard-coding it again is the exact regression this guards. Both
        // locales, because one of them being right is not enough.
        for (const f of ['src/core/i18n/tr.ts', 'src/core/i18n/en.ts']) {
            const line = read(f).split('\n')
                .find(l => l.includes('os.successorOsV100')) ?? '';
            expect(line).toContain('{version}');
            expect(line).not.toContain('v1.0.0');
        }
    });

    it('and the settings screen actually passes it', () => {
        // ------------------------------------------------------------------
        //  A PARAMETER NOBODY SUPPLIES RENDERS AS "{version}"
        // ------------------------------------------------------------------
        //  The i18n change on its own would replace a wrong version with a
        //  placeholder, which is a different kind of broken and looks like a
        //  translation fault rather than a wiring one.
        // ------------------------------------------------------------------
        const src = read('src/features/os/screens/SettingsScreen.tsx');
        expect(src).toContain('appVersionLabel()');
        expect(src).toMatch(/successorOsV100',\s*\{\s*version:/);
    });
});
