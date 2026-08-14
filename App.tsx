import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BootSplash from 'react-native-bootsplash';
import RootNavigator from './src/navigation/RootNavigator';
import { useStatsStore } from './src/core/store/useStatsStore';
import { useGameStore } from './src/core/store/useGameStore';

const App = () => {
  // Sadece kritik store'ların yüklenmesi yeterli (diğerleri de onlarla aynı anda store'dan çıkacak)
  const statsHydrated = useStatsStore(state => state._hasHydrated);
  const gameHydrated = useGameStore(state => state._hasHydrated);

  const isFullyHydrated = statsHydrated && gameHydrated;

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
