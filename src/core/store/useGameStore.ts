import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { simulateNewMonth } from '../../event/eventEngine';
import { calculateQuarterlyFinances } from '../../features/assets/logic/EconomyEngine';
import { applyPartnerBuffs } from '../../logic/relationshipLogic';
import { calculateStatDecay } from '../../logic/statsLogic';
import { zustandStorage } from '../../storage/persist';
import { useEventStore } from './useEventStore';
import { useLaboratoryStore } from './useLaboratoryStore';
import { useMarketStore } from './useMarketStore';
import { usePlayerStore } from './usePlayerStore';
import { useProductStore } from './useProductStore';
import { useStatsStore } from './useStatsStore';
import { useUserStore } from './useUserStore';

const LOW_MORALE_REASONS = [
  "Factory strikes halted production for 3 days.",
  "Quality control sabotage detected in Batch #404.",
  "Employees staged a 'slow-down' protest.",
  "High absenteeism caused shipping delays.",
  "Key engineers resigned, causing workflow chaos.",
  "Leaked internal memos damaged brand reputation.",
  "Unmotivated support staff ignored customer orders.",
  "Warehouse theft resulted in missing inventory.",
  "Production errors increased due to lack of focus.",
  "Disgruntled staff disrupted the supply chain.",
  "Critical machinery was left unmaintained.",
  "Union representatives blocked delivery trucks.",
  "Data entry errors caused massive order cancellations.",
  "Safety protocols were ignored, causing a shutdown.",
  "Staff walkout during peak hours slashed output."
];

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
    reportCurrentRP: number;
    operationalSetback: boolean;
    setbackMessage: string;
    lostRevenue: number;
    lostUnits: number;
    playerCash: number;
    companyCapital: number;
    playerNetWorth: number;
    playerIncome: number;
    playerExpenses: number;
    companyValuation: number;
    productBreakdown: {
      id: string;
      name: string;
      produced: number;
      sold: number;
      revenue: number;
      expense: number;
      profit: number;
      stock: number;
    }[];
  };
};

export type GameState = {
  currentMonth: number;
  age: number;
  actionsUsedThisMonth: number;
  maxActionsPerMonth: number;
  // Employee Management
  employeeMorale: number; // 0-100
  salaryPolicy: 'low' | 'avg' | 'high';
  eventsHostedThisQuarter: number;
  lastQuarterProfit: number;
  bonusDistributedThisQuarter: boolean;
};

type GameStore = GameState & {
  setField: <K extends keyof GameState>(key: K, value: GameState[K]) => void;
  resetMonthlyState: () => void;
  advanceMonth: (months?: number) => Promise<EconomyResult>;
  resetGame: () => Promise<void>;
  // Employee Actions
  distributeBonus: () => void;
  organizeEvent: (cost: number, boost: number) => void;
  setSalaryPolicy: (policy: 'low' | 'avg' | 'high') => void;
};

