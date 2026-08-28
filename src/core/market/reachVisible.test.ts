// src/core/market/reachVisible.test.ts
//
// ============================================================================
//  THE MOST PUNISHING NUMBER IN THE GAME AND NOBODY COULD SEE IT
// ============================================================================
//
//  `reachIndex` is computed every quarter, persisted on the product, and
//  MULTIPLIED INTO the attraction that decides market share. Turn customers
//  away and it falls; serve them and it recovers slowly.
//
//  It appeared on no screen. Measured through the real tick over twenty four
//  quarters at the full benchmark, serving about two thirds of demand:
//
//      q1 0.95   q2 0.90   q4 0.81   q8 0.64   q16 0.47   q24 0.46
//
//  More than half the company's reach, gone, permanently, with nothing
//  anywhere naming it. Which is most of "brand and demand are not growing and
//  I do not know why": demand was not failing to grow, it was being destroyed
//  by stockouts whose lasting cost was invisible.
//
//  AND THE EARLY GAME IS NOT BROKEN, WHICH I HAD SAID IT WAS. I reported that
//  starting demand of 5,379 against a tier one capacity of 4,050 meant a new
//  company could not serve its own demand. Measured across marketing levels
//  over twenty four quarters:
//
//      budget    q1 demand   worst served   capital at q24
//      x0.00        2,696        100%          $11.33M
//      x0.25        3,771         86%          $12.71M
//      x0.50        4,486         77%          $11.05M
//      x1.00        5,379         67%           $7.74M
//
//  The 5,379 was MY simulation choosing to spend a full benchmark in quarter
//  one. Spend nothing and demand is 2,696 against 4,050 and you serve all of
//  it. The lever was there the whole time; a quarter of the benchmark is the
//  best of the four, which is a real decision rather than a broken one.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { updateReachIndex, REACH_FLOOR, REACH_FULL_THRESHOLD } from './attraction';

describe('what turning customers away costs', () => {
    it('falls when you cannot serve the demand you made', () => {
        expect(updateReachIndex(1, 0.67)).toBeLessThan(1);
    });

    it('and keeps falling, so a long stockout is a lasting loss', () => {
        let r = 1;
        const at: Record<number, number> = {};
        for (let q = 1; q <= 24; q++) {
            r = updateReachIndex(r, 0.67);
            at[q] = r;
        }
        // The measured curve, to two places.
        expect(at[1]).toBeCloseTo(0.94, 2);
        expect(at[8]).toBeLessThan(0.7);
        expect(at[24]).toBeLessThan(0.5);
    });

    it('but it never reaches zero, or a bad year would end the company', () => {
        let r = 1;
        for (let q = 0; q < 500; q++) r = updateReachIndex(r, 0);
        expect(r).toBeCloseTo(REACH_FLOOR, 6);
    });

    it('and serving your demand wins it back, slower than losing it', () => {
        // The asymmetry is the point: a reputation for being out of stock
        // outlasts the quarter that earned it.
        const lost = 1 - updateReachIndex(1, 0);
        const won = updateReachIndex(0.5, 1) - 0.5;
        expect(won).toBeLessThan(lost);
    });

    it('and serving almost all of it counts as serving it', () => {
        // Ninety per cent is full marks, so a small miss is not punished as
        // though it were a collapse.
        expect(updateReachIndex(0.8, REACH_FULL_THRESHOLD)).toBeGreaterThan(0.8);
        expect(updateReachIndex(0.8, REACH_FULL_THRESHOLD - 0.01)).toBeLessThan(0.8);
    });
});

describe('and now the player can see it', () => {
    const read = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8');

    it('the tick puts it on the report, which it never did', () => {
        // THE DEFECT. It was persisted on the product and read by the engine,
        // and no screen ever received it.
        expect(read('core', 'reportTypes.ts')).toMatch(/reachIndex\?: number;/);
        expect(read('core', 'store', 'useGameStore.ts')).toMatch(/reachIndex: updatedProducts\.length > 0/);
    });

    it('and it reports the WEAKEST line, because that is the one in trouble', () => {
        // A mean would hide one collapsed product behind three healthy ones.
        expect(read('core', 'store', 'useGameStore.ts'))
            .toMatch(/Math\.min\(\.\.\.updatedProducts\.map\(p => p\.reachIndex \?\? 1\)\)/);
    });

    it('and the report says it in words, with the number that was lost', () => {
        const src = read('features', 'assets', 'screens', 'QuarterlyReportModal.tsx');
        expect(src).toMatch(/obs\.reachLost/);
        expect(src).toMatch(/v1: formatPercent\(Math\.round\(\(1 - reach\) \* 100\)\)/);
    });

    it('and only once it has cost something worth a sentence', () => {
        // A note every quarter for a rounding error is wallpaper, which is
        // the mistake the drought warning already made once.
        expect(read('features', 'assets', 'screens', 'QuarterlyReportModal.tsx'))
            .toMatch(/reach !== undefined && reach < 0\.95/);
    });

    it('and right after the stockout note, because it is the bill for it', () => {
        // I wrote this as "above" first and it failed. Below is right: the
        // stockout is what happened this quarter, the lost reach is what it
        // cost, and a bill only makes sense next to the purchase.
        const src = read('features', 'assets', 'screens', 'QuarterlyReportModal.tsx');
        const reachAt = src.indexOf('obs.reachLost');
        const stockAt = src.indexOf('obs.youRanOutOf');
        const upkeepAt = src.indexOf('obs.marketingUnderUpkeep');
        expect(stockAt).toBeGreaterThan(-1);
        expect(reachAt).toBeGreaterThan(stockAt);
        expect(reachAt).toBeLessThan(upkeepAt);
    });

    it('and both languages can say it, without a dash', () => {
        const tr = fs.readFileSync(path.join(__dirname, '..', 'i18n', 'tr.ts'), 'utf8');
        const en = fs.readFileSync(path.join(__dirname, '..', 'i18n', 'en.ts'), 'utf8');
        const lines = [...tr.split('\n'), ...en.split('\n')].filter(l => /'obs\.reachLost'/.test(l));
        expect(lines).toHaveLength(2);
        for (const l of lines) {
            expect(l).not.toMatch(/[—–]/);
            expect(l.replace(/^.*?':/, '')).not.toMatch(/ - /);
        }
    });
});
