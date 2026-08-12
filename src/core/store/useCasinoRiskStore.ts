// src/core/store/useCasinoRiskStore.ts
//
// ============================================================================
//  HOW MANY QUARTERS IN A ROW
// ============================================================================
//
//  The casino has been in this game since before any of the story was, and it
//  has never cost the chief executive anything except money. There was no
//  counter of any kind: a player could be at a roulette table every week for
//  nine years and nothing in the company would know.
//
//  This is the counter, and it counts the only thing that matters for a
//  scandal - not how much was lost, not how often, but HOW MANY QUARTERS IN A
//  ROW. One heavy weekend is a story nobody writes. Three consecutive
//  quarters is a pattern, and a pattern is what a journalist can print.
//
//  ---------------------------------------------------------------------------
//  A BOOLEAN PER QUARTER, NOT A TALLY
//  ---------------------------------------------------------------------------
//  Deliberately. Counting visits would make the mechanic about volume, and a
//  player who worked out that four visits was safe and five was not would be
//  playing a spreadsheet. One visit marks the quarter; the streak is what is
//  scored; and stopping for a single quarter clears it completely, which is
//  both merciful and exactly how this works in life.
// ============================================================================

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '../../storage/persist';

/** Consecutive quarters at which a pattern becomes a story. */
export const SCANDAL_STREAK = 3;

export interface CasinoRiskState {
    /** Has the player been at a table at all this quarter? */
    visitedThisQuarter: boolean;
    /** Consecutive quarters with at least one visit. */
    streak: number;
    /** Longest run this campaign, for the scene to be able to say it. */
    longestStreak: number;
    _hasHydrated: boolean;
}

type Store = CasinoRiskState & {
    setHasHydrated: (v: boolean) => void;
    /** Called when a bet is placed. Idempotent within a quarter. */
    recordVisit: () => void;
    /** Called by the tick. Rolls the quarter over. */
    closeQuarter: (quarters?: number) => void;
    reset: () => void;
};

export const initialCasinoRiskState: CasinoRiskState = {
    visitedThisQuarter: false,
    streak: 0,
    longestStreak: 0,
    _hasHydrated: false,
};

export const useCasinoRiskStore = create<Store>()(
    persist(
        (set) => ({
            ...initialCasinoRiskState,
            setHasHydrated: v => set({ _hasHydrated: v }),

            recordVisit: () => set(s => (s.visitedThisQuarter ? s : { visitedThisQuarter: true })),

            closeQuarter: (quarters = 1) =>
                set(s => {
                    if (!s.visitedThisQuarter) {
                        // One clean quarter clears the whole run. Merciful, and
                        // it is what makes the streak a decision the player can
                        // act on rather than a debt they accumulate.
                        return { visitedThisQuarter: false, streak: 0 };
                    }
                    // Advancing several months at once counts as ONE quarter of
                    // attendance, because the flag is all the evidence there is
                    // - crediting three would let the clock create a pattern
                    // that never happened.
                    const streak = s.streak + 1;
                    return {
                        visitedThisQuarter: false,
                        streak,
                        longestStreak: Math.max(s.longestStreak, streak),
                    };
                }),

            reset: () => set({ ...initialCasinoRiskState, _hasHydrated: true }),
        }),
        {
            name: 'succesor_casino_risk_v1',
            storage: createJSONStorage(() => zustandStorage),
            partialize: state => ({
                visitedThisQuarter: state.visitedThisQuarter,
                streak: state.streak,
                longestStreak: state.longestStreak,
            }),
            onRehydrateStorage: () => state => { state?.setHasHydrated(true); },
        },
    ),
);
