// src/core/store/useNegotiationStore.ts
//
// ============================================================================
//  THE QUARTER BETWEEN SENDING AND HEARING BACK
// ============================================================================
//
//  core/market/negotiation.ts is arithmetic and vocabulary and knows nothing
//  about the app. This is the only file that knows both, the same split as
//  effects.ts / gameSink.ts.
//
//  THE ONE RULE IT EXISTS TO ENFORCE: an offer sent this quarter is answered
//  NEXT quarter. Not after a two-second spinner, not on the same tick. That is
//  the whole difference between this and the shelved NegotiationModal, and it
//  is the reason the store exists at all - without a wait there is nothing to
//  persist and the feature collapses back into a modal with a die in it.
//
//  Persisted, because a pending offer that evaporates when the app is closed
//  is worse than no offer: the player remembers writing it.
// ============================================================================

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '../../storage/persist';
import {
    isDue, replyFor, counterFor, resistance, hostilePremiumFor, termsFor,
    canMeet, DEMAND_MET_RELIEF,
    type Offer, type Subject, type Demand, type Reply,
} from '../market/negotiation';
import { negotiatorFor, shiftFor } from '../../data/market/negotiators';
import type { TargetRisk } from '../market/mergers';

export interface NegotiationState {
    offers: Offer[];
    /**
     * How many times each board has refused, ever.
     *
     * Kept separately from the offers so that clearing old letters does not
     * clear the memory. A board that turned you down in year two is harder in
     * year nine, and the only way that survives a tidy-up is if it lives
     * somewhere other than the letter.
     */
    refusalsByTarget: Record<string, number>;
    /**
     * Targets that will never speak to you again.
     *
     * One negotiator ends this way - see Vane's `withdraw` in negotiators.ts -
     * and it needs to be permanent to mean anything. Flag-shaped rather than
     * counted, because it cannot be undone.
     */
    closedForever: Record<string, true>;
    _hasHydrated: boolean;
}

export interface SendInput {
    targetId: string;
    targetName: string;
    subject: Subject;
    marketCap: number;
    risk: TargetRisk;
    acquirerValuation: number;
    strength?: number;
    quarter: number;
}

type Store = NegotiationState & {
    setHasHydrated: (v: boolean) => void;
    /** Put a letter in the post. Returns the offer, or a reason it could not go. */
    send: (input: SendInput) => { ok: true; offer: Offer } | { ok: false; reason: string };
    /**
     * Turn the quarter. Every offer that has waited long enough is answered.
     * Returns the ones that just became readable so the caller can post mail.
     */
    resolveDue: (quarter: number) => Offer[];
    /** The player's answer to a demand. */
    answer: (offerId: string, met: boolean, world: {
        publicReputation: number; capital: number; price: number;
    }) => { ok: boolean; counter?: Demand; closed?: boolean; reason?: string };
    /** Walk away without going hostile. */
    withdraw: (offerId: string) => void;
    /** Everything the player still has to answer. */
    open: () => Offer[];
    /** What a hostile bid for this target would cost right now, as a ratio. */
    hostilePremium: (targetId: string, fallbackScore: number) => number;
    reset: () => void;
};

export const initialNegotiationState: NegotiationState = {
    offers: [],
    refusalsByTarget: {},
    closedForever: {},
    _hasHydrated: false,
};

