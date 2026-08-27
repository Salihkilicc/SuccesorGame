// src/core/market/matchDemand.test.ts
//
// ============================================================================
//  THE BUTTON HAS TO BUILD WHAT IT SAYS IT BUILDS
// ============================================================================
//
//  Reported as "match demand says X but I need several times X to stop running
//  out of stock, and the gap makes the game confusing".
//
//  The demand figure itself was measured first and it was exact - the screen's
//  projection matched the engine to the unit over six quarters (4354/4354,
//  3868/3868, 3759/3759). So the number was never the lie. What lied was the
//  button:
//
//      the label said   need > capacity ? capacity : need / yield
//      the press set    min(capacity, need / yield)
//
//  Two sums for one button. At need 3800, yield 0.9 and capacity 4050 the
//  label announced 4222 and the press set 4050, and nothing on the screen
//  said so.
//
//  Measured on a fresh company at tier one, capacity 4050:
//
//      marketing  67k  demand 4354  1.08x capacity
//      marketing 200k  demand 5761  1.42x
//      marketing 600k  demand 6981  1.72x
//      marketing   2M  demand 7675  1.90x
//
//  Capacity is flat and demand is not, so the wall is reached the quarter you
//  start spending. The explanation existed - `product.capacityCeiling` says
//  "hire up to the crew or raise the tier" - but it lived behind the alerts
//  button, three taps from the control that would fix it.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { matchDemandPlan, DEMAND_BUFFER } from './production';

describe('what match demand builds', () => {
    it('covers demand after scrap, which is the whole reason it is not just demand', () => {
        // 1000 wanted, a tenth of every build thrown away.
        const plan = matchDemandPlan({ neededUnits: 1000, effectiveYield: 0.9, maxUnits: 999_999 });
        expect(Math.floor(plan.build * 0.9)).toBeGreaterThanOrEqual(1000);
        expect(plan.shortfall).toBe(0);
    });

    it('and adds a margin on top, so a demand that drifts up does not empty the shelf', () => {
        // Serving a quarter well raises the reach index and the brand, and
        // both raise NEXT quarter's demand. Aiming at exactly today's figure
        // means arriving short every time, and short is what costs the index.
        const plan = matchDemandPlan({ neededUnits: 1000, effectiveYield: 1, maxUnits: 999_999 });
        expect(plan.build).toBe(1100);
        expect(DEMAND_BUFFER).toBeCloseTo(0.10, 6);
    });

    it('and the margin stays under the overbuilding warning, because storage is charged', () => {
        // `overBuilding` fires at a fifth of demand left on the shelf. A
        // default that trips the game's own warning is not a default.
        expect(DEMAND_BUFFER).toBeLessThan(0.20);
    });

    it('and the scrap and the margin compound rather than replacing each other', () => {
        const plan = matchDemandPlan({ neededUnits: 1000, effectiveYield: 0.8, maxUnits: 999_999 });
        expect(plan.build).toBe(Math.ceil((1000 / 0.8) * 1.1));
    });
});

describe('when the line cannot reach it', () => {
    it('the number it shows is the number it sets', () => {
        // THE DEFECT. The label read the raw need against capacity while the
        // press read need/yield against capacity, so the two disagreed in
        // exactly the band where the player is trying hardest.
        const plan = matchDemandPlan({ neededUnits: 3800, effectiveYield: 0.9, maxUnits: 4050 });
        expect(plan.build).toBe(4050);
        expect(plan.capped).toBe(true);
    });

    it('and it says how far short that leaves you, in units somebody can sell', () => {
        const plan = matchDemandPlan({ neededUnits: 3800, effectiveYield: 0.9, maxUnits: 4050 });
        // 4050 built, 3645 sellable, against 3800 wanted.
        expect(plan.shortfall).toBe(3800 - Math.floor(4050 * 0.9));
        expect(plan.shortfall).toBeGreaterThan(0);
    });

    it('but losing only the margin is not being short', () => {
        // Capacity that covers demand exactly, with no room for the cushion.
        // The player is fine; the button must not cry wolf at them.
        const plan = matchDemandPlan({ neededUnits: 1000, effectiveYield: 1, maxUnits: 1000 });
        expect(plan.capped).toBe(true);
        expect(plan.shortfall).toBe(0);
    });

    it('and a dead line asks for nothing rather than dividing by zero', () => {
        const plan = matchDemandPlan({ neededUnits: 1000, effectiveYield: 0.9, maxUnits: 0 });
        expect(plan.build).toBe(0);
        expect(plan.shortfall).toBe(1000);
        expect(Number.isFinite(plan.target)).toBe(true);
    });

    it('and a nonsense yield does not produce an infinite target', () => {
        const plan = matchDemandPlan({ neededUnits: 1000, effectiveYield: 0, maxUnits: 999_999 });
        expect(Number.isFinite(plan.build)).toBe(true);
        expect(plan.build).toBeGreaterThan(0);
    });

    it('and no demand asks for no build', () => {
        expect(matchDemandPlan({ neededUnits: 0, effectiveYield: 0.9, maxUnits: 4050 }).build).toBe(0);
    });
});