export const initialGameState: GameState = {
  currentMonth: 1,
  age: 25, // Beta Start Age
  actionsUsedThisMonth: 0,
  maxActionsPerMonth: 999,
  employeeMorale: 85, // Slightly higher for beta positive start
  salaryPolicy: 'avg',
  eventsHostedThisQuarter: 0,
  lastQuarterProfit: 0,
  bonusDistributedThisQuarter: false,
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
        let totalLostUnits = 0;
        let totalLostRevenue = 0;
        let operationalSetback = false;
        let setbackMessage = '';

        // MORALE CHECK
        // Get morale directly, if < 50 calc penalty
        const currentMorale = get().employeeMorale;
        let penaltyRatio = 0;
        if (currentMorale < 50) {
          penaltyRatio = ((50 - currentMorale) / 50) * 0.35;
          operationalSetback = true;
          // Select random reason
          setbackMessage = LOW_MORALE_REASONS[Math.floor(Math.random() * LOW_MORALE_REASONS.length)];
        }

        // Loop through each active product and calculate financials
        const updatedProducts: any[] = [];
        const productBreakdownList: {
          id: string;
          name: string;
          produced: number;
          sold: number;
          revenue: number;
          expense: number;
          profit: number;
          stock: number;
        }[] = [];

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
            // COMPLEXITY-BASED PRODUCTION FORMULA
            // More complex products require more time/resources to build
            const BASE_OUTPUT = 500;
            const complexity = product.complexity || 50; // Default to 50 if not set
            const rawProduction = (stats.employeeCount * BASE_OUTPUT) / complexity;
            const maxProduction = Math.floor(rawProduction);

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

            // Apply Morale Penalty
            let actualPotentialSales = potentialSales;
            if (penaltyRatio > 0) {
              const lost = Math.floor(potentialSales * penaltyRatio);
              totalLostUnits += lost;
              totalLostRevenue += (lost * sellingPrice);
              actualPotentialSales = potentialSales - lost;
            }

            // Actual Sales: Cannot sell more than available
            const quarterlySales = Math.min(availableGoods, actualPotentialSales);

            // 4. Update Inventory (New Inventory = Total - Sales)
            const newInventory = availableGoods - quarterlySales;
            totalEndingStock += newInventory;

            // DEBUG LOGGING


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

            // Add to breakdown list
            const productProfit = productRevenue - (productCOGS + marketingCost + storageCost);
            productBreakdownList.push({
              id: product.id,
              name: product.name,
              produced: quarterlyProduction, // CORRECTED: Use this product's quarterly production
              sold: quarterlySales,
              revenue: productRevenue,
              expense: (productCOGS + marketingCost + storageCost),
              profit: productProfit,
              stock: newInventory
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
        const OVERHEAD_PER_FACTORY = 5000; // $5k per factory per quarter
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

        }


        // 4. OTHER EXPENSES
        const monthlyFixedExpenses = 5000;
        const totalFixedExpenses = monthlyFixedExpenses * months;
        const interestExpense = (stats.companyDebtTotal || 0) * 0.05 * (months / 12);

        // 4b. PARTNER UPKEEP COST (Deep Persona System)
        const partner = useUserStore.getState().partner;
        let partnerUpkeepCost = 0;

        // Check if partner has the new Deep Persona structure
        if (partner && 'finances' in partner && 'monthlyCost' in (partner as any).finances) {
          partnerUpkeepCost = (partner as any).finances.monthlyCost * months;

        }

        // 5. CALCULATE NET PROFIT/LOSS
        const totalExpenses = totalCOGS + totalMarketingCost + totalStorageCost + factoryOverhead + rndSalaryCost + totalFixedExpenses + interestExpense;
        const netProfit = totalRevenue - totalExpenses;

        // 6. UPDATE CAPITAL
        const newCompanyCapital = (stats.companyCapital || 0) + netProfit;

        // 7. PLAYER FINANCIALS (Using Quarterly Economy Engine)
        // Calculate quarterly finances once and apply to player cash
        const quarterlyReport = calculateQuarterlyFinances(
          useUserStore.getState(),
          useMarketStore.getState(),
          useStatsStore.getState()
        );

        // Apply Net Flow to Cash
        const newPlayerCash = (stats.money || 0) + quarterlyReport.netFlow;




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



        // 6. Yan Etkileri Tetikle (Eventler vs.)
        simulateNewMonth();

        import('../../achievements/checker').then(mod => {
          mod.checkAllAchievementsAfterStateChange();
        });

        // 7. QUARTERLY MORALE LOGIC
        if (months >= 3) {
          const state = get();
          let newMorale = state.employeeMorale;

          // Natural Decay (-5)
          newMorale -= 5;

          // Salary Policy Impact
          if (state.salaryPolicy === 'high') newMorale += 15;
          if (state.salaryPolicy === 'low') newMorale -= 15;

          // Clamp (0-100)
          newMorale = Math.max(0, Math.min(100, newMorale));

          set(state => ({
            ...state,
            employeeMorale: newMorale,
            eventsHostedThisQuarter: 0,
            lastQuarterProfit: netProfit,
            bonusDistributedThisQuarter: false,
          }));


          // 7a. MARKET SIMULATION (NEW)
          // Simulate market for each quarter that passed
          for (let q = 0; q < quarters; q++) {
            useMarketStore.getState().simulateQuarter();
          }


          // 7b. STAT DECAY LOGIC (Paslanma Kuralı)
          // "İşleyen demir ışıldar, işlemeyen paslanır."
          const playerStore = usePlayerStore.getState();
          const currentAttributes = playerStore.attributes;
          const decay = calculateStatDecay(currentAttributes);

          // Apply Decay
          Object.entries(decay).forEach(([stat, value]) => {
            if (value < 0) {
              const currentVal = currentAttributes[stat as keyof typeof currentAttributes];
              playerStore.updateAttribute(stat as any, Math.max(0, currentVal + value));

            }
          });

          // 7c. PARTNER BUFFS (Gelişmiş Partner Sistemi)
          const partner = useUserStore.getState().partner;
          if (partner) {
            const { changes, notification } = applyPartnerBuffs(partner);

            if (notification) {

              // Show notification in report if no crisis
              if (!operationalSetback) {
                setbackMessage = notification;
              }
            }

            // Apply Stats
            if (changes.attributes) {
              Object.entries(changes.attributes).forEach(([k, v]) =>
                playerStore.updateAttribute(k as any, (playerStore.attributes[k as keyof typeof playerStore.attributes] || 0) + (v as number))
              );
            }
            if (changes.core) {
              Object.entries(changes.core).forEach(([k, v]) =>
                playerStore.updateCore(k as any, (playerStore.core[k as keyof typeof playerStore.core] || 0) + (v as number))
              );
            }
            if (changes.reputation) {
              Object.entries(changes.reputation).forEach(([k, v]) =>
                playerStore.updateReputation(k as any, (playerStore.reputation[k as keyof typeof playerStore.reputation] || 0) + (v as number))
              );
            }
            if (changes.personality) {
              playerStore.setAll({ personality: { ...playerStore.personality, ...changes.personality } });
            }
            if (changes.money) {
              useStatsStore.getState().update({ money: (useStatsStore.getState().money || 0) + changes.money });
            }

            // New Integration: Security, Skills, Hidden
            if (changes.security) {
              Object.entries(changes.security).forEach(([k, v]) => {
                playerStore.updateSecurity(k as any, (playerStore.security[k as keyof typeof playerStore.security] || 0) + (v as number));
              });
            }
            if (changes.skills) {
              if (changes.skills.martialArts) {
                playerStore.updateSkill('martialArts', {
                  progress: (playerStore.skills.martialArts.progress || 0) + (changes.skills.martialArts.progress || 0)
                });
              }
            }
            if (changes.hidden) {
              Object.entries(changes.hidden).forEach(([k, v]) => {
                playerStore.updateHidden(k as any, (playerStore.hidden[k as keyof typeof playerStore.hidden] || 0) + (v as number));
              });
            }

          }

          // 7d. EDUCATION ADVANCEMENT (New System)
          const { useEducationStore } = require('./useEducationStore'); // Safe import
          const eduResult = useEducationStore.getState().advanceProgress();

          if (eduResult.message) {

            // Report to UI if significant (graduation) or just progress
            if (!setbackMessage && !operationalSetback) {
              setbackMessage = eduResult.message;
            }
          }
        }

        // 8. Sonucu UI'ın beklediği formatta döndür
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
            reportCurrentRP: useLaboratoryStore.getState().totalRP,
            operationalSetback,
            setbackMessage,
            lostRevenue: totalLostRevenue,
            lostUnits: totalLostUnits,

            // Güncel Bakiye Verileri
            playerCash: newPlayerCash,
            companyCapital: newCompanyCapital,

            // Diğerleri (Stats store'dan veya hesaplamadan)
            playerNetWorth: newPlayerCash + (newCompanyCapital * 1.5 * (stats.companyOwnership / 100)),
            playerIncome: baseSalary, // FIXED: Return the actual salary used
            playerExpenses: baseExpenses,
            companyValuation: newCompanyCapital * 1.5,
            productBreakdown: productBreakdownList
          }
        };



        return result;
      },
      distributeBonus: () => {
        const { lastQuarterProfit, employeeMorale, bonusDistributedThisQuarter } = get();
        if (bonusDistributedThisQuarter) return;

        const { companyCapital, update } = useStatsStore.getState();

        const bonusAmount = lastQuarterProfit * 0.05;

        // Checks
        if (lastQuarterProfit <= 0) return;
        if (companyCapital < bonusAmount) return;

        // Apply
        update({ companyCapital: companyCapital - bonusAmount });
        set({ employeeMorale: Math.min(100, employeeMorale + 15), bonusDistributedThisQuarter: true });

      },

      organizeEvent: (cost: number, boost: number) => {
        const currentState = get();
        if (currentState.eventsHostedThisQuarter >= 2) return;

        const { companyCapital, update } = useStatsStore.getState();

        if (companyCapital >= cost) {
          const newMorale = Math.min(100, currentState.employeeMorale + boost);
          update({ companyCapital: companyCapital - cost });
          set(state => ({
            ...state,
            employeeMorale: newMorale,
            eventsHostedThisQuarter: currentState.eventsHostedThisQuarter + 1
          }));
        }
      },

      setSalaryPolicy: (policy) => {
        set(state => ({ ...state, salaryPolicy: policy }));
      },

      resetGame: async () => {
        useStatsStore.getState().reset();
        useUserStore.getState().reset();
        useEventStore.getState().reset();
        useProductStore.getState().reset(); // Reset Products

        set(() => ({ ...initialGameState }));



        await zustandStorage.removeItem('succesor_stats_v1');
        await zustandStorage.removeItem('succesor_user_v1');
        await zustandStorage.removeItem('succesor_game_v1');
        await zustandStorage.removeItem('succesor_game_v2');
        await zustandStorage.removeItem('succesor_products_v3'); // Remove Product Persist
        await zustandStorage.removeItem('succesor_laboratory_v1'); // Remove Laboratory Persist if exists


      },
    }),
    {
      name: 'succesor_game_v2',
      storage: createJSONStorage(() => zustandStorage),
      partialize: state => ({
        currentMonth: state.currentMonth,
        age: state.age,
        employeeMorale: state.employeeMorale,
        salaryPolicy: state.salaryPolicy,
        eventsHostedThisQuarter: state.eventsHostedThisQuarter,
        lastQuarterProfit: state.lastQuarterProfit,
        bonusDistributedThisQuarter: state.bonusDistributedThisQuarter,
      }),
    },
  ),
);