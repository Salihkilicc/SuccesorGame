// src/core/market/ceoPay.test.ts
//
// ============================================================================
//  THE FIVE HOLES, ONE TEST BLOCK EACH
// ============================================================================
//
//  A CEO who sets their own pay is a cheat code unless somebody sits down and
//  writes out how they would cheat. This file is that list, and it is arranged
//  by exploit rather than by function, because the functions are trivial and
//  the exploits are the design.
//
//  The one that matters is the third. Everything built in the last few commits
//  rests on a single distinction - company money is voted on, personal money
//  is not - and a salary the player controls is a pipe between the two. If it
//  is wide enough to fund a buyout, governance is decoration.
// ============================================================================

import {
    decidePay,
    payCeiling,
    greedCost,
    payAsShareOfRevenue,
    MAX_PAY_SHARE_OF_REVENUE,
    PAY_VOTE_MULTIPLE,
    PAY_CHANGE_COOLDOWN,
    PAY_RISE_TRUST_COST,
    CEO_BASE_SALARY_QUARTERLY,
} from './ceoPay';
import { CEO_BONUS_RATE } from './compensation';
import { personalQuarter } from './personalEconomy';

/** A real company: 400m a year of revenue. */
const REVENUE = 400_000_000;
const SETTLED = {
    current: CEO_BASE_SALARY_QUARTERLY,
    trailingAnnualRevenue: REVENUE,
    quartersSinceChange: PAY_CHANGE_COOLDOWN,
};

describe('LOOPHOLE 1: pay yourself the treasury', () => {
    it('is capped at a share of revenue rather than of the pool', () => {
        // Capital is a POOL, so a cap against it lets one tap take a good
        // year. Revenue is a RATE and a trailing one, so a spectacular
        // quarter moves it by a quarter of itself.
        const d = decidePay({ ...SETTLED, amount: 999_999_999_999 });
        expect(d.capped).toBe(true);
        expect(d.granted).toBe(payCeiling(REVENUE));
        expect(d.granted).toBe((REVENUE * MAX_PAY_SHARE_OF_REVENUE) / 4);
    });

    it('and the ceiling is two per cent of what the company sells', () => {
        const d = decidePay({ ...SETTLED, amount: 1e12 });
        expect(payAsShareOfRevenue(d.granted, REVENUE)).toBeCloseTo(MAX_PAY_SHARE_OF_REVENUE, 6);
    });

    it('while a company with no revenue still pays its founder', () => {
        // Otherwise the first four quarters of every run are unsurvivable.
        expect(payCeiling(0)).toBe(CEO_BASE_SALARY_QUARTERLY);
        expect(payCeiling(-5)).toBe(CEO_BASE_SALARY_QUARTERLY);
    });
});

describe('LOOPHOLE 2: spike it, collect, put it back', () => {
    it('is refused, because pay changes once a year', () => {
        const d = decidePay({ ...SETTLED, amount: 200_000, quartersSinceChange: 1 });
        expect(d.blocked).toMatch(/once a year/i);
        expect(d.granted).toBe(CEO_BASE_SALARY_QUARTERLY);
    });

    it('and the cooldown is the same period the bonus settles over', () => {
        // So the two cannot be played against each other: you cannot time a
        // raise inside a bonus year and a cut outside it.
        expect(PAY_CHANGE_COOLDOWN).toBe(4);
    });

    it('but a CUT is always allowed, immediately', () => {
        // Nobody games this by paying themselves less, and a player putting
        // money back into a dying company should not wait a year for it.
        const d = decidePay({
            ...SETTLED, amount: 10_000, current: 500_000, quartersSinceChange: 0,
        });
        expect(d.blocked).toBeNull();
        expect(d.granted).toBe(10_000);
        expect(d.trustCost).toBe(0);
    });
});

