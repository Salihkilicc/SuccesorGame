// src/core/market/insolvency.test.ts
//
// ============================================================================
//  ONE BAD QUARTER WAS THE WHOLE GAME
// ============================================================================
//
//  Asked as "is it hard to come back when you are heading for the wall?" It
//  was not hard, it was impossible: `companyCapital < 0` for a single quarter
//  ended the run. No overdraft, no grace, no financing, no warning.
//
//  Measured, a tier three company with $0.3M in the bank, cutting costs:
//
//      q1  +$0.41M    q2  +$0.62M    q4  -$0.84M   <- game over
//
//  With the ending suppressed and the same company carried on:
//
//      q8  +$0.75M    q12 +$1.74M    q20 +$4.75M   q48 +$23.69M
//
//  Four quarters after the wall it was solvent again and twelve years later
//  worth twenty three million. The near death and the comeback was a shape of
//  play the game could not contain.
//
//  AND IT RAN BACKWARDS. From the identical position the player who CUT COSTS
//  died at q4 and the one who kept spending finished at $32.67M, because
//  cutting marketing lowers brand, brand lowers demand, and demand is the
//  revenue. The intuitive move was the fatal one and nothing said so.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    advanceInsolvency,
    isInsolvencyTerminal,
    insolvencyQuartersLeft,
    INSOLVENCY_GRACE_QUARTERS,
} from './insolvency';

describe('the clock', () => {
    it('does not start while the company is solvent', () => {
        expect(advanceInsolvency(0, 1)).toBe(0);
        expect(advanceInsolvency(0, 0)).toBe(0);
        expect(advanceInsolvency(3, 5_000_000)).toBe(0);
    });

    it('and zero is solvent, because owing nothing is not owing something', () => {
        expect(advanceInsolvency(2, 0)).toBe(0);
    });

    it('and it counts up one quarter at a time while capital is negative', () => {
        let n = 0;
        for (let q = 1; q <= 6; q++) {
            n = advanceInsolvency(n, -1_000);
            expect(n).toBe(q);
        }
    });

    it('and it RESETS the moment the company climbs back', () => {
        // The rule that makes the comeback possible. Carrying the count over
        // would make a second crisis unsurvivable for no reason anybody could
        // name at the table.
        let n = 0;
        n = advanceInsolvency(n, -100);
        n = advanceInsolvency(n, -100);
        expect(n).toBe(2);
        n = advanceInsolvency(n, 50);
        expect(n).toBe(0);
    });

    it('and rubbish in does not produce rubbish out', () => {
        expect(advanceInsolvency(undefined, -1)).toBe(1);
        expect(advanceInsolvency(-9 as any, -1)).toBe(1);
        expect(advanceInsolvency(0, NaN)).toBe(0);
    });
});

describe('when the doors actually shut', () => {
    it('not on the first negative quarter, which is the whole defect', () => {
        expect(isInsolvencyTerminal(1)).toBe(false);
    });

    it('and not on the fourth either, because the grace is four WHOLE quarters', () => {
        expect(INSOLVENCY_GRACE_QUARTERS).toBe(4);
        expect(isInsolvencyTerminal(INSOLVENCY_GRACE_QUARTERS)).toBe(false);
        expect(isInsolvencyTerminal(INSOLVENCY_GRACE_QUARTERS + 1)).toBe(true);
    });

    it('and the grace is long enough for the recovery that was measured', () => {
        // The tier three case was negative at q4 and positive again by q8.
        // Anything under three would still have killed it.
        expect(INSOLVENCY_GRACE_QUARTERS).toBeGreaterThanOrEqual(3);
    });

    it('and short enough that it is still an ending', () => {
        // A grace nobody can reach the end of is not a grace, it is the
        // removal of a rule.
        expect(INSOLVENCY_GRACE_QUARTERS).toBeLessThanOrEqual(8);
    });

    it('and a solvent company is never terminal', () => {
        expect(isInsolvencyTerminal(0)).toBe(false);
        expect(isInsolvencyTerminal(undefined)).toBe(false);
    });
});

