// src/core/market/brandVisibleByCategory.test.ts
//
// ============================================================================
//  THE NUMBER THE PLAYER CHECKS AND THE NUMBER THE GATE READS ARE NOT THE SAME
// ============================================================================
//
//  Asked as "should we show each category's brand value in Innovation, because
//  you cannot tell when the next category opens", and then "is the brand value
//  on the home screen an average".
//
//  It is: `corporateBrandFrom` is a weighted mean over the markets you trade
//  in, weighted by how hard the market is (Consumer 0.2 up to Deep Tech 0.8).
//  The gate is `canUnlockAnotherCategory`, which reads the WEAKEST market. A
//  mean is never below its own minimum, so the corporate figure is always the
//  kinder of the two and can never answer the question the player is asking
//  it. Measured:
//
//      markets                              corporate   gate reads
//      Consumer 242                             242     242 Consumer
//      Consumer 300, Robotics 120               180     120 Robotics
//      Consumer 400, Robotics 180, Deep 90      160      90 Deep Tech
//
//  And the second line is the other half of the complaint: opening a weak
//  second market DROPS the corporate figure from 300 to 180 while the gate has
//  not moved at all, which reads as the brand collapsing for no reason.
//
//  AND THE HOME SCREEN WAS PRINTING A THIRD THING. `Math.round(brandValue)` is
//  the raw 0-100 INDEX, while MyCompanyScreen, the market panel and the
//  quarterly report all print POINTS through `brandDisplay`. One company, 56
//  on the home screen and 242 two taps away, and the gate quoted in points so
//  the home figure compared to nothing at all.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    corporateBrandFrom,
    canUnlockAnotherCategory,
    CATEGORY_BRAND_WEIGHT,
    CATEGORY_UNLOCK_BRAND,
} from './brand';

describe('why the corporate figure cannot answer the gate question', () => {
    it('the corporate brand is a weighted average over the markets you hold', () => {
        // One market and it is simply that market.
        expect(corporateBrandFrom({ Consumer: 242 }, ['Consumer'])).toBeCloseTo(242, 6);
        // Two, and the harder one pulls twice as hard.
        expect(corporateBrandFrom({ Consumer: 300, Robotics: 120 }, ['Consumer', 'Robotics']))
            .toBeCloseTo((0.2 * 300 + 0.4 * 120) / 0.6, 6);
    });

    it('and the weights really do lean towards the hard markets', () => {
        expect(CATEGORY_BRAND_WEIGHT.Consumer).toBeLessThan(CATEGORY_BRAND_WEIGHT['Deep Tech']);
    });

    it('but the gate reads the weakest market, not the average', () => {
        const by = { Consumer: 300, Robotics: 120 };
        const cats = ['Consumer', 'Robotics'];
        const gate = canUnlockAnotherCategory(by, cats);
        expect(gate.have).toBe(120);
        expect(gate.weakest).toBe('Robotics');
        expect(corporateBrandFrom(by, cats)).toBeGreaterThan(gate.have);
    });

    it('and the average is never below the weakest, so it always flatters', () => {
        // The reason this is a rule and not a coincidence.
        const sets: Record<string, number>[] = [
            { Consumer: 242 },
            { Consumer: 300, Robotics: 120 },
            { Consumer: 400, Robotics: 180, 'Deep Tech': 90 },
            { 'Deep Tech': 50, Consumer: 50 },
        ];
        for (const by of sets) {
            const cats = Object.keys(by);
            expect(corporateBrandFrom(by, cats))
                .toBeGreaterThanOrEqual(canUnlockAnotherCategory(by, cats).have - 1e-9);
        }
    });

    it('and opening a weak second market drops the average while the gate stands still', () => {
        const before = corporateBrandFrom({ Consumer: 300 }, ['Consumer']);
        const after = corporateBrandFrom({ Consumer: 300, Robotics: 120 }, ['Consumer', 'Robotics']);
        expect(after).toBeLessThan(before);
        // "My brand collapsed" is the average moving, not the brand falling.
        expect(canUnlockAnotherCategory({ Consumer: 300, Robotics: 120 }, ['Consumer', 'Robotics']).required)
            .toBe(CATEGORY_UNLOCK_BRAND);
    });
});

