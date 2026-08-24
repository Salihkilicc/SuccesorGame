// src/core/market/personalEconomy.test.ts
//
// ============================================================================
//  THREE SALARIES, NONE OF WHICH AGREED
// ============================================================================
//
//    useStatsStore        monthlyIncome: 8_000     "Kurucu maasi - mutevazi"
//    useGameStore:331     stats.monthlyIncome || 5000
//    EconomyEngine:10     const baseSalary = 45000    // quarterly
//
//  Only the third moved any money. The first two formed a loop: the quarter
//  read `monthlyIncome`, passed it out as `result.data.playerIncome`, and
//  wrote the identical value back into the store at the end of the tick. A
//  number that copied itself forever and was handed to nobody - the sole
//  consumer of `playerIncome` is a native bridge interface that is never
//  called, and no screen renders either field.
//
//  And the units did not line up either: 8,000 under a name saying MONTHLY,
//  against 45,000 a QUARTER. Anybody reconciling the two would have been out
//  by a factor of three before they started. Same fault as the buyout
//  comparison - two quantities, one name, two units - which is why the
//  constants in this module all say which they are.
// ============================================================================

import {
    personalQuarter,
    asMonthly,
    CEO_BASE_SALARY_QUARTERLY,
    HOUSING_COST_QUARTERLY,
    LIFESTYLE_COST_QUARTERLY,
    PERSONAL_TAX_RATE,
    MONTHS_PER_QUARTER,
} from './personalEconomy';
import { CEO_BONUS_RATE } from './compensation';

/**
 * Source with the comments taken out.
 *
 * The shelved originals are quoted at length in both files - that is the rule
 * for this codebase - so a rule that says "this line is gone" has to read past
 * the copy of it kept for the next person.
 */
const codeOf = (...p: string[]): string => {
    const fs = require('fs');
    const path = require('path');
    return fs.readFileSync(path.join(__dirname, ...p), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter((l: string) => !/^\s*(\/\/|\*)/.test(l))
        .map((l: string) => l.replace(/\s\/\/.*$/, ''))
        .join('\n');
};

const NO_SCHOOL = { educationMultiplier: 1, portfolioIncomeQuarterly: 0 };
const NO_BILLS = { educationCostQuarterly: 0, partnerCostQuarterly: 0 };

describe('a quarter of the player\'s own money', () => {
    it('pays the salary the engine has always actually paid', () => {
        const q = personalQuarter(NO_SCHOOL, NO_BILLS);
        expect(q.salary).toBe(CEO_BASE_SALARY_QUARTERLY);
        expect(CEO_BASE_SALARY_QUARTERLY).toBe(45_000);
    });

    it('and education multiplies it', () => {
        const q = personalQuarter({ ...NO_SCHOOL, educationMultiplier: 2 }, NO_BILLS);
        expect(q.salary).toBe(CEO_BASE_SALARY_QUARTERLY * 2);
    });

    it('and a missing multiplier does not zero the wage', () => {
        // `salaryMultiplier()` returning undefined used to silently mean a
        // salary of NaN, which propagates into cash and never recovers.
        const q = personalQuarter({ educationMultiplier: NaN } as any, NO_BILLS);
        expect(q.salary).toBe(CEO_BASE_SALARY_QUARTERLY);
        expect(Number.isFinite(q.netFlow)).toBe(true);
    });

    it('taxes the income rather than the salary alone', () => {
        const q = personalQuarter({ ...NO_SCHOOL, portfolioIncomeQuarterly: 10_000 }, NO_BILLS);
        expect(q.tax).toBeCloseTo((CEO_BASE_SALARY_QUARTERLY + 10_000) * PERSONAL_TAX_RATE, 6);
    });

    it('and the roof and the lifestyle are the same every quarter', () => {
        const q = personalQuarter(NO_SCHOOL, NO_BILLS);
        expect(q.housing).toBe(HOUSING_COST_QUARTERLY);
        expect(q.lifestyle).toBe(LIFESTYLE_COST_QUARTERLY);
    });
});

describe('what it comes to', () => {
    it('is barely positive, which is the point', () => {
        // 45,000 in, 30,000 of roof and lifestyle, 9,000 of tax. Six thousand
        // a quarter. The life economy is a life economy: it is not where a
        // company gets bought.
        const q = personalQuarter(NO_SCHOOL, NO_BILLS);
        expect(q.netFlow).toBeCloseTo(6_000, 6);
        expect(q.netFlow).toBeGreaterThan(0);
    });

    it('and cannot buy out a sibling in a lifetime', () => {
        // The arithmetic that sends the player to buyoutFinancing.ts instead.
        // Fifty years of saving every penny of it.
        const q = personalQuarter(NO_SCHOOL, NO_BILLS);
        const fiftyYears = q.netFlow * 4 * 50;
        const siblingHolding = 0.07 * 50_000_000_000 * 1.7;
        expect(fiftyYears).toBeLessThan(siblingHolding / 1000);
    });

    it('while the bonus is the only lever that scales at all', () => {
        // 4% of a two billion year is eighty million, against a salary that
        // is the same on the last quarter as on the first.
        const bonusOnAGoodYear = 2_000_000_000 * CEO_BONUS_RATE;
        const salaryForAYear = personalQuarter(NO_SCHOOL, NO_BILLS).salary * 4;
        expect(bonusOnAGoodYear / salaryForAYear).toBeGreaterThan(400);
    });
});

describe('the monthly fields', () => {
    it('finally hold a monthly figure', () => {
        // `monthlyIncome` held 8,000 while the engine paid 45,000 a quarter.
        // Neither was the other divided by three, because neither was derived
        // from the other at all.
        expect(asMonthly(45_000)).toBe(15_000);
        expect(MONTHS_PER_QUARTER).toBe(3);
    });

    it('and survive nothing being passed', () => {
        expect(asMonthly(0)).toBe(0);
        expect(asMonthly(undefined as any)).toBe(0);
    });
});

describe('the quarter tick', () => {
    const src = codeOf('..', 'store', 'useGameStore.ts');

    it('no longer writes a field back onto itself', () => {
        expect(src).not.toMatch(/monthlyIncome: baseSalary/);
        expect(src).not.toMatch(/const baseSalary = stats\.monthlyIncome \|\| 5000/);
    });

    it('and writes what the engine collected instead', () => {
        expect(src).toMatch(/monthlyIncome: asMonthly\(quarterlyReport\.totalIncome\)/);
        expect(src).toMatch(/monthlyExpenses: asMonthly\(quarterlyReport\.totalExpenses\)/);
    });
});

describe('the engine', () => {
    const src = codeOf('..', '..', 'features', 'assets', 'logic', 'EconomyEngine.ts');

    it('holds none of the numbers itself any more', () => {
        expect(src).not.toMatch(/const baseSalary = 45000/);
        expect(src).not.toMatch(/const housingCost = 20000/);
        expect(src).not.toMatch(/const lifestyleCost = 10000/);
        expect(src).not.toMatch(/totalIncome \* 0\.20/);
    });

    it('and asks the one module that does', () => {
        expect(src).toMatch(/personalQuarter\(/);
        expect(src).toMatch(/personalEconomy/);
    });
});
