// src/core/store/useSponsorshipStore.ts
//
// ============================================================================
//  WHAT THE NAME IS ON, AND HOW LONG IT HAS BEEN ON NOTHING
// ============================================================================
//
//  Same three-way split as everything else: core/market/sponsorship.ts is the
//  arithmetic and the thirty offers, this remembers, and the tick is the only
//  thing that knows about both.
//
//  Persisted, because both halves outlive a session - a live deal has a term
//  left on it, and the drought counter is the whole reason the feature is a
//  decision rather than a shop.
// ============================================================================

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '../../storage/persist';
import { offerById, nextOffer, droughtPenalty, type SponsorOffer } from '../market/sponsorship';

export interface ActiveSponsorship {
    offerId: string;
    quartersLeft: number;
}

export interface SponsorshipState {
    active?: ActiveSponsorship;
    /** Offers already put in front of the player. Never shown twice. */
    seen: string[];
    /** Quarters since the last day the name was on something. */
    quartersWithout: number;
    _hasHydrated: boolean;
}

type Store = SponsorshipState & {
    setHasHydrated: (v: boolean) => void;
    /** The next letter to send, or nothing if the well is dry at this size. */
    nextFor: (companyValue: number) => SponsorOffer | undefined;
    /** Mark one as offered, whether or not it is taken. */
    markSeen: (offerId: string) => void;
    /** Sign it. Replaces any live deal - a company sponsors one thing. */
    sign: (offerId: string) => void;
    /**
     * One quarter passes. Returns the quarterly bill and brand gain, so the
     * tick can apply both through the doors that already exist.
     */
    advance: (quarters?: number) => { cost: number; brand: number };
    /** Ceiling points currently owed to the drought. */
    penalty: () => number;
    reset: () => void;
};

export const initialSponsorshipState: SponsorshipState = {
    active: undefined,
    seen: [],
    quartersWithout: 0,
    _hasHydrated: false,
};

export const useSponsorshipStore = create<Store>()(
    persist(
        (set, get) => ({
            ...initialSponsorshipState,
            setHasHydrated: v => set({ _hasHydrated: v }),

            nextFor: companyValue => nextOffer(companyValue, get().seen),
            markSeen: offerId =>
                set(s => (s.seen.includes(offerId) ? s : { seen: [...s.seen, offerId] })),

            sign: offerId => {
                const offer = offerById(offerId);
                if (!offer) return;
                set(s => ({
                    // ONE AT A TIME. A company's name is on one thing; letting
                    // them stack would make the drought counter meaningless and
                    // turn brand into a purchase.
                    active: { offerId, quartersLeft: offer.quarters },
                    quartersWithout: 0,
                    seen: s.seen.includes(offerId) ? s.seen : [...s.seen, offerId],
                }));
            },

            advance: (quarters = 1) => {
                const n = Math.max(1, quarters);
                const state = get();
                const offer = state.active ? offerById(state.active.offerId) : undefined;

                if (!state.active || !offer) {
                    set({ quartersWithout: state.quartersWithout + n });
                    return { cost: 0, brand: 0 };
                }

                // Only the quarters actually remaining are charged and credited,
                // so advancing three months past the end of a two-quarter term
                // does not bill for a quarter nobody was sponsored in.
                const paid = Math.min(n, state.active.quartersLeft);
                const left = state.active.quartersLeft - n;

                set({
                    active: left > 0 ? { ...state.active, quartersLeft: left } : undefined,
                    // The drought starts counting from the quarter the deal ran
                    // out, not from the quarter somebody noticed.
                    quartersWithout: left > 0 ? 0 : Math.max(0, n - paid),
                });

                return {
                    cost: offer.quarterlyCost * paid,
                    brand: offer.brandPerQuarter * paid,
                };
            },

            penalty: () => (get().active ? 0 : droughtPenalty(get().quartersWithout)),

            reset: () => set({ ...initialSponsorshipState, _hasHydrated: true }),
        }),
        {
            name: 'succesor_sponsorship_v1',
            storage: createJSONStorage(() => zustandStorage),
            partialize: state => ({
                active: state.active,
                seen: state.seen,
                quartersWithout: state.quartersWithout,
            }),
            onRehydrateStorage: () => state => { state?.setHasHydrated(true); },
        },
    ),
);
