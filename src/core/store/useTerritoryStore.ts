// src/core/store/useTerritoryStore.ts
//
// ============================================================================
//  WHAT YOU AGREED TO, AND WHO IS CURRENTLY SPENDING AGAINST YOU
// ============================================================================
//
//  core/market/territory.ts is arithmetic. This remembers, and it is persisted
//  because both halves of the dilemma outlive the conversation - that is the
//  entire reason the choice is a choice. A royalty that vanished on restart
//  would make deferring free, which is the one thing it must never be.
//
//  TWO SHAPES, DELIBERATELY DIFFERENT. Royalties have no end date and no
//  counter; sieges have nothing but a counter. Reading the state should tell
//  you which kind of cost you took without reading a comment.
// ============================================================================

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '../../storage/persist';
import {
    royaltyDue, siegePressure, advanceSieges,
    ROYALTY_RATE, SIEGE_QUARTERS, SIEGE_PRESSURE,
    type RoyaltyTerm, type Siege,
} from '../market/territory';

export interface TerritoryState {
    royalties: RoyaltyTerm[];
    sieges: Siege[];
    _hasHydrated: boolean;
}

type Store = TerritoryState & {
    setHasHydrated: (v: boolean) => void;
    /** Take their terms. Idempotent per category - you cannot sign twice. */
    agreeRoyalty: (category: string, rate: number, quarter: number, giant: string) => void;
    /** Tell them no. */
    beginSiege: (category: string, quarters: number, pressure: number, giant: string) => void;
    /** What this quarter's royalties cost, given what was sold. */
    royaltyFor: (revenueByCategory: Record<string, number>) => number;
    /** The multiplier on the competitor pool in one category. */
    pressureIn: (category: string) => number;
    /** One quarter passes. */
    advance: (quarters?: number) => void;
    reset: () => void;
};

export const initialTerritoryState: TerritoryState = {
    royalties: [],
    sieges: [],
    _hasHydrated: false,
};

export const useTerritoryStore = create<Store>()(
    persist(
        (set, get) => ({
            ...initialTerritoryState,
            setHasHydrated: v => set({ _hasHydrated: v }),

            agreeRoyalty: (category, rate, quarter, giant) =>
                set(s => (
                    // Signing the same category twice would stack two cuts on
                    // one revenue line. The scene can only fire once per
                    // category, but a store that relies on a scene behaving
                    // is a store that will one day be wrong.
                    s.royalties.some(r => r.category === category)
                        ? s
                        : { royalties: [...s.royalties, { category, rate, since: quarter, giant }] }
                )),

            beginSiege: (category, quarters, pressure, giant) =>
                set(s => ({
                    sieges: [
                        ...s.sieges.filter(x => x.category !== category),
                        { category, quartersLeft: quarters, pressure, giant },
                    ],
                })),

            royaltyFor: revenueByCategory => royaltyDue(revenueByCategory, get().royalties),
            pressureIn: category => siegePressure(category, get().sieges),
            advance: (quarters = 1) =>
                set(s => ({ sieges: advanceSieges(s.sieges, quarters) })),

            reset: () => set({ ...initialTerritoryState, _hasHydrated: true }),
        }),
        {
            name: 'succesor_territory_v1',
            storage: createJSONStorage(() => zustandStorage),
            partialize: state => ({ royalties: state.royalties, sieges: state.sieges }),
            onRehydrateStorage: () => state => { state?.setHasHydrated(true); },
        },
    ),
);

export { ROYALTY_RATE, SIEGE_QUARTERS, SIEGE_PRESSURE };
