package com.salihkilic.successor

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.zoontek.rnbootsplash.RNBootSplash

class MainActivity : ReactActivity() {

  /**
   * The name JavaScript registered.
   *
   * This has to be byte for byte what index.js passes to
   * AppRegistry.registerComponent. If the two disagree the app does not crash
   * and does not warn: it opens a white screen and stays there, and nothing
   * in the log says which of the two names is wrong.
   *
   * The generated project ships this as the name of the throwaway it was made
   * from, so it is wrong by default on day one of every port.
   *
   * src/core/androidBoot.test.ts reads this file and index.js and compares
   * them as a pair, because seeing only one side is what makes this cost an
   * evening.
   */
  override fun getMainComponentName(): String = "Succesor"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * The launch screen, and the null that is not a typo.
   *
   * `super.onCreate(null)` rather than passing `savedInstanceState` through,
   * and that is the documented form for react-native-screens BELOW v4.16.0.
   * This project is on 4.15.0, checked rather than assumed.
   *
   * The reason is fragment restoration: when Android rebuilds the activity it
   * hands back a saved state describing fragments that the new React tree has
   * not created yet, and the restore lands on nothing. Dropping the state
   * makes the rebuild start clean.
   *
   * IF react-native-screens IS EVER UPGRADED TO 4.16 OR ABOVE, this changes:
   * the state is passed through again and a RNScreensFragmentFactory is set
   * on the fragment manager instead. Leaving this line as it is after that
   * upgrade is not a crash, it is a saved-state bug that only shows up when
   * the system kills the app in the background.
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(null)
  }
}
