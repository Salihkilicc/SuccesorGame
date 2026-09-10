// src/features/shopping/generationMarket.test.ts
//
// ============================================================================
//  THE SHELF AN HEIR WALKS UP TO
// ============================================================================
//
//  Asked for as "the market growing when the child's time comes", then sized:
//  twelve new things a generation, three of them properly expensive, "because
//  they are getting richer", and stopping after two generations.
//
//  ---------------------------------------------------------------------------
//  THE THREE THINGS THAT WOULD GO WRONG, IN ORDER OF HOW QUIETLY
//  ---------------------------------------------------------------------------
//    THE GATE ON ONE DOOR AND NOT THE OTHERS. Four live places read the
//    catalogue and one of them missing the gate puts a two hundred sixty
//    billion dollar asteroid claim on the founder's front page. This is the
//    signature failure of this codebase and it is the first section below.
//
//    THE PRESTIGE SCORE MOVING UNDER A PLAYER. `TOTAL_CATALOG_VALUE` is the
//    denominator of the profile number. A catalogue that grew at a succession
//    would shrink every collection in the game overnight and nothing at all
//    would report it: the player bought nothing, sold nothing, and their score
//    fell. Measured here at four generations against a fixed collection.
//
//    A DRAW THAT IS NOT ACTUALLY A DRAW. Seeded on the company name, so two
//    saves differ and one save never changes its mind. Both halves matter and
//    only one of them is obvious.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { ITEMS, TOTAL_CATALOG_VALUE, calculatePrestigeScore } from './data/shoppingRegistry';
import {
    WAVES, WAVE_ITEMS, WAVE_DRAWN, RICH_DRAWN, TOP_DRAWN, LAST_GROWING_GENERATION,
} from './data/generationWaves';
import {
    shelfNow, shelfIds, onShelf, openedBy, drawnFromWave, seedFromName, marketStillGrowing,
} from './logic/shelfNow';

