// src/core/market/reach.test.ts
//
// ============================================================================
//  THE THREE THINGS THAT MADE THE NEGOTIATION A DECORATION
// ============================================================================
//
//  The mail negotiation has a resistance model, four subjects, personalities,
//  a quarter of waiting, counters, and a refusal that closes a company off for
//  good. All of that worked. Every one of its three exits did nothing:
//
//    1. The board says YES. `answer` required `reply.kind === 'demand'` and
//       fell through to "There is nothing open to answer", which the screen
//       showed as "Not yet". The best outcome in the system was the only one
//       the player could not act on.
//
//    2. The board makes a DEMAND and the player meets it. The offer closed,
//       the screen called goBack(), and nothing was bought. A year of letters
//       ending in a navigation call.
//
//    3. The player goes HOSTILE. The screen navigated to 'Assets' with a
//       `hostileFor` param, and nothing anywhere read it - Assets is the tab;
//       the acquisition screen is 'HostileTakeover' on the root stack.
//
//  Which is why "does this system work" was a fair question with an
//  uncomfortable answer: the front half was finished and the back half was
//  never wired.
// ============================================================================

import { useNegotiationStore, initialNegotiationState } from '../store/useNegotiationStore';
import { friendlyLock, isOutOfReach, FRIENDLY_LOCK_MARKET_CAP } from './reach';
import {
    priceFor, resistance, SECOND_APPROACH_PENALTY, GOODWILL_FLOOR,
} from './negotiation';
import { FRIENDLY_PREMIUM, HOSTILE_MULTIPLE, quoteAcquisition } from './mergers';
import { INITIAL_MARKET_ITEMS } from '../../features/assets/data/marketData';

const fresh = () => useNegotiationStore.setState({
    ...initialNegotiationState, _hasHydrated: true,
});

const world = { publicReputation: 100, capital: 1e15, price: 0 };

/** An offer sitting in the inbox with a given reply, ready to be answered. */
const waiting = (reply: any) => {
    fresh();
    useNegotiationStore.setState({
        offers: [{
            id: 'offer-x', targetId: 'pear', targetName: 'Pear Inc.',
            subject: 'purchase', sentQuarter: 1, status: 'open',
            score: 0.1, risk: 'Medium', reply,
        } as any],
    });
    return 'offer-x';
};

describe('a board that says yes', () => {
    it('can be agreed with', () => {
        // It could not. This is the whole bug in one assertion.
        const id = waiting({ kind: 'accept' });
        const r = useNegotiationStore.getState().answer(id, true, world);
        expect(r.ok).toBe(true);
    });

    it('and agreeing hands back terms to buy at', () => {
        // Without this the answer closed the offer and the player owned
        // nothing. `agreed` is what the acquisition screen needs.
        const id = waiting({ kind: 'accept' });
        const r = useNegotiationStore.getState().answer(id, true, world);
        expect(r.agreed).toEqual({
            targetId: 'pear',
            targetName: 'Pear Inc.',
            premiumRatio: FRIENDLY_PREMIUM,
            seat: false,
        });
    });

    it('and the offer is finished afterwards', () => {
        const id = waiting({ kind: 'accept' });
        useNegotiationStore.getState().answer(id, true, world);
        expect(useNegotiationStore.getState().offers[0].status).toBe('closed');
    });

    it('while refusing a yes is not an answer', () => {
        // There is nothing to refuse. Walking away is `withdraw`, which is
        // what the second button calls.
        const id = waiting({ kind: 'accept' });
        expect(useNegotiationStore.getState().answer(id, false, world).ok).toBe(false);
    });
});

describe('a demand that is met', () => {
    it('also hands back terms, including the premium that was agreed', () => {
        const id = waiting({ kind: 'demand', demand: { kind: 'price', extraPremium: 0.1 } });
        const r = useNegotiationStore.getState().answer(id, true, world);
        expect(r.agreed?.premiumRatio).toBeCloseTo(FRIENDLY_PREMIUM + 0.1, 6);
    });

    it('and a seat when the seat was the price', () => {
        const id = waiting({ kind: 'demand', demand: { kind: 'seat' } });
        expect(useNegotiationStore.getState().answer(id, true, world).agreed?.seat).toBe(true);
    });

    it('while a demand that is refused buys nothing', () => {
        const id = waiting({ kind: 'demand', demand: { kind: 'seat' } });
        const r = useNegotiationStore.getState().answer(id, false, world);
        expect(r.ok).toBe(true);
        expect(r.agreed).toBeUndefined();
    });
});

