// src/core/market/brandDisplay.test.ts
//
// ============================================================================
//  THE NUMBER DID NOT COLLAPSE. THE RULER CHANGED.
// ============================================================================
//
//  Reported as: "I used to make brand 200, and staying in one category I would
//  reach 600 and over. Now it goes 51, then 55, a little at every tier, and
//  the game became impossible or broken."
//
//  It did not. For a while `stats.brandValue` held POINTS - those are the 200
//  and the 600 - and it now holds the 0-100 INDEX. The same company reads
//  differently because the unit under it moved and nothing anywhere said so.
//  Measured on one run, both scales side by side:
//
//      T3   index 26.0 = 113 points
//      T7   index 43.0 = 186 points
//      T9   index 52.0 = 225 points      <- the remembered "200"
//      T10  index 56.0 = 242 points
//
//  So "51 then 55" is "221 then 238" in the money they remember. Their brand
//  was exactly where they thought it was.
//
//  AND TWO SCREENS WERE ALREADY READING IT AS POINTS. ProductModals converted
//  `stats.brandValue` DOWN with `brandIndex`, on a value that had already had
//  that conversion applied: a real brand of 52 arrived at `computeAttraction`
//  as 12. The projection the player reads before deciding anything, and the
//  contract partner list, were both computed against a brand a quarter of the
//  size. MyCompanyScreen coloured its figure green above 200, a threshold the
//  index can never reach.
//
//  Which is most of "brand does not do anything any more". It did. The screens
//  could not see it.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    brandDisplay,
    brandIndex,
    indexToPoints,
    BRAND_INDEX_SCALE,
    CATEGORY_UNLOCK_BRAND,
} from './brand';

describe('what the player is shown', () => {
    it('is points, not the index', () => {
        expect(brandDisplay(52)).toBe(225);
        expect(brandDisplay(26)).toBe(113);
        expect(brandDisplay(56)).toBe(242);
    });

    it('and it is the same conversion the engine uses, not a second one', () => {
        // Two conversions of one fact is how the scales came apart in the
        // first place.
        for (const idx of [0, 5, 22, 46, 61, 100]) {
            expect(brandDisplay(idx)).toBe(Math.round(indexToPoints(idx)));
        }
    });

    it('and it round trips back to the index it came from, within the rounding', () => {
        // Not exactly, and the bound is worth writing down rather than
        // guessing at: rounding to a whole point costs at most half a point,
        // which is half of 4.33 index, so 0.116. I set this to 0.05 first and
        // it failed at 0.08.
        const worst = 0.5 / BRAND_INDEX_SCALE;
        for (const idx of [5, 22, 46, 61, 100]) {
            expect(Math.abs(brandIndex(brandDisplay(idx)) - idx)).toBeLessThanOrEqual(worst);
        }
    });

    it('and the remembered numbers land where the player remembers them', () => {
        // "I used to make 200" is a tier nine company, which is where they
        // said they were.
        expect(brandDisplay(46)).toBeGreaterThanOrEqual(199);
        expect(brandDisplay(46)).toBeLessThanOrEqual(201);
    });

    it('and it is a whole number, because a reputation with a decimal is noise', () => {
        expect(Number.isInteger(brandDisplay(52.371))).toBe(true);
    });

    it('and rubbish in does not produce rubbish out', () => {
        expect(brandDisplay(-5)).toBe(0);
        expect(brandDisplay(NaN)).toBe(0);
        expect(brandDisplay(undefined as any)).toBe(0);
    });

    it('and the two scales really are a factor of four and a third apart', () => {
        // The whole confusion, as one number.
        expect(BRAND_INDEX_SCALE).toBeCloseTo(4.33, 2);
        expect(brandDisplay(100) / 100).toBeCloseTo(BRAND_INDEX_SCALE, 2);
    });
});

describe('the screens speak that scale', () => {
    const read = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8');

    it('the company screen shows points and colours against the gate', () => {
        const src = read('features', 'assets', 'screens', 'MyCompanyScreen.tsx');
        // THE VALUE LINE SPECIFICALLY. My first version matched
        // `brandDisplay(stats.brandValue ?? 0)` anywhere in the file, and the
        // colour line contains the same call - so reverting the figure the
        // player actually reads left every test green. Found by the probe.
        expect(src).toMatch(/value=\{`\$\{brandDisplay\(stats\.brandValue \?\? 0\)\}`\}/);
        expect(src).not.toMatch(/value=\{`\$\{Math\.round\(stats\.brandValue/);
        // And it compared a 0-100 index against 200, so it could never go green.
        expect(src).not.toMatch(/\(stats\.brandValue \?\? 0\) >= 200/);
        expect(src).toMatch(/>= CATEGORY_UNLOCK_BRAND/);
    });

    it('and the market panel does too', () => {
        expect(read('core', 'market', 'MarketPositionPanel.tsx'))
            .toMatch(/brandDisplay\(brandValue\)/);
    });

    it('and the quarterly report does, so it does not contradict them', () => {
        // It printed the raw index to one decimal. A report speaking a
        // different unit from the screen it reports on is the confusion.
        const src = read('features', 'assets', 'screens', 'QuarterlyReportModal.tsx');
        expect(src).toMatch(/const brandFigure = \(v: number \| undefined\): string => String\(brandDisplay\(v \?\? 0\)\)/);
    });

    it('and the product screen no longer converts a converted number', () => {
        // THE DEFECT. `brandIndex(stats.brandValue)` on a value that was
        // already the index: 52 arrived as 12.
        const src = read('features', 'products', 'components', 'ProductModals.tsx');
        expect(src).not.toMatch(/const brandValue = brandIndex\(brandPoints\)/);
        expect(src).toMatch(/const brandValue = useStatsStore\(state => state\.brandValue\)/);
        expect(src).toMatch(/const brandPoints = indexToPoints\(brandValue\)/);
    });

    it('and the tick still writes the INDEX, which is what all of this assumes', () => {
        // If this ever flips again, every line above is wrong and this is the
        // test that says so first.
        expect(read('core', 'store', 'useGameStore.ts')).toMatch(/brandValue: brandIdx,/);
    });
});

describe('and the gate is quoted in the same money', () => {
    it('so a player looking at 200 on the screen is looking at the gate', () => {
        expect(CATEGORY_UNLOCK_BRAND).toBe(243);
        expect(brandDisplay(brandIndex(CATEGORY_UNLOCK_BRAND))).toBe(CATEGORY_UNLOCK_BRAND);
    });
});
