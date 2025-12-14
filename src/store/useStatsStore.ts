import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '../storage/persist';

export type StatKey =
  | 'charisma'
  | 'reputation'
  | 'health'
  | 'stress'
  | 'love'
  | 'money'
  | 'netWorth'
  | 'monthlyIncome'
  | 'monthlyExpenses'
  | 'luck'
  | 'riskApetite'
  | 'strategicSense'
  | 'companyDebt'
  | 'companyDebtTotal'
  | 'companyOwnership'
  | 'companyValue'
  | 'companySharePrice'
  | 'companyDailyChange'
  | 'companyRevenueMonthly'
  | 'companyExpensesMonthly'
  | 'companyCapital'
  | 'casinoReputation';

export interface Shareholder {
  id: string;
  name: string;
  type: 'player' | 'family' | 'investor';
  percentage: number;
}

export type StatsState = Record<StatKey, number> & {
  shareholders: Shareholder[];
};

type StatsStore = StatsState & {
  update: (partial: Partial<StatsState>) => void;
  setField: <K extends StatKey>(key: K, value: number) => void;
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
  setShareholders: (list: Shareholder[]) => void;
  reset: () => void;
};

export const initialStatsState: StatsState = {
  charisma: 50,
  reputation: 50,
  health: 75,
  stress: 20,
  love: 65,
  money: 450_000,
  netWorth: 15000,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  luck: 55,
  riskApetite: 60,
  strategicSense: 60,
  companyDebt: 8_400_000,
  companyDebtTotal: 8_400_000,
  companyOwnership: 72,
  companyValue: 18_600_000,
  companySharePrice: 120.5,
  companyDailyChange: 2.1,
  casinoReputation: 0,
  companyRevenueMonthly: 1_200_000,
  companyExpensesMonthly: 620_000,
  companyCapital: 4_800_000,
  shareholders: [
    { id: 'player', name: 'Player', type: 'player', percentage: 65 },
    { id: 'family', name: 'Family', type: 'family', percentage: 15 },
    { id: 'investor-a', name: 'Investor A', type: 'investor', percentage: 7 },
    { id: 'investor-b', name: 'Investor B', type: 'investor', percentage: 3 },
    { id: 'investor-c', name: 'Investor C', type: 'investor', percentage: 10 },
  ],
};

export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => ({
      ...initialStatsState,
      update: partial => set(state => ({ ...state, ...partial })),
      setField: (key, value) => set(state => ({ ...state, [key]: value })),
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
      setCompanyCapital: value => set(state => ({ ...state, companyCapital: value })),
      setCasinoReputation: value =>
        set(state => ({ ...state, casinoReputation: value })),
      setShareholders: list => set(state => ({ ...state, shareholders: list })),
      reset: () => set(() => ({ ...initialStatsState })),
    }),
    {
      name: 'succesor_stats_v1',
      storage: createJSONStorage(() => zustandStorage),
      partialize: state => ({
        money: state.money,
        netWorth: state.netWorth,
        charisma: state.charisma,
        health: state.health,
        stress: state.stress,
        luck: state.luck,
        monthlyIncome: state.monthlyIncome,
        monthlyExpenses: state.monthlyExpenses,
        riskApetite: state.riskApetite,
        strategicSense: state.strategicSense,
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
      }),
    },
  ),
);