export const useNegotiationStore = create<Store>()(
    persist(
        (set, get) => ({
            ...initialNegotiationState,
            setHasHydrated: v => set({ _hasHydrated: v }),

            send: input => {
                const state = get();
                if (state.closedForever[input.targetId]) {
                    return { ok: false, reason: 'They have asked you not to write again.' };
                }
                // One live approach per company. Two letters in the post to the
                // same board is not a strategy, it is a way of getting two
                // replies to one question.
                if (state.offers.some(o =>
                    o.targetId === input.targetId && o.status !== 'closed')) {
                    return { ok: false, reason: 'You are already waiting on them.' };
                }

                const negotiator = negotiatorFor(input.targetId, input.risk);
                const score = resistance({
                    targetMarketCap: input.marketCap,
                    acquirerValuation: input.acquirerValuation,
                    risk: input.risk,
                    strength: input.strength,
                    subject: input.subject,
                    personalityShift: shiftFor(negotiator, input.subject),
                    priorRefusals: state.refusalsByTarget[input.targetId] ?? 0,
                });

                const offer: Offer = {
                    id: `offer-${input.targetId}-${input.quarter}`,
                    targetId: input.targetId,
                    targetName: input.targetName,
                    subject: input.subject,
                    sentQuarter: input.quarter,
                    status: 'sent',
                    // FROZEN AT SEND. The reply reads this rather than
                    // recomputing, so a quarter of share price movement between
                    // writing and hearing back cannot change an answer that was
                    // already decided by the letter you actually sent.
                    score,
                    risk: input.risk,
                };
                set(s => ({ offers: [offer, ...s.offers] }));
                return { ok: true, offer };
            },

            resolveDue: quarter => {
                const state = get();
                const due = state.offers.filter(o => isDue(o, quarter));
                if (!due.length) return [];

                const answered: Offer[] = [];
                const refusals = { ...state.refusalsByTarget };
                const closed = { ...state.closedForever };

                for (const offer of due) {
                    const negotiator = negotiatorFor(offer.targetId, offer.risk);
                    const reply: Reply = replyFor(negotiator, offer.score, offer.subject);
                    if (reply.kind === 'refuse') {
                        refusals[offer.targetId] = (refusals[offer.targetId] ?? 0) + 1;
                    }
                    answered.push({
                        ...offer,
                        // A refusal needs no answer from the player, so it is
                        // finished the moment it arrives. Only a demand or an
                        // acceptance leaves something open.
                        status: reply.kind === 'refuse' ? 'closed' : 'open',
                        reply,
                    });
                }

                set(s => ({
                    offers: s.offers.map(o =>
                        answered.find(a => a.id === o.id) ?? o),
                    refusalsByTarget: refusals,
                    closedForever: closed,
                }));
                return answered;
            },

            answer: (offerId, met, world) => {
                const state = get();
                const offer = state.offers.find(o => o.id === offerId);
                if (!offer || offer.status !== 'open' || offer.reply?.kind !== 'demand') {
                    return { ok: false, reason: 'There is nothing open to answer.' };
                }
                const demand = offer.reply.demand;

                if (met && !canMeet(demand, world)) {
                    // The reputation floor is the only demand that can be
                    // refused BY THE WORLD rather than by the player, and the
                    // offer stays open - they are waiting, not gone.
                    return { ok: false, reason: 'You cannot meet that today.' };
                }

                const negotiator = negotiatorFor(offer.targetId, offer.risk);
                const counter = counterFor(negotiator, demand, met);

                if (counter) {
                    // Their one comeback. The offer stays open, and because the
                    // reply is overwritten there is exactly one - `counterFor`
                    // cannot fire twice on the same terms.
                    set(s => ({
                        offers: s.offers.map(o => o.id === offerId
                            ? { ...o, reply: { kind: 'demand', demand: counter } }
                            : o),
                    }));
                    return { ok: true, counter };
                }

                const permanentlyClosed =
                    !met && negotiator.onAnswered === 'withdraw';

                set(s => ({
                    offers: s.offers.map(o => o.id === offerId
                        ? { ...o, status: 'closed', withdrawn: !met }
                        : o),
                    refusalsByTarget: met
                        ? {
                            // MEETING A DEMAND IS REMEMBERED, and it is the
                            // reason the hostile premium is a function. A board
                            // you dealt with honestly is cheaper to overrun
                            // later than one you never spoke to.
                            ...s.refusalsByTarget,
                            [offer.targetId]: Math.max(
                                0, (s.refusalsByTarget[offer.targetId] ?? 0) - 1,
                            ),
                        }
                        : { ...s.refusalsByTarget, [offer.targetId]: (s.refusalsByTarget[offer.targetId] ?? 0) + 1 },
                    closedForever: permanentlyClosed
                        ? { ...s.closedForever, [offer.targetId]: true as const }
                        : s.closedForever,
                }));
                return { ok: true, closed: true };
            },

            withdraw: offerId =>
                set(s => ({
                    offers: s.offers.map(o => o.id === offerId
                        ? { ...o, status: 'closed', withdrawn: true }
                        : o),
                })),

            open: () => get().offers.filter(o => o.status === 'open'),

            hostilePremium: (targetId, fallbackScore) => {
                const state = get();
                const latest = state.offers.find(o => o.targetId === targetId);
                const score = latest?.score ?? fallbackScore;
                // Every met demand takes a slice off what the rude route costs.
                const dealtWith = (state.refusalsByTarget[targetId] ?? 0) < 0
                    ? DEMAND_MET_RELIEF : 0;
                return hostilePremiumFor(Math.max(0, score - dealtWith));
            },

            reset: () => set({ ...initialNegotiationState, _hasHydrated: true }),
        }),
        {
            name: 'succesor_negotiation_v1',
            storage: createJSONStorage(() => zustandStorage),
            partialize: state => ({
                offers: state.offers,
                refusalsByTarget: state.refusalsByTarget,
                closedForever: state.closedForever,
            }),
            onRehydrateStorage: () => state => { state?.setHasHydrated(true); },
        },
    ),
);

/** What the player actually pays if they meet the demand in front of them. */
export const termsForOffer = (offer: Offer): ReturnType<typeof termsFor> =>
    termsFor(
        offer.reply?.kind === 'demand' ? offer.reply.demand : { kind: 'none' },
        true,
    );
