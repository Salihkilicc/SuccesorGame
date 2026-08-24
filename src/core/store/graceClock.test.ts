// src/core/store/graceClock.test.ts
//
// ============================================================================
//  THE CLOCK THE BOARD IS READ AGAINST
// ============================================================================
//
//  governance.test.ts proves the RULE: past quarter sixteen the founder is no
//  longer protected. That test passed the whole time the bug was live, because
//  the rule was never the broken part. What was broken was the number handed
//  to it.
//
//  This is the fourth time in this codebase that a correct pure module has sat
//  behind a caller feeding it the wrong thing - the buyout screens, the
//  education multiplier, the slots payout, the quarterly reputation allowance.
//  So this file tests the WIRING, and it tests it by running the clock rather
//  than by reading the line and agreeing with it.
//
//  ---------------------------------------------------------------------------
//  WHY IT PARSES THE SOURCE INSTEAD OF CALLING THE STORE
//  ---------------------------------------------------------------------------
//  The derivation lives in the middle of `advanceQuarter`, behind an economy
//  engine, a shareholder store and a dozen side effects. Re-typing the formula
//  into a test would prove only that I can type it twice: the version in the
//  test would agree with itself forever while the real one drifted, which is
//  exactly the failure being fixed here.
//
//  So the expression is LIFTED OUT OF THE FILE and evaluated. If somebody
//  changes it back to a wrapped month, this file runs the changed version and
//  fails.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    checkNoConfidence,
    FOUNDER_GRACE_PERIOD_QUARTERS,
    type GovMember,
} from '../market/governance';

const storeSource = () =>
    fs.readFileSync(path.join(__dirname, 'useGameStore.ts'), 'utf8');

/**
 * The real derivation, pulled out of the store and made callable.
 *
 * It reads the two inputs it depends on - `get().age` and the month - out of
 * the expression's own text, so the test cannot quietly diverge from it.
 */
const liftDerivation = (): ((age: number, month: number) => number) => {
    const src = storeSource();
    const match = src.match(/const elapsedQuarters =\s*([\s\S]*?);/);
    if (!match) throw new Error('elapsedQuarters is not derived in useGameStore any more');
    const expr = match[1]
        .replace(/get\(\)\.age/g, 'age')
        .replace(/currentMonthVal/g, 'month')
        .replace(/initialGameState\.age/g, 'startAge');
    // eslint-disable-next-line no-new-func
    const fn = new Function('age', 'month', 'startAge', `return (${expr});`) as
        (a: number, m: number, s: number) => number;
    return (age: number, month: number) => fn(age, month, START_AGE);
};

/** What `initialGameState.age` is, read rather than assumed. */
const START_AGE = (() => {
    const src = storeSource();
    const block = src.slice(src.indexOf('export const initialGameState'));
    const m = block.match(/\bage:\s*(\d+)/);
    if (!m) throw new Error('initialGameState no longer declares a starting age');
    return Number(m[1]);
})();

/**
 * The month field as the store actually keeps it: it WRAPS.
 *
 * This is a copy of the loop in `advanceQuarter` and it is the villain of the
 * whole entry - `while (newMonth > 12) { newMonth -= 12; newAge += 1; }`.
 */
const runClock = (quarters: number) => {
    let month = 1;
    let age = START_AGE;
    const seen: { month: number; age: number }[] = [];
    for (let q = 0; q < quarters; q++) {
        seen.push({ month, age });
        month += 3;
        while (month > 12) {
            month -= 12;
            age += 1;
        }
    }
    return seen;
};

describe('the elapsed quarter the store hands the board', () => {
    const derive = liftDerivation();

    it('counts up and never wraps, across ten years', () => {
        const ticks = runClock(40).map(({ month, age }) => derive(age, month));
        for (let i = 1; i < ticks.length; i++) {
            expect(ticks[i]).toBeGreaterThan(ticks[i - 1]);
        }
        // The old value could not express year five. This one reaches year ten.
        expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(40);
    });

    it('and the month it is built from really does wrap, which was the trap', () => {
        // Stated as a fact rather than as a comment, because the entire bug
        // was somebody reading this field as an absolute count.
        const months = runClock(40).map(t => t.month);
        expect(Math.max(...months)).toBeLessThanOrEqual(12);
    });

    it('so the board is free to act in year five, which it never was', () => {
        const hostile: GovMember[] = [
            { id: 'a', name: 'A', trait: 'Conservative', trust: 10, shareCount: 200_000 },
            { id: 'b', name: 'B', trait: 'Shark', trust: 15, shareCount: 150_000 },
        ];
        const failing = {
            profitable: false,
            leverage: 5,
            inBreach: true,
            lossStreak: 6,
            priceVsPeak: 0.2,
        };

        // Seventeen quarters in: five years of losses, a breach, and a board
        // that despises the CEO.
        const { month, age } = runClock(17)[16];
        const elapsed = derive(age, month);
        expect(elapsed).toBeGreaterThan(FOUNDER_GRACE_PERIOD_QUARTERS);

        const check = checkNoConfidence(hostile, 30, { ...failing, elapsedQuarters: elapsed });
        expect(check.inGracePeriod).toBe(false);
        expect(check.triggered).toBe(true);
    });

    it('and it is derived from age, not from the field that wraps', () => {
        // A structural check on top of the behavioural ones. Two runs that
        // differ ONLY in age must produce different quarters; if the
        // derivation ever goes back to reading the month alone, they will not.
        expect(derive(START_AGE + 5, 1)).not.toEqual(derive(START_AGE, 1));
    });
});

describe('and the shareholder store does not invent its own', () => {
    const shSource = () =>
        fs.readFileSync(
            path.join(__dirname, '../../features/shareholders/stores/useShareholderStore.ts'),
            'utf8',
        );

    const code = () =>
        shSource()
            .split('\n')
            .filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l))
            .map(l => l.replace(/\s\/\/.*$/, ''))
            .join('\n');

    it('because it used to synthesise a month out of a quarter', () => {
        // `const currentMonth = ctx.currentMonth ?? (quarter > 0 ? quarter * 3 : 0);`
        // A third clock, in a third unit, built on the line that consumed it.
        expect(code()).not.toMatch(/currentMonth\s*=\s*ctx\.currentMonth/);
        expect(code()).not.toMatch(/quarter\s*\*\s*3/);
    });

    it('and passes the one it was given straight through', () => {
        expect(code()).toMatch(/elapsedQuarters:\s*ctx\.elapsedQuarters/);
    });
});
