import {create} from 'zustand';

export type EventState = {
  todayEvent?: string;
  lastLifeEvent?: string | null;
  lastLoveEvent?: string | null;
  lastMarketEvent?: string | null;
  lastCompanyEvent?: string | null;
  companyEventCount?: number;
  lastCasinoEvent?: string | null;
  todayLifeEvents: string[];
  todayLoveEvents: string[];
  todayMarketEvents: string[];
  todayCompanyEvents: string[];
  todayCasinoEvents: string[];
  usedLoveActionToday: boolean;
};

type EventStore = EventState & {
  update: (partial: Partial<EventState>) => void;
  setField: <K extends keyof EventState>(key: K, value: EventState[K]) => void;
  setLastLifeEvent: (value: string | null) => void;
  setLastLoveEvent: (value: string | null) => void;
  setLastMarketEvent: (value: string | null) => void;
  setLastCompanyEvent: (value: string | null) => void;
  incrementCompanyEventCount: () => void;
  setLastCasinoEvent: (value: string | null) => void;
  resetDailyFlags: () => void;
  reset: () => void;
};

const initialState: EventState = {
  todayEvent: 'You woke up energized and ready to plan.',
  lastLifeEvent: 'Started a new morning routine.',
  lastLoveEvent: 'Sent a thoughtful message.',
  lastMarketEvent: 'Reviewed portfolio performance.',
  lastCompanyEvent: 'Board requested a brief update.',
  companyEventCount: 0,
  lastCasinoEvent: null,
  todayLifeEvents: [],
  todayLoveEvents: [],
  todayMarketEvents: [],
  todayCompanyEvents: [],
  todayCasinoEvents: [],
  usedLoveActionToday: false,
};

export const useEventStore = create<EventStore>(set => ({
  ...initialState,
  update: partial => set(state => ({...state, ...partial})),
  setField: (key, value) => set(state => ({...state, [key]: value})),
  setLastLifeEvent: value => set(state => ({...state, lastLifeEvent: value})),
  setLastLoveEvent: value => set(state => ({...state, lastLoveEvent: value})),
  setLastMarketEvent: value =>
    set(state => ({...state, lastMarketEvent: value})),
  setLastCompanyEvent: value =>
    set(state => ({...state, lastCompanyEvent: value})),
  incrementCompanyEventCount: () =>
    set(state => ({...state, companyEventCount: (state.companyEventCount ?? 0) + 1})),
  setLastCasinoEvent: value =>
    set(state => ({...state, lastCasinoEvent: value})),
  resetDailyFlags: () =>
    set(state => ({
      ...state,
      lastLifeEvent: null,
      lastLoveEvent: null,
      lastMarketEvent: null,
      lastCompanyEvent: null,
      lastCasinoEvent: null,
      usedLoveActionToday: false,
      todayLifeEvents: [],
      todayLoveEvents: [],
      todayMarketEvents: [],
      todayCompanyEvents: [],
      todayCasinoEvents: [],
    })),
  reset: () => set(initialState),
}));
