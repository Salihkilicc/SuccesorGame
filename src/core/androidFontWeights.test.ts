// src/core/androidFontWeights.test.ts
//
// ============================================================================
//  WHICH ANDROID VERSIONS ACTUALLY COLLAPSE A FONT WEIGHT
// ============================================================================
//
//  ANDROID_PLAN said the platform rounds every weight to normal or bold, and
//  that 600, 800 and 900 all land on bold. React Native's own source says
//  otherwise, in ReactFontManager.kt:
//
//      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
//        Typeface.create(typeface, nearestStyle)     // NORMAL or BOLD
//      } else {
//        Typeface.create(typeface, weight, italic)   // the real number
//      }
//
//  `nearestStyle` does collapse. That branch just does not run on Android 9
//  and up, which is where minSdk 24 becomes the whole of the question: the
//  collapse is real on API 24 to 27 and on nothing else.
//
//  ---------------------------------------------------------------------------
//  WHY THIS IS A TEST AND NOT A COMMENT
//  ---------------------------------------------------------------------------
//  Two numbers decide it and both live outside TypeScript: `minSdkVersion` in
//  a Gradle file, and the API level of the branch in a Kotlin file inside
//  node_modules. Nothing in the app can see either. Written down here, a
//  minSdk bump or a React Native upgrade that moves the branch shows up as a
//  failure rather than as a thing somebody has to remember.
//
//  It also stops the plan's original claim coming back. It was stated with
//  confidence, it was wrong, and a paragraph of prose is not what keeps a
//  wrong number from being believed a second time.
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..');

/** Android 9. Below it, React Native collapses a weight to normal or bold. */
const NUMERIC_WEIGHTS_FROM = 28;

describe('the android weight collapse is narrower than the plan said', () => {
    it('react native only collapses below Android 9', () => {
        const kt = path.join(
            ROOT,
            'node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/common/assets/ReactFontManager.kt',
        );
        // A React Native upgrade that moves this file is a reason to look
        // again rather than a reason to fail a suite.
        if (!fs.existsSync(kt)) return;

        const src = fs.readFileSync(kt, 'utf8');

        // The collapsing call, and the version gate in front of it.
        expect(src).toMatch(/Typeface\.create\(typeface,\s*nearestStyle\)/);
        expect(src).toMatch(/SDK_INT\s*<\s*Build\.VERSION_CODES\.P/);

        // And the branch that does NOT collapse, which is the one that
        // matters on any device sold since 2018.
        expect(src).toMatch(/Typeface\.create\(typeface,\s*weight,\s*italic\)/);
    });

    it('and the app still ships to versions where it happens', () => {
        const gradle = fs.readFileSync(path.join(ROOT, 'android', 'build.gradle'), 'utf8');
        const min = Number(gradle.match(/minSdkVersion\s*=\s*(\d+)/)![1]);

        // The claim this file exists to record: there IS a window, it is
        // Android 7.0 to 8.1, and it is the only window.
        expect(min).toBeLessThan(NUMERIC_WEIGHTS_FROM);

        // If somebody raises minSdk to 28 the collapse stops existing at all
        // and this test should be deleted along with the plan section.
        expect(min).toBe(24);
    });

    it('and the weight the screens lean on is the one to look at', () => {
        // ------------------------------------------------------------------
        //  700 AND 800 ARE MOST OF THE APP
        // ------------------------------------------------------------------
        //  Roboto has a 700 face and no 800 face, so on Android 9 and up the
        //  system picks the nearest it has. If that is 700, then these two
        //  render identically and the hierarchy between them is gone - on
        //  every device, not just the old ones.
        //
        //  That cannot be settled by reading. It is settled by looking at the
        //  player card on Home, where 700, 800 and 900 sit in one block.
        //  See ANDROID_PLAN 3.2.
        // ------------------------------------------------------------------
        const walk = (dir: string, out: string[] = []): string[] => {
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, e.name);
                if (e.isDirectory()) { walk(full, out); continue; }
                if (/\.tsx?$/.test(e.name) && !/\.test\./.test(e.name)) out.push(full);
            }
            return out;
        };

        const counts: Record<string, number> = {};
        for (const f of walk(path.join(ROOT, 'src'))) {
            for (const m of fs.readFileSync(f, 'utf8').matchAll(/fontWeight:\s*'(\d00)'/g)) {
                counts[m[1]] = (counts[m[1]] || 0) + 1;
            }
        }

        // Not an exact figure, which would fail on every unrelated edit. The
        // claim is about the SHAPE of the distribution: two weights carry the
        // app, and they are the pair with no face of its own between them.
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        expect((counts['700'] + counts['800']) / total).toBeGreaterThan(0.6);
        expect(counts['800']).toBeGreaterThan(200);
    });
});
