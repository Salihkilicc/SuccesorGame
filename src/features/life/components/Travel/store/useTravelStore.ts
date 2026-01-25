import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../../../../storage/persist';

interface TravelState {
    collectedSouvenirIds: string[];
    collectSouvenir: (id: string) => void;
    hasSouvenir: (id: string) => boolean;
}

export const useTravelStore = create<TravelState>()(
    persist(
        (set, get) => ({
            collectedSouvenirIds: [],

            collectSouvenir: (id: string) => {
                const current = get().collectedSouvenirIds;
                if (!current.includes(id)) {
                    set({ collectedSouvenirIds: [...current, id] });
                }
            },

            hasSouvenir: (id: string) => {
                return get().collectedSouvenirIds.includes(id);
            },
        }),
        {
            name: 'travel-storage',
            storage: createJSONStorage(() => zustandStorage),
        }
    )
);
