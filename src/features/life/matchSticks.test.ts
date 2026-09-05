// src/features/life/matchSticks.test.ts
//
// ============================================================================
//  A MATCH THAT SURVIVES CLOSING THE OVERLAY
// ============================================================================
//
//  swipeRight set matchStatus to 'MATCHED' and stored nothing. The overlay
//  came up, the player closed it, and the person they had just matched with
//  existed nowhere in the game. Reported as "date de eslesince de profilde
//  esin dursun".
//
//  This exercises the hook directly rather than through the modal, because
//  what was broken was the LOGIC and not the drawing. renderHook is not in
//  this project, so the hook is driven the way React drives it: call it
//  inside a component, keep the returned actions, act on them.
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { useHookupSystem } from './components/useHookupSystem';
import { useFamilyStore } from '../../core/store/useFamilyStore';
import { useStatsStore } from '../../core/store';
import { usePlayerStore } from '../../core/store/usePlayerStore';
import type { PartnerProfile } from '../../data/relationshipTypes';

type Api = ReturnType<typeof useHookupSystem>;

/** Mount the hook and hand back its latest value. */
const mountHook = () => {
    const box: { api: Api } = { api: null as never };
    const Probe = () => {
        box.api = useHookupSystem();
        return null;
    };
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => { tree = renderer.create(React.createElement(Probe)); });
    return {
        get: () => box.api,
        act: (fn: () => void) => { renderer.act(fn); },
        unmount: () => renderer.act(() => { tree.unmount(); }),
    };
};

const existing = (over: Record<string, unknown> = {}): PartnerProfile => ({
    id: 'old', name: 'Sophia Vance', photo: null, love: 80,
    relationYears: 3, isMarried: false, hasPrenup: false,
    stats: {
        ethnicity: 'RoyalEuropean', age: 31, occupation: 'Curator',
        looks: 80, style: 'Elegant', socialClass: 'HighSociety', familyWealth: 60,
        intelligence: 75, jealousy: 10, crazy: 10, libido: 50,
        reputationBuff: 0, financialAidChance: 0, networkPower: 0,
    },
    ...over,
} as PartnerProfile);

/**
 * Force the swipe to land. The formula is
 * (random * 100) + charm * 0.8 >= difficulty, and charm at 100 clears every
 * difficulty the generator produces, so the coin flip is taken out of a test
 * that is not about the coin flip.
 */
const alwaysMatch = () => {
    usePlayerStore.setState({ attributes: { charm: 100 } } as never);
};

beforeEach(() => {
    alwaysMatch();
    useFamilyStore.setState({ partner: null, exPartners: [] } as never);
    useStatsStore.setState({ money: 10_000_000 } as never);
});

describe('matching on the swipe app', () => {
    it('leaves somebody on the profile afterwards', () => {
        const h = mountHook();
        h.act(() => { h.get().startHookup(); });
        const card = h.get().currentCandidate!;
        expect(card).toBeTruthy();

        h.act(() => { h.get().swipeRight(); });
        expect(h.get().matchStatus).toBe('MATCHED');

        const partner = useFamilyStore.getState().partner;
        expect(partner).not.toBeNull();
        expect(partner!.name).toBe(card.name);
        expect(partner!.stats.age).toBe(card.age);
        expect(partner!.gender).toBe(card.gender);
        h.unmount();
    });

    it('and they survive the overlay being closed', () => {
        // The whole complaint. Closing used to be the end of them.
        const h = mountHook();
        h.act(() => { h.get().startHookup(); });
        h.act(() => { h.get().swipeRight(); });
        h.act(() => { h.get().closeHookupModal(); });
        expect(useFamilyStore.getState().partner).not.toBeNull();
        h.unmount();
    });

    it('and a swipe that misses changes nothing', () => {
        usePlayerStore.setState({ attributes: { charm: 0 } } as never);
        const h = mountHook();
        h.act(() => { h.get().startHookup(); });
        // Difficulty can still be low enough to pass on a lucky roll, so this
        // asserts the INVARIANT rather than the outcome: no match, no partner.
        h.act(() => { h.get().swipeRight(); });
        if (h.get().matchStatus === 'NO_MATCH') {
            expect(useFamilyStore.getState().partner).toBeNull();
        }
        h.unmount();
    });
});

describe('and leaving the partner you already had', () => {
    it('ends it, and says what it cost', () => {
        useFamilyStore.setState({ partner: existing() } as never);
        const h = mountHook();
        h.act(() => { h.get().startHookup(); });
        h.act(() => { h.get().swipeRight(); });

        const now = useFamilyStore.getState().partner!;
        expect(now.name).not.toBe('Sophia Vance');
        // A settlement that happens silently is the hidden counter this
        // game's design keeps arguing against.
        expect(h.get().lastConsequence).not.toBeNull();
        expect(h.get().lastConsequence!.partnerName).toBe('Sophia Vance');
        h.unmount();
    });

    it('and an unprotected marriage costs half of everything', () => {
        useFamilyStore.setState({
            partner: existing({ isMarried: true, hasPrenup: false }),
        } as never);
        const h = mountHook();
        h.act(() => { h.get().startHookup(); });
        h.act(() => { h.get().swipeRight(); });

        const c = h.get().lastConsequence!;
        // A marriage always finds out, so this is not a probabilistic check.
        expect(c.caught).toBe(true);
        expect(c.settlement).toBe(10_000_000 * 0.5);
        h.unmount();
    });

    it('and a prenup means it costs nothing', () => {
        useFamilyStore.setState({
            partner: existing({ isMarried: true, hasPrenup: true }),
        } as never);
        const h = mountHook();
        h.act(() => { h.get().startHookup(); });
        h.act(() => { h.get().swipeRight(); });
        expect(h.get().lastConsequence!.settlement).toBe(0);
        h.unmount();
    });

    it('but being single costs nothing and reports nothing', () => {
        const h = mountHook();
        h.act(() => { h.get().startHookup(); });
        h.act(() => { h.get().swipeRight(); });
        expect(h.get().lastConsequence).toBeNull();
        h.unmount();
    });
});
