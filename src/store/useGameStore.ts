import {create} from 'zustand';
import {useEventStore} from './useEventStore';
import {simulateNewDay} from '../event/eventEngine';

export type GameState = {
  currentDay: number;
  actionsUsedToday: number;
  maxActionsPerDay: number;
};

type GameStore = GameState & {
  setField: <K extends keyof GameState>(key: K, value: GameState[K]) => void;
  resetDailyState: () => void;
  advanceDay: () => void;
};

const initialState: GameState = {
  currentDay: 1,
  actionsUsedToday: 0,
  maxActionsPerDay: 999,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  setField: (key, value) => set(state => ({...state, [key]: value})),
  resetDailyState: () => {
    const {resetDailyFlags} = useEventStore.getState();
    resetDailyFlags();
    set(state => ({...state, actionsUsedToday: 0}));
    console.log('[Game] Daily state reset (placeholder)');
  },
  advanceDay: () => {
    set(state => ({...state, currentDay: state.currentDay + 1, actionsUsedToday: 0}));
    console.log(`[Game] Day advanced to ${get().currentDay}`);
    get().resetDailyState();
    simulateNewDay();
  },
}));