// ============================================================================
//  AND THE COMPANIES THAT CANNOT BE BOUGHT OVER THE COUNTER
// ============================================================================
describe('the friendly lock', () => {
    it('catches the trillion-dollar companies and the ones near it', () => {
        const locked = (INITIAL_MARKET_ITEMS as any[])
            .filter(i => i.marketCap > 0 && isOutOfReach(i.marketCap))
            .map(i => i.name);
        expect(locked).toEqual(expect.arrayContaining(['Pear Inc.', 'BitCash']));
        // Six of fifty-nine. A lock that catches everything teaches nothing,
        // and the exception has to stay the exception.
        expect(locked.length).toBeGreaterThan(3);
        expect(locked.length).toBeLessThan(10);
    });

    it('and lets the rest of the market alone', () => {
        const all = (INITIAL_MARKET_ITEMS as any[]).filter(i => i.marketCap > 0);
        const open = all.filter(i => !isOutOfReach(i.marketCap));
        expect(open.length).toBeGreaterThan(all.length * 0.8);
    });

    it('is an absolute line, not a fraction of what the player is worth', () => {
        // Deliberate: a relative rule makes the set of untouchable companies
        // change every quarter, so nothing in the world stays fixed. Pear is
        // untouchable because Pear is enormous, not because you are small -
        // which is also why `friendlyLock` takes one argument.
        expect(friendlyLock.length).toBe(1);
        expect(isOutOfReach(FRIENDLY_LOCK_MARKET_CAP)).toBe(true);
        expect(isOutOfReach(FRIENDLY_LOCK_MARKET_CAP - 1)).toBe(false);
    });

    it('and it always says where to go instead', () => {
        // A shut door with no sign on it is the same as a broken one.
        const lock = friendlyLock(3_000_000_000_000)!;
        expect(lock.hint).toMatch(/mail/i);
        expect(lock.hint).toMatch(/compose/i);
    });
});

describe('the hostile price', () => {
    it('is two and a half times the market for every company', () => {
        for (const item of (INITIAL_MARKET_ITEMS as any[]).filter(i => i.marketCap > 0)) {
            const q = quoteAcquisition(item.marketCap, item.risk ?? 'Medium', true, 1e9);
            expect(q.price / item.marketCap).toBeCloseTo(HOSTILE_MULTIPLE, 6);
        }
    });

    it('and is far above the friendly one, so it is never the lazy option', () => {
        const cap = 1_000_000_000;
        const f = quoteAcquisition(cap, 'Medium', false, 1e9);
        const h = quoteAcquisition(cap, 'Medium', true, 1e9);
        expect(h.price / f.price).toBeGreaterThan(2);
    });
});

// ============================================================================
//  "IS THE REST OF COMPOSE WORKING?" — TWO OF THE FOUR WERE NOT
// ============================================================================
//  `canAccept` has said since it was written that only a PURCHASE or a MERGER
//  can end in ownership: a partnership and a notice of intent always come back
//  with a condition and never with a plain yes. Nothing enforced it on the
//  answering side, so meeting the condition produced terms, the screen carried
//  the terms to the acquisition page, and writing to a company about a
//  COMMERCIAL PARTNERSHIP bought it at the friendly premium.
//
//  What those two letters actually buy is standing: `refusalsByTarget` goes
//  DOWN by one, which is what lowers resistance the next time you write about
//  buying them. That was always the point of the slow route.
// ============================================================================

const answering = (subject: string, reply: any, over: any = {}) => {
    fresh();
    useNegotiationStore.setState({
        offers: [{
            id: 'offer-y', targetId: 'medidevice', targetName: 'MediDevice',
            subject, sentQuarter: 1, status: 'open',
            score: 0.1, risk: 'Medium', marketCap: 1_000_000_000, reply, ...over,
        } as any],
    });
    return 'offer-y';
};

describe('the four subject lines', () => {
    it.each(['purchase', 'merger'])('%s can end in owning them', (subject) => {
        const id = answering(subject, { kind: 'demand', demand: { kind: 'seat' } });
        expect(useNegotiationStore.getState().answer(id, true, world).agreed).toBeDefined();
    });

    it.each(['partnership', 'notice'])('%s never does, whatever is agreed', (subject) => {
        const id = answering(subject, { kind: 'demand', demand: { kind: 'none' } });
        const r = useNegotiationStore.getState().answer(id, true, world);
        expect(r.ok).toBe(true);
        expect(r.closed).toBe(true);
        expect(r.agreed).toBeUndefined();
    });

    it('and what a partnership buys instead is a warmer desk', () => {
        // The mechanic that was already there, had nothing pointing at it,
        // and was clamped to zero anyway - see the goodwill block below.
        const id = answering('partnership', { kind: 'demand', demand: { kind: 'none' } });
        useNegotiationStore.getState().answer(id, true, world);
        expect(useNegotiationStore.getState().refusalsByTarget.medidevice).toBeLessThan(0);
    });
});

