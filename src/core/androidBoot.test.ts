// src/core/androidBoot.test.ts
//
// ============================================================================
//  THE THREE STRINGS THAT DECIDE WHETHER ANDROID OPENS AT ALL
// ============================================================================
//
//  None of these can be checked by TypeScript, by the bundler, or by any test
//  that runs JavaScript, because two of the three live in Kotlin and Gradle.
//  They are checked here as TEXT, the same way locks.test.ts reads the screens
//  to find out which tutorial targets really exist.
//
//  ---------------------------------------------------------------------------
//  THE ONE THAT FAILS SILENTLY
//  ---------------------------------------------------------------------------
//  `index.js` calls AppRegistry.registerComponent('Succesor', ...). Android's
//  MainActivity.getMainComponentName() has to return the same string.
//
//  If it does not, the app does not crash and does not warn. It opens a white
//  screen and stays there. Nothing in the log says which of the two names is
//  wrong, and the natural next move is to go looking in the JavaScript, where
//  there is nothing to find.
//
//  The template ships it as "SuccesorAndroid", after the throwaway project the
//  android folder was generated from, so this is wrong by default on day one.
//
//  ---------------------------------------------------------------------------
//  AND THE ONE THAT CANNOT BE UNDONE
//  ---------------------------------------------------------------------------
//  Google Play freezes `applicationId` at the first upload. After that the only
//  way to change it is a new listing with no reviews, no ranking and no
//  installs. IDENTITY.md is where the decision and its reasoning live; this
//  makes sure the file and the build agree.
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** What IDENTITY.md settled on. One place, so a rename moves one line. */
const APP_NAME = 'Succesor';
const APPLICATION_ID = 'com.salihkilic.successor';

const ANDROID = 'android';
const hasAndroid = fs.existsSync(path.join(ROOT, ANDROID));

// The port is done in phases and this file is written before the folder is
// finished. Skipping when there is no android/ is honest; asserting against a
// folder that does not exist would just be noise in the iOS-only tree.
const describeAndroid = hasAndroid ? describe : describe.skip;

