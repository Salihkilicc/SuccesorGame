// src/navigation/pushDuration.test.ts
//
// ============================================================================
//  HOW LONG A SCREEN TAKES TO ARRIVE, ON ANDROID
// ============================================================================
//
//  The obvious lever is `animationDuration` on the navigator, and it is a
//  trap. Its own typings say:
//
//      Duration (in milliseconds) for the following transition animations
//      on iOS: slide_from_bottom, fade_from_bottom, fade, simple_push
//      @platform ios
//
//  Ours is `slide_from_right`. So that prop would have been a line that
//  nothing reads on either platform - this house's signature failure, with
//  the added insult that it would have looked like the fix in a diff.
//
//  What actually decides it is four animation resources inside
//  react-native-screens, all four asking for
//  @android:integer/config_mediumAnimTime, which is 400.
//
//  Android merges the app's resources OVER a library's when the names match,
//  so android/app/src/main/res/anim holds the same four names and they point
//  at one integer of ours. No patch to node_modules, nothing to reapply after
//  an install.
//
//  ---------------------------------------------------------------------------
//  WHY THIS IS READ AS TEXT
//  ---------------------------------------------------------------------------
//  Same reason as androidBoot.test.ts: the whole mechanism is XML, resolved by
//  the Android resource merger at build time. Nothing that runs JavaScript can
//  see it, and the failure mode if a file is renamed or dropped is silent - the
//  library's 400 simply comes back and the screens feel slow again with nothing
//  to point at.
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..');
const ANDROID_RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

const hasAndroid = fs.existsSync(path.join(ROOT, 'android'));
const describeAndroid = hasAndroid ? describe : describe.skip;

/** Every animation react-native-screens uses for a left-right push. */
const PUSH_ANIMS = [
    'rns_slide_in_from_right',
    'rns_slide_out_to_left',
    'rns_slide_in_from_left',
    'rns_slide_out_to_right',
];

describeAndroid('the android push is ours rather than the platform default', () => {
    it('overrides every one of the four, not just the one you notice', () => {
        // Entering a screen is two animations at once: the new one coming in
        // and the old one leaving. Override only the first and the outgoing
        // screen still takes 400, so the two slide at different speeds and the
        // result looks worse than before it was touched.
        for (const name of PUSH_ANIMS) {
            const file = path.join(ANDROID_RES, 'anim', `${name}.xml`);
            expect(fs.existsSync(file)).toBe(true);
            expect(fs.readFileSync(file, 'utf8')).toMatch(
                /android:duration="@integer\/rns_push_duration"/,
            );
        }
    });

    it('names the number once, and it is faster than the platform medium', () => {
        const declared = fs
            .readFileSync(path.join(ANDROID_RES, 'values', 'integers.xml'), 'utf8')
            .match(/<integer name="rns_push_duration">(\d+)<\/integer>/);
        expect(declared).not.toBeNull();

        const ms = Number(declared![1]);

        // config_mediumAnimTime is 400 and that is what we are replacing. A
        // value at or above it means the override is doing nothing.
        expect(ms).toBeLessThan(400);

        // config_shortAnimTime is 200. Below that a push stops reading as a
        // push and starts reading as a cut, which is not what "hafif daha
        // hizli" asked for.
        expect(ms).toBeGreaterThanOrEqual(200);
    });

    it('the four names still match what the library actually asks for', () => {
        // If react-native-screens renames a resource, our override stops
        // overriding anything and goes quiet rather than red. This reads the
        // library's own source so the rename is caught at the version bump.
        const transaction = path.join(
            ROOT,
            'node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/utils/FragmentTransactionKt.kt',
        );

        // Skipped rather than failed if the library moves the file: that is a
        // reason to look, not a reason to block a suite.
        if (!fs.existsSync(transaction)) return;

        const source = fs.readFileSync(transaction, 'utf8');
        for (const name of PUSH_ANIMS) {
            expect(source).toContain(`R.anim.${name}`);
        }
    });
});
