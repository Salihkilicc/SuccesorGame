import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEventStore } from './useEventStore';
import { simulateNewMonth } from '../event/eventEngine';
import { zustandStorage } from '../storage/persist';
import { useStatsStore } from './useStatsStore';
import { useUserStore } from './useUserStore';

export type GameState = {
  currentMonth: number;
  age: number;
  actionsUsedThisMonth: number;
  maxActionsPerMonth: number;
};

type GameStore = GameState & {
  setField: <K extends keyof GameState>(key: K, value: GameState[K]) => void;
  resetMonthlyState: () => void;
  advanceMonth: () => void;
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
      advanceMonth: () => {
        const { currentMonth, age } = get();
        let newMonth = currentMonth + 1;
        let newAge = age;

        if (newMonth > 12) {
          newMonth = 1;
          newAge = age + 1;
        }

        set(state => ({
          ...state,
          currentMonth: newMonth,
          age: newAge,
          actionsUsedThisMonth: 0,
        }));
        console.log(`[Game] Advanced to age ${newAge}, month ${newMonth}`);
        get().resetMonthlyState();
        simulateNewMonth();
        useStatsStore.getState().processCompanyMonthlyTick();
        import('../achievements/checker').then(mod => {
          mod.checkAllAchievementsAfterStateChange();
        });
      },
      resetGame: async () => {
        useStatsStore.getState().reset();
        useUserStore.getState().reset();
        useEventStore.getState().reset();
        set(() => ({ ...initialGameState }));
        await zustandStorage.removeItem('succesor_stats_v1');
        await zustandStorage.removeItem('succesor_user_v1');
        await zustandStorage.removeItem('succesor_game_v1');
        await zustandStorage.removeItem('succesor_game_v2');
        console.log('[Game] Full game reset complete');
      },
    }),
    {
      name: 'succesor_game_v2',
      storage: zustandStorage,
      partialize: state => ({
        currentMonth: state.currentMonth,
        age: state.age,
      }),
    },
  ),
);