describeAndroid('android boots under the name javascript registered', () => {
    it('MainActivity returns exactly what index.js registers', () => {
        // ------------------------------------------------------------------
        //  THE WHITE SCREEN TEST
        // ------------------------------------------------------------------
        const registered = read('index.js')
            .match(/AppRegistry\.registerComponent\(\s*['"]([^'"]+)['"]/);
        expect(registered).not.toBeNull();

        const activity = read(
            `${ANDROID}/app/src/main/java/com/salihkilic/successor/MainActivity.kt`,
        ).match(/getMainComponentName\(\)\s*:\s*String\s*=\s*"([^"]+)"/);
        expect(activity).not.toBeNull();

        // Compared as a pair so a failure prints both sides. Seeing only one
        // of them is what makes this bug take an evening.
        expect([registered![1], activity![1]])
            .toEqual([APP_NAME, APP_NAME]);
    });

    it('and the java package matches the folder it sits in', () => {
        // A package declaration that disagrees with the directory does not
        // compile, but the error names neither the old name nor the new one
        // in a way that helps. Cheap to pin.
        for (const file of ['MainActivity', 'MainApplication']) {
            const src = read(
                `${ANDROID}/app/src/main/java/com/salihkilic/successor/${file}.kt`,
            );
            expect([file, src.split('\n')[0].trim()])
                .toEqual([file, `package ${APPLICATION_ID}`]);
        }
    });

    it('the application id is the one Google Play will freeze', () => {
        const gradle = read(`${ANDROID}/app/build.gradle`);
        expect(gradle).toContain(`applicationId "${APPLICATION_ID}"`);
        expect(gradle).toContain(`namespace "${APPLICATION_ID}"`);
    });

    it('and it agrees with what app.json and IDENTITY.md say', () => {
        // app.json's android.applicationId is read by nothing, exactly like
        // its ios.bundleIdentifier. It is kept because somebody will look
        // there first, and this is what stops it going stale again.
        const app = JSON.parse(read('app.json'));
        expect(app.android.applicationId).toBe(APPLICATION_ID);
        expect(app.ios.bundleIdentifier).toBe(APPLICATION_ID);
        expect(app.name).toBe(APP_NAME);
        expect(read('IDENTITY.md')).toContain(APPLICATION_ID);
    });

    it('the gradle project is the game, not the throwaway project', () => {
        // ------------------------------------------------------------------
        //  THIS ASSERTION USED TO INCLUDE strings.xml app_name, AND THAT WAS
        //  A CONFLATION OF TWO DIFFERENT NAMES
        // ------------------------------------------------------------------
        //  SHELVED, left here because the mistake is worth seeing:
        //
        //      expect(read(`${ANDROID}/app/src/main/res/values/strings.xml`))
        //          .toContain(`<string name="app_name">${APP_NAME}</string>`);
        //
        //  `APP_NAME` is the AppRegistry component id and nothing else. It has
        //  to match MainActivity, which is what the test above is for. The
        //  launcher LABEL is a separate thing that has to match the two store
        //  listings, and both of those say "Successor" with the second s.
        //
        //  Holding them to one constant meant the home screen was pinned to a
        //  misspelling of the store's own name, and the test agreed with it.
        //  The label is now asserted in appIcons.test.ts, against the store
        //  name, and the two are deliberately allowed to differ.
        // ------------------------------------------------------------------
        expect(read(`${ANDROID}/settings.gradle`))
            .toContain(`rootProject.name = '${APP_NAME}'`);
    });

    it('and nothing anywhere still says SuccesorAndroid', () => {
        // The generated project names itself after the throwaway it came
        // from, in five places. Four are harmless and one is the white
        // screen. Rather than remember which, none of them survive.
        const walk = (dir: string, out: string[] = []): string[] => {
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                if (['build', '.gradle', '.cxx'].includes(e.name)) continue;
                const full = path.join(dir, e.name);
                if (e.isDirectory()) walk(full, out);
                else if (/\.(kt|java|gradle|xml|json|pro)$/.test(e.name)) out.push(full);
            }
            return out;
        };
        const offenders = walk(path.join(ROOT, ANDROID))
            .filter(f => /SuccesorAndroid|succesorandroid/.test(fs.readFileSync(f, 'utf8')))
            .map(f => path.relative(ROOT, f));
        expect(offenders).toEqual([]);
    });
});

