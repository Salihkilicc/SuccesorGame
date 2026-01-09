import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '../../storage/persist';
import { useProductStore } from './useProductStore';

export type StatKey =
  | 'money'
  | 'netWorth'
  | 'monthlyIncome'
  | 'monthlyExpenses'
  | 'netWorth'
  | 'monthlyIncome'
  | 'monthlyExpenses'
  | 'companyDebt'
  | 'companyDebtTotal'
  | 'companyOwnership'
  | 'companyValue'
  | 'companySharePrice'
  | 'companyDailyChange'
  | 'companyRevenueMonthly'
  | 'companyExpensesMonthly'
  | 'companyCapital'
  | 'casinoReputation'
  | 'factoryCount'
  | 'employeeCount'
  | 'employeeMorale'
  | 'productionCapacity'
  | 'productionLevel'
  | 'researchPoints'
  | 'stockSplitCount';

export interface Shareholder {
  id: string;
  name: string;
  type: 'player' | 'family' | 'investor';
  percentage: number;
  relationship?: number; // 0-100, only for non-player
  avatar?: string;
  bio?: string;
}

export interface TechLevels {
  hardware: number;
  software: number;
  future: number;
}

export interface SubsidiaryState {
  id: string;
  name: string;
  marketCap: number;
  baseProfit: number; // Original profit when acquired
  currentProfit: number; // Current monthly profit (can be negative)
  isLossMaking: boolean; // True if currently failing
  initialPurchasePrice: number; // Price paid when acquiring the company
}

// --- State Definitions ---

export type Acquisitions = string[];

export type StatsState = Record<StatKey, number> & {
  shareholders: Shareholder[];
  salaryTier: 'low' | 'average' | 'above_average';
  techLevels: TechLevels;
  acquisitions: Acquisitions;
  subsidiaryStates: Record<string, SubsidiaryState>; // Track subsidiary performance
  isPublic: boolean;
};

type StatsStore = StatsState & {
  update: (partial: Partial<StatsState>) => void;
  setField: <K extends StatKey>(key: K, value: number) => void;

  // Money Transaction Methods (Single Source of Truth)
  spendMoney: (amount: number) => boolean; // Returns true if successful, false if insufficient funds
  earnMoney: (amount: number) => void;
  setMoney: (amount: number) => void; // For forced updates (e.g., load game, cheats)

  setCompanyValue: (value: number) => void;
  setCompanySharePrice: (value: number) => void;
  setCompanyDailyChange: (value: number) => void;
  setCompanyDebt: (value: number) => void;
  setCompanyDebtTotal: (value: number) => void;
  setCompanyOwnership: (value: number) => void;
  setCompanyRevenueMonthly: (value: number) => void;
  setCompanyExpensesMonthly: (value: number) => void;
  setCompanyCapital: (value: number) => void;
  setCasinoReputation: (value: number) => void;
  setResearchPoints: (value: number) => void;
  setShareholders: (list: Shareholder[]) => void;
  setSalaryTier: (tier: 'low' | 'average' | 'above_average') => void;
  setTechLevel: (category: keyof TechLevels, level: number) => void;
  addAcquisition: (id: string, companyData: { name: string; marketCap: number; profit: number }) => void;
  setIsPublic: (value: boolean) => void;
  performIPO: () => void;
  performStockSplit: () => void;
  updateShareholderRelationship: (id: string, delta: number) => void;
  performDilution: (percentage: number) => void;
  performBuyback: (percentage: number) => void;
  payDividend: (percentage: number) => void;
  processCompanyMonthlyTick: () => void;
  borrowCapital: (amount: number, interestRate: number) => void;
  repayCapital: (amount: number) => void;
  reset: () => void;
};

// --- Financial Constants ---
const SALARY_TIERS = {
  low: 3000,
  average: 5000,
  above_average: 8000
};
const FACTORY_COST_MONTHLY = 50_000;
const BASE_SHARES = 10_000_000;