describe('LOOPHOLE 3: launder company money into a personal buyout', () => {
    // ------------------------------------------------------------------
    //  THE ONE THAT MATTERS
    // ------------------------------------------------------------------
    //  A buyout from the treasury is a board vote. A buyout from your own
    //  pocket is not. So if a salary can move enough money, every voted
    //  buyout becomes an unvoted one with an extra step.
    // ------------------------------------------------------------------

    it('sends any real rise to the board', () => {
        const d = decidePay({ ...SETTLED, amount: CEO_BASE_SALARY_QUARTERLY * 2 });
        expect(d.needsVote).toBe(true);
    });

    it('and measures the threshold against the BASE, not against last year', () => {
        // Otherwise a player walks to any number they like in annual steps
        // that each look modest next to the one before.
        const alreadyRich = {
            ...SETTLED,
            current: CEO_BASE_SALARY_QUARTERLY * 10,
            amount: CEO_BASE_SALARY_QUARTERLY * 11,
        };
        expect(decidePay(alreadyRich).needsVote).toBe(true);
        expect(PAY_VOTE_MULTIPLE).toBeLessThan(2);
    });

    it('and the pipe is too narrow to fund a buyout even at full bore', () => {
        // The rule that makes the vote almost beside the point. A year of the
        // absolute maximum is two per cent of revenue. A sibling's holding is
        // a multiple of ANNUAL revenue, so the gap is three orders of
        // magnitude and no amount of patience closes it.
        const maxYear = payCeiling(REVENUE) * 4;
        const siblingHolding = 0.07 * (REVENUE * 12) * 1.7; // 12x revenue valuation
        expect(maxYear / siblingHolding).toBeLessThan(0.02);
    });

    it('so a successor cannot quietly raise their own pay at all', () => {
        // Below CONTROL_THRESHOLD governance sends EVERYTHING to a vote, and
        // a successor starts at thirty three per cent. The board they must
        // ask is the family they are trying to buy out.
        const d = decidePay({ ...SETTLED, amount: payCeiling(REVENUE) });
        expect(d.needsVote).toBe(true);
    });
});

describe('LOOPHOLE 4: pay yourself nothing to inflate the bonus', () => {
    it('is allowed, and is a terrible trade', () => {
        // Forgoing a salary raises profit by that salary and the bonus by 4%
        // of it. You give up a pound to gain fourpence. Left legal because it
        // is a real thing a founder might do in a bad year, and the
        // arithmetic is its own punishment.
        const d = decidePay({ ...SETTLED, amount: 0 });
        expect(d.blocked).toBeNull();
        expect(d.granted).toBe(0);

        const forgone = CEO_BASE_SALARY_QUARTERLY;
        expect(forgone * CEO_BONUS_RATE).toBeLessThan(forgone);
    });

    it('and a negative salary is not a way to be paid by the taxman', () => {
        const d = decidePay({ ...SETTLED, amount: -1_000_000 });
        expect(d.granted).toBe(0);
    });

    it('nor is a number that is not a number', () => {
        for (const bad of [NaN, Infinity, undefined, null, 'lots']) {
            const d = decidePay({ ...SETTLED, amount: bad as any });
            expect(Number.isFinite(d.granted)).toBe(true);
            expect(d.granted).toBeGreaterThanOrEqual(0);
        }
    });
});

describe('LOOPHOLE 5: a fat estate on the way out', () => {
    it('is limited by the same ceiling and the same cooldown', () => {
        // A deathbed raise is a raise: it waits a year and it goes to the
        // board. And inheritance splits cash EQUALLY among the children, so
        // most of anything taken this way goes to the siblings the next
        // player is about to be fighting.
        const d = decidePay({ ...SETTLED, amount: 1e12, quartersSinceChange: 0 });
        expect(d.blocked).not.toBeNull();
    });
});

describe('what asking costs, whatever the answer', () => {
    it('is trust with everybody, in proportion to the greed', () => {
        // Paid whether or not the vote passed. Without this the optimal play
        // is to ask for the ceiling every single year and pocket the ones
        // that happen to pass.
        const modest = decidePay({ ...SETTLED, amount: CEO_BASE_SALARY_QUARTERLY * 1.2 });
        const greedy = decidePay({ ...SETTLED, amount: payCeiling(REVENUE) });
        expect(greedy.trustCost).toBe(PAY_RISE_TRUST_COST);
        expect(modest.trustCost).toBeLessThan(greedy.trustCost);
        expect(modest.trustCost).toBeGreaterThanOrEqual(0);
    });

    it('and it climbs smoothly, so there is no ledge to sit under', () => {
        const ceiling = payCeiling(REVENUE);
        const costs = [0, 0.25, 0.5, 0.75, 1].map(f =>
            greedCost(CEO_BASE_SALARY_QUARTERLY + (ceiling - CEO_BASE_SALARY_QUARTERLY) * f, ceiling),
        );
        for (let i = 1; i < costs.length; i++) {
            expect(costs[i]).toBeGreaterThanOrEqual(costs[i - 1]);
        }
        expect(costs[0]).toBe(0);
    });

    it('and a company with no headroom charges nothing for the base', () => {
        // A startup on the floor salary is not being greedy by existing.
        expect(greedCost(CEO_BASE_SALARY_QUARTERLY, CEO_BASE_SALARY_QUARTERLY)).toBe(0);
        expect(greedCost(999, 0)).toBe(0);
    });
});