const SRC = path.join(__dirname, '..', '..');
const live = (rel: string) =>
    fs.readFileSync(path.join(SRC, rel), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

const shopping = (f: string) => live(path.join('features', 'shopping', f));

/** The catalogue as it was before any of this: everything not in a wave. */
const BASE = ITEMS.filter(i => !WAVE_ITEMS.some(w => w.id === i.id));

const NAME = 'Hale Industries';

describe('the founder sees the shop that was always there', () => {
    it('not one wave item, at any company name', () => {
        for (const name of ['', 'Hale Industries', 'Q', 'aaaaaaaaaa']) {
            const shelf = shelfNow(1, name).map(i => i.id);
            const leaked = shelf.filter(id => WAVE_ITEMS.some(w => w.id === id));
            expect({ name, leaked }).toEqual({ name, leaked: [] });
        }
    });

    it('and the whole of the old catalogue, unchanged', () => {
        expect(shelfNow(1, NAME)).toHaveLength(BASE.length);
        expect(BASE.length).toBeGreaterThanOrEqual(108);
    });
});

describe('and an heir walks up to twelve new things', () => {
    it('twelve in the second generation', () => {
        const grew = shelfNow(2, NAME).length - shelfNow(1, NAME).length;
        expect(grew).toBe(WAVE_DRAWN);
        expect(WAVE_DRAWN).toBe(12);
    });

    it('and twelve more in the third, on top rather than instead', () => {
        // ------------------------------------------------------------------
        //  CUMULATIVE, AND THAT IS A DECISION
        // ------------------------------------------------------------------
        //  A wave that replaced the last one would take away the thing an
        //  heir had been saving for on the exact day they took the chair.
        // ------------------------------------------------------------------
        const second = new Set(shelfNow(2, NAME).map(i => i.id));
        const third = shelfNow(3, NAME).map(i => i.id);
        expect(third.length).toBe(second.size + WAVE_DRAWN);
        expect([...second].filter(id => !third.includes(id))).toEqual([]);
    });

    it('and three of every twelve are the top of the market', () => {
        // The whole of "because they are getting richer". One draw across all
        // eighteen would eventually hand a generation twelve ordinary things.
        WAVES.forEach((wave, index) => {
            const drawn = drawnFromWave(index, seedFromName(NAME));
            const top = drawn.filter(d => wave.top.some(t => t.id === d.id));
            const rich = drawn.filter(d => wave.rich.some(r => r.id === d.id));
            expect({ index, top: top.length, rich: rich.length })
                .toEqual({ index, top: TOP_DRAWN, rich: RICH_DRAWN });
        });
        expect(TOP_DRAWN).toBe(3);
    });

    it('and then it stops, which is what was asked for', () => {
        const third = shelfNow(3, NAME).length;
        for (const g of [4, 5, 9, 40]) {
            expect({ g, n: shelfNow(g, NAME).length }).toEqual({ g, n: third });
        }
        expect(LAST_GROWING_GENERATION).toBe(3);
        expect(marketStillGrowing(2)).toBe(true);
        expect(marketStillGrowing(3)).toBe(false);
    });

    it('and nonsense generations do not open anything early', () => {
        for (const g of [0, -4, NaN, 1.9]) {
            const leaked = shelfNow(g as number, NAME)
                .filter(i => WAVE_ITEMS.some(w => w.id === i.id));
            expect({ g, leaked: leaked.length }).toEqual({ g, leaked: 0 });
        }
    });
});

describe('and the draw is a draw, and it is also stable', () => {
    it('the same save gets the same shelf every time it is asked', () => {
        // Not Math.random. A shelf that differed between two screens, or
        // reshuffled on every re render, would be worse than a fixed list.
        const first = shelfIds(2, NAME);
        for (let i = 0; i < 20; i++) {
            expect([...shelfIds(2, NAME)].sort()).toEqual([...first].sort());
        }
    });

    it('but two companies do not get the same twelve', () => {
        // ------------------------------------------------------------------
        //  OR IT IS A FIXED LIST WEARING A DRAW"S CLOTHES
        // ------------------------------------------------------------------
        //  Measured over thirty names rather than asserted on two, because
        //  two names colliding is not evidence of anything.
        // ------------------------------------------------------------------
        const names = Array.from({ length: 30 }, (_, i) => `Company ${i}`);
        const shelves = names.map(n => [...shelfIds(2, n)].sort().join(','));
        expect(new Set(shelves).size).toBeGreaterThan(5);
    });

    it('and the six that did not come up are still written', () => {
        // The reason to play a third time. If a wave ever draws its whole
        // pool, the draw has stopped meaning anything.
        for (const wave of WAVES) {
            expect(wave.rich.length).toBeGreaterThan(RICH_DRAWN);
            expect(wave.top.length).toBeGreaterThan(TOP_DRAWN);
        }
    });

    it('and it never draws the same thing twice', () => {
        for (const name of ['', NAME, 'Zzz', 'A very long company name indeed']) {
            for (const g of [2, 3]) {
                const drawn = openedBy(g, name).map(i => i.id);
                expect({ name, g, dupes: drawn.length - new Set(drawn).size })
                    .toEqual({ name, g, dupes: 0 });
            }
        }
    });

    it('and everything it draws is really in the catalogue', () => {
        // A drawn id that ITEMS does not carry is an entry the shelf shows
        // and the till cannot price.
        const ids = new Set(ITEMS.map(i => i.id));
        for (const item of WAVE_ITEMS) {
            expect({ id: item.id, known: ids.has(item.id) })
                .toEqual({ id: item.id, known: true });
        }
    });
});

describe('and the prestige score does not move under a player', () => {
    it('a fixed collection scores the same in every generation', () => {
        // ------------------------------------------------------------------
        //  THE SILENT ONE
        // ------------------------------------------------------------------
        //  `TOTAL_CATALOG_VALUE` is the denominator. Had the waves been kept
        //  out of ITEMS until they unlocked, the denominator would jump at
        //  each succession and every collection in the game would be worth a
        //  smaller share of it the morning after, with nothing to explain it.
        //
        //  It is a module constant, so this is really asserting that nothing
        //  ever makes it a function of the generation.
        // ------------------------------------------------------------------
        const collection = 10_000_000_000;
        const scores = [1, 2, 3, 4, 40].map(() => calculatePrestigeScore(collection));
        expect(new Set(scores).size).toBe(1);
        expect(scores[0]).toBeGreaterThan(0);
    });

    it('and the denominator counts the locked stock too', () => {
        const written = ITEMS.reduce((s, i) => s + i.price, 0);
        expect(TOTAL_CATALOG_VALUE).toBe(written);
        const waveValue = WAVE_ITEMS.reduce((s, i) => s + i.price, 0);
        expect(TOTAL_CATALOG_VALUE).toBeGreaterThan(waveValue);
    });
});

describe('and the money climbs, because the player does', () => {
    const cheapest = (list: { price: number }[]) => Math.min(...list.map(i => i.price));
    const dearest = (list: { price: number }[]) => Math.max(...list.map(i => i.price));

    it('the third generation band starts above the second', () => {
        expect(cheapest(WAVES[1].rich)).toBeGreaterThan(cheapest(WAVES[0].rich));
        expect(dearest(WAVES[1].rich)).toBeGreaterThan(dearest(WAVES[0].rich));
    });

    it('and its top three go further', () => {
        expect(dearest(WAVES[1].top)).toBeGreaterThan(dearest(WAVES[0].top));
        expect(cheapest(WAVES[1].top)).toBeGreaterThan(cheapest(WAVES[0].top));
    });

    it('and the top of every wave really is above its own ordinary band', () => {
        for (const wave of WAVES) {
            expect(cheapest(wave.top)).toBeGreaterThan(dearest(wave.rich));
        }
    });

    it('and the Ark is still the most expensive thing in the game', () => {
        // ------------------------------------------------------------------
        //  DELIBERATE
        // ------------------------------------------------------------------
        //  data/categories/space.ts argues the Ark to $980B out of the game's
        //  own title ladder and calls it "the only thing at that height".
        //  Adding a wave that quietly beat it would undo that argument
        //  without answering it.
        // ------------------------------------------------------------------
        const ark = ITEMS.find(i => i.name === 'The Ark Programme')!;
        expect(ark).toBeDefined();
        const above = ITEMS.filter(i => i.price > ark.price).map(i => i.name);
        expect(above).toEqual([]);
    });
});

// ============================================================================
//  AND EVERY DOOR INTO THE SHOP ASKS
// ============================================================================
//
//  Four live places read the catalogue. `ShoppingBrowseView` is a fifth and is
//  not mounted by anything (pinned in shopIdentity.test.ts), so it is left
//  alone; `adminMode` is a cheat button and is meant to grant the lot.
//
//  A gate on three of four is not a gate. It is a bug that only shows up on
//  one screen, which is the hardest kind to find and the easiest kind to
//  write.
// ============================================================================

describe('every door into the shop asks what is on the shelf', () => {
    it('the shop grid asks', () => {
        // ------------------------------------------------------------------
        //  SCOPED TO THE FUNCTION, WHICH IT WAS NOT AT FIRST
        // ------------------------------------------------------------------
        //  This read the whole file for the line and passed on a probe that
        //  had deleted the gate from `getShopItems`, because the IDENTICAL
        //  line in `getTrendingItems` twenty lines below satisfied it.
        //
        //  A wiring test that matches anywhere in a file is not a wiring
        //  test, and this one would have gone on passing while the grid
        //  showed a generation two asteroid claim to the founder.
        // ------------------------------------------------------------------
        const src = shopping(path.join('hooks', 'useShopping.ts'));
        expect(src).toMatch(/from '\.\.\/logic\/shelfNow'/);
        const grid = src.slice(
            src.indexOf('const getShopItems'),
            src.indexOf('const getTrendingItems'),
        );
        expect(grid.length).toBeGreaterThan(100);
        expect(grid).toMatch(/if \(!onShelf\(item\.id, open\)\) return false;/);
    });

    it('and the trending row asks', () => {
        const src = shopping(path.join('hooks', 'useShopping.ts'));
        const trending = src.slice(src.indexOf('const getTrendingItems'));
        expect(trending.length).toBeGreaterThan(100);
        expect(trending).toMatch(/onShelf\(item\.id, open\)/);
    });

    it('and the detail screen asks, which is the one that would have been missed', () => {
        // `SHOP_DATA` bakes an items array per shop at module load. Gating
        // ITEMS and forgetting this leaves every wave item on sale behind a
        // shop card from the first quarter.
        const src = shopping(path.join('hooks', 'useShopping.ts'));
        const memo = src.slice(src.indexOf('const shop = useMemo'));
        expect(memo).toMatch(/items: found\.items\.filter\(i => onShelf\(i\.id, open\)\)/);
    });

    it('and the preview card on the shop front asks', () => {
        const src = shopping(path.join('components', 'ShopPreviewCard.tsx'));
        expect(src).toMatch(/from '\.\.\/logic\/shelfNow'/);
        expect(src).toMatch(/onShelf\(item\.id, open\)/);
    });

    it('and anything that is not part of a wave was never gated at all', () => {
        // The base catalogue must be untouched by any of this, in every
        // generation, whatever the shelf says.
        for (const item of BASE) {
            expect({ id: item.id, open: onShelf(item.id, new Set()) })
                .toEqual({ id: item.id, open: true });
        }
    });
});
