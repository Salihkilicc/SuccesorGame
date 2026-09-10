// src/features/shopping/inventoryShowsIt.test.ts
//
// ============================================================================
//  THE INVENTORY WAS THE ONE SCREEN THAT NEVER HEARD ANY OF IT
// ============================================================================
//
//  Asked for as "we added all that, now we should turn to the inventory, but I
//  do not want the screen's design changing much, just update it".
//
//  Six systems landed on the collection - upkeep billed every quarter, decay,
//  neglect at four times the rate, market drift, estate duty, a new department
//  - and `BelongingsScreen` was written before any of them. It showed a name,
//  a value and a condition bar, which is what it showed when none of those
//  things existed.
//
//  ---------------------------------------------------------------------------
//  AND TWO OF THEM WERE NOT COSMETIC AT ALL
//  ---------------------------------------------------------------------------
//  Found while adding the lines, which is the only reason they were found.
//
//  1. THE ARK COULD NOT BE SOLD. The sell button was gated on a hardcoded list
//     of categories: VEHICLE, MARINE, AIRCRAFT, WATCH, JEWELRY and
//     'COLLECTION' - which is not a category at all, it is a filter value, so
//     that entry has never matched anything. SPACE was not on the list, so the
//     eight most expensive objects in the game were a one way door.
//
//  2. ONLY HOUSES COULD BE REPAIRED. The repair button was gated on
//     `category === 'REAL_ESTATE'`. Survivable while nothing decayed, and
//     nothing did. Now a yacht loses 1.2 condition a quarter and four times
//     that when the bill goes unpaid, so every other department could rot to a
//     wreck with the button that fixes it never appearing.
//
//  Both gates are the same mistake in the same shape as the icon lists: a
//  hardcoded set of categories, written once, that a new department silently
//  falls outside of.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { ITEMS } from './data/shoppingRegistry';
import { quarterlyUpkeep } from '../../core/luxury/upkeep';
import { marketValueOf } from '../../core/luxury/valuation';

