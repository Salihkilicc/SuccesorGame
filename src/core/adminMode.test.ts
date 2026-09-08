// src/core/adminMode.test.ts
//
// ============================================================================
//  A CHEAT THAT CLAIMS FIVE THINGS AND DOES THREE
// ============================================================================
//
//  That is the failure mode of every god mode button ever written, and it is
//  worse than it sounds: the two it missed look like bugs in the GAME
//  afterwards, and the player spends an evening chasing a shop that will not
//  sell to them because the money went in and the research did not.
//
//  So every claim on the button is a line here. Not "applyAdminMode was
//  called" - the state of the game afterwards, read back out of the stores.
//
//  And one thing that is not about the feature at all: THERE WAS ALREADY A
//  GOD MODE IN THIS CODEBASE AND NOTHING COULD REACH IT. GodModeModal's only
//  door is the Underworld screen and `underworld` has been false the whole
//  time. That is why the wiring is tested as hard as the behaviour.
// ============================================================================

import {
    ADMIN_MONEY,
    ADMIN_RESEARCH,
    applyAdminMode,
} from './adminMode';
import { useStatsStore } from './store/useStatsStore';
import { usePlayerStore } from './store/usePlayerStore';
import { useProductStore } from './store/useProductStore';
import { useAssetStore } from '../features/shopping/store/useAssetStore';
import { ITEMS } from '../features/shopping/data/shoppingRegistry';
import { REPUTATION_CEILING } from '../features/casino/data/casinoData';

const fresh = () => {
    useStatsStore.setState({ money: 50_000, researchPoints: 0 } as never);
    usePlayerStore.setState({
        reputation: { social: 0, street: 0, business: 0, police: 0, casino: 0 },
    } as never);
    useAssetStore.setState({ ownedItems: [] } as never);
    useProductStore.setState({
        unlockableProducts: (useProductStore.getState() as never as {
            unlockableProducts: { id: string; isUnlocked: boolean }[];
        }).unlockableProducts.map(p => ({ ...p, isUnlocked: false })),
    } as never);
};

const products = () => (useProductStore.getState() as never as {
    unlockableProducts: { id: string; isUnlocked: boolean }[];
}).unlockableProducts;

beforeEach(fresh);

describe('one press really does all five things', () => {
    it('the money', () => {
        applyAdminMode();
        expect(useStatsStore.getState().money).toBe(ADMIN_MONEY);
    });

    it('and it is a number rather than Infinity', () => {
        // ------------------------------------------------------------------
        //  INFINITY IS NOT UNLIMITED MONEY
        // ------------------------------------------------------------------
        //  It formats as a symbol, turns every percentage into NaN and makes
        //  net worth unprintable. A quadrillion is unlimited in every sense
        //  the game can measure and still behaves like a number.
        // ------------------------------------------------------------------
        applyAdminMode();
        const m = useStatsStore.getState().money;
        expect(Number.isFinite(m)).toBe(true);
        expect(m.toLocaleString()).toMatch(/^[\d.,\s]+$/);
        // And large enough that the most expensive thing in the game is dust.
        const dearest = Math.max(...ITEMS.map(i => i.price || 0));
        expect(m / dearest).toBeGreaterThan(1_000);
    });

    it('and the research', () => {
        applyAdminMode();
        expect(useStatsStore.getState().researchPoints).toBe(ADMIN_RESEARCH);
    });

    it('and the casino standing, at the real ceiling and not at 100', () => {
        // Casino reputation is the one on a different scale. Setting it to
        // 100 would open three rooms of seven and look like a failure.
        applyAdminMode();
        expect(usePlayerStore.getState().reputation.casino).toBe(REPUTATION_CEILING);
        expect(REPUTATION_CEILING).toBeGreaterThan(100);
    });

    it('and every product, not most of them', () => {
        const total = products().length;
        expect(total).toBeGreaterThan(10);
        const report = applyAdminMode();
        expect(products().filter(p => p.isUnlocked)).toHaveLength(total);
        expect(report.productsUnlocked).toBe(total);
    });

    it('and the whole catalogue, one of each', () => {
        const report = applyAdminMode();
        const owned = useAssetStore.getState().ownedItems;
        expect(ITEMS.length).toBeGreaterThan(20);
        expect(owned).toHaveLength(ITEMS.length);
        expect(report.assetsOwned).toBe(ITEMS.length);
        // One of each, not fifty of one.
        expect(new Set(owned.map(a => a.id)).size).toBe(ITEMS.length);
    });
});

