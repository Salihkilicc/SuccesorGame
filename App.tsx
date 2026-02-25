import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
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
        await BootSplash.hide({ fade: true });
      };
      hideSplash();
    }
  }, [isFullyHydrated]);

  // Hydration bitene kadar UI ÇİZİLMESİN. 
  // Eski state'in üzerine yazılmasını engelleyen en kritik satır burasıdır.
  if (!isFullyHydrated) {
    return null; // Bootsplash arkada kalmaya devam eder
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <RootNavigator />
    </>
  );
};

export default App;
