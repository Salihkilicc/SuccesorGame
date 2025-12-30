import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEventStore } from './useEventStore';
import { simulateNewMonth } from '../event/eventEngine';
import { zustandStorage } from '../storage/persist';
import { useStatsStore } from './useStatsStore';
import { useUserStore } from './useUserStore';
import { simulateEconomy } from '../logic/EconomyEngine'; // <--- YENİ MOTOR

// UI Tarafının beklediği sonuç tipi
export type EconomyResult = {
  status: 'active' | 'bankrupt';
  reason?: string;
  data: {
    reportTotalProduction: number;
    reportTotalSales: number;
    reportTotalRevenue: number;
    reportTotalExpenses: number;
    reportNetProfit: number;
    playerCash: number;
    companyCapital: number;
    playerNetWorth: number;
    playerIncome: number;
    playerExpenses: number;
    companyValuation: number;
  };
};

export type GameState = {
  currentMonth: number;
  age: number;
  actionsUsedThisMonth: number;
  maxActionsPerMonth: number;
};

type GameStore = GameState & {
  setField: <K extends keyof GameState>(key: K, value: GameState[K]) => void;
  resetMonthlyState: () => void;
  advanceMonth: (months?: number) => Promise<EconomyResult>;
  resetGame: () => Promise<void>;
};

export const initialGameState: GameState = {
  currentMonth: 1,
  age: 18,
  actionsUsedThisMonth: 0,
  maxActionsPerMonth: 999,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialGameState,
      setField: (key, value) => set(state => ({ ...state, [key]: value })),
      resetMonthlyState: () => {
        const { resetCycleFlags } = useEventStore.getState();
        resetCycleFlags();
        set(state => ({ ...state, actionsUsedThisMonth: 0 }));
        console.log('[Game] Monthly state reset (placeholder)');
      },
      advanceMonth: async (monthsInput?: number) => {
        // Input güvenliği (Varsayılan 3 ay)
        const months = typeof monthsInput === 'number' ? monthsInput : 3;

        // 1. Mevcut İstatistikleri Çek
        const stats = useStatsStore.getState();

        // CRITICAL FIX: Default salary if not set
        const baseSalary = stats.monthlyIncome || 5000;
        const baseExpenses = stats.monthlyExpenses || 2000;

        // 2. Saf TypeScript Motorunu Çalıştır (Swift Yok!)
        const simulationResult = simulateEconomy({
          companyCapital: stats.companyCapital || 0,
          productStock: 0, // Basitlik için her ay stok sıfırlanıyor varsayıyoruz
          productionCostPerUnit: 50,
          salesPricePerUnit: 80,
          monthlyFixedExpenses: 5000,
          companyDebt: stats.companyDebtTotal || 0,
          interestRate: 0.05,
          playerCash: stats.money || 0,
          playerSalary: baseSalary, // FIXED: Use default if 0
          playerExpenses: baseExpenses,
          factoryCount: stats.factoryCount || 5,
          employeeCount: stats.employeeCount || 100,
          productionLevel: stats.productionLevel || 2000
        }, months);

        const { newState, report } = simulationResult;

        // 3. Tarihi İlerlet
        const { currentMonth, age } = get();
        let newMonth = currentMonth + months;
        let newAge = age;

        while (newMonth > 12) {
          newMonth -= 12;
          newAge += 1;
        }

        set(state => ({
          ...state,
          currentMonth: newMonth,
          age: newAge,
          actionsUsedThisMonth: 0,
        }));
        console.log(`[Game] Advanced ${months} months. New Date: Month ${newMonth}, Age ${newAge}`);

        // 4. Aylık Flagleri Sıfırla
        get().resetMonthlyState();

        // 5. Store'ları Güncelle (Yeni verileri kaydet)
        // CRITICAL FIX: Use update() instead of setState() to preserve other fields
        useStatsStore.getState().update({
          companyCapital: newState.companyCapital,
          money: newState.playerCash,
          monthlyIncome: baseSalary, // Keep the salary consistent
          monthlyExpenses: baseExpenses,
          // Basit valuation mantığı: Sermaye * 1.5 (İleride geliştirebilirsin)
          companyValue: newState.companyCapital * 1.5,
          // Calculate net worth: cash + company ownership value
          netWorth: newState.playerCash + (newState.companyCapital * 1.5 * (stats.companyOwnership / 100))
        });

        console.log('[Game] Store updated with new values:', {
          cash: newState.playerCash,
          capital: newState.companyCapital,
          income: baseSalary
        });

        // 6. Yan Etkileri Tetikle (Eventler vs.)
        simulateNewMonth();

        import('../achievements/checker').then(mod => {
          mod.checkAllAchievementsAfterStateChange();
        });

        // 7. Sonucu UI'ın beklediği formatta döndür
        const result: EconomyResult = {
          status: report.isBankrupt ? 'bankrupt' : 'active',
          reason: report.bankruptcyReason,
          data: {
            // Rapor verileri
            reportTotalProduction: report.productionCount,
            reportTotalSales: report.salesCount,
            reportTotalRevenue: report.revenue,
            reportTotalExpenses: report.totalExpenses,
            reportNetProfit: report.netProfit,

            // Güncel Bakiye Verileri
            playerCash: newState.playerCash,
            companyCapital: newState.companyCapital,

            // Diğerleri (Stats store'dan veya hesaplamadan)
            playerNetWorth: newState.playerCash + (newState.companyCapital * 1.5 * (stats.companyOwnership / 100)),
            playerIncome: baseSalary, // FIXED: Return the actual salary used
            playerExpenses: baseExpenses,
            companyValuation: newState.companyCapital * 1.5
          }
        };

        console.log('[Game] Returning result to UI:', result);

        return result;
      },
      resetGame: async () => {
        useStatsStore.getState().reset();
        useUserStore.getState().reset();
        useEventStore.getState().reset();
        set(() => ({ ...initialGameState }));

        // NativeEconomy.restartGame() KALDIRILDI çünkü artık yok.

        await zustandStorage.removeItem('succesor_stats_v1');
        await zustandStorage.removeItem('succesor_user_v1');
        await zustandStorage.removeItem('succesor_game_v1');
        await zustandStorage.removeItem('succesor_game_v2');
        console.log('[Game] Full game reset complete');
      },
    }),
    {
      name: 'succesor_game_v2',
      storage: createJSONStorage(() => zustandStorage),
      partialize: state => ({
        currentMonth: state.currentMonth,
        age: state.age,
      }),
    },
  ),
);