export const initialStatsState: StatsState = {
  money: 450_000,
  netWorth: 15000,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  companyDebt: 0,
  companyDebtTotal: 0,
  companyOwnership: 72,
  companyValue: 18_600_000,
  companySharePrice: 120.5,
  companyDailyChange: 0,
  casinoReputation: 0,
  companyRevenueMonthly: 0,
  companyExpensesMonthly: 0,
  companyCapital: 100_000_000_000, // 100 Billion for M&A testing
  factoryCount: 5,
  employeeCount: 100,
  employeeMorale: 75,
  salaryTier: 'average',
  productionCapacity: 1000,
  productionLevel: 2000,
  researchPoints: 0,
  stockSplitCount: 0,
  isPublic: false,
  techLevels: {
    hardware: 1,
    software: 1,
    future: 1,
  },
  acquisitions: [], // Ensure this is initialized
  subsidiaryStates: {}, // Track subsidiary performance
  shareholders: [
    { id: 'player', name: 'Player', type: 'player', percentage: 51, avatar: 'P' },
    {
      id: 'family',
      name: 'Uncle Sam',
      type: 'family',
      percentage: 10,
      relationship: 90,
      avatar: 'U',
      bio: 'Your supportive uncle who provided the initial seed funding. He trusts you completely.'
    },
    {
      id: 'partner',
      name: 'Jessica (Partner)',
      type: 'family',
      percentage: 5,
      relationship: 100,
      avatar: 'J',
      bio: 'Your life partner and confidant. She supports your vision but worries about the risks.'
    },
    {
      id: 'vp',
      name: 'Angel Investor Mike',
      type: 'investor',
      percentage: 14,
      relationship: 65,
      avatar: 'M',
      bio: 'An early-stage tech investor looking for the next unicorn. Impatient but wealthy.'
    },
    {
      id: 'vc_small',
      name: 'Nebula VC',
      type: 'investor',
      percentage: 10,
      relationship: 45,
      avatar: 'N',
      bio: 'A mid-tier venture firm focused on rapid growth. They push for aggressive expansion.'
    },
    {
      id: 'vc_big',
      name: 'BlackRock VC',
      type: 'investor',
      percentage: 10,
      relationship: 30,
      avatar: 'B',
      bio: 'A global investment giant. They care only about returns and have zero patience for failure.'
    },
  ],
};

// --- Helper: Recalculate Financials ---
const recalculateFinancials = (currentState: StatsStore) => {
  const {
    employeeCount,
    salaryTier,
    factoryCount,
    companyDebtTotal,
    companyCapital,
    isPublic,
    techLevels,
    stockSplitCount
  } = currentState;

  // 1. Calculate Expenses
  const salaryCost = employeeCount * SALARY_TIERS[salaryTier];
  let factoryCost = factoryCount * FACTORY_COST_MONTHLY;

  // ChipMaster Bonus: Reduces production costs
  if (Array.isArray(currentState.acquisitions) && currentState.acquisitions.includes('chipMaster')) {
    factoryCost *= 0.9;
  }

  const debtInterest = (companyDebtTotal * 0.05) / 12; // Approx 5% annual interest base
  const totalExpenses = salaryCost + factoryCost + debtInterest;

  // 2. Calculate Revenue (from Product Store)
  const productState = useProductStore.getState();
  const activeProducts = productState.products.filter(p => p.status === 'active');
  const totalRevenue = activeProducts.reduce((sum, p) => sum + (p.revenue || 0), 0);

  // 3. Calculate Valuation
  // Multiplier Logic: Base 3x, Public 15x, +1 for each Tech Level
  const techBonus = techLevels.hardware + techLevels.software + techLevels.future;
  const multiplier = (isPublic ? 15 : 3) + techBonus;

  // Annualized Revenue * Multiplier + Cash
  const valuation = (totalRevenue * 12 * multiplier) + companyCapital;

  // 4. Calculate Share Price
  // Adjust base shares for splits
  const currentTotalShares = BASE_SHARES * Math.pow(10, stockSplitCount);
  const sharePrice = Math.max(0.01, valuation / currentTotalShares);

  // Return partial state update
  return {
    companyExpensesMonthly: totalExpenses,
    companyRevenueMonthly: totalRevenue,
    companyValue: valuation,
    companySharePrice: sharePrice
  };
};

