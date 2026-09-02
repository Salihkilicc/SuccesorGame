// src/features/shopping/shopIdentity.test.ts
//
// ============================================================================
//  A MISSPELLED ICON NAME RENDERS A BLANK BOX AND THROWS NOTHING
// ============================================================================
//
//  Which is why this file exists at all. `shopIdentity.ts` is ninety one
//  strings handed to a font, and `MaterialCommunityIcons` given a name it does
//  not have draws an empty square in silence. No warning, no crash, no failing
//  test - just a hole in the shop that somebody notices on a device.
//
//  So the first assertion below reads the SHIPPED GLYPH MAP out of
//  node_modules and checks every name against it. That is what makes a long
//  hand written list of icon names a safe thing to have.
//
//  ---------------------------------------------------------------------------
//  AND THE REST IS THE CONSTRAINT, NOT THE VALUES
//  ---------------------------------------------------------------------------
//  Twenty seven shops each state one number, a hue, and their three colours
//  are derived from it. Same approach as the casino's felts and for the same
//  reason: eighty one hand picked colours is eighty one chances to collide.
//
//  So these check that no two shops look alike and that every pairing can be
//  read, which is what actually matters, rather than checking hex codes -
//  which would only ever assert that the file says what the file says.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    CATEGORY_ICON, EDGE_L, SHOP_IDENTITY, TINT_L, TYPE_ICON, WASH_L,
    contrast, iconForItem, shopTheme,
} from './data/shopIdentity';
import { ITEMS, SHOPS } from './data/shoppingRegistry';

/** The font the app actually ships, read off disk rather than assumed. */
const GLYPHS: Record<string, number> = JSON.parse(fs.readFileSync(
    path.join(
        __dirname, '..', '..', '..',
        'node_modules', 'react-native-vector-icons', 'glyphmaps',
        'MaterialCommunityIcons.json',
    ),
    'utf8',
));

/** The app's own dark ground, which everything here is drawn on. */
const BACKGROUND = '#0F1214';

describe('every symbol in the shop exists in the font', () => {
    it('the glyph map really was loaded, or this whole file is vacuous', () => {
        expect(Object.keys(GLYPHS).length).toBeGreaterThan(1000);
        expect(GLYPHS['car-sports']).toBeDefined();
        expect(GLYPHS['not-a-real-icon-name']).toBeUndefined();
    });

    it('every item type symbol', () => {
        const missing = Object.entries(TYPE_ICON)
            .filter(([, icon]) => !(icon in GLYPHS))
            .map(([type, icon]) => `${type} -> ${icon}`);
        expect(missing).toEqual([]);
    });

    it('and every department symbol', () => {
        const missing = Object.entries(CATEGORY_ICON)
            .filter(([, icon]) => !(icon in GLYPHS))
            .map(([cat, icon]) => `${cat} -> ${icon}`);
        expect(missing).toEqual([]);
    });

    it('and every shop symbol', () => {
        const missing = Object.entries(SHOP_IDENTITY)
            .filter(([, id]) => !(id.icon in GLYPHS))
            .map(([shop, id]) => `${shop} -> ${id.icon}`);
        expect(missing).toEqual([]);
    });

    it('and the fallback, which is the one nobody would think to check', () => {
        expect(shopTheme('a shop that does not exist').icon in GLYPHS).toBe(true);
        expect(iconForItem({ type: 'nonsense', category: 'nonsense' }) in GLYPHS).toBe(true);
    });
});

describe('and every product in the catalogue gets its own', () => {
    it('nothing falls through to the department symbol', () => {
        // THE DEFECT. Every item drew `getCategoryTheme(item.category)`, so a
        // 1962 racer, an armoured truck and an electric hypercar were the
        // same little car. Six symbols for eighty five things.
        const fellThrough = ITEMS
            .filter(i => !i.type || !(i.type in TYPE_ICON))
            .map(i => `${i.id} (${i.type ?? 'no type'})`);
        expect(fellThrough).toEqual([]);
    });

    it('and a department is not one symbol wearing eighty five hats', () => {
        // Measured per department rather than overall: a catalogue can have
        // fifty distinct icons and still draw every car identically.
        const byCategory: Record<string, Set<string>> = {};
        for (const item of ITEMS) {
            byCategory[item.category] = byCategory[item.category] || new Set();
            byCategory[item.category].add(iconForItem(item));
        }
        for (const [cat, icons] of Object.entries(byCategory)) {
            expect([cat, icons.size]).not.toEqual([cat, 1]);
            expect([cat, icons.size >= 3]).toEqual([cat, true]);
        }
    });

    it('and an item with an unknown type still draws something sensible', () => {
        expect(iconForItem({ type: 'hovercraft', category: 'MARINE' }))
            .toBe(CATEGORY_ICON.MARINE);
        expect(iconForItem({ category: 'WATCH' })).toBe(CATEGORY_ICON.WATCH);
    });
});

