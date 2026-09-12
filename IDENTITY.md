# What this app is called, and where each name really lives

Written down because there were three answers and two of them were wrong,
and because one of the two is about to become permanent on Google Play.

## The decision

```
applicationId / bundle id     com.salihkilic.successor
app name shown under the icon Succesor
```

`com.salihkilic.successor` is the identifier that has actually been shipping
to the App Store since the beginning. It is in `ios/Succesor.xcodeproj`, it is
what App Store Connect knows, and it cannot be changed there either. So it is
the one the Android side adopts as well, rather than the two platforms living
under different names for no reason.

Note the spelling is deliberately inconsistent and has to stay that way: the
app is `Succesor` with one s, the identifier is `successor` with two. Neither
can be corrected now without abandoning the listing.

## Where each name is actually read

This is the part that cost the confusion. Four files say something about the
app's identity and only two of them are read by anything.

| File | Field | Read by |
| --- | --- | --- |
| `ios/Succesor.xcodeproj/project.pbxproj` | `PRODUCT_BUNDLE_IDENTIFIER` | **Xcode. This is the one that ships on iOS.** |
| `android/app/build.gradle` | `applicationId` | **Gradle. This is the one that ships on Android.** |
| `app.json` | `name`, `displayName` | the React Native CLI |
| `app.json` | `ios.bundleIdentifier`, `android.applicationId` | **nothing** |

The last row is the trap. `ios.bundleIdentifier` in `app.json` is an Expo
convention and a bare React Native project does not read it. It sat there
saying `com.salih115.succesor` while the app shipped as
`com.salihkilic.successor`, and nothing anywhere disagreed out loud.

The house name for this failure is correct data that nothing reads. This was
its mirror image: WRONG data that nothing reads, which is worse, because the
next person to need the identifier finds it, believes it, and is wrong.

It now says the truth. It is still read by nothing, and it is kept rather than
deleted for exactly one reason: somebody will look there first.

## The URL scheme is a third value and it is NOT the same

`ios/Succesor/Info.plist` registers `com.salih115.succesor` as a
`CFBundleURLScheme`. That one IS live: it is what a deep link into the app
uses. It does not have to match the bundle identifier and changing it would
break any link already in the wild.

So three strings, and they are not all the same on purpose:

```
com.salihkilic.successor   what the stores know          iOS + Android
com.salih115.succesor      what a deep link uses         iOS URL scheme
Succesor                   what the player reads         both
```

## Before the first Play Store upload

`applicationId` is frozen by Google Play at the first upload. After that the
only way to change it is a new listing with no reviews, no ranking and no
installs. Check `android/app/build.gradle` one more time before that upload.
