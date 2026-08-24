// src/components/MyCompany/Shares/payPanel.test.ts
//
// ============================================================================
//  THREE ANSWERS, ONE OF WHICH COULD BE GIVEN
// ============================================================================
//
//  The pay panel listed the founder's wage, a middle step and the ceiling as
//  `lines` - read only - beneath a single button that said "Ask for the
//  maximum" and called `requestCeoPay(payMax)`. So the player was shown three
//  numbers and allowed exactly one of them, and it was the greediest.
//
//  ---------------------------------------------------------------------------
//  AND IT COST THE ONE MOVE THAT IS ALWAYS ALLOWED
//  ---------------------------------------------------------------------------
//  ceoPay.ts goes out of its way to permit a CUT at any time, with no cooldown
//  and no trust cost - "a player who wants to put money back into a dying
//  company should not be told to wait a year for permission". That rule was
//  written, tested and unreachable: no control on any screen could ask for a
//  number below the current one.
//
//  The fifth instance of this codebase's signature failure. `decidePay` was
//  correct, and the screen in front of it could only send one value.
//
//  ---------------------------------------------------------------------------
//  WHAT THIS TESTS
//  ---------------------------------------------------------------------------
//  Both halves, because either alone would have passed while the bug was live:
//  that the RULE lets a cut through, and that the SCREEN can express one.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    decidePay,
    payCeiling,
    PAY_CHANGE_COOLDOWN,
    PAY_VOTE_MULTIPLE,
} from '../../../core/market/ceoPay';
import { CEO_BASE_SALARY_QUARTERLY } from '../../../core/market/personalEconomy';

const read = () => fs.readFileSync(path.join(__dirname, 'ShareControlHub.tsx'), 'utf8');

/** Source with comments stripped, so a rule cannot pass on a mention in prose. */
const code = () =>
    read()
        .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

/** Just the body of openPayPanel, so nothing on this screen answers for it. */
const payPanelBody = () => {
    const src = code();
    const start = src.indexOf('const openPayPanel');
    expect(start).toBeGreaterThan(-1);
    return src.slice(start, src.indexOf('const handleStockSplit'));
};

describe('the pay panel', () => {
    it('offers its three options as choices rather than as reading matter', () => {
        const body = payPanelBody();
        expect(body).toMatch(/choices:\s*options\.map/);
        // The old shape. `lines` renders a label and a value and nothing else
        // on the row can be pressed.
        expect(body).not.toMatch(/lines:\s*options\.map/);
    });

    it('and every one of them actually asks for its own number', () => {
        // The specific defect: three options, and the only handler in the
        // panel passed `payMax` no matter which one you were looking at.
        const body = payPanelBody();
        expect(body).toMatch(/onPress:\s*\(\)\s*=>\s*askForPay\(o\.amount\)/);
        expect(body).not.toMatch(/requestCeoPay\(payMax\)/);
    });

    it('and hands them to a panel that can render them', () => {
        // A choice list built into state that the panel is never given is the
        // same bug one level up, and it is a real risk here: `choices` was on
        // ConfirmPanel the whole time and this screen never passed it.
        const src = code();
        expect(src).toMatch(/choices=\{panel\?\.choices\}/);
        expect(src).toMatch(/choices\?:\s*\{/);
    });

    it('and shows the ones it cannot take, greyed, with the reason', () => {
        // The acquisition panel's lesson, written down in ConfirmPanel: a
        // missing button teaches nothing. So nothing is filtered out.
        const body = payPanelBody();
        expect(body).toMatch(/disabled:\s*!!d\.blocked/);
        expect(body).not.toMatch(/options\s*\n?\s*\.filter/);
        expect(body).toMatch(/description:\s*detail/);
    });
});

describe('and the option that was unreachable', () => {
    const revenue = 400_000_000; // ceiling of 2,000,000 a quarter

    it('is a cut, which the rules have always allowed at once', () => {
        const onTheCeiling = payCeiling(revenue);
        const cut = decidePay({
            amount: CEO_BASE_SALARY_QUARTERLY,
            current: onTheCeiling,
            trailingAnnualRevenue: revenue,
            quartersSinceChange: 0, // no wait served at all
        });
        expect(cut.blocked).toBeNull();
        expect(cut.granted).toBe(CEO_BASE_SALARY_QUARTERLY);
        expect(cut.trustCost).toBe(0);
    });

    it('and a rise in the same breath is refused, which is the contrast', () => {
        const rise = decidePay({
            amount: payCeiling(revenue),
            current: CEO_BASE_SALARY_QUARTERLY,
            trailingAnnualRevenue: revenue,
            quartersSinceChange: 0,
        });
        expect(rise.blocked).not.toBeNull();
        expect(rise.granted).toBe(CEO_BASE_SALARY_QUARTERLY);
    });

    it('and the middle option is a real third answer, not a rounding of the top', () => {
        // If it collapsed onto the ceiling the panel would be offering two
        // choices wearing three labels.
        const middle = Math.min(
            payCeiling(revenue),
            CEO_BASE_SALARY_QUARTERLY * PAY_VOTE_MULTIPLE * 2,
        );
        expect(middle).toBeGreaterThan(CEO_BASE_SALARY_QUARTERLY);
        expect(middle).toBeLessThan(payCeiling(revenue));
    });

    it('and the cooldown it reports is the one the rules use', () => {
        const blocked = decidePay({
            amount: 999_999_999,
            current: CEO_BASE_SALARY_QUARTERLY,
            trailingAnnualRevenue: revenue,
            quartersSinceChange: PAY_CHANGE_COOLDOWN - 1,
        });
        expect(blocked.blocked).toContain('1 more quarter');
    });
});