// ============================================================================
//  AND THE MONEY CHECK, WHICH HAD NOTHING TO CHECK AGAINST
// ============================================================================
//  `canMeet` prices a price demand at `capital >= price * (1 + extra)`, and
//  the screen passed `price: 0` - so it read `capital >= 0` and every premium
//  in the game was affordable. The player agreed to a number they could not
//  fund and was bounced by the financing screen one tap later, with nothing
//  connecting the two refusals.
// ============================================================================
describe('agreeing to a price you cannot raise', () => {
    const demand = { kind: 'demand', demand: { kind: 'price', extraPremium: 0.10 } };
    const poor = { publicReputation: 100, capital: 50_000_000, price: 0 };

    it('is refused, and refused before the financing screen', () => {
        const id = answering('purchase', demand);
        const r = useNegotiationStore.getState().answer(id, true, poor);
        expect(r.ok).toBe(false);
        expect(r.reason).toMatch(/cannot raise/i);
    });

    it('and they have not gone away — the letter stays open', () => {
        // The same shape as the reputation floor: short of something, not
        // rejected. Closing it would punish a player for reading their post.
        const id = answering('purchase', demand);
        useNegotiationStore.getState().answer(id, true, poor);
        expect(useNegotiationStore.getState().offers[0].status).toBe('open');
    });

    it('while a company that can afford it goes through', () => {
        const id = answering('purchase', demand);
        // 1B market cap at the friendly premium plus ten points = 1.25B.
        const rich = { publicReputation: 100, capital: 2_000_000_000, price: 0 };
        expect(useNegotiationStore.getState().answer(id, true, rich).ok).toBe(true);
    });

    it('and the price it checks is the one the acquisition screen will charge', () => {
        // Same premium `termsFor` produces and `quoteAcquisition` applies, so
        // the letter, the button and the till agree.
        const offer = { marketCap: 1_000_000_000 } as any;
        expect(priceFor(offer, 0.10)).toBeCloseTo(1_000_000_000 * (1 + FRIENDLY_PREMIUM + 0.10), 0);
    });

    it('and a save written before the price was frozen is not treated as free', () => {
        // No market cap on the offer: `priceFor` says it does not know, and
        // the world's own figure stands rather than zero standing in for it.
        expect(priceFor({} as any, 0.1)).toBeUndefined();
    });
});

// ============================================================================
//  AND THE GOODWILL ITSELF, WHICH TWO CLAMPS HAD SWITCHED OFF
// ============================================================================
//  `Math.max(0, ...)` in the store and `Math.max(0, priorRefusals)` in
//  `resistance`. Between them, meeting a board's condition could never put you
//  in credit - and since a partnership is signed BEFORE anybody has refused
//  you, the normal case scored exactly zero. DEMAND_MET_RELIEF and the comment
//  about an honestly-handled board being cheaper to overrun were both
//  describing a mechanic that arithmetic had turned off.
// ============================================================================
describe('goodwill', () => {
    const base = {
        targetMarketCap: 1e9, acquirerValuation: 5e9, risk: 'Medium' as const,
        subject: 'purchase' as const, personalityShift: 0,
    };

    it('makes the next letter easier, which it did not', () => {
        expect(resistance({ ...base, priorRefusals: -1 }))
            .toBeLessThan(resistance({ ...base, priorRefusals: 0 }));
    });

    it('by exactly what a refusal costs, in the other direction', () => {
        const neutral = resistance({ ...base, priorRefusals: 0 });
        expect(resistance({ ...base, priorRefusals: -1 }))
            .toBeCloseTo(neutral - SECOND_APPROACH_PENALTY, 6);
        expect(resistance({ ...base, priorRefusals: 1 }))
            .toBeCloseTo(neutral + SECOND_APPROACH_PENALTY, 6);
    });

    it('and it cannot be farmed', () => {
        // One good turn is remembered. Four is a routine - and four signed
        // partnerships walking you into anybody is not a negotiation system.
        expect(resistance({ ...base, priorRefusals: -4 }))
            .toBe(resistance({ ...base, priorRefusals: GOODWILL_FLOOR }));
    });

    it('and the store will not bank more than one either', () => {
        const id = answering('partnership', { kind: 'demand', demand: { kind: 'none' } });
        for (let i = 0; i < 4; i++) {
            useNegotiationStore.setState({
                offers: [{ ...useNegotiationStore.getState().offers[0], status: 'open' } as any],
            });
            useNegotiationStore.getState().answer(id, true, world);
        }
        expect(useNegotiationStore.getState().refusalsByTarget.medidevice).toBe(GOODWILL_FLOOR);
    });
});
