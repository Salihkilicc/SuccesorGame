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
//  FOUR OF THOSE FIVE. "Every product open" was taken back the first time it
//  was pressed, and the reason is worth reading before anybody puts it back:
//  see the shelved block in `applyAdminMode`.
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
    /**
     * SHELVED, and kept at zero.
     *
     * The button used to open every product and no longer does; see the note
     * in `applyAdminMode`. The field stays so a save, a test or a future
     * demo switch has the same shape, and so that "zero" is a statement
     * rather than a missing number.
     */
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
    //  SHELVED: EVERY PRODUCT OPEN
    // ------------------------------------------------------------------
    //  Asked for in the first place as part of "everything already in it",
    //  and taken back the moment it was actually pressed: "let all of these
    //  products not be open".
    //
    //  Which is right, and it is worth writing down why, because the other
    //  four steps stayed. Money, research, casino standing and the
    //  collection all SKIP A GRIND. They hand the player the position that
    //  forty years of play would have reached, and the game after the press
    //  is the same game.
    //
    //  Opening every product is a different thing. The tech tree is not a
    //  grind to be skipped, it is the decision the company screen is ABOUT:
    //  which category to enter, what to unlock next, what to leave shut.
    //  Turning all of it on does not fast forward that decision, it deletes
    //  it - and leaves a screen of things the player did not choose and has
    //  no reason to care about.
    //
    //  So the button no longer touches products. A player who wants one at
    //  the top of the tree has a quadrillion dollars and a billion research
    //  points and can open it in the ordinary way, in the order the tree
    //  intends, which is the part that was worth keeping.
    //
    //  Kept commented rather than removed, in case the position it produced
    //  is ever wanted for a screenshot or a demo. `report.productsUnlocked`
    //  stays zero and the dialog no longer claims a number.
    // ------------------------------------------------------------------
    // try {
    //     const { useProductStore } = require('./store/useProductStore');
    //     const store = useProductStore.getState() as {
    //         unlockableProducts?: { id: string; isUnlocked: boolean }[];
    //     };
    //     const list = store.unlockableProducts;
    //     if (Array.isArray(list)) {
    //         useProductStore.setState({
    //             unlockableProducts: list.map(p => ({ ...p, isUnlocked: true })),
    //         });
    //         report.productsUnlocked =
    //             (useProductStore.getState() as typeof store)
    //                 .unlockableProducts?.filter(p => p.isUnlocked).length ?? 0;
    //     }
    // } catch { /* product store not standing */ }

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
        // ITEMS, and NOT the generation gated shelf. Deliberate: this button
        // exists to put the whole catalogue in the collection, and a debug
        // grant that stopped short of the locked stock would leave the
        // prestige score short of a hundred with nothing on screen to say
        // why. See features/shopping/logic/shelfNow.ts for the shop's rule.
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
