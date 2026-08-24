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
import { offerById, nextOffer, droughtPenalty, sponsorGlow, type SponsorOffer } from '../market/sponsorship';

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
    /**
     * Brand points the live deal is adding to the EQUILIBRIUM right now.
     *
     * Full size on the quarter it was signed, nothing by the end of the term.
     * See core/market/sponsorship.ts for why it moves the destination rather
     * than the value.
     */
    glow: () => number;
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

                // ------------------------------------------------------------
                //  THE BRAND HALF IS SHELVED
                // ------------------------------------------------------------
                //  `brand: offer.brandPerQuarter * paid` went into
                //  gameSink().brand(), which adds to the brand VALUE - and the
                //  walk in advanceCategoryBrand pulls a value addition back out
                //  with a half life of about four quarters. Measured: the
                //  largest deal in the game, 384 million over sixteen quarters,
                //  was down to +9 points eight quarters after it ended.
                //
                //  A deal lifts the EQUILIBRIUM now, through `glow()` above.
                //  The cost half is unchanged: the money is still paid every
                //  quarter of the term.
                // ------------------------------------------------------------
                return {
                    cost: offer.quarterlyCost * paid,
                    brand: 0,
                };
            },

            penalty: () => (get().active ? 0 : droughtPenalty(get().quartersWithout)),

            glow: () => {
                const { active } = get();
                if (!active) return 0;
                const offer = offerById(active.offerId);
                if (!offer) return 0;
                // Read BEFORE `advance` decrements, so the quarter a deal is
                // signed sees the whole thing. See the tick: the brand loop
                // runs long before the sponsorship quarter is closed.
                const elapsed = offer.quarters - active.quartersLeft;
                return sponsorGlow(offer, elapsed);
            },

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
