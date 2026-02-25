import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import RootNavigator from './src/navigation/RootNavigator';
import { useStatsStore } from './src/core/store/useStatsStore';
import { useGameStore } from './src/core/store/useGameStore';
import { readFromMMKV, debouncedWriteToMMKV } from './src/storage/manualPersist';

const App = () => {
  useEffect(() => {
    // =============================================
    // 1. STARTUP: MMKV'den state'i geri yükle
    // =============================================
    const saved = readFromMMKV();
    if (saved) {
      console.log('[App] Restoring state from MMKV. Money:', saved.money);
      useStatsStore.getState().update({
        money: saved.money,
        netWorth: saved.netWorth,
        companyCapital: saved.companyCapital,
        companyValue: saved.companyValue,
        companyOwnership: saved.companyOwnership,
        companyDebtTotal: saved.companyDebtTotal,
        factoryCount: saved.factoryCount,
        employeeCount: saved.employeeCount,
      });
      useGameStore.getState().setField('currentMonth', saved.currentMonth);
      useGameStore.getState().setField('age', saved.age);
    }

    // =============================================
    // 2. SUBSCRIBE: State değişince MMKV'ye yaz
    // =============================================
    const unsubscribeStats = useStatsStore.subscribe((state) => {
      debouncedWriteToMMKV({
        money: state.money,
        netWorth: state.netWorth,
        companyCapital: state.companyCapital,
        companyValue: state.companyValue,
        companyOwnership: state.companyOwnership,
        companyDebtTotal: state.companyDebtTotal,
        factoryCount: state.factoryCount,
        employeeCount: state.employeeCount,
        currentMonth: useGameStore.getState().currentMonth,
        age: useGameStore.getState().age,
      });
    });

    const unsubscribeGame = useGameStore.subscribe((state) => {
      const stats = useStatsStore.getState();
      debouncedWriteToMMKV({
        money: stats.money,
        netWorth: stats.netWorth,
        companyCapital: stats.companyCapital,
        companyValue: stats.companyValue,
        companyOwnership: stats.companyOwnership,
        companyDebtTotal: stats.companyDebtTotal,
        factoryCount: stats.factoryCount,
        employeeCount: stats.employeeCount,
        currentMonth: state.currentMonth,
        age: state.age,
      });
    });

    // =============================================
    // 3. Splash screen'i gizle
    // =============================================
    const hideSplash = async () => {
      await BootSplash.hide({ fade: true });
    };
    hideSplash();

    return () => {
      unsubscribeStats();
      unsubscribeGame();
    };
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <RootNavigator />
    </>
  );
};

export default App;
