import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: RCTAppDelegate {
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    self.moduleName = "Succesor" // Proje adın burasıyla aynı olmalı
    self.dependencyProvider = RCTAppDependencyProvider()

    // Başlangıç parametreleri (gerekirse buraya eklenir)
    self.initialProps = [:]

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    return self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
      // Metro Bundler'a bağlan (index.js üzerinden)
      return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
      // Release modunda paketlenmiş dosyayı kullan
      return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
