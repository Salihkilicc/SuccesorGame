// src/core/adminMode.ts
//
// ============================================================================
//  A RUN WITH EVERYTHING ALREADY IN IT
// ============================================================================
//
//  For playing the late game without playing forty years to reach it. Asked
//  for as unlimited money, everything bought, every product open, casino
//  standing at the top and research that never runs out.
//
//  ---------------------------------------------------------------------------
//  WHY THIS IS A MODULE AND NOT SIX LINES IN A BUTTON
//  ---------------------------------------------------------------------------
//  A god mode button is the single easiest thing in a codebase to get wrong
//  and the hardest to notice: it claims five things and does three, and the
//  two it misses look like bugs in the game rather than in the button. Every
//  claim it makes is a line here and a line in the test beside it.
//
//  It is also the only place that reaches into six stores at once, which is
//  exactly the shape that goes stale. `applyAdminMode` returns a REPORT of
//  what it did, so the test can check the game afterwards rather than check
//  that the function was called.
//
//  ---------------------------------------------------------------------------
//  AND WHY THE MONEY IS FINITE
//  ---------------------------------------------------------------------------
//  `Infinity` is not unlimited money, it is a number that formats as "∞",
//  turns every percentage into NaN and makes `netWorth` unprintable. A
//  quadrillion is unlimited in every sense the game can tell: the largest
//  thing anybody can buy is a rounding error against it, and it still adds,
//  subtracts and formats like a number.
// ============================================================================

/** Unlimited, in every sense the game can measure. */
export const ADMIN_MONEY = 1_000_000_000_000_000;

/** The same, for research. Nothing costs a fraction of this. */
export const ADMIN_RESEARCH = 1_000_000_000;

import type { OwnedAsset } from '../features/shopping/types';

/**
 * What one press changed.
 *
 * Counts rather than booleans, so a step that ran and did nothing - a
 * catalogue that came back empty, a product list that failed to load - reads
 * as zero rather than as success.
 */
export type AdminReport = {
    money: number;
    researchPoints: number;
    casinoReputation: number;
    productsUnlocked: number;
    assetsOwned: number;
};

/**
 * Turn everything on.
 *
 * Every store is reached through `require` inside the call for the same
 * reason the sponsorship penalty is: this module is imported by tests that
 * have no stores standing, and a missing one must skip its step rather than
 * take the other four down with it.
 */
export const applyAdminMode = (): AdminReport => {
    const report: AdminReport = {
        money: 0,
        researchPoints: 0,
        casinoReputation: 0,
        productsUnlocked: 0,
        assetsOwned: 0,
    };

    // ------------------------------------------------------------------
    //  MONEY AND RESEARCH
    // ------------------------------------------------------------------
    try {
        const { useStatsStore } = require('./store/useStatsStore');
        const stats = useStatsStore.getState();
        stats.setField('money', ADMIN_MONEY);
        stats.setResearchPoints(ADMIN_RESEARCH);
        report.money = useStatsStore.getState().money;
        report.researchPoints = useStatsStore.getState().researchPoints;
    } catch { /* stats store not standing */ }

    // ------------------------------------------------------------------
    //  THE CASINO KNOWS YOU
    // ------------------------------------------------------------------
    //  REPUTATION_CEILING rather than 100. Casino standing is the one
    //  reputation on a different scale - see features/casino/data/casinoData -
    //  and setting it to 100 would open three rooms of seven and look like
    //  the button had failed.
    // ------------------------------------------------------------------
    try {
        const { usePlayerStore } = require('./store/usePlayerStore');
        const { REPUTATION_CEILING } = require('../features/casino/data/casinoData');
        usePlayerStore.getState().updateReputation('casino', REPUTATION_CEILING);
        report.casinoReputation = usePlayerStore.getState().reputation.casino;
    } catch { /* player store not standing */ }

    // ------------------------------------------------------------------
    //  EVERY PRODUCT OPEN
    // ------------------------------------------------------------------
    //  Written straight onto the list rather than through `unlockProduct`,
    //  which charges research and cash and refuses anything whose
    //  prerequisite is shut. Paying for them out of a quadrillion would work
    //  and would also make the order matter, which is a reason for this to
    //  fail quietly on a bad day.
    // ------------------------------------------------------------------
    try {
        const { useProductStore } = require('./store/useProductStore');
        const store = useProductStore.getState() as {
            unlockableProducts?: { id: string; isUnlocked: boolean }[];
        };
        const list = store.unlockableProducts;
        if (Array.isArray(list)) {
            useProductStore.setState({
                unlockableProducts: list.map(p => ({ ...p, isUnlocked: true })),
            });
            report.productsUnlocked =
                (useProductStore.getState() as typeof store)
                    .unlockableProducts?.filter(p => p.isUnlocked).length ?? 0;
        }
    } catch { /* product store not standing */ }

    // ------------------------------------------------------------------
    //  AND THE WHOLE CATALOGUE IN THE COLLECTION
    // ------------------------------------------------------------------
    //  One of each, at full condition, bought this instant. `quartersHeld` at
    //  zero on purpose: the collection ages from there like anything else, so
    //  the upkeep and the drift both behave normally from the moment the
    //  button is pressed. See core/luxury/upkeep.ts.
    //
    //  ADDED TO what is already owned rather than replacing it, so pressing
    //  this twice does not throw away a collection the player built.
    // ------------------------------------------------------------------
    try {
        const { useAssetStore } = require('../features/shopping/store/useAssetStore');
        const { ITEMS } = require('../features/shopping/data/shoppingRegistry');
        // TYPED, because this was written untyped first and the age field was
        // spelled `quartersHeld`. `OwnedAsset` calls it `quartersOwned`, so
        // every asset the button added carried a junk field and not the real
        // one - and the valuation, which reads the real one, saw undefined on
        // all forty of them. A loose object literal is how that got through.
        const owned = useAssetStore.getState().ownedItems as OwnedAsset[];
        const have = new Set(owned.map(a => a.id));
        const now = Date.now();
        const fresh = (ITEMS as OwnedAsset[])
            .filter(item => !have.has(item.id))
            .map((item, i): OwnedAsset => ({
                ...(item as OwnedAsset),
                instanceId: `admin_${now}_${i}`,
                purchaseDate: now,
                condition: 100,
                marketValue: item.price ?? 0,
                quartersOwned: 0,
            }));
        useAssetStore.setState({ ownedItems: [...owned, ...fresh] });
        report.assetsOwned = useAssetStore.getState().ownedItems.length;
    } catch { /* the shop is behind a flag, or its store is not standing */ }

    return report;
};
