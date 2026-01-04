import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEventStore } from './useEventStore';
import { simulateNewMonth } from '../event/eventEngine';
import { zustandStorage } from '../storage/persist';
import { useStatsStore } from './useStatsStore';
import { useUserStore } from './useUserStore';
import { useLaboratoryStore } from './useLaboratoryStore';
import { useProductStore } from './useProductStore';
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
    reportTotalInventory: number; // NEW: Track total stock
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

        // 1. Mevcut İstatistikleri ve Ürünleri Çek
        const stats = useStatsStore.getState();
        const { products } = useProductStore.getState();
        const { researcherCount } = useLaboratoryStore.getState();

        // CRITICAL FIX: Default salary if not set
        const baseSalary = stats.monthlyIncome || 5000;
        const baseExpenses = stats.monthlyExpenses || 2000;

        // 2. DYNAMIC PRODUCT FINANCIALS (Per Quarter)
        // Calculate quarters passed (assuming 3 months = 1 quarter)
        const quarters = Math.floor(months / 3);

        // Initialize totals
        let totalRevenue = 0;
        let totalCOGS = 0;
        let totalProduction = 0;
        let totalSales = 0;
        let totalMarketingCost = 0;
        let totalStorageCost = 0;
        let totalBeginningStock = 0;
        let totalEndingStock = 0;

        // Loop through each active product and calculate financials
        const updatedProducts: any[] = [];
        products.forEach((product: any) => {
          if (product.status === 'active') {
            // Get actual cost and price (with R&D upgrades applied)
            const unitCost = product.unitCost ?? product.baseProductionCost;
            const sellingPrice = product.sellingPrice || product.suggestedPrice;
            const previousInventory = product.inventory || 0;
            totalBeginningStock += previousInventory;

            // 1. Calculate Real Production Volume
            const baseCapacityPerFactory = 1000000; // 1 Million units per factory
            const factoryCount = stats.factoryCount || 5;
            const maxProduction = product.maxProduction || (factoryCount * baseCapacityPerFactory);

            const utilizationRate = (product.productionLevel ?? 50) / 100; // Use ?? for 0%
            const quarterlyProduction = Math.floor(maxProduction * utilizationRate * quarters);

            // 2. INVENTORY FIRST SALES LOGIC
            // Total Supply = Existing Inventory + Quarterly Production
            const availableGoods = previousInventory + quarterlyProduction;

            // 3. Calculate Potential Sales
            const demandRate = (product.marketDemand || 50) / 100; // Base Demand
            const marketingSpend = product.marketingSpendPerUnit || 0;

            // Organic Sales (15% baseline even with $0 spend)
            const organicFactor = 0.15;

            // DYNAMIC MARKETING EFFICIENCY (The 30% Rule)
            // Saturation Point = Price * 0.30 (Minimum $1 to avoid division by zero)
            const saturationPoint = Math.max(1, sellingPrice * 0.30);

            // Efficiency based on Saturation Point
            const efficiency = Math.min(1, marketingSpend / saturationPoint);

            // Final Sales Rate (0.15 to 1.0 range)
            const finalSalesRate = organicFactor + (0.85 * efficiency);

            // Potential Sales based on AVAILABLE GOODS (Inventory + Production)
            const potentialSales = Math.floor(availableGoods * demandRate * finalSalesRate);

            // Actual Sales: Cannot sell more than available
            const quarterlySales = Math.min(availableGoods, potentialSales);

            // 4. Update Inventory (New Inventory = Total - Sales)
            const newInventory = availableGoods - quarterlySales;
            totalEndingStock += newInventory;

            // DEBUG LOGGING
            console.log(`[Product: ${product.name}] Stock: ${previousInventory}, Prod: ${quarterlyProduction}, Total: ${availableGoods}, Sales: ${quarterlySales}, NewStock: ${newInventory}`);

            // 5. Costs & Revenue
            // Storage costs: $5 per unit in NEW inventory
            const storageCost = newInventory * 5 * quarters;

            // Marketing Costs (per unit sold)
            const marketingCost = quarterlySales * marketingSpend;

            // Revenue & COGS
            const productRevenue = sellingPrice * quarterlySales;
            const productCOGS = unitCost * quarterlyProduction; // COGS applies to PRODUCTION only

            totalRevenue += productRevenue;
            totalCOGS += productCOGS;
            totalProduction += quarterlyProduction;
            totalSales += quarterlySales;
            totalMarketingCost += marketingCost;
            totalStorageCost += storageCost;

            // Update product with new inventory
            updatedProducts.push({
              ...product,
              inventory: newInventory
            });
          } else {
            updatedProducts.push(product);
          }
        });

        // Update products in store with new inventory levels
        updatedProducts.forEach((updatedProduct) => {
          if (updatedProduct.inventory !== undefined) {
            useProductStore.getState().updateProduct(updatedProduct.id, { inventory: updatedProduct.inventory });
          }
        });

        // 3. FACTORY OVERHEAD (Corporate Fixed Costs)
        const OVERHEAD_PER_FACTORY = 30000000; // $30M per factory per quarter
        const factoryOverhead = (stats.factoryCount || 5) * OVERHEAD_PER_FACTORY * quarters;

        // 3. R&D LABORATORY COSTS (Updated to $500k per researcher)
        const RESEARCHER_SALARY_PER_QUARTER = 500000;
        const rndSalaryCost = researcherCount * RESEARCHER_SALARY_PER_QUARTER * quarters;

        // Process RP generation for each quarter
        let rndRPGenerated = 0;
        if (quarters > 0) {
          for (let i = 0; i < quarters; i++) {
            const { rpAwarded } = useLaboratoryStore.getState().processQuarter(() => { });
            rndRPGenerated += rpAwarded;
          }
          console.log(`[Game] R&D Results: Generated ${rndRPGenerated} RP, Cost $${rndSalaryCost}`);
        }

        // 4. OTHER EXPENSES
        const monthlyFixedExpenses = 5000;
        const totalFixedExpenses = monthlyFixedExpenses * months;
        const interestExpense = (stats.companyDebtTotal || 0) * 0.05 * (months / 12);

        // 5. CALCULATE NET PROFIT/LOSS
        const totalExpenses = totalCOGS + totalMarketingCost + totalStorageCost + factoryOverhead + rndSalaryCost + totalFixedExpenses + interestExpense;
        const netProfit = totalRevenue - totalExpenses;

        // 6. UPDATE CAPITAL
        const newCompanyCapital = (stats.companyCapital || 0) + netProfit;

        // 7. PLAYER FINANCIALS (Simplified)
        const playerIncome = baseSalary * months;
        const playerExpenses = baseExpenses * months;
        const newPlayerCash = (stats.money || 0) + playerIncome - playerExpenses;

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
          companyCapital: newCompanyCapital,
          money: newPlayerCash,
          monthlyIncome: baseSalary, // Keep the salary consistent
          monthlyExpenses: baseExpenses,
          // Basit valuation mantığı: Sermaye * 1.5 (İleride geliştirebilirsin)
          companyValue: newCompanyCapital * 1.5,
          // Calculate net worth: cash + company ownership value
          netWorth: newPlayerCash + (newCompanyCapital * 1.5 * (stats.companyOwnership / 100))
        });

        console.log('[Game] Store updated with new values:', {
          cash: newPlayerCash,
          capital: newCompanyCapital,
          income: baseSalary,
          revenue: totalRevenue,
          expenses: {
            total: totalExpenses,
            cogs: totalCOGS,
            marketing: totalMarketingCost,
            storage: totalStorageCost,
            factoryOverhead: factoryOverhead,
            rnd: rndSalaryCost,
            fixed: totalFixedExpenses
          },
          netProfit: netProfit
        });

        // 6. Yan Etkileri Tetikle (Eventler vs.)
        simulateNewMonth();

        import('../achievements/checker').then(mod => {
          mod.checkAllAchievementsAfterStateChange();
        });

        // 7. Sonucu UI'ın beklediği formatta döndür
        const result: EconomyResult = {
          status: newCompanyCapital < 0 ? 'bankrupt' : 'active',
          reason: newCompanyCapital < 0 ? 'Company capital is negative' : undefined,
          data: {
            // Rapor verileri (Dynamic calculations)
            reportTotalProduction: totalProduction,
            reportTotalSales: totalSales,
            reportTotalRevenue: totalRevenue,
            reportTotalExpenses: totalExpenses,
            reportNetProfit: netProfit,
            reportTotalInventory: totalEndingStock, // NEW: Stock tracking

            // Güncel Bakiye Verileri
            playerCash: newPlayerCash,
            companyCapital: newCompanyCapital,

            // Diğerleri (Stats store'dan veya hesaplamadan)
            playerNetWorth: newPlayerCash + (newCompanyCapital * 1.5 * (stats.companyOwnership / 100)),
            playerIncome: baseSalary, // FIXED: Return the actual salary used
            playerExpenses: baseExpenses,
            companyValuation: newCompanyCapital * 1.5
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