// src/core/appVersion.ts
//
// ============================================================================
//  WHICH BUILD IS THIS
// ============================================================================
//
//  Settings has always shown "Successor OS v1.0.0", hard-coded in the i18n
//  file. It said that on versionCode 1 and it still said it on 5. So the one
//  screen a person looks at to answer "am I running the fixed build" could not
//  answer it, and the question came up repeatedly during the purchase work:
//  a fix would ship, the old binary would still be on the device, and the two
//  were indistinguishable without `adb shell dumpsys`.
//
//  ---------------------------------------------------------------------------
//  WHY THE CODE IS SHOWN AS WELL AS THE NAME
//  ---------------------------------------------------------------------------
//  versionName does not move on every upload. It is for people, and two
//  uploads of identical content share one. versionCode moves on EVERY upload
//  and is consumed by the upload rather than by the release, so a bundle that
//  was sent and abandoned still burns its number.
//
//  That means the code is the only thing that identifies a particular binary,
//  and it is the one somebody needs when a device is behaving like yesterday.
//
//  ---------------------------------------------------------------------------
//  THE TWO PLATFORMS DO NOT SHARE A NUMBER
//  ---------------------------------------------------------------------------
//  The first version of this file had one pair of constants taken from
//  android/app/build.gradle, and iOS showed them too. On an iPhone the About
//  row therefore read "v1.0.3 (6)" while Info.plist said 0.0.1 (1): a version
//  row that names a build which is not the one running is worse than no
//  version row, because somebody will believe it and go looking in the wrong
//  place. That is exactly the failure this file was written to end.
//
//  Android's build number and Apple's are independent counters that advance
//  for different reasons, so they are kept separate and both are pinned.
//
//  ---------------------------------------------------------------------------
//  WHY THESE ARE CONSTANTS AND NOT READ FROM THE NATIVE SIDE
//  ---------------------------------------------------------------------------
//  Reading BuildConfig.VERSION_NAME and CFBundleVersion needs a native module
//  or a dependency, for four strings. The cheaper arrangement is to keep them
//  here and PROVE they agree with build.gradle and Info.plist in a test, which
//  is the same thing androidBoot.test.ts already does for the application id.
//
//  A copy that can drift silently would be worse than no copy at all, since it
//  would confidently name the wrong build. appVersion.test.ts is what makes
//  that impossible: change one and the suite goes red naming the other.
// ============================================================================

import { Platform } from 'react-native';

/** Must equal `versionName` in android/app/build.gradle. */
export const ANDROID_VERSION_NAME = '1.0.4';

/** Must equal `versionCode` in android/app/build.gradle. */
export const ANDROID_VERSION_CODE = 7;

/** Must equal `CFBundleShortVersionString` in ios/Succesor/Info.plist. */
export const IOS_VERSION_NAME = '1.0.4';

/**
 * Must equal `CFBundleVersion` in ios/Succesor/Info.plist.
 *
 * A STRING, not a number, and not compared to Android's. Apple's build number
 * is allowed to be "1", "1.2" or "1.2.3", it starts again at 1 for a new
 * marketing version if you want it to, and nothing has been uploaded to
 * TestFlight yet. Starting at 1 here is honest rather than tidy: making it
 * match Android's 6 would claim five uploads that never happened.
 */
export const IOS_BUILD_NUMBER = '2';

/** The marketing version of whichever platform this is running on. */
export const appVersionName = (): string =>
    Platform.OS === 'android' ? ANDROID_VERSION_NAME : IOS_VERSION_NAME;

/** The build number of whichever platform this is running on. */
export const appBuildNumber = (): string =>
    Platform.OS === 'android' ? String(ANDROID_VERSION_CODE) : IOS_BUILD_NUMBER;

/** What the About row shows. "1.0.4 (7)" on Android, "1.0.4 (2)" on iOS. */
export const appVersionLabel = (): string =>
    `${appVersionName()} (${appBuildNumber()})`;
