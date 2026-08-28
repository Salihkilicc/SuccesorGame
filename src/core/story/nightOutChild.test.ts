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
        // THE DEFECT. `addChild` appeared nowhere in this flow. It is called
        // one naming step later now, so the rule is that it is called at all
        // and that the pregnancy card is what starts the chain.
        expect(hook()).toMatch(/useFamilyStore\.getState\(\)\.addChild\(/);
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

// ============================================================================
//  AND WHOSE CHILD IT IS DECIDES WHAT THEY INHERIT
// ============================================================================
//  Asked for as "if it is not the heir it should get no shares, because it is
//  illegitimate; a child born to your wife should get shares even if it is not
//  the heir".
//
//  The estate already split the two currencies for a reason - the others get
//  PAID, the heir gets CONTROL - so this rides on the split that was already
//  there rather than adding a second rule beside it. Cash is untouched.
// ============================================================================
describe('who is on the share register afterwards', () => {
    const { divideEstate, HEIR_STOCK_SHARE } = require('./inheritance');
    const legit = (id: string) => ({ id, kind: 'child' as const, legitimate: true });
    const bastard = (id: string) => ({ id, kind: 'child' as const, legitimate: false });
    const estate = { cash: 1_000_000, shares: 1_000 };

    it('a child from your wife takes stock even when it is not the heir', () => {
        const out = divideEstate(estate, [legit('a'), legit('b')], 'a');
        expect(out.find((b: any) => b.id === 'b').shares).toBe(1_000 * (1 - HEIR_STOCK_SHARE));
    });

    it('but a child from a night out does not', () => {
        // THE RULE. It is still in the will and still in the family; it is
        // simply not on the register.
        const out = divideEstate(estate, [legit('a'), bastard('b')], 'a');
        expect(out.find((b: any) => b.id === 'b').shares).toBe(0);
    });

    it('and it is still PAID the same as everybody else', () => {
        // Cutting them out of the money as well would make the rule about
        // punishing them rather than about who runs the company.
        const out = divideEstate(estate, [legit('a'), bastard('b')], 'a');
        expect(out.find((b: any) => b.id === 'b').cash)
            .toBe(out.find((b: any) => b.id === 'a').cash);
    });

    it('unless you CHOOSE them, and then they inherit exactly as any heir does', () => {
        // The point of it being a choice. You can put the company in the hands
        // of the child nobody expected; the cost is that you had to decide to.
        const out = divideEstate(estate, [bastard('a'), legit('b')], 'a');
        expect(out.find((b: any) => b.id === 'a').kind).toBe('heir');
        expect(out.find((b: any) => b.id === 'a').shares).toBe(1_000 * HEIR_STOCK_SHARE);
    });

    it('and the stock that would have gone to them goes to the heir, not nowhere', () => {
        // The register has to keep adding up. A share that belongs to nobody
        // is a company that quietly shrinks every generation.
        const out = divideEstate(estate, [legit('a'), bastard('b'), bastard('c')], 'a');
        expect(out.reduce((n: number, b: any) => n + b.shares, 0)).toBe(1_000);
        expect(out.find((b: any) => b.id === 'a').shares).toBe(1_000);
    });

    it('and with no heir at all the illegitimate ones still take none', () => {
        // The underage branch. Nobody is in charge, but that does not promote
        // anybody either.
        const out = divideEstate(estate, [legit('a'), bastard('b')], null);
        expect(out.find((b: any) => b.id === 'b').shares).toBe(0);
        expect(out.find((b: any) => b.id === 'a').shares).toBe(1_000);
    });

    it('and a child with no flag at all is treated as legitimate', () => {
        // Every existing save. Absent must never mean disinherited.
        const out = divideEstate(estate, [{ id: 'a', kind: 'child' }, { id: 'b', kind: 'child' }], 'a');
        expect(out.find((b: any) => b.id === 'b').shares).toBeGreaterThan(0);
    });

    it('and the night out child is the one that carries the flag', () => {
        expect(newbornFromNightOut(ctx).legitimate).toBe(false);
    });
});

describe('and the player names them', () => {
    const read = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8');
    const hook = () => read('features', 'life', 'components', 'NightOut', 'useNightOutSystem.ts');
    const screen = () => read('features', 'life', 'screens', 'NightOutScreen.tsx');

    it('the child is drawn once and named after, not re-rolled by the card', () => {
        // Opening a naming screen twice must not be a way to shop for a
        // better child.
        expect(hook()).toMatch(/setPendingNewborn\(newbornFromNightOut\(/);
        expect(hook()).toMatch(/const child = pendingNewborn;/);
    });

    it('and skipping the name still births the child', () => {
        // A naming card that can lose you an heir on a stray tap is not a
        // mechanic.
        expect(screen()).toMatch(/onSkip=\{confirmNewbornName\}/);
        expect(screen()).toMatch(/onConfirm=\{confirmNewbornName\}/);
    });

    it('and the reader hands the flag to the estate, or the rule does nothing', () => {
        expect(read('core', 'story', 'readRecord.ts'))
            .toMatch(/legitimate: c\.legitimate !== false/);
    });
});
