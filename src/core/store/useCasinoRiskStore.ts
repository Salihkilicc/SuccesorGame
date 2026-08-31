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
import { MAX_REP_PER_QUARTER } from '../../features/casino/data/casinoData';

/** Consecutive quarters at which a pattern becomes a story. */
export const SCANDAL_STREAK = 3;

export interface CasinoRiskState {
    /** Has the player been at a table at all this quarter? */
    visitedThisQuarter: boolean;
    /**
     * Reputation already banked this quarter.
     *
     * The casino has no energy cost and no limit on how many hands you play,
     * so without this the seven room ladder falls in one sitting to anybody
     * with a bankroll - the gates were a minute of tapping rather than a
     * career. See MAX_REP_PER_QUARTER in features/casino/data/casinoData.ts.
     *
     * It lives here rather than in the player store because it is a fact
     * about a QUARTER, and this is the store that already knows when one
     * ends.
     */
    repThisQuarter: number;
    /** Consecutive quarters with at least one visit. */
    streak: number;
    /** Longest run this campaign, for the scene to be able to say it. */
    longestStreak: number;
    /**
     * THE QUARTER THE PLAYER LAST WALKED INTO THE VIP ROOM.
     *
     * `null` for somebody who has never been. It lives here rather than in the
     * casino system because this is the store that already knows when a
     * quarter ends, and the cooldown is the only thing that makes a bet of a
     * hundred per cent of everything a decision rather than a retry.
     * See features/casino/data/vipRoom.ts.
     */
    lastVipQuarter: number | null;
    /**
     * WHICH ROOM THE PLAYER IS IN.
     *
     * It used to be `useState` inside `useCasinoSystem`, which every screen
     * calls separately - so each screen had its OWN copy and every one of them
     * started at Athens. Travelling to Macau in the lobby and then opening
     * blackjack put you back at the cheapest table in the game with the
     * cheapest chips, silently. Found while wiring the VIP room, which cannot
     * work at all without this.
     */
    currentLocationId: string;
    _hasHydrated: boolean;
}

type Store = CasinoRiskState & {
    setHasHydrated: (v: boolean) => void;
    /** Called when a bet is placed. Idempotent within a quarter. */
    recordVisit: () => void;
    /**
     * Bank some standing, and return what was actually allowed.
     *
     * Returns 0 once the quarter is spent, so the caller can leave the
     * player's reputation alone rather than writing the same number back.
     */
    bankReputation: (amount: number) => number;
    /** Called by the tick. Rolls the quarter over. */
    closeQuarter: (quarters?: number) => void;
    /** Stamp the VIP visit. The cooldown counts from here. */
    recordVipVisit: (quarter: number) => void;
    /** Walk into a room. */
    setCurrentLocationId: (id: string) => void;
    reset: () => void;
};

export const initialCasinoRiskState: CasinoRiskState = {
    visitedThisQuarter: false,
    repThisQuarter: 0,
    streak: 0,
    longestStreak: 0,
    lastVipQuarter: null,
    currentLocationId: 'athens',
    _hasHydrated: false,
};

export const useCasinoRiskStore = create<Store>()(
    persist(
        (set, get) => ({
            ...initialCasinoRiskState,
            setHasHydrated: v => set({ _hasHydrated: v }),

            recordVisit: () => set(s => (s.visitedThisQuarter ? s : { visitedThisQuarter: true })),

            recordVipVisit: (quarter: number) =>
                set({ lastVipQuarter: Math.max(0, Math.floor(quarter || 0)) }),

            setCurrentLocationId: (id: string) => set({ currentLocationId: id }),

            bankReputation: (amount: number) => {
                const asked = Math.max(0, Math.floor(amount || 0));
                if (asked <= 0) return 0;
                const room = Math.max(0, MAX_REP_PER_QUARTER - (get().repThisQuarter || 0));
                const given = Math.min(asked, room);
                if (given > 0) set(s => ({ repThisQuarter: (s.repThisQuarter || 0) + given }));
                return given;
            },

            closeQuarter: (quarters = 1) =>
                set(s => {
                    if (!s.visitedThisQuarter) {
                        // One clean quarter clears the whole run. Merciful, and
                        // it is what makes the streak a decision the player can
                        // act on rather than a debt they accumulate.
                        return { visitedThisQuarter: false, repThisQuarter: 0, streak: 0 };
                    }
                    // Advancing several months at once counts as ONE quarter of
                    // attendance, because the flag is all the evidence there is
                    // - crediting three would let the clock create a pattern
                    // that never happened.
                    const streak = s.streak + 1;
                    return {
                        visitedThisQuarter: false,
                        // The allowance refills with the quarter, which is the
                        // whole point of measuring it in quarters.
                        repThisQuarter: 0,
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
                repThisQuarter: state.repThisQuarter,
                streak: state.streak,
                longestStreak: state.longestStreak,
                // Or the cooldown lasts exactly as long as the app stays open,
                // which is not a cooldown.
                lastVipQuarter: state.lastVipQuarter,
                currentLocationId: state.currentLocationId,
            }),
            onRehydrateStorage: () => state => { state?.setHasHydrated(true); },
        },
    ),
);