describe('what the player is told', () => {
    it('how many quarters are left, counting down', () => {
        expect(insolvencyQuartersLeft(0)).toBe(4);
        expect(insolvencyQuartersLeft(1)).toBe(3);
        expect(insolvencyQuartersLeft(4)).toBe(0);
    });

    it('and it never goes negative, so the sentence never reads "-2 quarters"', () => {
        expect(insolvencyQuartersLeft(9)).toBe(0);
    });

    it('and zero means this is the last one, which needs its own sentence', () => {
        // "You have 0 quarters" is not a warning anybody can act on.
        const tr = fs.readFileSync(path.join(__dirname, '..', 'i18n', 'tr.ts'), 'utf8');
        const en = fs.readFileSync(path.join(__dirname, '..', 'i18n', 'en.ts'), 'utf8');
        for (const src of [tr, en]) {
            expect(src).toContain(`'obs.insolvencyCountdown'`);
            expect(src).toContain(`'obs.insolvencyLastCall'`);
        }
    });
});

describe('the wiring', () => {
    const read = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8');

    it('the tick counts instead of ending on the first negative quarter', () => {
        const src = read('core', 'store', 'useGameStore.ts');
        // The old shape is gone.
        expect(src).not.toMatch(/if \(newCompanyCapital < 0\) \{/);
        expect(src).toMatch(/if \(insolventQuarters > INSOLVENCY_GRACE_QUARTERS\) \{/);
    });

    it('and it writes the counter EVERY quarter, or it could never reset', () => {
        // The failure this guards: writing it only inside the negative branch
        // leaves the count standing after a recovery, and the next dip starts
        // from wherever the last one stopped.
        const src = read('core', 'store', 'useGameStore.ts');
        expect(src).toMatch(/const insolventQuarters = advanceInsolvency\(/);
        expect(src).toMatch(/quartersInsolvent: insolventQuarters,/);
    });

    it('and it computes it ONCE, because three places read it', () => {
        // The report, the stat and the ending check all need the same number.
        // I computed it twice on the first pass, which is the shape of every
        // drift bug in that file.
        const src = read('core', 'store', 'useGameStore.ts');
        expect((src.match(/advanceInsolvency\(/g) ?? []).length).toBe(1);
    });

    it('and the counter survives a reload, or the clock restarts on every load', () => {
        const src = read('core', 'store', 'useStatsStore.ts');
        expect(src).toMatch(/quartersInsolvent\?: number;/);
        expect(src).toMatch(/quartersInsolvent: state\.quartersInsolvent,/);
    });

    it('and the report carries the number, only while it is running', () => {
        const src = read('core', 'store', 'useGameStore.ts');
        expect(src).toMatch(/insolvencyQuartersLeft: newCompanyCapital < 0/);
        expect(src).toMatch(/: undefined,/);
    });

    it('and the screen says it FIRST, because nothing else matters meanwhile', () => {
        const src = read('features', 'assets', 'screens', 'QuarterlyReportModal.tsx');
        expect(src).toMatch(/obs\.insolvencyCountdown/);
        expect(src).toMatch(/obs\.insolvencyLastCall/);
        const clockAt = src.indexOf('insolvencyQuartersLeft !== undefined');
        const upkeepAt = src.indexOf('marketingSpend < upkeep');
        expect(clockAt).toBeGreaterThan(-1);
        expect(upkeepAt).toBeGreaterThan(clockAt);
    });

    it('and no player facing string here uses a dash, which the game does not', () => {
        const tr = fs.readFileSync(path.join(__dirname, '..', 'i18n', 'tr.ts'), 'utf8');
        const en = fs.readFileSync(path.join(__dirname, '..', 'i18n', 'en.ts'), 'utf8');
        const lines = [...tr.split('\n'), ...en.split('\n')]
            .filter(l => /'obs\.insolvency/.test(l));
        expect(lines).toHaveLength(4);
        for (const l of lines) {
            expect(l).not.toMatch(/[—–]/);
            expect(l.replace(/^.*?':/, '')).not.toMatch(/ - /);
        }
    });
});