describeAndroid('the things that fail without failing', () => {
    // ------------------------------------------------------------------
    //  EACH OF THESE BUILDS, LAUNCHES, RUNS, AND IS WRONG
    // ------------------------------------------------------------------
    //  None of them throws. None of them logs. All three look like a
    //  styling mistake from the sofa, which is the most expensive kind of
    //  bug to own because it sends you looking in the JavaScript.
    // ------------------------------------------------------------------

    it('async storage can find the engine it ships in its own package', () => {
        // ------------------------------------------------------------------
        //  THE ONE THAT DOES FAIL LOUDLY, AND STILL MISLEADS
        // ------------------------------------------------------------------
        //  Unlike the others in this block this one stops the build, but the
        //  message it stops with sends you the wrong way:
        //
        //      Could not find org.asyncstorage.shared_storage:storage-android
        //
        //  That reads as a missing repository or a network problem. It is
        //  neither. async-storage v3 does not publish that artifact to Maven
        //  Central; it ships inside the npm package as a small maven
        //  repository, and expects the project to declare the directory.
        //
        //  Pinned because the fix lives in a file nothing else reads, and
        //  because `npm install` can move the package without warning.
        // ------------------------------------------------------------------
        const local = 'node_modules/@react-native-async-storage/async-storage/android/local_repo';
        expect(fs.existsSync(path.join(ROOT, local,
            'org/asyncstorage/shared_storage/storage-android/1.0.0'))).toBe(true);
        expect(read(`${ANDROID}/build.gradle`)).toContain(local.replace('node_modules/', ''));
        expect(read(`${ANDROID}/build.gradle`))
            .toContain('includeGroup("org.asyncstorage.shared_storage")');
    });

    it('the icon fonts are copied in, or every icon is an empty square', () => {
        // iOS lists nineteen fonts in Info.plist under UIAppFonts. Android
        // has no equivalent list; they have to be copied into assets at
        // build time and this gradle file is what does it.
        expect(read(`${ANDROID}/app/build.gradle`))
            .toContain('react-native-vector-icons/fonts.gradle');
    });

    it('the splash theme is on the activity, or the app opens white', () => {
        // The splash is the window background the SYSTEM puts up before any
        // of our code runs, so it is a theme in the manifest rather than
        // anything React draws. Missing, the first thing the player sees is
        // a white rectangle.
        const manifest = read(`${ANDROID}/app/src/main/AndroidManifest.xml`);
        expect(manifest).toContain('android:theme="@style/BootTheme"');

        const styles = read(`${ANDROID}/app/src/main/res/values/styles.xml`);
        expect(styles).toContain('<style name="BootTheme" parent="Theme.BootSplash">');
        // Without this the activity keeps the splash theme all session and
        // AppTheme never applies.
        expect(styles).toContain('<item name="postBootSplashTheme">@style/AppTheme</item>');
    });

    it('and the native side is told to raise it', () => {
        const activity = read(
            `${ANDROID}/app/src/main/java/com/salihkilic/successor/MainActivity.kt`,
        );
        expect(activity).toContain('RNBootSplash.init(this, R.style.BootTheme)');
        // App.tsx hides it. If it is raised and never hidden the game is
        // behind a logo forever; if it is hidden and never raised the hide
        // is a no-op and the white rectangle is back.
        expect(read('App.tsx')).toContain('BootSplash.hide');
    });

    it('the launch ground is the colour iOS already uses', () => {
        // assets/bootsplash/manifest.json records what the iOS storyboard
        // was generated with, and is the source of truth for both. If the
        // two drift, the app flashes one colour on iOS and another on
        // Android for the same half second.
        const manifest = JSON.parse(read('assets/bootsplash/manifest.json'));
        const colors = read(`${ANDROID}/app/src/main/res/values/colors.xml`);
        expect(colors).toContain(
            `<color name="bootsplash_background">${manifest.background}</color>`);
    });

    it('and the logo is present at every density', () => {
        const missing = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']
            .filter(d => !fs.existsSync(path.join(
                ROOT, ANDROID, 'app/src/main/res', `drawable-${d}`, 'bootsplash_logo.png')));
        expect(missing).toEqual([]);
    });
});

