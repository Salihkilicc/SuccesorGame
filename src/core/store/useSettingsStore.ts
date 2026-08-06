// @orphan-ok deliberately excluded from a new game: language and notification
// preferences belong to the player, not to the save.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingsState = {
    _hasHydrated: boolean;
    isMusicEnabled: boolean;
    isSoundEnabled: boolean;
    isNotificationsEnabled: boolean;
    isHapticsEnabled: boolean;
};

type SettingsStore = SettingsState & {
    setHasHydrated: (value: boolean) => void;
    toggleMusic: () => void;
    toggleSound: () => void;
    toggleNotifications: () => void;
    toggleHaptics: () => void;
};

const initialState: SettingsState = {
    _hasHydrated: false,
    isMusicEnabled: true,
    isSoundEnabled: true,
    isNotificationsEnabled: true,
    isHapticsEnabled: true,
};

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            ...initialState,
            setHasHydrated: (value) => set({ _hasHydrated: value }),
            toggleMusic: () => set((state) => ({ isMusicEnabled: !state.isMusicEnabled })),
            toggleSound: () => set((state) => ({ isSoundEnabled: !state.isSoundEnabled })),
            toggleNotifications: () => set((state) => ({ isNotificationsEnabled: !state.isNotificationsEnabled })),
            toggleHaptics: () => set((state) => ({ isHapticsEnabled: !state.isHapticsEnabled })),
        }),
        {
            name: 'succesor_settings_v1',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                isMusicEnabled: state.isMusicEnabled,
                isSoundEnabled: state.isSoundEnabled,
                isNotificationsEnabled: state.isNotificationsEnabled,
                isHapticsEnabled: state.isHapticsEnabled,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.setHasHydrated(true);
                }
            },
        },
    ),
);