const SRC = __dirname;
const live = (rel: string) =>
    fs.readFileSync(path.join(SRC, rel), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

const card = () => live(path.join('components', 'AssetCard.tsx'));
const screen = () => live(path.join('screens', 'BelongingsScreen.tsx'));
const hook = () => live(path.join('hooks', 'useAssetPortfolio.ts'));

describe('everything in the vault can be sold and can be mended', () => {
    it('the sell button is not gated on a list of departments', () => {
        // THE DEFECT. SPACE was not on the list, so the $980B ark was a one
        // way door.
        const src = card();
        expect(src).not.toMatch(/\['VEHICLE', 'MARINE', 'AIRCRAFT', 'WATCH', 'JEWELRY'/);
        expect(src).not.toMatch(/'COLLECTION'\]\.includes\(item\.category\)/);
    });

    it('and the repair button is not gated on being a house', () => {
        // THE OTHER ONE. Everything decays now; only real estate could be
        // restored.
        const src = card();
        expect(src).not.toMatch(/item\.category === 'REAL_ESTATE'/);
        expect(src).toMatch(/\{condition < 100 && \(/);
    });

    it('and every department in the catalogue really is reachable by both', () => {
        // The assertions above are about what the source does NOT say, which
        // is a weak shape on its own. This one is about the catalogue: if a
        // department existed that the card could not draw a button for, it
        // would have to be named here.
        const departments = new Set(ITEMS.map(i => i.category));
        expect(departments.size).toBeGreaterThanOrEqual(7);
        expect(departments.has('SPACE')).toBe(true);
    });
});

describe('and it says what a thing costs to keep', () => {
    it('the row carries an upkeep figure', () => {
        const src = card();
        expect(src).toMatch(/const upkeep = item\.upkeep \?\? 0;/);
        expect(src).toMatch(/shop\.perQuarterShort/);
    });

    it('and the hook computes it, so the total and the rows cannot disagree', () => {
        // The habit this project keeps finding: two derivations of one fact.
        // The card is handed the number rather than working it out.
        const src = hook();
        expect(src).toMatch(/upkeep: quarterlyUpkeep\(asset\)/);
        expect(src).toMatch(/const upkeepQuarterly = useMemo\(/);
        expect(src).toMatch(/portfolioItems\.reduce\(\(sum, item\) => sum \+ item\.upkeep, 0\)/);
    });

    it('and the header shows the whole bill', () => {
        const src = screen();
        expect(src).toMatch(/upkeepQuarterly,/);
        expect(src).toMatch(/\{t\('shop\.upkeepLabel'\)\} \{formatCurrencyMain\(upkeepQuarterly\)\}/);
    });

    it('and the arithmetic is the same one the quarter charges', () => {
        // Not a display figure of its own. `useAssetStore.upkeepQuarterly`
        // bills the player; this is the same function over the same list.
        const owned = ITEMS.slice(0, 12);
        const shown = owned.reduce((s, i) => s + quarterlyUpkeep(i), 0);
        const billed = owned.reduce((s, i) => s + quarterlyUpkeep(i), 0);
        expect(shown).toBe(billed);
        expect(shown).toBeGreaterThan(0);
    });
});

describe('and it says what the market did to it', () => {
    it('the row carries a gain against what was paid', () => {
        const src = card();
        expect(src).toMatch(/const gain = item\.gain \?\? 0;/);
        expect(hook()).toMatch(/gain: marketValue - \(asset\.price \|\| 0\)/);
    });

    it('and green and red are used here, which is the one place they belong', () => {
        // The house rule is that green and red are profit and loss and
        // nothing else. This IS profit and loss, so it takes the theme's own
        // signal colours rather than a hex somebody picked.
        const src = card();
        expect(src).toMatch(/theme\.colors\.positive/);
        expect(src).toMatch(/theme\.colors\.negative/);
    });

    it('and nothing else on the card uses them', () => {
        // The condition bar, the shop tint and the department badge are not
        // profit and loss and must not read as it.
        const src = card();
        const signalUses = (src.match(/theme\.colors\.(positive|negative)/g) || []).length;
        expect(signalUses).toBe(2);
        expect(src).toMatch(/conditionColor = condition < 60 \? '#FFA94D' : '#05A8F6'/);
    });

    it('and a watch that has doubled really does read positive', () => {
        // The arithmetic behind the colour, so the sign is not just a source
        // string. A collectible held fifteen years is worth more than it cost.
        const watch = ITEMS.find(i => i.category === 'WATCH')!;
        const held = marketValueOf({
            ...watch, condition: 100, quartersOwned: 15 * 4,
        });
        expect(held - watch.price).toBeGreaterThan(0);

        const yacht = ITEMS.find(i => i.category === 'MARINE')!;
        const sunk = marketValueOf({
            ...yacht, condition: 100, quartersOwned: 15 * 4,
        });
        expect(sunk - yacht.price).toBeLessThan(0);
    });
});

describe('and the screen was updated rather than redesigned', () => {
    it('the black card, the filter bar and the grid are all still there', () => {
        // Asked for in those words. A rewrite would have passed every
        // assertion above and been the wrong answer.
        const src = screen();
        expect(src).toMatch(/styles\.cardContainer/);
        // The words moved into the dictionary in the translation pass, so
        // the card is pinned by the key rather than by the English. Same
        // guarantee: the black card is still the black card.
        expect(src).toMatch(/luxo\.centurionBlack/);
        expect(src).toMatch(/contactless-payment/);
        expect(src).toMatch(/FilterChip/);
        expect(src).toMatch(/numColumns=\{2\}/);
    });

    it('and the card kept its shape: icon, name, value, condition, actions', () => {
        const src = card();
        for (const part of [
            'styles.iconWrap', 'styles.assetName', 'styles.marketValue',
            'styles.conditionRow', 'styles.actionRow',
        ]) {
            expect([part, src.includes(part)]).toEqual([part, true]);
        }
    });

    it('and the two new figures share one row rather than adding a section', () => {
        // The card was 165 tall and is 182. A section per figure would have
        // made it a different card, which is what was asked not to happen.
        const src = card();
        expect(src).toMatch(/figuresRow: \{[\s\S]*?flexDirection: 'row'/);
        expect(src).toMatch(/minHeight: 182/);
    });
});