describeAndroid('the release build is signed with a key Play will accept', () => {
    // ------------------------------------------------------------------
    //  THE LINE THAT KEPT THE PROJECT OFF THE STORE
    // ------------------------------------------------------------------
    //  React Native's template ships `release { signingConfig
    //  signingConfigs.debug }` with a comment warning you about it, and
    //  nothing ever enforces the warning. The build succeeds, the AAB
    //  appears where it is supposed to, and Play refuses it.
    //
    //  That is this repository's signature failure in a build file: a
    //  check that passes because it is not looking. Here is the look.
    // ------------------------------------------------------------------
    const gradle = () => read(`${ANDROID}/app/build.gradle`);

    /**
     * The release buildType block, without the signingConfigs above it, and
     * without its own comments.
     *
     * The comment stripping is not tidiness. The first run of this test failed
     * on the sentence explaining what the line used to say, exactly the way
     * the reachability audit once counted a hex colour quoted inside a JSX
     * comment. A test that reads source has to read the code, not the prose
     * about the code.
     */
    const releaseBuildType = (): string => {
        const src = gradle();
        const types = src.indexOf('buildTypes {');
        expect(types).toBeGreaterThan(-1);
        const start = src.indexOf('release {', types);
        expect(start).toBeGreaterThan(-1);
        return src.slice(start, src.indexOf('\n        }', start))
            .split('\n')
            .filter(line => !line.trim().startsWith('//'))
            .join('\n');
    };

    it('release does not reach for the debug key', () => {
        // Scoped to the release buildType on purpose. A file-wide
        // `not.toContain('signingConfigs.debug')` would be a lie: the
        // debug buildType uses it legitimately, so the assertion would
        // have to be deleted rather than kept, and a file-wide claim for
        // a block-level fact is how newGamePrompt.test.ts passed for the
        // wrong reason.
        expect(releaseBuildType()).not.toContain('signingConfigs.debug');
    });

    it('and uses the upload key instead', () => {
        expect(releaseBuildType()).toContain('signingConfig signingConfigs.release');
    });

    it('which reads its passwords from outside the repository', () => {
        const src = gradle();
        expect(src).toContain("project.hasProperty('SUCCESOR_UPLOAD_STORE_FILE')");
        for (const prop of [
            'SUCCESOR_UPLOAD_STORE_FILE',
            'SUCCESOR_UPLOAD_STORE_PASSWORD',
            'SUCCESOR_UPLOAD_KEY_ALIAS',
            'SUCCESOR_UPLOAD_KEY_PASSWORD',
        ]) {
            expect([prop, src.includes(prop)]).toEqual([prop, true]);
        }
    });

    it('and no committed file carries the value of any of them', () => {
        // ------------------------------------------------------------------
        //  THE ONE THAT CANNOT BE UNDONE BY FIXING IT
        // ------------------------------------------------------------------
        //  A password committed once is in the history forever, and the
        //  usual repair - change the password - does not apply here,
        //  because the key it protects is frozen by Play at first upload.
        //
        //  So this looks for an ASSIGNMENT, `SUCCESOR_..._PASSWORD=value`,
        //  rather than for the name. The names are supposed to be here;
        //  a value next to one is the accident.
        //
        //  NARROWED, AFTER IT FIRED ON ITS OWN INSTRUCTIONS
        //  ------------------------------------------------
        //  The first version also matched ALIAS and STORE_FILE, and went red
        //  the moment build.gradle's error message spelled out the four lines
        //  the user has to paste. That was the test being wrong, not the
        //  file: an alias and a filename are not secrets - both are readable
        //  straight out of the signed artifact - and a check that forbids
        //  printing them is a check that forbids the error message from
        //  being useful.
        //
        //  The password is the only one that cannot be printed, so it is the
        //  only one this looks for. `<...>` is excluded because that is the
        //  placeholder shape the message uses.
        // ------------------------------------------------------------------
        const committed = [
            `${ANDROID}/app/build.gradle`,
            `${ANDROID}/gradle.properties`,
            `${ANDROID}/build.gradle`,
            'gradle.properties',
        ].filter(f => fs.existsSync(path.join(ROOT, f)));

        const leaked = committed.filter(f =>
            /SUCCESOR_UPLOAD_[A-Z_]*PASSWORD\s*=\s*(?!<)\S/.test(read(f)));
        expect(leaked).toEqual([]);
    });

    it('the kotlin metadata gap is bridged for the ads module and nothing else', () => {
        // ------------------------------------------------------------------
        //  MEASURED FROM TWO FAILED BUILDS, NOT FROM A GUESS
        // ------------------------------------------------------------------
        //  play-services-ads 25.4.0 carries Kotlin metadata 2.3.0 and this
        //  project compiles with 2.1.20, which reads up to 2.2.
        //
        //  The first attempt raised `kotlinVersion` to 2.3.21. That property
        //  moves the stdlib COORDINATES, not the compiler - React Native's
        //  gradle plugin owns the Kotlin Gradle Plugin version - so it handed
        //  a 2.3 stdlib to a 2.1 compiler and five modules failed instead of
        //  one.
        //
        //  So two things are pinned here, and the second matters more than
        //  the first: the flag exists, AND it is confined to the advertising
        //  module. A future hand that lifts it to `allprojects` would be
        //  silencing the check for react-native-purchases too, and that is
        //  the module that takes money.
        // ------------------------------------------------------------------
        const gradle = read(`${ANDROID}/build.gradle`);
        expect(gradle).toContain('-Xskip-metadata-version-check');
        expect(gradle).toMatch(
            /subproject\.name == "react-native-google-mobile-ads"[\s\S]{0,200}-Xskip-metadata-version-check/,
        );

        // And the version that was tried and reverted stays reverted.
        expect(gradle).toContain('kotlinVersion = "2.1.20"');
    });

    it('and a missing password says so instead of throwing a null', () => {
        // ------------------------------------------------------------------
        //  MEASURED, NOT ASSUMED
        // ------------------------------------------------------------------
        //  The first real `./gradlew bundleRelease` on this project ended:
        //
        //      > Task :app:signReleaseBundle FAILED
        //      > java.lang.NullPointerException (no error message)
        //
        //  after four and a half minutes of compiling. No property name, no
        //  file name, no mention of signing at all. This pins the check that
        //  turns that into a sentence, and pins the two things that make the
        //  check safe: it reads the task GRAPH, so it cannot break a debug
        //  build, and it names the file the passwords actually go in.
        // ------------------------------------------------------------------
        const src = gradle();
        expect(src).toContain('gradle.taskGraph.whenReady');
        expect(src).toContain('throw new GradleException');
        expect(src).toContain('~/.gradle/gradle.properties');
    });

    it('and the key itself can never be added by accident', () => {
        // The file exists on his machine and must not exist in git. The
        // rule that catches it is `*.keystore`, with `!debug.keystore`
        // letting the one harmless key through.
        const ignore = read('.gitignore');
        expect(ignore).toContain('*.keystore');
        expect(ignore).toContain('!debug.keystore');
        // A re-include for the upload key would silently undo all of it.
        expect(ignore).not.toContain('!succesor-upload.keystore');
    });
});