describe('and the ordinary case', () => {
    it('is that nothing changes until somebody asks', () => {
        const d = decidePay({ ...SETTLED, amount: CEO_BASE_SALARY_QUARTERLY });
        expect(d.granted).toBe(CEO_BASE_SALARY_QUARTERLY);
        expect(d.needsVote).toBe(false);
        expect(d.trustCost).toBe(0);
        expect(d.blocked).toBeNull();
    });
});


// ============================================================================
//  AND THE TWO THAT GOT THROUGH THE FIRST TIME
// ============================================================================
//
//  Both found by reading the finished code rather than by any of the eighteen
//  rules above, and both reopen a hole that was supposed to be shut. The
//  lesson is the same one as the buyout screens: the pure module was tested
//  and the things AROUND it were not.
// ============================================================================

describe('LOOPHOLE 1, through the side door', () => {
    it('is not reopened by a degree', () => {
        // ----------------------------------------------------------------
        //  A CAPPED NUMBER MULTIPLIED AFTERWARDS IS NOT CAPPED
        // ----------------------------------------------------------------
        //  `salaryMultiplier()` returns up to SIX - two for an undergraduate
        //  degree, two for a master's, one and a half for a doctorate - and
        //  the personal economy multiplied the salary by it AFTER the board
        //  had approved a figure.
        //
        //  Measured, not guessed: a ceiling of 2,000,000 paid 12,000,000.
        //  Twelve per cent of revenue where the rule says two, on a number
        //  the board had signed off at two million.
        //
        //  A degree gets you TO the number faster. It does not raise the roof.
        // ----------------------------------------------------------------
        const ceiling = payCeiling(400_000_000);
        const paid = personalQuarter(
            {
                educationMultiplier: 6,
                ceoPayQuarterly: ceiling,
                payCeilingQuarterly: ceiling,
                portfolioIncomeQuarterly: 0,
            },
            { educationCostQuarterly: 0, partnerCostQuarterly: 0 },
        ).salary;
        expect(paid).toBe(ceiling);
    });

    it('while a degree still helps anybody below the roof', () => {
        const ceiling = payCeiling(400_000_000);
        const paid = personalQuarter(
            {
                educationMultiplier: 2,
                ceoPayQuarterly: CEO_BASE_SALARY_QUARTERLY,
                payCeilingQuarterly: ceiling,
                portfolioIncomeQuarterly: 0,
            },
            { educationCostQuarterly: 0, partnerCostQuarterly: 0 },
        ).salary;
        expect(paid).toBe(CEO_BASE_SALARY_QUARTERLY * 2);
    });

    it('and a ceiling that FALLS pulls the salary down with it', () => {
        // The same fix covers this. A ceiling only checked on the way in
        // stops applying the moment revenue drops, so a company whose sales
        // collapsed would go on paying the salary of the company it was.
        const paid = personalQuarter(
            {
                educationMultiplier: 1,
                ceoPayQuarterly: 2_000_000,
                payCeilingQuarterly: payCeiling(0),
                portfolioIncomeQuarterly: 0,
            },
            { educationCostQuarterly: 0, partnerCostQuarterly: 0 },
        ).salary;
        expect(paid).toBe(CEO_BASE_SALARY_QUARTERLY);
    });
});

describe('and the clock across a succession', () => {
    it('cannot end up counting backwards', () => {
        // ----------------------------------------------------------------
        //  `currentQuarter()` is derived from `age - initialGameState.age`,
        //  and a successor takes the chair at SIXTEEN against a starting age
        //  of twenty, so the counter collapses to almost nothing. With the
        //  parent's `ceoPaySetQuarter` still in the store - a number from a
        //  life that ran for decades - `quartersSinceChange` comes out
        //  NEGATIVE and the new player is told to wait a hundred and twenty
        //  quarters before they may set their own pay.
        //
        //  runSuccession resets both fields. This is the rule that says a
        //  negative gap can never mean "blocked forever" even if one slips
        //  through again.
        // ----------------------------------------------------------------
        const d = decidePay({
            amount: CEO_BASE_SALARY_QUARTERLY * 2,
            current: CEO_BASE_SALARY_QUARTERLY,
            trailingAnnualRevenue: 400_000_000,
            quartersSinceChange: -118,
        });
        expect(d.blocked).not.toBeNull();
        expect(d.blocked).not.toMatch(/1[0-9][0-9] more/);
    });
});
