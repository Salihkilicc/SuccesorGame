// src/core/story/nightOutChild.test.ts
//
// ============================================================================
//  THE GAME PROMISED A CHILD AND NEVER DELIVERED ONE
// ============================================================================
//
//  `nightOutUtils` has rolled a seven per cent pregnancy on every night out
//  since it was written, and `PregnancyRevealModal` says so to the player's
//  face: "your wild night left a permanent mark, you are becoming a parent".
//
//  The modal is fifty one lines. An icon, three sentences, and a button that
//  closes it. It does not import the family store and `addChild` was never
//  called from anywhere in that flow. The player was told they were a parent
//  and no child was ever born.
//
//  Correct data with no reader again, and worse than the usual case because
//  it is a PROMISE rather than a number. Two of the six long simulation runs
//  ended in `diedWithoutAnHeir`.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    newbornFromNightOut,
    NIGHT_OUT_CHILD_NAMES,
    NIGHT_OUT_CHILD_LOYALTY,
    NIGHT_OUT_CHILD_RELATIONSHIP,
    DYNASTY_START_YEAR,
} from './nightOutChild';

const ctx = { birthYear: 2030, birthQuarter: 3 };
/** A die that always reads the same, so the shape can be asserted. */
const fixed = (v: number) => () => v;

describe('the child that arrives', () => {
    it('is a newborn, with everything the family store needs', () => {
        const c = newbornFromNightOut(ctx, fixed(0.5));
        expect(c.age).toBe(0);
        expect(c.role).toBe('Infant');
        expect(c.educationLevel).toBe('None');
        expect(c.birthYear).toBe(2030);
        expect(c.birthQuarter).toBe(3);
        expect(c.isSuccessorCandidate).toBe(false);
        expect(c.allowance).toBe(0);
    });

    it('and carries no surname, because the store appends the dynasty name', () => {
        // Doing it here as well produced "Alex Hale Hale" the first time.
        for (const r of [0, 0.3, 0.7, 0.99]) {
            const c = newbornFromNightOut(ctx, fixed(r));
            expect(c.name).not.toMatch(/Hale/);
            expect(NIGHT_OUT_CHILD_NAMES).toContain(c.name);
        }
    });

    it('and every stat is inside the range the rest of the game expects', () => {
        for (let i = 0; i < 200; i++) {
            const c = newbornFromNightOut(ctx);
            for (const [k, v] of Object.entries(c.stats)) {
                expect(typeof v).toBe('number');
                expect(v).toBeGreaterThanOrEqual(0);
                expect(v).toBeLessThanOrEqual(100);
                expect(Number.isFinite(v)).toBe(true);
                expect(`${k}:${v}`).toBeTruthy();
            }
        }
    });

    it('and it can be either, rather than always the same one', () => {
        expect(newbornFromNightOut(ctx, fixed(0.2)).gender).toBe('Male');
        expect(newbornFromNightOut(ctx, fixed(0.8)).gender).toBe('Female');
    });
});

describe('and it is not the child you planned for', () => {
    it('its loyalty does not start where a planned child starts', () => {
        // FamilyMemberScreen pins a planned baby at 95. A child who arrives by
        // letter has a reason to be ambivalent about the family that did not
        // expect them. It is still your heir; it is simply not free.
        expect(NIGHT_OUT_CHILD_LOYALTY).toBeLessThan(95);
        expect(newbornFromNightOut(ctx).stats.loyalty).toBe(NIGHT_OUT_CHILD_LOYALTY);
    });

    it('nor does its warmth towards you', () => {
        expect(NIGHT_OUT_CHILD_RELATIONSHIP).toBeLessThan(100);
        expect(newbornFromNightOut(ctx).relationshipWithPlayer).toBe(NIGHT_OUT_CHILD_RELATIONSHIP);
    });

    it('but it is not written off either, because it may be the only heir you get', () => {
        // A child nobody can use is not a mechanic, it is a punishment with a
        // cot in it.
        expect(NIGHT_OUT_CHILD_LOYALTY).toBeGreaterThan(40);
        for (let i = 0; i < 100; i++) {
            const c = newbornFromNightOut(ctx);
            expect(c.stats.businessAcumen).toBeGreaterThan(40);
        }
    });

    it('and it says on the record how it arrived', () => {
        expect(newbornFromNightOut(ctx).traits).toContain('Unplanned');
    });
});

describe('and rubbish in does not produce rubbish out', () => {
    it('a nonsense quarter is clamped into the year', () => {
        expect(newbornFromNightOut({ birthYear: 2030, birthQuarter: 0 }).birthQuarter).toBe(1);
        expect(newbornFromNightOut({ birthYear: 2030, birthQuarter: 9 }).birthQuarter).toBe(4);
        expect(newbornFromNightOut({ birthYear: 2030, birthQuarter: NaN }).birthQuarter).toBe(1);
    });

    it('and a nonsense year does not go negative', () => {
        expect(newbornFromNightOut({ birthYear: -50, birthQuarter: 1 }).birthYear).toBe(0);
        expect(newbornFromNightOut({ birthYear: NaN, birthQuarter: 1 }).birthYear).toBe(0);
    });

    it('and a die at the very ends of its range still picks a real name', () => {
        expect(NIGHT_OUT_CHILD_NAMES).toContain(newbornFromNightOut(ctx, fixed(0)).name);
        expect(NIGHT_OUT_CHILD_NAMES).toContain(newbornFromNightOut(ctx, fixed(0.9999999)).name);
        expect(NIGHT_OUT_CHILD_NAMES).toContain(newbornFromNightOut(ctx, fixed(1)).name);
    });
});

describe('the wiring', () => {
    const read = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8');
    const hook = () => read('features', 'life', 'components', 'NightOut', 'useNightOutSystem.ts');
    const screen = () => read('features', 'life', 'screens', 'NightOutScreen.tsx');

    it('the roll that was already there still fires at seven per cent', () => {
        // Untouched. The chance was never the missing part.
        const utils = read('features', 'life', 'components', 'NightOut', 'logic', 'nightOutUtils.ts');
        expect(utils).toMatch(/const triggerPregnancy = Math\.random\(\) < 0\.07/);
    });

    it('and dismissing the card is what actually creates the child', () => {
        // THE DEFECT. `addChild` appeared nowhere in this flow.
        expect(hook()).toMatch(/useFamilyStore\.getState\(\)\.addChild\(newbornFromNightOut\(/);
        expect(screen()).toMatch(/onClose=\{handlePregnancyClose\}/);
    });

    it('and the screen no longer closes it by hand, so there is one path', () => {
        // Two ways to dismiss one modal is one way to be born and one way not
        // to be.
        expect(screen()).not.toMatch(/onClose=\{\(\) => setPregnancyModalVisible\(false\)\}/);
    });

    it('and the birth is dated from the game clock rather than a literal', () => {
        expect(hook()).toMatch(/currentQuarter\(\)/);
        expect(hook()).toMatch(/DYNASTY_START_YEAR \+ Math\.floor\(\(q - 1\) \/ 4\)/);
        expect(DYNASTY_START_YEAR).toBe(2026);
    });
});