describe('so the panel names every market instead', () => {
    const read = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8');
    const tech = () => read('features', 'products', 'screens', 'TechTreeScreen.tsx');

    it('the innovation screen draws one row per market you hold', () => {
        expect(tech()).toMatch(/activeCategories\.map\(cat => \{/);
        expect(tech()).toMatch(/styles\.gatePanel/);
    });

    it('and every row is measured against the gate, not against itself', () => {
        expect(tech()).toMatch(/\(points \/ CATEGORY_UNLOCK_BRAND\) \* 100/);
    });

    it('and a market you already cleared says so rather than showing a number', () => {
        // The gate memory is what makes a cleared market permanent; a row that
        // kept counting after that would be counting towards nothing.
        expect(tech()).toMatch(/const cleared = !!\(gateClearedByCategory \|\| \{\}\)\[cat\]/);
        expect(tech()).toMatch(/done \? t\('product\.gateRowCleared'\)/);
    });

    it('and the bar is never green, because clearing a gate is not a profit', () => {
        // Theme rule 4. The obvious colour for "done" is exactly the one that
        // is spoken for.
        expect(tech()).toMatch(/backgroundColor: done \? theme\.colors\.primary : theme\.colors\.brand/);
        expect(tech()).not.toMatch(/gateFill[\s\S]{0,200}colors\.positive/);
    });

    it('and the panel says out loud that the home figure is the average', () => {
        // Otherwise this screen and the home screen disagree and neither
        // explains itself, which is the state that produced the question.
        expect(tech()).toMatch(/t\('product\.gatePanelShut'/);
        for (const f of ['tr', 'en'] as const) {
            const line = read('core', 'i18n', `${f}.ts`)
                .split('\n').find(l => /'product\.gatePanelShut'/.test(l))!;
            expect(line).toBeDefined();
            expect(line).toMatch(/\{v1\}/);
            expect(line).toMatch(/\{v2\}/);
        }
    });

    it('and it only appears once you actually hold a market', () => {
        // On a brand new company there is nothing to compare and the panel
        // would be four empty bars.
        expect(tech()).toMatch(/activeCategories\.length > 0 && \(/);
    });
});

describe('and the home screen speaks the same scale as everything else', () => {
    const read = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8');
    const home = () => read('screens', 'Home', 'HomeScreen.tsx');

    it('it prints points now, not the raw index', () => {
        // THE DEFECT: 56 here against 242 on the company screen.
        expect(home()).not.toMatch(/const brandBrief = `\$\{Math\.round\(brandValue \|\| 0\)\}`/);
        expect(home()).toMatch(/const brandBrief = `\$\{brandDisplay\(brandValue \?\? 0\)\}`/);
    });

    it('and so does the arrow under it, or the figure and its change disagree', () => {
        expect(home()).toMatch(/\? indexToPoints\(brandChange\)/);
    });

    it('and when it shows the change is unchanged, only what it is measured in', () => {
        expect(home()).toMatch(/Math\.abs\(brandChange\) >= 0\.05/);
    });
});

describe('and none of the new lines uses a dash', () => {
    it('in either language', () => {
        const keys = [
            'product.gatePanelTitle', 'product.gatePanelBar', 'product.gateRowCleared',
            'product.gatePanelOpen', 'product.gatePanelShut',
        ];
        for (const f of ['tr', 'en'] as const) {
            const src = fs.readFileSync(path.join(__dirname, '..', 'i18n', `${f}.ts`), 'utf8');
            for (const k of keys) {
                const line = src.split('\n').find(l => l.includes(`'${k}'`));
                expect(`${f}:${k}:${line}`).toContain(k);
                expect(line).not.toMatch(/[—–]/);
                expect(line!.replace(/^.*?':/, '')).not.toMatch(/ - /);
            }
        }
    });
});
