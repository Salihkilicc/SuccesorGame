// @survives-new-game language and notification preferences belong to the
// player, not to the save. A new company should not put the app back into
// English.
//
// @orphan-ok deliberately excluded from a new game: language and notification
// preferences belong to the player, not to the save.
//
// ---------------------------------------------------------------------------
//  BOTH MARKERS, AND THE SECOND ONE IS THE OVERSHOOT
// ---------------------------------------------------------------------------
//  `@orphan-ok` is a WHOLE FILE pass on the reachability audit: it turns off
//  the palette check, the frozen-text check and the dead-code check here too,
//  which is a large hole to open for one small exemption. `@survives-new-game`
//  is the narrow marker for exactly this, and it is what newGameKeys.test.ts
//  reads. Left side by side rather than swapped, because dropping the old one
//  is a change to what the audit reports about this file and that belongs in
//  its own pass, not in a cleanup that was fixing the family store.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { zustandStorage } from '../../storage/persist';

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
            storage: createJSONStorage(() => zustandStorage),
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