describe('and no two shops look alike', () => {
    it('every shop in the catalogue has an identity', () => {
        const orphans = SHOPS.filter(s => !SHOP_IDENTITY[s.id]).map(s => s.id);
        expect(orphans).toEqual([]);
    });

    it('and nothing here names a shop that does not exist', () => {
        // The other direction, which is the one that rots quietly: a renamed
        // shop leaves an entry behind and nothing ever says so.
        const ids = new Set(SHOPS.map(s => s.id));
        const stale = Object.keys(SHOP_IDENTITY).filter(k => !ids.has(k));
        expect(stale).toEqual([]);
    });

    it('and no two of them share a symbol', () => {
        // THE DEFECT. Two shops shared a crown, two a trophy, two a diamond.
        const icons = SHOPS.map(s => shopTheme(s.id).icon);
        expect(new Set(icons).size).toBe(SHOPS.length);
    });

    it('and no two of them share a colour', () => {
        // Five values across twenty seven shops, two of them greys.
        const tints = SHOPS.map(s => shopTheme(s.id).tint);
        expect(new Set(tints).size).toBe(SHOPS.length);
    });

    it('and their hues are actually spread out, not clustered', () => {
        // Twenty seven distinct hex values one degree apart would pass the
        // test above and look identical on a screen.
        const hues = SHOPS.map(s => SHOP_IDENTITY[s.id].hue).sort((a, b) => a - b);
        for (let i = 1; i < hues.length; i++) {
            expect([hues[i - 1], hues[i], hues[i] - hues[i - 1] >= 8])
                .toEqual([hues[i - 1], hues[i], true]);
        }
        expect(Math.max(...hues) - Math.min(...hues)).toBeGreaterThan(300);
    });
});

describe('and everything can be read', () => {
    it('the tint carries on the app"s own dark ground', () => {
        // The house rule this project has broken before: text is never dark on
        // a dark ground. 4.5:1 is the readable threshold.
        for (const shop of SHOPS) {
            const c = contrast(shopTheme(shop.id).tint, BACKGROUND);
            expect([shop.name, c >= 4.5]).toEqual([shop.name, true]);
        }
    });

    it('and on its own wash, which is what it usually sits on', () => {
        for (const shop of SHOPS) {
            const t = shopTheme(shop.id);
            const c = contrast(t.tint, t.wash);
            expect([shop.name, c >= 4.5]).toEqual([shop.name, true]);
        }
    });

    it('and white carries on every wash, because prices are printed there', () => {
        for (const shop of SHOPS) {
            const c = contrast(shopTheme(shop.id).wash, '#FFFFFF');
            expect([shop.name, c >= 4.5]).toEqual([shop.name, true]);
        }
    });

    it('and the wash is darker than the edge is darker than the tint', () => {
        // The ordering is the design. Out of order, a card has a hairline
        // brighter than its own symbol.
        expect(WASH_L).toBeLessThan(EDGE_L);
        expect(EDGE_L).toBeLessThan(TINT_L);
        for (const shop of SHOPS) {
            const t = shopTheme(shop.id);
            expect([shop.name, contrast(t.wash, '#FFFFFF') > contrast(t.edge, '#FFFFFF')])
                .toEqual([shop.name, true]);
        }
    });

    it('and nothing on a screen reads the shelved emoji or banner colour', () => {
        // The fields are still on the data - stripping them out of twenty
        // seven records buys nothing - so the guard is that nothing READS
        // them. A shelved field with a live reader is not shelved.
        //
        // Comments stripped: the notes explaining the change name both fields,
        // and this project has produced that false positive three times.
        const walk = (dir: string, out: string[] = []): string[] => {
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, e.name);
                if (e.isDirectory()) { walk(full, out); continue; }
                if (!/\.tsx?$/.test(e.name) || /\.test\./.test(e.name)) continue;
                out.push(full);
            }
            return out;
        };
        const SHOPPING = path.join(__dirname);
        const offenders = walk(SHOPPING)
            // The data files declare them; the type declares them. Neither is
            // a reader.
            .filter(f => !f.includes(path.join('data', 'categories')))
            .filter(f => !f.endsWith('types.ts') && !f.endsWith('shopTypes.ts'))
            // ShoppingBrowseView is NOT MOUNTED. Nothing in src renders it and
            // it could never have worked: its brand lookup knows four names
            // out of twenty seven, so twenty three shops would have rendered
            // as Velocity Motors. Left exactly as it is and named here rather
            // than renovated, because polishing a screen nobody can open makes
            // it look maintained and costs the next person the same hour.
            .filter(f => !f.endsWith('ShoppingBrowseView.tsx'))
            .filter(f => {
                const src = fs.readFileSync(f, 'utf8')
                    .replace(/\/\*[\s\S]*?\*\//g, '')
                    .split('\n')
                    .filter(l => !/^\s*(\/\/|\*)/.test(l))
                    .map(l => l.replace(/\s\/\/.*$/, ''))
                    .join('\n');
                return /\.emoji\b|\bbannerColor\b/.test(src);
            })
            .map(f => path.relative(SHOPPING, f));

        expect(offenders).toEqual([]);
    });

    it('and every colour it produces is a real hex', () => {
        for (const shop of [...SHOPS.map(s => s.id), 'nonsense', '']) {
            const t = shopTheme(shop);
            for (const v of [t.tint, t.wash, t.edge]) {
                expect([shop, v]).toEqual([shop, expect.stringMatching(/^#[0-9A-F]{6}$/)]);
            }
        }
    });
});
