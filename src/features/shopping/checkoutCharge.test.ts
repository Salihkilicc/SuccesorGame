// src/features/shopping/checkoutCharge.test.ts
//
// ============================================================================
//  EVERY PURCHASE IN THE SHOP WAS PAID FOR TWICE
// ============================================================================
//
//  Found while counting the catalogue for the LuxoNet work, which is the only
//  reason it was found at all: nothing about the screen looks wrong. The cart
//  adds up correctly, the total shown is the total charged, the item appears
//  in the inventory. The money is simply taken again afterwards.
//
//  ---------------------------------------------------------------------------
//  THE TWO CASHIERS
//  ---------------------------------------------------------------------------
//  `CartScreen.handlePaymentComplete` runs three things in a row:
//
//      spendMoney(orderTotal);                     // subtotal + 8% + shipping
//      purchaseCart();                             // register the assets
//      cart.forEach(i => handleBuyLuxury(i));      // brand surge + headline
//
//  The third was only ever wanted for the last two of its jobs. But
//  `handleBuyLuxury` is also a cashier: it calls `luxoStore.buyAsset`, and
//  when that comes back "Item not found in LuxoNet catalog" it falls through
//  to `spendMoney(price)` on its own.
//
//  And it ALWAYS comes back not found. There are two luxury catalogues in this
//  project and they share no ids:
//
//      LuxeNet   features/shopping/data/categories   27 shops, 85 items
//      LuxoNet   core/store/useLuxoNetStore           4 items
//
//  The cart is filled from the first and the lookup is done against the
//  second. So every item bought through the shop takes its price out of the
//  wallet a second time, on top of a total that already included it.
//
//  Measured on a $3.9M car: 4,212,000 charged, then 3,900,000 charged again.
//  2.08 times the sticker price, and the screen reports the first number.
//
//  ---------------------------------------------------------------------------
//  WHY THE TEST IS SHAPED LIKE THIS
//  ---------------------------------------------------------------------------
//  The defect does not live in any one of the three functions. Each is correct
//  alone; `handleBuyLuxury` charging for a purchase it was handed is exactly
//  what the preview modal in the profile screen needs from it. The defect is
//  in the COMPOSITION, so the test has to run the composition - and then check
//  that the screen is still that composition, or the test drifts away from the
//  code it is describing and stays green over a broken checkout.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { useStatsStore } from '../../core/store/useStatsStore';
import { useAssetStore } from './store/useAssetStore';
import { announceLuxuryPurchase, handleBuyLuxury } from '../../logic/personalEventsLogic';
import { ITEMS, SHOPS } from './data/shoppingRegistry';
import { initialLuxuryCatalog } from '../../core/store/useLuxoNetStore';
import type { CartItem } from './store/useAssetStore';

const cartScreen = () =>
    fs.readFileSync(path.join(__dirname, 'screens', 'CartScreen.tsx'), 'utf8');

/**
 * The same file with its comments taken out.
 *
 * Needed because the note left at the fix names the function it stopped
 * calling, and a plain search finds the note. This project has had that exact
 * false positive twice before, both times in an audit reading source as text.
 */
const cartScreenLive = () =>
    cartScreen()
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

/** The cart maths, copied from the screen because that is what it charges. */
const orderTotalOf = (cart: { price: number }[]) => {
    const subtotal = cart.reduce((a, i) => a + i.price, 0);
    const shipping = cart.length > 0 ? 5000 : 0;
    return subtotal + shipping + subtotal * 0.08;
};

/**
 * `handlePaymentComplete`, run outside the screen.
 *
 * Deliberately the same three calls in the same order rather than a rendered
 * component: the point of failure is which functions are called, not what the
 * screen looks like while calling them.
 */
const checkout = (cart: CartItem[]) => {
    const { spendMoney } = useStatsStore.getState();
    const orderTotal = orderTotalOf(cart);

    spendMoney(orderTotal);
    useAssetStore.getState().purchaseCart();

    for (const item of cart) {
        announceLuxuryPurchase({
            id: item.id,
            name: item.name,
            price: item.price,
            prestigeScore: Math.min(600, Math.max(50, Math.round(item.price / 80000))),
            category: item.category,
            brand: item.name.split(' ')[0] || 'Luxury',
        });
    }

    return orderTotal;
};

