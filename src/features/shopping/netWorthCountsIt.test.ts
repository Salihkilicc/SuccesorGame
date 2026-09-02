// src/features/shopping/netWorthCountsIt.test.ts
//
// ============================================================================
//  SPENDING MONEY AND BURNING IT WERE THE SAME THING
// ============================================================================
//
//  `personalNetWorth` has carried a `belongingsValue` term since it was
//  written, with a note on it saying so:
//
//      "They belong to the shopping feature, which is flagged off. When it
//       comes back this is where the number joins the total."
//
//  Nothing ever passed it. So buying a $70M car took $75.6M out of the wallet,
//  put an object in a list, and the player's net worth fell by the whole of
//  it - on the home screen, on the wealth screen, in their standing, and in
//  the wealth title at ten billion. The endgame shop was a machine for getting
//  poorer, and the more you spent the worse you did.
//
//  ---------------------------------------------------------------------------
//  WHY THIS IS NOT A BALANCE CHANGE, WHICH IS THE THING TO BE SURE OF
//  ---------------------------------------------------------------------------
//  The worry when this was planned was that folding the collection into net
//  worth moves the ten billion title gate and the achievements. It does not
//  move them in the direction that was feared.
//
//  The money spent was ALREADY IN THE TOTAL, as cash, before the purchase.
//  Counting what it bought does not add anything; it stops the total losing
//  something. A purchase is now roughly NEUTRAL and slightly negative: down by
//  the 8% luxury tax at the till, and down further every quarter as the
//  condition falls. The title gets HARDER for a spender, not easier - and
//  harder still for one who does not pay the upkeep, because the collection is
//  valued at its condition.
//
//  That is the argument, and the tests below are it rather than a restatement
//  of it.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { useAssetStore } from './store/useAssetStore';
import { ITEMS } from './data/shoppingRegistry';
import { personalNetWorth } from '../../core/market/personalEconomy';
import { marketValueOf } from '../../core/luxury/valuation';

const SRC = path.join(__dirname, '..', '..');
const live = (rel: string) =>
    fs.readFileSync(path.join(SRC, rel), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

const dearest = () => [...ITEMS].sort((a, b) => b.price - a.price)[0];
const owned = () => useAssetStore.getState().ownedItems
    .reduce((s, a) => s + (a.marketValue || 0), 0);

/** The checkout's own arithmetic: subtotal, 8% luxury tax, shipping. */
const quoteFor = (price: number) => price + 5000 + price * 0.08;

beforeEach(() => useAssetStore.getState().reset());

describe('buying something is not the same as burning the money', () => {
    it('a purchase costs the tax, not the sticker price', () => {
        // THE DEFECT, as one number. Before this the loss was the whole
        // 6,500,000,000 rather than the 520,005,000 of tax and shipping.
        const item = dearest();
        const START = 20_000_000_000;

        const before = personalNetWorth({ cash: START });

        const quote = quoteFor(item.price);
        useAssetStore.getState().addToCart(item);
        useAssetStore.getState().purchaseCart();

        const after = personalNetWorth({
            cash: START - quote,
            belongingsValue: owned(),
        });

        expect(before - after).toBeCloseTo(quote - item.price, 0);
        expect(before - after).toBeLessThan(item.price);
    });

    it('and the collection is valued at its condition, not at what was paid', () => {
        // A JET rather than the dearest thing in the shop, which is a tower
        // and appreciates. The market drift landed after this test was written
        // and turned it red on a real estate item going up while its condition
        // went down - which is the two forces working as designed, so the test
        // for the condition half holds something the market is not lifting.
        const item = [...ITEMS].filter(i => i.category === 'AIRCRAFT')
            .sort((a, b) => b.price - a.price)[0];
        useAssetStore.getState().addToCart(item);
        useAssetStore.getState().purchaseCart();
        expect(owned()).toBe(Math.floor(item.price));

        useAssetStore.getState().quarterlyTick(12, true);
        expect(owned()).toBe(Math.floor(marketValueOf(useAssetStore.getState().ownedItems[0])));
        expect(owned()).toBeLessThan(item.price);
    });

    it('and neglect makes the wealth title harder, not easier', () => {
        // The direction that matters. Somebody who buys the toys and does not
        // keep them is worth LESS than somebody who never bought them, which
        // is the shape the upkeep work is for.
        const item = dearest();
        useAssetStore.getState().addToCart(item);
        useAssetStore.getState().purchaseCart();

        useAssetStore.getState().quarterlyTick(20, true);
        const kept = owned();

        useAssetStore.getState().reset();
        useAssetStore.getState().addToCart(item);
        useAssetStore.getState().purchaseCart();
        useAssetStore.getState().quarterlyTick(20, false);

        expect(owned()).toBeLessThan(kept);
    });

    it('and an empty collection changes nothing at all', () => {
        expect(personalNetWorth({ cash: 100, belongingsValue: owned() }))
            .toBe(personalNetWorth({ cash: 100 }));
    });
});

// ============================================================================
//  AND BOTH NET WORTHS HAVE TO KNOW, BECAUSE THERE ARE TWO
// ============================================================================
//
//  `useAssetsLogic` is what the home card and the wealth screen show.
//  `useStatsStore.netWorth`, written once a quarter in the tick, is what the
//  STORY reads: standing, the wealth title, the closing record.
//
//  They are separate derivations of one fact, which is this project's oldest
//  and most expensive habit - the note on `personalNetWorth` exists because
//  the home screen and the wealth screen once disagreed by the whole of the
//  player's shareholding. Teaching one of them about the collection and not
//  the other would have rebuilt exactly that.
// ============================================================================

describe('and every net worth in the game counts it', () => {
    it('the one the screens read', () => {
        const src = live(path.join('features', 'assets', 'hooks', 'useAssetsLogic.ts'));
        expect(src).toMatch(/const belongingsValue = useAssetStore/);
        expect(src).toMatch(/cash, equityValue, investmentsValue, belongingsValue,/);
    });

    it('and the one the story reads', () => {
        const src = live(path.join('core', 'store', 'useGameStore.ts'));
        expect(src).toMatch(/netWorth: newPlayerCash \+ valuation \* \(ownership \/ 100\) \+ belongingsValue/);
    });

    it('and the story one reads the collection AFTER ageing it', () => {
        // Or the quarter a fleet is neglected still reports it as mint, and
        // the penalty lands one quarter late for the rest of the run.
        const src = live(path.join('core', 'store', 'useGameStore.ts'));
        const aged = src.indexOf('.quarterlyTick(');
        const read = src.indexOf('belongingsValue = useAssetStore.getState().ownedItems');
        expect(aged).toBeGreaterThan(-1);
        expect(read).toBeGreaterThan(aged);
    });

    it('and it is valued off marketValue, which follows condition', () => {
        // Not `price`. Summing what was paid would make the collection an
        // immortal asset and undo the whole of the upkeep work.
        for (const rel of [
            path.join('features', 'assets', 'hooks', 'useAssetsLogic.ts'),
            path.join('core', 'store', 'useGameStore.ts'),
        ]) {
            const src = live(rel);
            const line = src.split('\n').find(l => l.includes('a.marketValue'));
            expect([rel, line !== undefined]).toEqual([rel, true]);
        }
    });
});
