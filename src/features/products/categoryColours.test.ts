// src/features/products/categoryColours.test.ts
//
// ============================================================================
//  BIO-TECH WAS DRAWN IN THE PROFIT COLOUR
// ============================================================================
//
//  Asked for as the product category colours coming out of the game's palette
//  while the symbols stay as they are. Measured before touching anything:
//
//      8 categories, 0 in the palette, 1 a signal colour
//      'Bio-Tech': '#4ADE80'   which IS theme.colors.success
//
//  Green and red in this game mean profit and loss and they are TEXT colours
//  only, never a fill or a border. So every Bio-Tech badge drew the profit
//  signal as a border and a wash around a product that had neither earned nor
//  lost anything, on four different screens.
//
//  The other seven were not rule breaks, just hexes from nowhere: they appear
//  in no theme token, so a palette change would have left them behind.
// ============================================================================

import {
    CATEGORY_COLORS,
    CATEGORY_ICONS,
    PRODUCT_ICON_NAMES,
    getCategoryColor,
    getCategoryIconName,
    getProductIconName,
} from './components/ProductIcon';
import { theme } from '../../core/theme';

const PALETTE = theme.colors.avatarTints;
const SIGNAL: string[] = [theme.colors.success, theme.colors.danger, theme.colors.error];

describe('the category colours come out of the palette', () => {
    it('every one of them, with nothing left over from before', () => {
        const strays = Object.entries(CATEGORY_COLORS)
            .filter(([, hex]) => !PALETTE.includes(hex))
            .map(([k, hex]) => `${k}=${hex}`);
        expect(strays).toEqual([]);
    });

    it('and so does the colour an unknown category falls back to', () => {
        // The fallback was a literal too. A product whose category has not
        // been added here would arrive in a colour from nowhere.
        expect(PALETTE).toContain(getCategoryColor(undefined));
        expect(PALETTE).toContain(getCategoryColor('a category nobody wrote'));
    });

    it('and none of them is the profit or loss signal', () => {
        // ------------------------------------------------------------------
        //  THE RULE, NOT A PREFERENCE
        // ------------------------------------------------------------------
        //  Green and red carry one meaning in this game and it is money. A
        //  category is a kind of thing; it is neither good nor bad, and it
        //  must never be drawn in the colours that say it is.
        // ------------------------------------------------------------------
        const signals = Object.entries(CATEGORY_COLORS)
            .filter(([, hex]) => SIGNAL.includes(hex))
            .map(([k, hex]) => `${k}=${hex}`);
        expect(signals).toEqual([]);
        expect(SIGNAL).not.toContain(getCategoryColor('Bio-Tech'));
    });

    it('and the palette this reads is the categorical one, still eight wide', () => {
        // A guard on the source rather than on this file: if avatarTints
        // shrinks, an index above could go undefined and a badge would draw
        // with no colour at all.
        expect(PALETTE).toHaveLength(8);
        for (const hex of Object.values(CATEGORY_COLORS)) {
            expect(typeof hex).toBe('string');
            expect(hex).toMatch(/^#[0-9A-F]{6}$/i);
        }
    });

    it('and the four real categories are told apart from each other', () => {
        // Four badges can be on one screen. Two sharing a tint makes the
        // colour decorative rather than informative.
        const four = ['Consumer', 'Robotics', 'Bio-Tech', 'Deep Tech']
            .map(c => getCategoryColor(c));
        expect(new Set(four).size).toBe(4);
    });
});

describe('and the symbols are exactly the ones they were', () => {
    it('every category still names its own icon', () => {
        // "sembolleri kalsin" - the request was colours only.
        expect(CATEGORY_ICONS).toEqual({
            'Consumer': 'cellphone-sound',
            'Robotics': 'robot-industrial',
            'Bio-Tech': 'dna',
            'Deep Tech': 'atom',
        });
    });

    it('and all fifteen products still name theirs', () => {
        expect(Object.keys(PRODUCT_ICON_NAMES)).toHaveLength(15);
        expect(getProductIconName('fusion_reactor')).toBe('radioactive');
        expect(getProductIconName('immortality')).toBe('infinity');
    });

    it('and a product with no icon of its own still falls back to its category', () => {
        expect(getProductIconName('not_a_product', 'Bio-Tech')).toBe('dna');
        expect(getProductIconName(undefined, 'Deep Tech')).toBe('atom');
        expect(getCategoryIconName('nothing')).toBe('cube-outline');
    });
});