/**
 * Enough to buy anything in the shop several times over.
 *
 * Has to be, or the two cashiers hide behind each other: the second charge is
 * refused for insufficient funds, the wallet is left alone, and the test goes
 * green over the bug it was written for. The catalogue tops out near a
 * billion, so this is above three of the most expensive item.
 */
const START = 20_000_000_000;

/** The dearest thing in the shop, so the overcharge is at its largest. */
const dearest = () => [...ITEMS].sort((a, b) => b.price - a.price)[0];

beforeEach(() => {
    useAssetStore.getState().reset();
    useStatsStore.setState({ money: START });
});

describe('the shop charges once', () => {
    it('a single item costs the total the screen quoted, and nothing more', () => {
        // THE DEFECT, as one assertion. Before the fix the wallet was short by
        // another full sticker price on top of this.
        const item = dearest();
        useAssetStore.getState().addToCart(item);

        const quoted = checkout(useAssetStore.getState().cart);
        expect(useStatsStore.getState().money).toBe(START - quoted);
    });

    it('and a cart of three is not three extra charges', () => {
        // The overcharge scaled with the cart, so a full basket was the worst
        // case and the one a player would actually hit.
        const three = [...ITEMS].sort((a, b) => b.price - a.price).slice(0, 3);
        expect(three.length).toBe(3);
        for (const i of three) useAssetStore.getState().addToCart(i);

        const quoted = checkout(useAssetStore.getState().cart);
        expect(useStatsStore.getState().money).toBe(START - quoted);
    });

    it('and the asset is registered once, not once per cashier', () => {
        const item = dearest();
        useAssetStore.getState().addToCart(item);
        checkout(useAssetStore.getState().cart);

        const owned = useAssetStore.getState().ownedItems.filter(o => o.id === item.id);
        expect(owned.length).toBe(1);
    });

    it('and a player who can just afford the quote gets the whole purchase', () => {
        // THE BOUNDARY, and the one place the bug was visible from the chair.
        // `spendMoney` refuses rather than going negative, so the second charge
        // failed silently for a player buying at the top of their means - and
        // `handleBuyLuxury` returning failure takes the brand surge and the
        // headline down with it. You paid the full quote and the world did not
        // notice you had bought anything.
        const item = dearest();
        useAssetStore.getState().addToCart(item);
        useStatsStore.setState({ money: orderTotalOf([item]), brandValue: 18 });

        checkout(useAssetStore.getState().cart);
        expect(useStatsStore.getState().money).toBe(0);
        expect(useStatsStore.getState().brandValue).toBeGreaterThan(18);
    });
});

describe('and it still does the things it was called for', () => {
    it('the brand surge still happens', () => {
        // The fix must not be "stop calling handleBuyLuxury". Two thirds of
        // what it does is the reason the call is there.
        const item = dearest();
        useStatsStore.setState({ brandValue: 18 });
        useAssetStore.getState().addToCart(item);
        checkout(useAssetStore.getState().cart);

        expect(useStatsStore.getState().brandValue).toBeGreaterThan(18);
    });

    it('and the purchase still reaches the news', () => {
        // Checked by CONTENT rather than by count, and not for tidiness:
        // `addNewsBatch` does `set({ newsHistory: formattedItems })`, so it
        // replaces the feed instead of appending to it and the count is 1
        // however many things you buy. That is its own defect - a purchase
        // wipes the quarter's news - and it belongs to the news work, not to
        // this fix. Written down here because a counting test would have gone
        // green on it and hidden it again.
        const { useNewsStore } = require('../../core/store/useNewsStore');
        const item = dearest();
        useAssetStore.getState().addToCart(item);
        checkout(useAssetStore.getState().cart);

        // The body rather than the headline: one of the four headlines is
        // generic and does not name the item, so a headline check would fail
        // one run in four. The story text always names it.
        const feed = useNewsStore.getState().newsHistory;
        expect(feed.some((n: { text: string }) => n.text.includes(item.name))).toBe(true);
    });

    it('and buying from the LuxoNet catalogue directly still pays for itself', () => {
        // The other caller. `LuxoNetPreviewModal` hands `handleBuyLuxury` an
        // item and nothing else, so there the charging is the whole point -
        // which is why the fix cannot simply be to delete it.
        const asset = initialLuxuryCatalog[0];
        const before = useStatsStore.getState().money;
        handleBuyLuxury(asset);
        expect(useStatsStore.getState().money).toBe(before - asset.price);
    });
});

