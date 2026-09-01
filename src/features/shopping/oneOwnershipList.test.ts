// src/features/shopping/oneOwnershipList.test.ts
//
// ============================================================================
//  THE SHOP WROTE TO ONE LIST AND THE WEALTH SCREEN READ THE OTHER
// ============================================================================
//
//  The root cause behind the double charge, which was only its first symptom.
//  There are two luxury systems in this project:
//
//      LuxeNet   features/shopping           27 shops, 85 items, useAssetStore
//      LuxoNet   core/store/useLuxoNetStore    4 items, its own ownedAssets
//
//  Everything the player can actually press is wired to the first. The cart,
//  the checkout, the belongings screen, the profile, the partner gifts. The
//  second is written to by exactly one function - `luxoStore.buyAsset`, via
//  `handleBuyLuxury` - which is reached from exactly one component,
//  `LuxoNetPreviewModal`, and that component is not mounted anywhere.
//
//  So `useLuxoNetStore.ownedAssets` is empty for the whole of every run.
//
//  ---------------------------------------------------------------------------
//  WHICH MADE THE ASSETS SCREEN'S LUXURY ROW UNREACHABLE
//  ---------------------------------------------------------------------------
//  That row was added specifically to fix "correct data that nothing reads" -
//  the store's four query helpers had no callers, so a player could buy a
//  hypercar and their wealth would not move. The row reads the store. The
//  store is the empty one. It renders behind `luxuryCount > 0`, so it has
//  never appeared on screen once.
//
//  The same failure at one remove, and worth writing down in those terms: the
//  first version was data nothing read, and the fix was a reader pointed at
//  the wrong data. Checking that something reads the field is not enough. It
//  has to read the field the game WRITES.
//
//  This file is the check that they are the same list.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { useStatsStore } from '../../core/store/useStatsStore';
import { useAssetStore } from './store/useAssetStore';
import { useLuxoNetStore } from '../../core/store/useLuxoNetStore';
import { ITEMS } from './data/shoppingRegistry';

const SRC = path.join(__dirname, '..', '..');

const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');

/** Source with its comments stripped, so a note about the old store is not a use of it. */
const live = (rel: string) =>
    read(rel)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

const assetsScreen = () => live(path.join('features', 'assets', 'screens', 'AssetsScreen.tsx'));

const dearest = () => [...ITEMS].sort((a, b) => b.price - a.price)[0];

beforeEach(() => {
    useAssetStore.getState().reset();
    useLuxoNetStore.getState().reset();
    useStatsStore.setState({ money: 20_000_000_000 });
});

describe('buying something puts it in the list the game keeps', () => {
    it('the shop writes to useAssetStore', () => {
        const item = dearest();
        useAssetStore.getState().addToCart(item);
        useAssetStore.getState().purchaseCart();

        expect(useAssetStore.getState().ownedItems.map(o => o.id)).toEqual([item.id]);
    });

    it('and leaves the other store empty, because nothing fills it', () => {
        // THE DEFECT. Not an accident of this test setup: `buyAsset` is the
        // only writer and its only caller is an unmounted modal.
        const item = dearest();
        useAssetStore.getState().addToCart(item);
        useAssetStore.getState().purchaseCart();

        expect(useLuxoNetStore.getState().ownedAssets).toEqual([]);
    });

    it('and the value the player owns is readable from it', () => {
        const three = [...ITEMS].sort((a, b) => b.price - a.price).slice(0, 3);
        for (const i of three) useAssetStore.getState().addToCart(i);
        useAssetStore.getState().purchaseCart();

        const owned = useAssetStore.getState().ownedItems;
        const total = owned.reduce((s, o) => s + o.marketValue, 0);
        expect(total).toBe(three.reduce((s, i) => s + i.price, 0));
    });
});

describe('and the wealth screen reads that same list', () => {
    it('the luxury row counts what the shop registered', () => {
        // THE FIX, as one assertion. Before it, this read `useLuxoNetStore`.
        const src = assetsScreen();
        expect(src).toMatch(/useAssetStore/);
        expect(src).toMatch(/ownedItems/);
    });

    it('and no longer reads the store nothing writes', () => {
        // Stripped of comments, because the note left at the fix names it.
        expect(assetsScreen()).not.toMatch(/useLuxoNetStore/);
    });

    it('and takes the field that store actually has', () => {
        // `currentMarketValue` is the LuxoNet field name. `OwnedAsset` calls
        // it `marketValue`, and reading the wrong one gives NaN rather than
        // an error - which is the quiet version of this same bug.
        const src = assetsScreen();
        expect(src).toMatch(/marketValue/);
        expect(src).not.toMatch(/currentMarketValue/);
    });

    it('and is still information only, with no door into the shop', () => {
        // The standing decision from when the row was added, unchanged by
        // this. Folding it into net worth moves a title gate and an
        // achievement, and that is its own piece of work.
        const src = assetsScreen();
        expect(src).not.toMatch(/openLuxoNet/);
        expect(src).not.toMatch(/LuxoNetPreviewModal|LuxoNetInventoryModal/);
        expect(src).not.toMatch(/belongingsValue: luxuryValue/);
        expect(src).not.toMatch(/netWorth \+ luxuryValue/);
    });
});

// ============================================================================
//  AND THE SHELVED STORE STAYS SHELVED
// ============================================================================
//
//  Not deleted. It holds the only per-item economics written in this project -
//  annualMaintenanceCost, appreciationRatePerYear, prestigeScore, buffs - and
//  the maintenance and valuation work is going to want all four of them. What
//  it must not do is go on being a second place to record what you own.
// ============================================================================

describe('the LuxoNet store is shelved, not deleted', () => {
    it('it is still there, with its catalogue and its economics intact', () => {
        const src = read(path.join('core', 'store', 'useLuxoNetStore.ts'));
        expect(src).toMatch(/annualMaintenanceCost/);
        expect(src).toMatch(/appreciationRatePerYear/);
        expect(src).toMatch(/prestigeScore/);
    });

    it('but nothing on a screen records ownership in it any more', () => {
        // `useProfileLogic` still reads `membershipTier` from it, which is a
        // setting rather than a holding, so this checks the holdings field by
        // name instead of the import.
        const walk = (dir: string, out: string[] = []): string[] => {
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, e.name);
                if (e.isDirectory()) { walk(full, out); continue; }
                if (!/\.tsx?$/.test(e.name) || /\.test\./.test(e.name)) continue;
                out.push(full);
            }
            return out;
        };

        const offenders = walk(SRC)
            .filter(f => !f.endsWith(path.join('core', 'store', 'useLuxoNetStore.ts')))
            .filter(f => {
                const src = live(path.relative(SRC, f));
                return /useLuxoNetStore[\s\S]{0,80}ownedAssets/.test(src);
            })
            .map(f => path.relative(SRC, f));

        expect(offenders).toEqual([]);
    });
});
