// src/core/store/tutorialFlags.test.ts
//
// ============================================================================
//  THE STEP CLEARS WHEN THE PLAYER DOES THE THING
// ============================================================================
//
//  It did not, and this is the fault behind every "the tutorial does not
//  work" of the last few days.
//
//  The lock clears on `tutorialProductionSet`. That flag was raised only when
//  an update carried `productionLevel` - the OLD percentage field. Production
//  moved to absolute units some time ago and the detail modal has written
//  `productionUnits` ever since, so a player who opened the phone, chose a
//  number and saved raised nothing at all. The screen stayed dim, the card
//  stayed up, and the only way out was the twelve-second skip.
//
//  Which is the worst shape a bug can have: the player does exactly what they
//  were told, the game does not acknowledge it, and the only available
//  conclusion is that they misunderstood.
//
//  The second half of the same story is the seed. It carried
//  `productionLevel: 50` with no units beside it, which production.ts reads as
//  a legacy save and migrates - so a NEW GAME was already running at half
//  capacity while the father said the line was cold and the card asked for a
//  target. Both of them describing a world the game was not in.
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

describe('the line the player inherits', () => {
    it('is cold, which is what the father says it is', () => {
        // 22 employees, tier one. Whatever the capacity works out to, the
        // target is zero until somebody sets one.
        expect(resolveTargetUnits(phone(), 22, 1)).toBe(0);
    });

    it('carries units, not the percentage that triggers the migration', () => {
        // The seed held `productionLevel` and no units, so every new game took
        // the legacy branch of resolveTargetUnits and started at 50% of
        // capacity. If this ever fails, the opening is lying again.
        expect(phone().productionUnits).toBe(0);
        expect(phone().productionLevel).toBeUndefined();
    });

    it('and its marketing budget is zero, so being unknown is real', () => {
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