// ============================================================================
//  AND THE SCREEN HAS TO STILL BE THE THING THIS TESTED
// ============================================================================
//
//  `checkout` above is a copy of `handlePaymentComplete`. A copy that the
//  original can walk away from proves nothing, so these pin the parts of the
//  screen the copy depends on.
// ============================================================================

describe('and the checkout on screen is the one measured here', () => {
    it('it takes the money exactly once, through the stats store', () => {
        const src = cartScreenLive();
        expect((src.match(/spendMoney\(/g) || []).length).toBe(1);
    });

    it('and the quote it charges is the quote it showed', () => {
        const src = cartScreenLive();
        expect(src).toMatch(/spendMoney\(orderTotal\)/);
        expect(src).toMatch(/setOrderTotal\(calculatedTotal\)/);
    });

    it('and it still registers the assets and still announces them', () => {
        const src = cartScreenLive();
        expect(src).toMatch(/purchaseCart\(\)/);
        expect(src).toMatch(/announceLuxuryPurchase\(/);
    });

    it('and it does not call the version that is also a cashier', () => {
        // THE PROBE THAT BITES. `handleBuyLuxury` is still exported and still
        // correct for its own caller, so nothing stops this screen reaching
        // for it again by name. The whole defect was one wrong import.
        expect(cartScreenLive()).not.toMatch(/handleBuyLuxury/);
    });
});

describe('and the announcement is not a till', () => {
    it('it moves brand and news, and does not move money', () => {
        // The property the split exists for, asserted directly rather than
        // through the checkout, so a `spendMoney` creeping back into
        // `announceLuxuryPurchase` fails here whatever the screen does.
        const item = dearest();
        useStatsStore.setState({ money: START, brandValue: 18 });

        const result = announceLuxuryPurchase(item);
        expect(useStatsStore.getState().money).toBe(START);
        expect(result.brandValueDelta).toBeGreaterThan(0);
        expect(result.newsHeadline.length).toBeGreaterThan(0);
    });

    it('and it works for a player with no money at all', () => {
        // Because it is not a purchase. A checkout that has already been paid
        // for can legitimately leave the wallet empty, and the brand surge and
        // the headline were being lost exactly there.
        const item = dearest();
        useStatsStore.setState({ money: 0, brandValue: 18 });

        expect(announceLuxuryPurchase(item).brandValueDelta).toBeGreaterThan(0);
        expect(useStatsStore.getState().money).toBe(0);
    });
});

// ============================================================================
//  THE ROOT CAUSE, PINNED SO IT CANNOT COME BACK QUIETLY
// ============================================================================
//
//  The double charge is a symptom. The cause is that the shop sells from one
//  catalogue and the purchase logic looks the item up in another. Merging the
//  two is the next piece of work; until then this records the split, so that
//  if somebody adds a LuxoNet id to the shop the assumption breaks loudly.
// ============================================================================

describe('the two catalogues', () => {
    it('share no ids at all, which is why the lookup always missed', () => {
        const luxo = new Set(initialLuxuryCatalog.map(a => a.id));
        const overlap = ITEMS.filter(i => luxo.has(i.id));
        expect(overlap).toEqual([]);
    });

    it('and the shop is the big one, so it is the one that survives the merge', () => {
        expect(ITEMS.length).toBeGreaterThan(initialLuxuryCatalog.length * 10);
        expect(SHOPS.length).toBeGreaterThan(20);
    });
});