describe('the wiring', () => {
    const src = fs.readFileSync(
        path.join(__dirname, '..', '..', 'features', 'products', 'components', 'ProductModals.tsx'),
        'utf8',
    );

    it('the screen asks the plan rather than doing the sum itself', () => {
        expect(src).toMatch(/matchDemandPlan\(\{\s*neededUnits,\s*effectiveYield,\s*maxUnits\s*\}\)/);
    });

    it('and the press and the label read the SAME plan', () => {
        // The bug was two expressions, so this is the rule that would have
        // caught it: neither the press nor the label recomputes anything.
        expect(src).toMatch(/onPress=\{\(\) => setProductionUnits\(demandPlan\.build\)\}/);
        expect(src).toMatch(/units: formatNumber\(demandPlan\.build\)/);
        // And the old shape is gone from both.
        expect(src).not.toMatch(/setProductionUnits\(Math\.min\(maxUnits, Math\.ceil\(neededUnits/);
        expect(src).not.toMatch(/neededUnits > maxUnits\s*$/m);
    });

    it('and the shortfall is on the button, not three taps away in the alerts', () => {
        expect(src).toMatch(/product\.matchDemandShort/);
        expect(src).toMatch(/short: formatNumber\(demandPlan\.shortfall\)/);
    });
});

// ============================================================================
//  AND IT DOES NOT DISAPPEAR
// ============================================================================
//  Reported as "the blue match demand button goes away later in the game and
//  I don't know why". Four conditions, three of which rendered something else:
//
//      demand 0            -> NOTHING AT ALL, an empty gap
//      stock covers it     -> an 11px line at 48% white
//      no line to build on -> an 11px line at 48% white
//      otherwise           -> a solid blue button
//
//  Two thirds of the time the control was gone and what stood in for it read
//  as absence rather than as an answer. Nothing was broken; the screen just
//  stopped talking at the moment it had something to say.
// ============================================================================
describe('the control stays where it is', () => {
    const src = fs.readFileSync(
        path.join(__dirname, '..', '..', 'features', 'products', 'components', 'ProductModals.tsx'),
        'utf8',
    );

    it('every reason it cannot act has a sentence, including no demand', () => {
        for (const key of [
            'product.matchDemandNoDemand',
            'product.enoughStock',
            'product.cannotBuildRetooling',
            'product.cannotBuildNoCrew',
        ]) {
            expect(src).toContain(key);
        }
    });

    it('and both languages can say all of them', () => {
        const tr = fs.readFileSync(path.join(__dirname, '..', 'i18n', 'tr.ts'), 'utf8');
        const en = fs.readFileSync(path.join(__dirname, '..', 'i18n', 'en.ts'), 'utf8');
        for (const key of [
            'product.matchDemandNoDemand',
            'product.matchDemandShort',
            'product.matchDemandBuffer',
        ]) {
            expect(tr).toContain(`'${key}'`);
            expect(en).toContain(`'${key}'`);
        }
    });

    it('and it keeps the button shape rather than collapsing to a grey line', () => {
        // The rule that would have caught the original: whatever renders in
        // the stalled cases carries `matchBtn`, so it occupies the same space.
        expect(src).toMatch(/\[styles\.matchBtn, styles\.matchBtnIdle\]/);
        expect(src).toMatch(/matchBtnIdle: \{ backgroundColor: theme\.colors\.disabled \}/);
    });

    it('and the idle label is dark, because the idle fill is light', () => {
        // Rule 1. `disabled` is a light grey, so the text on it is onLight -
        // the same black the live button uses, so greying out does not turn
        // into a different control.
        expect(src).toMatch(/matchBtnIdleText: \{ color: theme\.colors\.onLight/);
    });

    it('and no player facing string in this block uses a dash', () => {
        const tr = fs.readFileSync(path.join(__dirname, '..', 'i18n', 'tr.ts'), 'utf8');
        const en = fs.readFileSync(path.join(__dirname, '..', 'i18n', 'en.ts'), 'utf8');
        const lines = [...tr.split('\n'), ...en.split('\n')]
            .filter(l => /'product\.matchDemand/.test(l) || /'product\.enoughStock/.test(l));
        expect(lines.length).toBeGreaterThan(0);
        for (const l of lines) {
            expect(l).not.toMatch(/[—–]/);
            expect(l.replace(/^.*?:/, '')).not.toMatch(/ - /);
        }
    });
});
