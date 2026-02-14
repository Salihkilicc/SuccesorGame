import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../../../../storage/persist';

// Basic Encounter Interface for Store
interface TravelEncounter {
    candidate: any; // Using any to avoid circular deps with PartnerProfile
    scenario: any;
    context: string;
}

interface TravelState {
    collectedSouvenirIds: string[];
    currentEncounter: TravelEncounter | null; // For reliable modal triggering

    collectSouvenir: (id: string) => void;
    hasSouvenir: (id: string) => boolean;

    setEncounter: (encounter: TravelEncounter) => void;
    clearEncounter: () => void;
}

export const useTravelStore = create<TravelState>()(
    persist(
        (set, get) => ({
            collectedSouvenirIds: [],
            currentEncounter: null,

            collectSouvenir: (id: string) => {
                const current = get().collectedSouvenirIds;
                if (!current.includes(id)) {
                    set({ collectedSouvenirIds: [...current, id] });
                }
            },

            hasSouvenir: (id: string) => {
                return get().collectedSouvenirIds.includes(id);
            },

            setEncounter: (encounter) => set({ currentEncounter: encounter }),
            clearEncounter: () => set({ currentEncounter: null }),
        }),
        {
            name: 'travel-storage',
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({ collectedSouvenirIds: state.collectedSouvenirIds }), // Don't persist encounter
        }
    )
);
