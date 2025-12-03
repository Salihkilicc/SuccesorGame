import {create} from 'zustand';

export type StatKey =
  | 'charisma'
  | 'health'
  | 'stress'
  | 'money'
  | 'netWorth'
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
};

const initialState: StatsState = {
  charisma: 50,
  health: 75,
  stress: 20,
  money: 5000,
  netWorth: 15000,
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

export const useStatsStore = create<StatsStore>(set => ({
  ...initialState,
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
}));