describeAndroid('the launcher icon is wired and complete', () => {
    const RES = `${ANDROID}/app/src/main/res`;

    it('the manifest points at the two drawables that exist', () => {
        const manifest = read(`${RES}/../AndroidManifest.xml`);
        expect(manifest).toContain('android:icon="@mipmap/ic_launcher"');
        expect(manifest).toContain('android:roundIcon="@mipmap/ic_launcher_round"');
    });

    it('every density carries all four layers', () => {
        // Legacy square, round, and the two adaptive layers. A density that
        // is missing one does not fail the build; Android falls back to a
        // lower density and the icon goes soft on exactly the phones with
        // the best screens.
        const want = ['ic_launcher.png', 'ic_launcher_round.png',
            'ic_launcher_foreground.png', 'ic_launcher_background.png'];
        const missing: string[] = [];
        for (const d of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
            for (const f of want) {
                const p = path.join(ROOT, RES, `mipmap-${d}`, f);
                if (!fs.existsSync(p)) missing.push(`mipmap-${d}/${f}`);
            }
        }
        expect(missing).toEqual([]);
    });

    it('and the v26 xml that makes it adaptive at all', () => {
        // Without these two, Android 8 and up uses the legacy square and the
        // icon sits in a white rounded box on most launchers.
        for (const f of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
            const xml = read(`${RES}/mipmap-anydpi-v26/${f}`);
            expect(xml).toContain('<adaptive-icon');
            expect(xml).toContain('@mipmap/ic_launcher_foreground');
            expect(xml).toContain('@mipmap/ic_launcher_background');
        }
    });
});
