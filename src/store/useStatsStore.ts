import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {zustandStorage} from '../storage/persist';

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
  | 'companyOwnership'
  | 'companyValue'
  | 'companySharePrice'
  | 'companyDailyChange'
  | 'casinoReputation';

export type StatsState = Record<StatKey, number>;

type StatsStore = StatsState & {
  update: (partial: Partial<StatsState>) => void;
  setField: <K extends StatKey>(key: K, value: number) => void;
  setCompanyValue: (value: number) => void;
  setCompanySharePrice: (value: number) => void;
  setCompanyDailyChange: (value: number) => void;
  setCompanyDebt: (value: number) => void;
  setCompanyOwnership: (value: number) => void;
  setCasinoReputation: (value: number) => void;
  reset: () => void;
};

export const initialStatsState: StatsState = {
  charisma: 50,
  reputation: 50,
  health: 75,
  stress: 20,
  love: 65,
  money: 5000,
  netWorth: 15000,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  luck: 55,
  riskApetite: 60,
  strategicSense: 60,
  companyDebt: 12_400_000,
  companyOwnership: 72,
  companyValue: 18_600_000,
  companySharePrice: 142.78,
  companyDailyChange: 2.1,
  casinoReputation: 40,
};

export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => ({
      ...initialStatsState,
      update: partial => set(state => ({...state, ...partial})),
      setField: (key, value) => set(state => ({...state, [key]: value})),
      setCompanyValue: value => set(state => ({...state, companyValue: value})),
      setCompanySharePrice: value =>
        set(state => ({...state, companySharePrice: value})),
      setCompanyDailyChange: value =>
        set(state => ({...state, companyDailyChange: value})),
      setCompanyDebt: value => set(state => ({...state, companyDebt: value})),
      setCompanyOwnership: value =>
        set(state => ({...state, companyOwnership: value})),
      setCasinoReputation: value =>
        set(state => ({...state, casinoReputation: value})),
      reset: () => set(() => ({...initialStatsState})),
    }),
    {
      name: 'succesor_stats_v1',
      storage: zustandStorage,
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
        companyOwnership: state.companyOwnership,
        casinoReputation: state.casinoReputation,
      }),
    },
  ),
);