export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => ({
      ...initialStatsState,
      update: partial => set(state => ({ ...state, ...partial })),
      setField: (key, value) => set(state => ({ ...state, [key]: value })),

      // Money Transaction Methods
      spendMoney: (amount) => {
        const current = get().money;
        if (current >= amount) {
          set({ money: current - amount });
          console.log(`[StatsStore] Spent $${amount.toLocaleString()}. Remaining: $${(current - amount).toLocaleString()}`);
          return true; // Transaction successful
        }
        console.warn(`[StatsStore] Insufficient funds. Tried to spend $${amount.toLocaleString()}, but only have $${current.toLocaleString()}`);
        return false; // Insufficient funds
      },

      earnMoney: (amount) => {
        const current = get().money;
        set({ money: current + amount });
        console.log(`[StatsStore] Earned $${amount.toLocaleString()}. New balance: $${(current + amount).toLocaleString()}`);
      },

      setMoney: (amount) => {
        set({ money: amount });
        console.log(`[StatsStore] Money set to $${amount.toLocaleString()}`);
      },

      setCompanyValue: value => set(state => ({ ...state, companyValue: value })),
      setCompanySharePrice: value =>
        set(state => ({ ...state, companySharePrice: value })),
      setCompanyDailyChange: value =>
        set(state => ({ ...state, companyDailyChange: value })),
      setCompanyDebt: value => set(state => ({ ...state, companyDebt: value })),
      setCompanyDebtTotal: value =>
        set(state => ({ ...state, companyDebtTotal: value })),
      setCompanyOwnership: value =>
        set(state => ({ ...state, companyOwnership: value })),
      setCompanyRevenueMonthly: value =>
        set(state => ({ ...state, companyRevenueMonthly: value })),
      setCompanyExpensesMonthly: value =>
        set(state => ({ ...state, companyExpensesMonthly: value })),

      // Hook into setCompanyCapital to trigger updates? 
      // Doing it explicitly in actions is safer to avoid loops.
      setCompanyCapital: value => set(state => {
        const nextState = { ...state, companyCapital: value } as StatsStore;
        // Recalculate usually happens on month tick, but cash changes affect valuation immediately
        const financials = recalculateFinancials(nextState);
        return { ...nextState, ...financials };
      }),

      setCasinoReputation: value =>
        set(state => ({ ...state, casinoReputation: value })),
      setResearchPoints: value => set(state => ({ ...state, researchPoints: value })),
      setShareholders: list => set(state => ({ ...state, shareholders: list })),

      setSalaryTier: tier => set(state => {
        const nextState = { ...state, salaryTier: tier } as StatsStore;
        const financials = recalculateFinancials(nextState);
        return { ...nextState, ...financials };
      }),

      setTechLevel: (category, level) =>
        set(state => {
          const nextState = {
            ...state,
            techLevels: { ...state.techLevels, [category]: level },
          } as StatsStore;
          const financials = recalculateFinancials(nextState);
          return { ...nextState, ...financials };
        }),

      addAcquisition: (id, companyData) =>
        set(state => {
          const purchasePrice = companyData.marketCap * 1.15; // Assume 15% premium

          const subsidiaryState: SubsidiaryState = {
            id,
            name: companyData.name,
            marketCap: companyData.marketCap,
            baseProfit: companyData.profit,
            currentProfit: companyData.profit,
            isLossMaking: false,
            initialPurchasePrice: purchasePrice,
          };

          // Ensure acquisitions is an array (handle legacy state)
          const currentAcquisitions = Array.isArray(state.acquisitions) ? state.acquisitions : [];

          return {
            ...state,
            acquisitions: [...currentAcquisitions, id],
            subsidiaryStates: {
              ...state.subsidiaryStates,
              [id]: subsidiaryState,
            },
          };
        }),

      setIsPublic: (value) => set(state => {
        const nextState = { ...state, isPublic: value } as StatsStore;
        const financials = recalculateFinancials(nextState);
        return { ...nextState, ...financials };
      }),

      performIPO: () =>
        set(state => {
          if (state.isPublic) return state; // Already public

          // 1. Valuation increases by 40% (Liquidity Premium)
          const valuationIncrease = state.companyValue * 0.4;
          const newValuation = state.companyValue + valuationIncrease;

          // 2. Add 15% of NEW Valuation to Company Cash
          const cashInjection = newValuation * 0.15;

          const nextState = {
            ...state,
            isPublic: true,
            companyValue: newValuation,
            companyCapital: state.companyCapital + cashInjection,
          } as StatsStore;

          // Perform full recalculation to sync everything
          const financials = recalculateFinancials(nextState);

          return { ...nextState, ...financials };
        }),

      performStockSplit: () =>
        set(state => {
          if (state.companySharePrice <= 1000) return state; // Only split if > $1000

          const nextState = {
            ...state,
            stockSplitCount: state.stockSplitCount + 1,
          } as StatsStore;

          const financials = recalculateFinancials(nextState);
          return { ...nextState, ...financials };
        }),

      updateShareholderRelationship: (id, delta) =>
        set(state => ({
          ...state,
          shareholders: state.shareholders.map(sh =>
            sh.id === id && sh.type !== 'player'
              ? { ...sh, relationship: Math.max(0, Math.min(100, (sh.relationship || 50) + delta)) }
              : sh
          ),
        })),
      performDilution: (percentage) =>
        set(state => {
          const capitalRaised = state.companyValue * (percentage / 100);
          const newOwnership = state.companyOwnership * (1 - percentage / 100);

          // Share Price drops by 3% (Supply increase)
          const newSharePrice = state.companySharePrice * 0.97;

          return {
            ...state,
            companyCapital: state.companyCapital + capitalRaised,
            companyOwnership: newOwnership,
            companySharePrice: newSharePrice,
            shareholders: state.shareholders.map(s => {
              if (s.type === 'player') return { ...s, percentage: newOwnership };
              return s;
            }),
          };
        }),
      performBuyback: (percentage) =>
        set(state => {
          const cost = state.companyValue * (percentage / 100);
          if (state.companyCapital < cost) return state;

          const multiplier = 1 / (1 - (percentage / 100));
          const preciseNewOwnership = Math.min(100, state.companyOwnership * multiplier);

          // Share Price increases by 4% (Demand increase)
          const newSharePrice = state.companySharePrice * 1.04;

          return {
            ...state,
            companyCapital: state.companyCapital - cost,
            companyOwnership: preciseNewOwnership,
            companySharePrice: newSharePrice,
            shareholders: state.shareholders.map(s => {
              if (s.type === 'player') return { ...s, percentage: preciseNewOwnership };
              return s;
            }),
          };
        }),
      payDividend: (percentage) =>
        set(state => {
          const dividendPool = state.companyCapital * (percentage / 100);
          const playerOwnership = state.companyOwnership / 100;
          const playerDividend = dividendPool * playerOwnership;

          // Share Price increases by 2% (Happy investors)
          const newSharePrice = state.companySharePrice * 1.02;

          return {
            ...state,
            companyCapital: state.companyCapital - dividendPool,
            money: state.money + playerDividend,
            companySharePrice: newSharePrice,
          };
        }),

      processCompanyMonthlyTick: () =>
        set(state => {
          // 1. Process Product Sales (Updates Product Store Revenue)
          // We pass current store state as context for the sales logic
          useProductStore.getState().processMonthlySales({
            morale: state.employeeMorale,
            techLevels: state.techLevels,
            acquisitions: state.acquisitions
          });

          // 2. Simulate Subsidiary Performance (RNG Logic)
          const updatedSubsidiaries: Record<string, SubsidiaryState> = {};
          let subsidiaryNetProfit = 0;

          Object.values(state.subsidiaryStates).forEach(sub => {
            const roll = Math.random() * 100;
            let newSub = { ...sub };

            if (!sub.isLossMaking) {
              // Healthy Company: 7% chance to fail
              if (roll < 7) {
                newSub.isLossMaking = true;
                newSub.currentProfit = -sub.marketCap * 0.02; // 2% of market cap as loss
              }
            } else {
              // Failing Company: 25% chance to recover
              if (roll < 25) {
                newSub.isLossMaking = false;
                newSub.currentProfit = sub.baseProfit; // Restore to original profit
              }
            }

            updatedSubsidiaries[sub.id] = newSub;
            subsidiaryNetProfit += newSub.currentProfit;
          });

          // 3. Recalculate Financials (Reads updated Revenue from Product Store + Subsidiary Profit)
          const financials = recalculateFinancials(state as StatsStore);

          // Add subsidiary profit to revenue (or subtract if loss)
          const adjustedRevenue = financials.companyRevenueMonthly + Math.max(0, subsidiaryNetProfit);
          const adjustedExpenses = financials.companyExpensesMonthly + Math.max(0, -subsidiaryNetProfit);

          const updatedFinancials = {
            ...financials,
            companyRevenueMonthly: adjustedRevenue,
            companyExpensesMonthly: adjustedExpenses,
          };

          // 4. Feedback Loop
          const profit = updatedFinancials.companyRevenueMonthly - updatedFinancials.companyExpensesMonthly;
          let moraleDelta = 0;

          if (profit > 0) moraleDelta += 1;
          else moraleDelta -= 2;

          if (state.salaryTier === 'low') moraleDelta -= 2;
          if (state.salaryTier === 'above_average') moraleDelta += 2;

          const nextMorale = Math.max(0, Math.min(100, state.employeeMorale + moraleDelta));

          let updates: Partial<StatsState> = {
            ...updatedFinancials,
            employeeMorale: nextMorale,
            subsidiaryStates: updatedSubsidiaries,
          };

          // 5. Stock price volatility if public
          if (state.isPublic) {
            const profitMargin = updatedFinancials.companyRevenueMonthly > 0
              ? profit / updatedFinancials.companyRevenueMonthly
              : -0.1;

            // Base change on performance (-10% to +10%)
            let priceChangePercent = profitMargin * 10;

            // Add random news factor (-5% to +5%)
            const newsFactor = (Math.random() - 0.5) * 10;
            priceChangePercent += newsFactor;

            // Apply change to Share Price & Value
            const newPrice = updatedFinancials.companySharePrice * (1 + priceChangePercent / 100);
            const newValue = updatedFinancials.companyValue * (1 + priceChangePercent / 100);

            updates = {
              ...updates,
              companySharePrice: newPrice,
              companyValue: newValue,
              companyDailyChange: priceChangePercent,
            };
          }

          return { ...state, ...updates };
        }),

      borrowCapital: (amount, interestRate) =>
        set(state => {
          // Interest is handled in recalculateFinancials based on TotalDebt
          // But here we need to update Capital and Debt first
          const nextState = {
            ...state,
            companyCapital: state.companyCapital + amount,
            companyDebtTotal: state.companyDebtTotal + amount,
            companyDebt: state.companyDebt + amount,
          } as StatsStore;

          const financials = recalculateFinancials(nextState);
          return { ...nextState, ...financials };
        }),

      repayCapital: (amount) =>
        set(state => {
          if (state.companyDebtTotal <= 0) return state;

          const nextState = {
            ...state,
            companyCapital: state.companyCapital - amount,
            companyDebtTotal: state.companyDebtTotal - amount,
            companyDebt: state.companyDebt - amount,
          } as StatsStore;

          const financials = recalculateFinancials(nextState);
          return { ...nextState, ...financials };
        }),

      reset: () => set(() => ({ ...initialStatsState })),
    }),
    {
      name: 'succesor_stats_v1',
      storage: createJSONStorage(() => zustandStorage),
      partialize: state => ({
        money: state.money,
        netWorth: state.netWorth,
        monthlyIncome: state.monthlyIncome,
        monthlyExpenses: state.monthlyExpenses,
        companyValue: state.companyValue,
        companyDebt: state.companyDebt,
        companyDebtTotal: state.companyDebtTotal,
        companyOwnership: state.companyOwnership,
        companySharePrice: state.companySharePrice,
        companyRevenueMonthly: state.companyRevenueMonthly,
        companyExpensesMonthly: state.companyExpensesMonthly,
        companyCapital: state.companyCapital,
        shareholders: state.shareholders,
        casinoReputation: state.casinoReputation,
        factoryCount: state.factoryCount,
        employeeCount: state.employeeCount,
        employeeMorale: state.employeeMorale,
        salaryTier: state.salaryTier,
        productionCapacity: state.productionCapacity,
        productionLevel: state.productionLevel,
        techLevels: state.techLevels,
        acquisitions: state.acquisitions,
        isPublic: state.isPublic,
        stockSplitCount: state.stockSplitCount,
      }),
      onRehydrateStorage: (state) => {
        console.log('[StatsStore] Storage hydration starting...');
        return (state, error) => {
          if (error) {
            console.error('[StatsStore] An error happened during hydration:', error);
          } else {
            console.log('[StatsStore] Hydration finished successfully!');
            console.log('[StatsStore] Rehydrated Money:', state?.money);
          }
        };
      },
    },
  ),
);
