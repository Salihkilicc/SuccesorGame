// src/core/market/categoryGate.test.ts
//
// ============================================================================
//  A BAR THAT RISES WITH YOU IS A BAR YOU NEVER FEEL YOURSELF CLEAR
// ============================================================================
//
//  This gate has now been three things, and the history is the argument.
//
//  FLAT 200. Where it started. Unreachable at tier one, which produced "I
//  cannot move to another market without upgrading the factory".
//
//  FLAT 93. My conversion of "about 4.6% share" onto the square root curve.
//  The tier one ceiling is 95, so the gate sat two points under it: not a
//  gate, a coin toss. It opened once in forty quarters.
//
//  SEVEN TENTHS OF THE TIER CEILING. Fixed that and introduced something
//  worse, reported after playing with it:
//
//      "the limit is what I do not like. Now it goes 51, then 55, a little at
//      every tier, and the game became impossible or broken."
//
//  Which is what a proportional bar does: every upgrade raised the
//  requirement alongside the brand, so the player's number crept up beside a
//  line creeping up with it and nothing ever felt like arriving.
//
//  FLAT 200 AGAIN. Asked for as "open the second category around a tier
//  twelve factory, and take the limit away" - which turn out to be the same
//  request. Measured, the proportional rule asks for:
//
//      T1 67   T5 115   T9 170   T11 197   T12 212
//
//  So a flat 200 IS the tier eleven to twelve gate, without a moving line.
//  On one run it was reached at quarter 85 against quarter 5 proportional.
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
    it('is the same number at every tier', () => {
        expect(categoryUnlockRequirement()).toBe(CATEGORY_UNLOCK_BRAND);
        expect(CATEGORY_UNLOCK_BRAND).toBe(200);
    });

    it('and it takes no arguments, so the signature cannot lie about that', () => {
        // It used to take the tier's ceiling. Leaving an ignored parameter
        // behind would say the rule still depends on something it does not.
        expect(categoryUnlockRequirement.length).toBe(0);
    });

    it('and it lands where a tier eleven to twelve factory sits', () => {
        // The ratio is kept as the record of what was tried, so the claim can
        // be checked rather than asserted.
        const proportional = (tier: number) =>
            Math.round(indexToPoints(ceilingOf(tier)) * CATEGORY_UNLOCK_CEILING_RATIO);
        expect(proportional(11)).toBeLessThan(CATEGORY_UNLOCK_BRAND);
        expect(proportional(12)).toBeGreaterThan(CATEGORY_UNLOCK_BRAND);
    });

    it('and it is well clear of the tier one ceiling, which the 93 was not', () => {
        // 93 against a ceiling of 95 was the coin toss.
        expect(CATEGORY_UNLOCK_BRAND).toBeGreaterThan(indexToPoints(ceilingOf(1)));
    });
});

describe('why a tier one company cannot simply buy it', () => {
    it('the share it implies is far past what a tier one line can serve', () => {
        const mk = getMarket('Consumer')!;
        let share = 0;
        while (brandEquilibrium(share) < CATEGORY_UNLOCK_BRAND && share < 100) share += 0.01;
        const unitsNeeded = mk.sizeUnitsPerQuarter * share / 100;
        const canBuild = maxUnitsPerQuarter(getTier(1).crew, 50, 1, false);
        expect(unitsNeeded / canBuild).toBeGreaterThan(10);
    });

    it('and that is the point: it is a late gate on purpose', () => {
        // The complaint the proportional rule was written for was that the
        // gate was unreachable early. The answer turned out to be that it is
        // SUPPOSED to be late, and the earlier fix was solving the wrong
        // problem.
        expect(CATEGORY_UNLOCK_BRAND).toBeGreaterThan(indexToPoints(ceilingOf(5)));
    });
});

