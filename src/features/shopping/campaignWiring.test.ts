// src/features/shopping/campaignWiring.test.ts
//
// ============================================================================
//  THE BANNER, THE SHELF AND THE TILL HAVE TO BE ONE NUMBER
// ============================================================================
//
//  Asked for as "I would like the shops to have taken out adverts, for those
//  to change, and to be able to run campaigns".
//
//  The adverts were three shop ids typed into `AdBannerCarousel`, out of a
//  catalogue of twenty seven, identical in the first quarter and the fortieth.
//
//  ---------------------------------------------------------------------------
//  AND THE ROTATION IS THE EASY HALF
//  ---------------------------------------------------------------------------
//  The rotation is tested next door, in core/luxury/promotions.test.ts, where
//  it belongs. What is tested HERE is the thing that would have gone wrong:
//  a banner saying 15% OFF that the checkout has never heard of.
//
//  That is decoration wearing the costume of a system, and it is the shape of
//  nearly every defect this project has found - a maintenance cost nobody
//  billed, an appreciation rate nobody read, a luxury row reading a store
//  nobody writes to, a repair formula the value curve had never been compared
//  with. A sale badge is the easiest one of all to fake, because it LOOKS like
//  it is working from the moment it is drawn.
//
//  So every assertion below is about the same question asked in three places
//  getting the same answer.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { effectivePrice, campaignsFor } from '../../core/luxury/promotions';
import { ITEMS, SHOPS } from './data/shoppingRegistry';

const SRC = path.join(__dirname, '..', '..');
const live = (rel: string) =>
    fs.readFileSync(path.join(SRC, rel), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

const shopping = (f: string) => live(path.join('features', 'shopping', f));
const shelf = () => shopping(path.join('screens', 'ShoppingScreen.tsx'));
const browse = () => shopping(path.join('components', 'ShoppingBrowseView.tsx'));
const till = () => shopping(path.join('screens', 'CartScreen.tsx'));
const banner = () => shopping(path.join('components', 'AdBannerCarousel.tsx'));

describe('every price in the shop comes from one function', () => {
    it('the shelf asks it', () => {
        const src = shelf();
        expect(src).toMatch(/from '\.\.\/\.\.\/\.\.\/core\/luxury\/promotions'/);
        expect(src).toMatch(/effectivePrice\(item, SHOPS, quarter\)/);
    });

    it('and the department listing asks it', () => {
        const src = browse();
        expect(src).toMatch(/effectivePrice\(item, SHOPS, quarter\)/);
    });

    it('and the till asks it, which is the one that matters', () => {
        // THE DEFECT THIS PREVENTS. A discount the checkout does not know
        // about is a picture of a discount.
        const src = till();
        expect(src).toMatch(/acc \+ effectivePrice\(item, SHOPS, quarter\)/);
    });

    it('and nothing in the shop still adds up raw prices', () => {
        // The old subtotal, by shape. `item.price` is still the sticker and
        // still legitimate on a struck through line, so this pins the SUM
        // rather than every mention.
        expect(till()).not.toMatch(/acc \+ item\.price/);
    });

    it('and the purchase is announced at what was actually paid', () => {
        // The news headline quotes a figure. Quoting the sticker after a 20%
        // sale is a small lie in a system built to stop small lies.
        expect(till()).toMatch(/price: effectivePrice\(cartItem, SHOPS, quarter\)/);
    });

    it('and the till prices at checkout rather than trusting the cart', () => {
        // A cart that remembers the price it was filled at is a cart you can
        // load during a sale and empty ten years later.
        const src = till();
        const quarterRead = src.indexOf('const quarter = currentQuarter()');
        const subtotal = src.indexOf('const subtotal = cart.reduce');
        expect(quarterRead).toBeGreaterThan(-1);
        expect(subtotal).toBeGreaterThan(quarterRead);
    });
});

describe('and the banners are the ones actually running', () => {
    it('the carousel reads the rotation instead of a typed list', () => {
        const src = banner();
        expect(src).toMatch(/featuredFor\(SHOPS, currentQuarter\(\)\)/);
    });

    it('and the three hardcoded shops are gone from the live code', () => {
        // THE DEFECT. Shelved in a comment above, so this reads the source
        // with the comments stripped - this project has produced that exact
        // false positive twice before.
        const src = banner();
        expect(src).not.toMatch(/const ADS = \[/);
        expect(src).not.toMatch(/ad_velocity/);
    });

    it('and a banner prints the discount from the same function', () => {
        expect(banner()).toMatch(/\$\{Math\.round\(discount \* 100\)\}% OFF/);
    });

    it('and the sale badge is not green, which is the house rule', () => {
        // Every real shop makes it green. Green and red in this game are
        // profit and loss and nothing else.
        const src = banner();
        expect(src).toMatch(/offerBadge: \{[\s\S]*?backgroundColor: '#4E3A20'/);
        expect(src).toMatch(/offerText: \{[\s\S]*?color: '#FBBF24'/);
    });

    it('and the struck through old price is muted rather than coloured', () => {
        expect(shelf()).toMatch(/itemWasPrice: \{[\s\S]*?textDecorationLine: 'line-through'/);
        expect(shelf()).toMatch(/itemWasPrice: \{[\s\S]*?color: theme\.colors\.textMuted/);
    });
});

// ============================================================================
//  AND A SALE IS NOT A WAY TO MAKE MONEY
// ============================================================================
//
//  The standing rule on this work, given as "repair and flip must not be
//  profitable". A discount is the same hazard from the other end: buy at
//  twenty per cent off and sell at whatever resale pays.
// ============================================================================

describe('and buying on offer and selling straight back still loses', () => {
    it('the deepest discount in the catalogue does not beat the resale rate', () => {
        // Resale is 70% of market value and the deepest campaign is 20% off,
        // so the best possible flip pays 0.70 against 0.80 paid, before the
        // 8% luxury tax. There is no quarter in which this is a trade.
        const RESALE = 0.7;
        for (const q of [0, 1, 5, 13, 40]) {
            for (const item of ITEMS) {
                const paid = effectivePrice(item, SHOPS, q) * 1.08;
                // Sold at the STICKER value, which is what the collection is
                // worth: the discount was a favour, not a revaluation.
                expect([q, item.id, item.price * RESALE < paid])
                    .toEqual([q, item.id, true]);
            }
        }
    });

    it('and the value of what you own is the sticker, not what you paid', () => {
        // `purchaseCart` records `marketValue: item.price`. Deliberate: a
        // watch bought in a sale is still that watch. Pinned because pricing
        // the asset at the discount would make a campaign a way to
        // permanently mark the collection down.
        const src = shopping(path.join('store', 'useAssetStore.ts'));
        expect(src).toMatch(/marketValue: item\.price/);
    });

    it('and there is always something on offer to notice', () => {
        for (const q of [0, 1, 2, 3, 9, 27]) {
            expect([q, campaignsFor(SHOPS, q).length > 0]).toEqual([q, true]);
        }
    });
});
