import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BootSplash from 'react-native-bootsplash';
import RootNavigator from './src/navigation/RootNavigator';
import { warmUpStorage } from './src/storage/warmUp';

const App = () => {
  // ==========================================================================
  //  EVERY SAVE, NOT TWO OF THEM
  // ==========================================================================
  //  SHELVED, and the comment on it was the bug:
  //
  //    // Sadece kritik store'larin yuklenmesi yeterli
  //    // (digerleri de onlarla ayni anda store'dan cikacak)
  //    const statsHydrated = useStatsStore(state => state._hasHydrated);
  //    const gameHydrated = useGameStore(state => state._hasHydrated);
  //    const isFullyHydrated = statsHydrated && gameHydrated;
  //
  //  They do not come out at the same time. A store starts reading when it is
  //  CREATED, and half of them are created by a lazy `require` inside the
  //  quarter tick - so their first read began in the same pass as their first
  //  write, and the write was dropped.
  //
  //  Measured on a device: launch, press Next Quarter within about a second,
  //  and that quarter's territory, sponsorship, casino risk, achievements and
  //  subsidiaries are all discarded. Thirty dropped writes in one tick.
  //
  //  `warmUpStorage` imports every persisted store, which is what starts the
  //  reads, and resolves when all of them have landed. See storage/warmUp.ts.
  // ==========================================================================
  const [isFullyHydrated, setFullyHydrated] = React.useState(false);

  useEffect(() => {
    let alive = true;
    warmUpStorage().then(() => { if (alive) setFullyHydrated(true); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    // Sadece HER ŞEY yüklendiğinde splash screen'i gizle
    if (isFullyHydrated) {
      const hideSplash = async () => {
        setTimeout(async () => {
          await BootSplash.hide({ fade: true });
        }, 2000);
      };
      hideSplash();
    }
  }, [isFullyHydrated]);

  // Hydration bitene kadar UI ÇİZİLMESİN. 
  // Eski state'in üzerine yazılmasını engelleyen en kritik satır burasıdır.
  if (!isFullyHydrated) {
    return null; // Bootsplash arkada kalmaya devam eder
  }

  // ==========================================================================
  //  SafeAreaProvider BELONGS HERE, AND HAD BEEN MISSING ALL ALONG
  // ==========================================================================
  //  `useSafeAreaInsets` throws without a provider above it, and the app has
  //  been calling it from ScreenHeader on every screen. It worked because
  //  react-navigation mounts its own SafeAreaProviderCompat INSIDE the
  //  navigator - so every screen had one by accident of where it happened to
  //  be rendered, not because the app supplied it.
  //
  //  The onboarding gate is the first thing that renders ABOVE the navigator,
  //  and it fell straight through the hole: "No safe area value available."
  //  The gate is not the bug; it is the first caller that was outside the
  //  accident.
  //
  //  The library's own instruction is to mount this once at the top of the
  //  app, which is what this is. Navigation's compat provider detects an
  //  existing one and steps aside, so nothing below changes.
  // ==========================================================================
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#1C242C' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1C242C" />
      <RootNavigator />
    </SafeAreaProvider>
  );
};

export default App;
