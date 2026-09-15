// src/core/market/financingVisibility.test.ts
//
// ============================================================================
//  A ROUTE YOU CANNOT TAKE IS STILL A ROUTE YOU SHOULD SEE
// ============================================================================
//
//  "Bu mail ile satin alma sirketi olayi olmamis gibi, offer veremiyorum, param
//  var ama olmuyor, issue shares cikiyor sadece."
//
//  Two things were true at once and neither was visible.
//
//    THE MONEY WAS IN THE WRONG POCKET. A deal is paid out of COMPANY CAPITAL.
//    The figure a player thinks of as "my money" is `stats.money`, which is
//    personal and cannot buy a company. `quoteFinancing` was right; nothing
//    said which pot it was reading.
//
//    AND THE PANEL DELETED THE EVIDENCE. It mapped over `feasible`, so a route
//    that did not qualify was simply not on screen. `quoteFinancing` has
//    always returned a `reason` and it was being discarded one line before it
//    reached the player - which is this codebase's most common bug in its
//    other form: correct code that nothing reads.
//
//  These pin the rule rather than the layout: every route must come back with
//  an answer, and a refusal must come back with a reason attached.
// ============================================================================

import fs from 'fs';
import path from 'path';

import { quoteFinancing, MAX_LEVERAGE_RATIO } from './mergers';

const ROUTES = ['cash', 'debt', 'stock'] as const;

const quote = (
    method: (typeof ROUTES)[number],
    over: Partial<{
        price: number; capital: number; valuation: number;
        debt: number; sharePrice: number;
    }> = {},
) => quoteFinancing(
    method,
    over.price ?? 10_000_000,
    over.capital ?? 3_000_000,
    over.valuation ?? 20_000_000,
    over.debt ?? 0,
    over.sharePrice ?? 12,
    1_000_000,
    600_000,
    0.08,
);

describe('every financing route answers', () => {
    it('and a refusal always says why', () => {
        // The panel now prints `reason` under a greyed row, so a refusal with
        // an empty reason is a greyed row with nothing under it.
        for (const method of ROUTES) {
            const q = quote(method, { price: 500_000_000, capital: 1_000, valuation: 1_000 });
            if (!q.feasible) expect((q.reason ?? '').length).toBeGreaterThan(10);
        }
    });

    it('and it is the COMPANY treasury that pays, not the player', () => {
        // The whole misunderstanding in one assertion. The third argument is
        // company capital; there is no parameter for personal cash because
        // personal cash cannot buy a company.
        expect(quote('cash', { price: 5_000_000, capital: 5_000_000 }).feasible).toBe(true);
        expect(quote('cash', { price: 5_000_000, capital: 4_999_999 }).feasible).toBe(false);
    });

    it('while borrowing is capped by the valuation rather than the till', () => {
        const price = 10_000_000;
        // Broke, but worth enough to borrow against.
        expect(quote('debt', { price, capital: 0, valuation: price / MAX_LEVERAGE_RATIO }).feasible)
            .toBe(true);
        // Rich, and already at the ceiling.
        expect(quote('debt', {
            price, capital: 999_000_000,
            valuation: price / MAX_LEVERAGE_RATIO, debt: price,
        }).feasible).toBe(false);
    });

    it('and stock only needs a share price', () => {
        expect(quote('stock', { capital: 0, sharePrice: 12 }).feasible).toBe(true);
        expect(quote('stock', { capital: 0, sharePrice: 0 }).feasible).toBe(false);
    });
});

// ============================================================================
//  AND THE SCREEN DOES NOT FILTER THE ANSWER AWAY
// ============================================================================
describe('the acquisition panel', () => {
    const SRC = path.join(
        __dirname, '..', '..', 'components', 'MyCompany', 'Actions', 'AcquisitionModal.tsx',
    );
    // Comments describe the bug at length in this file; the rule is about code.
    const code = () => fs.readFileSync(SRC, 'utf8')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l))
        .join('\n');

    it('offers all three routes rather than only the affordable ones', () => {
        expect(code()).toContain('choices: options.map');
        expect(code()).not.toContain('choices: feasible.map');
    });

    it('and hands the reason through to the row', () => {
        expect(code()).toMatch(/disabled:\s*!o\.feasible/);
        expect(code()).toMatch(/o\.feasible\s*\?\s*describe\(o\)\s*:\s*\(o\.reason/);
    });

    it('and shows the pot the deal is actually paid from', () => {
        // "Param var" was true and about the other pot. The panel says which.
        //
        // The KEY, not the English. This read /label: 'Company capital'/ and
        // went red the day the panel was translated, which is the third test
        // this week caught pinning a word rather than a claim. The claim is
        // that the panel names the pot; it survives being said in Turkish.
        expect(code()).toMatch(/label:\s*t\('acq\.companyCapital'\)/);
    });
});
