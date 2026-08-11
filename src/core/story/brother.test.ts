// src/core/story/brother.test.ts
//
// The brother is one relationship stored in two systems, and for a Snake they
// run in OPPOSITE directions. That is not a bug you find by playing - both
// halves look right on their own, and the only symptom is that being kind to
// him slowly makes him more dangerous.
//
// These pin the conversion in both directions.

// From loyalty.ts rather than governance.ts: the re-export would drag in
// i18n and AsyncStorage, and this is arithmetic.
import { loyaltyOf, trustForLoyalty } from '../market/loyalty';
import { INITIAL_DIALS } from './state';

const brother = (trust: number) => ({ id: 'brother', trait: 'Snake' as const, trust, shareCount: 1_500_000 });
const director = (trust: number) => ({ id: 'x', trait: 'Loyalist' as const, trust, shareCount: 1_000_000 });

describe('trustForLoyalty is the exact inverse of loyaltyOf', () => {
    it('round-trips for a Snake', () => {
        for (let t = 0; t <= 100; t += 5) {
            const m = brother(t);
            expect(trustForLoyalty('Snake', loyaltyOf(m as any))).toBe(t);
        }
    });

    it('round-trips for everyone else', () => {
        for (let t = 0; t <= 100; t += 5) {
            const m = director(t);
            expect(trustForLoyalty('Loyalist', loyaltyOf(m as any))).toBe(t);
        }
    });

    it('inverts for a Snake and does not for anyone else', () => {
        expect(loyaltyOf(brother(65) as any)).toBe(35);
        expect(loyaltyOf(director(65) as any)).toBe(65);
    });

    it('clamps rather than running off the end', () => {
        expect(trustForLoyalty('Snake', 140)).toBe(0);
        expect(trustForLoyalty('Snake', -40)).toBe(100);
        expect(trustForLoyalty('Loyalist', 140)).toBe(100);
    });
});

describe('warming him up warms him up in BOTH systems', () => {
    // The failure this prevents: a scene nudges brotherTrust +12, the story
    // shows him warmer, and the cap table - which is what actually votes -
    // records him as twelve points more dangerous.
    const nudged = (startTrust: number, delta: number) => {
        const m = brother(startTrust);
        const nextTrust = trustForLoyalty('Snake', loyaltyOf(m as any) + delta);
        return { trust: nextTrust, loyalty: loyaltyOf({ ...m, trust: nextTrust } as any) };
    };

    it('a positive nudge raises loyalty and LOWERS his stored trust', () => {
        const before = brother(60);
        const after = nudged(60, +12);
        expect(loyaltyOf(before as any)).toBe(40);
        expect(after.loyalty).toBe(52);
        expect(after.trust).toBeLessThan(before.trust);
    });

    it('a negative nudge does the reverse', () => {
        const after = nudged(60, -15);
        expect(after.loyalty).toBe(25);
        expect(after.trust).toBe(75);
    });

    it('the direction never flips, at any starting point', () => {
        for (let t = 0; t <= 100; t += 10) {
            const start = loyaltyOf(brother(t) as any);
            expect(nudged(t, +5).loyalty).toBeGreaterThanOrEqual(start);
            expect(nudged(t, -5).loyalty).toBeLessThanOrEqual(start);
        }
    });
});

describe('the two agree on day one', () => {
    it('his seeded board trust is the inverse of the story dial', () => {
        // Derived in the cap table rather than typed in, so a rebalance of one
        // cannot leave the other behind.
        const seeded = trustForLoyalty('Snake', INITIAL_DIALS.brotherTrust);
        expect(seeded).toBe(60);
        expect(loyaltyOf(brother(seeded) as any)).toBe(INITIAL_DIALS.brotherTrust);
    });

    it('he starts not behind you, without being a crisis', () => {
        // 40 is below halfway - a real drag on the board's weighted average -
        // but nowhere near the 35 average that starts a removal.
        expect(INITIAL_DIALS.brotherTrust).toBeLessThan(50);
        expect(INITIAL_DIALS.brotherTrust).toBeGreaterThan(25);
    });
});
