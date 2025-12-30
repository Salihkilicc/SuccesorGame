import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../storage/persist';

type AchievementState = {
  unlockedIds: string[];
  lastUnlockedId?: string | null;
};

type AchievementStore = AchievementState & {
  unlockAchievement: (id: string) => void;
  isUnlocked: (id: string) => boolean;
  resetAchievements: () => void;
};

const initialState: AchievementState = {
  unlockedIds: [],
  lastUnlockedId: null,
};

export const useAchievementStore = create<AchievementStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      unlockAchievement: id => {
        if (get().unlockedIds.includes(id)) {
          return;
        }
        set(state => ({
          unlockedIds: [...state.unlockedIds, id],
          lastUnlockedId: id,
        }));
        console.log(`Unlocked achievement: ${id}`);
      },
      isUnlocked: id => get().unlockedIds.includes(id),
      resetAchievements: () => set(() => ({ ...initialState })),
    }),
    {
      name: 'succesor_achievements_v1',
      storage: createJSONStorage(() => zustandStorage),
      partialize: state => ({
        unlockedIds: state.unlockedIds,
        lastUnlockedId: state.lastUnlockedId,
      }),
    },
  ),
);
