// src/core/market/categoryGate.test.ts
//
// ============================================================================
//  A GATE TWO POINTS UNDER THE CEILING IS NOT A GATE
// ============================================================================
//
//  Reported as "I want to move from phones to another market, but if I cannot
//  reach the number without upgrading the factory I cannot move, and getting
//  that far in Consumer is hard".
//
//  Measured, and it was worse than the report:
//
//      the gate                     93 points
//      the tier one brand ceiling   95 points
//
//  Two points of margin, and that margin was mine. The 93 came from
//  converting "about 4.6% share" onto the square root curve in an earlier
//  session, without ever checking it against the ceiling it would have to sit
//  under.
//
//  SHARE CANNOT CARRY YOU THERE EITHER. 93 points needs 4.62% of Consumer,
//  which is 46,200 units a quarter. A tier one line makes 4,050. Eleven times
//  over. So at tier one only marketing can open the gate, and marketing stops
//  at the ceiling, two points above it.
//
//  Played out over forty quarters at tier one with the budget at three times
//  the benchmark, the category brand went:
//
//      q5   61 points  shut
//      q10  95 points  OPEN     <- exactly the ceiling
//      q15  88         shut
//      q20  64         shut
//      q30  35         shut
//      q40  22         shut
//
//  One quarter in forty. And what closed it again was the sponsorship
//  drought, which is the other half of this - see droughtCap.test.ts.
// ============================================================================

import {
    canUnlockAnotherCategory,
    categoryUnlockRequirement,
    CATEGORY_UNLOCK_BRAND,
    CATEGORY_UNLOCK_CEILING_RATIO,
    indexToPoints,
    brandEquilibrium,
} from './brand';
import { getTier } from './capacity';
import { maxUnitsPerQuarter } from './production';
import { getMarket } from './productMarkets';

const ceilingOf = (tier: number) => getTier(tier).brandCeiling;

describe('what the gate asks for', () => {
    it('is a share of what THIS factory allows, not a fixed number', () => {
        for (const tier of [1, 3, 5, 8]) {
            const expected = Math.round(
                indexToPoints(ceilingOf(tier)) * CATEGORY_UNLOCK_CEILING_RATIO,
            );
            expect(categoryUnlockRequirement(ceilingOf(tier))).toBe(expected);
        }
    });

    it('and it leaves room to hold the number, not just touch it', () => {
        // THE DEFECT. 93 against a tier one ceiling of 95 is not something a
        // player can sit on; it is something they pass through.
        for (const tier of [1, 2, 3, 5, 8]) {
            const gate = categoryUnlockRequirement(ceilingOf(tier));
            const ceiling = indexToPoints(ceilingOf(tier));
            expect(ceiling - gate).toBeGreaterThan(ceiling * 0.25);
        }
    });

    it('and at tier one that is a number a tier one company can reach', () => {
        expect(categoryUnlockRequirement(ceilingOf(1))).toBe(67);
        expect(CATEGORY_UNLOCK_BRAND).toBe(93);   // what it used to be, flat
        expect(67).toBeLessThan(indexToPoints(ceilingOf(1)));
    });

    it('and it rises with the factory, so the rule means the same thing later', () => {
        const gates = [1, 2, 3, 4, 5, 6, 7, 8].map(t => categoryUnlockRequirement(ceilingOf(t)));
        for (let i = 1; i < gates.length; i++) {
            expect(gates[i]).toBeGreaterThan(gates[i - 1]);
        }
    });

    it('and with no ceiling to hand it falls back rather than letting everyone through', () => {
        expect(categoryUnlockRequirement(undefined)).toBe(CATEGORY_UNLOCK_BRAND);
        expect(categoryUnlockRequirement(0)).toBe(CATEGORY_UNLOCK_BRAND);
    });
});

describe('why the old number was unreachable at tier one', () => {
    it('the share it implied was eleven times the line', () => {
        const mk = getMarket('Consumer')!;
        // What share supports 93 points on its own.
        let share = 0;
        while (brandEquilibrium(share) < CATEGORY_UNLOCK_BRAND && share < 100) share += 0.01;
        const unitsNeeded = mk.sizeUnitsPerQuarter * share / 100;
        const canBuild = maxUnitsPerQuarter(getTier(1).crew, 50, 1, false);
        expect(share).toBeCloseTo(4.62, 1);
        expect(Math.round(unitsNeeded)).toBe(46_200);
        expect(canBuild).toBe(4_050);
        expect(unitsNeeded / canBuild).toBeGreaterThan(10);
    });

    it('and the new one is inside what the factory can hold', () => {
        // Not inside what SHARE alone supports - a tier one line is 0.4% of
        // Consumer and that carries about 27 points - but inside the ceiling,
        // which is what marketing can reach and keep.
        const gate = categoryUnlockRequirement(ceilingOf(1));
        expect(gate).toBeLessThan(indexToPoints(ceilingOf(1)));
        expect(gate).toBeLessThan(CATEGORY_UNLOCK_BRAND);
    });
});

describe('the gate itself still gates', () => {
    const CEIL = ceilingOf(1);

    it('the weakest market is the one that decides', () => {
        const gate = canUnlockAnotherCategory(
            { Consumer: 200, Robotics: 10 }, ['Consumer', 'Robotics'], CEIL,
        );
        expect(gate.allowed).toBe(false);
        expect(gate.weakest).toBe('Robotics');
        expect(gate.have).toBe(10);
    });

    it('and one strong market does not carry two neglected ones', () => {
        expect(canUnlockAnotherCategory(
            { Consumer: 400, Robotics: 5, 'Deep Tech': 5 },
            ['Consumer', 'Robotics', 'Deep Tech'], CEIL,
        ).allowed).toBe(false);
    });

    it('and your very first market is never gated', () => {
        expect(canUnlockAnotherCategory({}, [], CEIL).allowed).toBe(true);
    });

    it('and it opens when the weakest is there', () => {
        const need = categoryUnlockRequirement(CEIL);
        expect(canUnlockAnotherCategory({ Consumer: need }, ['Consumer'], CEIL).allowed).toBe(true);
        expect(canUnlockAnotherCategory({ Consumer: need - 1 }, ['Consumer'], CEIL).allowed).toBe(false);
    });

    it('and it reports the number it actually used, so the screen can name it', () => {
        expect(canUnlockAnotherCategory({ Consumer: 10 }, ['Consumer'], CEIL).required)
            .toBe(categoryUnlockRequirement(CEIL));
        expect(canUnlockAnotherCategory({ Consumer: 10 }, ['Consumer'], ceilingOf(5)).required)
            .toBe(categoryUnlockRequirement(ceilingOf(5)));
    });
});

describe('the wiring', () => {
    const fs = require('fs');
    const path = require('path');
    const read = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8');

    it('both screens hand over the tier, or the gate silently falls back to 93', () => {
        // The failure this guards: `canUnlockAnotherCategory` still works with
        // two arguments, so a caller that forgets the third gets the old flat
        // number and nothing anywhere goes red.
        for (const src of [
            read('features', 'products', 'components', 'ProductUnlockModal.tsx'),
            read('features', 'products', 'screens', 'TechTreeScreen.tsx'),
        ]) {
            expect(src).toMatch(/canUnlockAnotherCategory\([^)]*getTier\(facilityTier\)\.brandCeiling\)/);
        }
    });
});