describe('and it does not break what it touches', () => {
    it('a second press does not double the collection', () => {
        applyAdminMode();
        const once = useAssetStore.getState().ownedItems.length;
        applyAdminMode();
        expect(useAssetStore.getState().ownedItems).toHaveLength(once);
    });

    it('and it does not throw away a collection that was already there', () => {
        // A player who has been buying things and then presses this should
        // keep what they bought, instances and all.
        useAssetStore.setState({
            ownedItems: [{
                ...ITEMS[0], instanceId: 'mine', purchaseDate: 1,
                condition: 62, marketValue: 5, quartersOwned: 9,
            }],
        } as never);
        applyAdminMode();
        const kept = useAssetStore.getState().ownedItems.find(a => a.instanceId === 'mine');
        expect(kept).toBeDefined();
        expect(kept!.condition).toBe(62);
        expect(kept!.quartersOwned).toBe(9);
    });

    it('and every asset it adds is a complete one', () => {
        // A half-built asset would blow up the upkeep and the valuation on
        // the next tick, three screens away from this button.
        applyAdminMode();
        for (const a of useAssetStore.getState().ownedItems) {
            expect(typeof a.instanceId).toBe('string');
            expect(a.instanceId.length).toBeGreaterThan(0);
            expect(a.condition).toBe(100);
            // THE FIELD IS `quartersOwned`. Written as `quartersHeld` first, which
            // type-checked inside a loose object literal and left every asset the
            // button added without the number the valuation reads.
            expect(a.quartersOwned).toBe(0);
            expect(Number.isFinite(a.marketValue)).toBe(true);
        }
        // Instance ids are unique, or the sell screen removes the wrong one.
        const ids = useAssetStore.getState().ownedItems.map(a => a.instanceId);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('and the report counts what happened rather than what was intended', () => {
        const report = applyAdminMode();
        expect(report).toEqual({
            money: useStatsStore.getState().money,
            researchPoints: useStatsStore.getState().researchPoints,
            casinoReputation: usePlayerStore.getState().reputation.casino,
            productsUnlocked: products().filter(p => p.isUnlocked).length,
            assetsOwned: useAssetStore.getState().ownedItems.length,
        });
    });
});

describe('and something can actually press it', () => {
    const fs = require('fs');
    const path = require('path');
    const src = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', ...p), 'utf8');

    const screen = src('features', 'os', 'screens', 'SettingsScreen.tsx');
    const logic = src('features', 'os', 'logic', 'useSettingsLogic.ts');

    it('the settings logic calls it', () => {
        expect(logic).toContain('applyAdminMode()');
        expect(logic).toMatch(/handleAdminUnlock,/);
    });

    it('and the settings screen has a row wired to that', () => {
        expect(screen).toContain('actions.handleAdminUnlock');
    });

    it('and it is not the unreachable one', () => {
        // ------------------------------------------------------------------
        //  THE CONTROL THAT MAKES THE TWO ABOVE MEAN SOMETHING
        // ------------------------------------------------------------------
        //  GodModeModal has existed for a long time, is perfectly good, and
        //  is opened only by UnderworldScreen - which sits behind a flag that
        //  is false. This asserts the new door is somewhere else.
        // ------------------------------------------------------------------
        const flags = src('core', 'featureFlags.ts');
        expect(flags).toMatch(/underworld: false/);
        // Comments stripped: this file's own note NAMES the unreachable one,
        // and matching that would pass the test for the wrong reason.
        const live = screen
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/^\s*\/\/.*$/gm, '');
        expect(live).not.toContain('GodModeModal');
        expect(live).toContain('actions.handleAdminUnlock');
    });

    it('and it cannot ship', () => {
        // Behind FEATURES.godMode, which is __DEV__: in a release build the
        // section is not rendered at all.
        expect(screen).toMatch(/\{FEATURES\.godMode && \(/);
        const flags = src('core', 'featureFlags.ts');
        expect(flags).toMatch(/godMode: __DEV__/);
    });

    it('and the player is told what it did, in both languages', () => {
        expect(logic).toContain("t('os.adminDone')");
        for (const lang of ['tr', 'en']) {
            const dict = src('core', 'i18n', `${lang}.ts`);
            for (const key of ['os.admin', 'os.adminUnlock', 'os.adminUnlockSub',
                               'os.adminDone', 'os.adminDoneBody']) {
                expect({ lang, key, has: dict.includes(`'${key}':`) })
                    .toEqual({ lang, key, has: true });
            }
        }
    });
});