describe('the gate itself still gates', () => {
    it('the weakest market is the one that decides', () => {
        const gate = canUnlockAnotherCategory(
            { Consumer: 400, Robotics: 10 }, ['Consumer', 'Robotics'],
        );
        expect(gate.allowed).toBe(false);
        expect(gate.weakest).toBe('Robotics');
        expect(gate.have).toBe(10);
    });

    it('and one strong market does not carry two neglected ones', () => {
        expect(canUnlockAnotherCategory(
            { Consumer: 600, Robotics: 5, 'Deep Tech': 5 },
            ['Consumer', 'Robotics', 'Deep Tech'],
        ).allowed).toBe(false);
    });

    it('and your very first market is never gated', () => {
        expect(canUnlockAnotherCategory({}, []).allowed).toBe(true);
    });

    it('and it opens when the weakest is there', () => {
        const need = categoryUnlockRequirement();
        expect(canUnlockAnotherCategory({ Consumer: need }, ['Consumer']).allowed).toBe(true);
        expect(canUnlockAnotherCategory({ Consumer: need - 1 }, ['Consumer']).allowed).toBe(false);
    });

    it('and it reports the number it used, so the screen can name it', () => {
        expect(canUnlockAnotherCategory({ Consumer: 10 }, ['Consumer']).required)
            .toBe(CATEGORY_UNLOCK_BRAND);
    });
});

// ============================================================================
//  AND A GATE YOU CLEARED STAYS CLEARED
// ============================================================================
//  Less load bearing than it was - a flat bar does not rise out from under
//  you - but brand still FALLS, and losing the right to a market you already
//  proved you could run because of one bad year is the same unfairness by a
//  slower route.
// ============================================================================
describe('a gate you cleared', () => {
    it('stays cleared after the brand falls back', () => {
        expect(canUnlockAnotherCategory(
            { Consumer: 1 }, ['Consumer'], { Consumer: true },
        ).allowed).toBe(true);
    });

    it('but an uncleared market still shuts it, however strong the others are', () => {
        const g = canUnlockAnotherCategory(
            { Consumer: 600, Robotics: 5 }, ['Consumer', 'Robotics'], { Consumer: true },
        );
        expect(g.allowed).toBe(false);
        expect(g.weakest).toBe('Robotics');
    });

    it('and a cleared market is never named as the weakest link', () => {
        const g = canUnlockAnotherCategory(
            { Consumer: 1, Robotics: 50 }, ['Consumer', 'Robotics'], { Consumer: true },
        );
        expect(g.weakest).toBe('Robotics');
    });

    it('and no memory at all behaves exactly as it did before', () => {
        const need = categoryUnlockRequirement();
        expect(canUnlockAnotherCategory({ Consumer: need }, ['Consumer'], undefined).allowed).toBe(true);
        expect(canUnlockAnotherCategory({ Consumer: need - 1 }, ['Consumer'], undefined).allowed).toBe(false);
    });

    it('and everything cleared is simply open', () => {
        expect(canUnlockAnotherCategory(
            { Consumer: 1, Robotics: 1 }, ['Consumer', 'Robotics'],
            { Consumer: true, Robotics: true },
        ).allowed).toBe(true);
    });
});

describe('the wiring', () => {
    const fs = require('fs');
    const path = require('path');
    const read = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8');

    it('neither screen hands over a tier any more, because the bar is flat', () => {
        for (const src of [
            read('features', 'products', 'components', 'ProductUnlockModal.tsx'),
            read('features', 'products', 'screens', 'TechTreeScreen.tsx'),
        ]) {
            expect(src).toMatch(/canUnlockAnotherCategory\([^)]*gateClearedByCategory\)/);
            // And the tier is gone from the call, or the bar is still moving.
            expect(src).not.toMatch(/canUnlockAnotherCategory\([^)]*brandCeiling/);
        }
    });

    it('and the memory too, or upgrading the factory takes the gate away again', () => {
        for (const src of [
            read('features', 'products', 'components', 'ProductUnlockModal.tsx'),
            read('features', 'products', 'screens', 'TechTreeScreen.tsx'),
        ]) {
            expect(src).toMatch(/gateClearedByCategory = useStatsStore\(st => st\.gateClearedByCategory\)/);
        }
    });

    it('and the tick records it, or there is nothing for them to read', () => {
        const src = read('core', 'store', 'useGameStore.ts');
        expect(src).toMatch(/if \(r\.newBrand >= gateBar\) nextCleared\[cat\] = true/);
        expect(src).toMatch(/gateClearedByCategory: nextCleared/);
        // And the bar it records against is the one the screens will use.
        expect(src).toMatch(/const gateBar = categoryUnlockRequirement\(\)/);
    });
});
