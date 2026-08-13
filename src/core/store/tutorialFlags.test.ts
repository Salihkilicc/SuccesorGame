// src/core/store/tutorialFlags.test.ts
//
// ============================================================================
//  THE STEP CLEARS WHEN THE PLAYER DOES THE THING
// ============================================================================
//
//  It did not, and this is the fault behind every "the tutorial does not
//  work" of the last few days.
//
//  `tutorialProductionSet` was raised only when an update carried
//  `productionLevel` - the OLD percentage field. Production moved to absolute
//  units some time ago and the detail modal has written `productionUnits`
//  ever since, so a player who opened the phone, chose a number and saved
//  raised nothing at all. The screen stayed dim, the card stayed up, and the
//  only way out was the twelve-second skip.
//
//  Which is the worst shape a bug can have: the player does exactly what they
//  were told, the game does not acknowledge it, and the only available
//  conclusion is that they misunderstood.
//
//  Both flags are covered here rather than just the one the opening lock
//  happens to wait on today. That lock is now the marketing one - see
//  data/tutorial/sequence.ts - and the production flag still has to work,
//  because which lesson comes first is a design decision and this file is
//  about the wiring underneath it.
// ============================================================================

import { useProductStore, initialProductState } from './useProductStore';
import { useStoryStore, initialStoryState } from './useStoryStore';
import { resolveTargetUnits } from '../market/production';

const fresh = () => {
    useProductStore.setState({ ...initialProductState });
    useStoryStore.setState({ ...initialStoryState, flags: {} });
};

const raised = (flag: string) =>
    !!(useStoryStore.getState().flags as Record<string, true>)[flag];

const phone = () =>
    useProductStore.getState().products.find(p => p.id === 'smart_phone')!;

beforeEach(fresh);

describe('the company the player inherits', () => {
    it('is already making the phone, because a product exists', () => {
        // It was briefly seeded at zero, on a reading of "the line is cold"
        // that made the first hour worse: an inherited company that builds
        // nothing has no revenue, and the player's opening act became
        // switching the machine on rather than deciding anything.
        expect(resolveTargetUnits(phone(), 22, 1)).toBeGreaterThan(0);
    });

    it('at half of capacity, in units rather than by migration', () => {
        // The seed used to hold `productionLevel` and no units, so every new
        // game took the LEGACY branch of resolveTargetUnits - it ran at half
        // capacity because a compatibility path fired, not because anybody
        // wrote a starting figure. Same number, stated on purpose now.
        const max = resolveTargetUnits(
            { ...phone(), productionUnits: 999_999 }, 22, 1,
        );
        expect(phone().productionUnits).toBe(Math.floor(max / 2));
        expect(phone().productionLevel).toBeUndefined();
    });

    it('and nobody has heard of it, which is the first real hole', () => {
        // The thing that is genuinely undone, and what the opening lesson
        // now points at.
        expect(phone().marketingBudget).toBe(0);
    });
});

describe('setting a production target', () => {
    it('raises the flag the opening lock waits on', () => {
        expect(raised('tutorialProductionSet')).toBe(false);
        // Exactly what ProductDetailModal sends on save.
        useProductStore.getState().updateProduct('smart_phone', { productionUnits: 400 });
        expect(raised('tutorialProductionSet')).toBe(true);
    });

    it('including through the old percentage field, for old saves', () => {
        useProductStore.getState().updateProduct('smart_phone', { productionLevel: 50 });
        expect(raised('tutorialProductionSet')).toBe(true);
    });

    it('even when the number chosen is zero', () => {
        // Deciding to build nothing is still a decision, and the alternative
        // is a player held on a dimmed screen for choosing badly.
        useProductStore.getState().updateProduct('smart_phone', { productionUnits: 0 });
        expect(raised('tutorialProductionSet')).toBe(true);
    });

    it('but not when something else about the product changes', () => {
        // The tick writes results back. If any update raised the flag, the
        // step would clear itself in the first quarter without the player
        // having touched anything.
        useProductStore.getState().updateProduct('smart_phone', { revenue: 90_000 });
        useProductStore.getState().updateProduct('smart_phone', { inventory: 120 });
        expect(raised('tutorialProductionSet')).toBe(false);
    });
});

describe('setting a marketing budget', () => {
    it('raises its own flag when money is actually committed', () => {
        useProductStore.getState().updateProduct('smart_phone', { marketingBudget: 400_000 });
        expect(raised('tutorialMarketingSet')).toBe(true);
    });

    it('and zero does not count, because that is not the lesson', () => {
        useProductStore.getState().updateProduct('smart_phone', { marketingBudget: 0 });
        expect(raised('tutorialMarketingSet')).toBe(false);
    });
});
