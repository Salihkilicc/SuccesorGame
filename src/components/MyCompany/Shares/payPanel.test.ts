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

const read = (file = 'CeoPayPanel.tsx') =>
    fs.readFileSync(path.join(__dirname, file), 'utf8');

/** Source with comments stripped, so a rule cannot pass on a mention in prose. */
const code = (file?: string) =>
    read(file)
        .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

/**
 * The panel's own source.
 *
 * It used to be a slice of ShareControlHub between two markers, because the
 * panel was a closure on a screen. It is a component now, so the file IS the
 * body and there is nothing else in it to answer for it.
 */
const payPanelBody = () => code();

describe('the pay panel', () => {
    it('offers its three options as choices rather than as reading matter', () => {
        const body = payPanelBody();
        expect(body).toMatch(/const choices = options\.map/);
        expect(body).toMatch(/choices=\{choices\}/);
        // The old shape. `lines` renders a label and a value and nothing else
        // on the row can be pressed.
        expect(body).not.toMatch(/lines:\s*options\.map/);
        expect(body).not.toMatch(/lines=\{/);
    });

    it('and every one of them actually asks for its own number', () => {
        // The specific defect: three options, and the only handler in the
        // panel passed `payMax` no matter which one you were looking at.
        const body = payPanelBody();
        expect(body).toMatch(/onPress:\s*\(\)\s*=>\s*askForPay\(o\.amount\)/);
        expect(body).not.toMatch(/requestCeoPay\(payMax\)/);
    });

    it('and hands them to a panel that can render them', () => {
        // A choice list built and never passed is the same bug one level up,
        // and it is a real risk here: `choices` was on ConfirmPanel the whole
        // time and the old screen never passed it.
        const src = code();
        expect(src).toMatch(/choices=\{choices\}/);
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


// ============================================================================
//  AND IT IS ONE DOOR NOW
// ============================================================================
//
//  The panel lived under Equity, beside the IPO and the buyback, because that
//  is where it was first written. It is the player's OWN wages, and a player
//  looking for their wages does not open a share control screen.
//
//  It moved WHOLE. The risk in a move like this is that it becomes a copy -
//  which this codebase has paid for four times: the casino's 700 in four
//  places, three salaries, four buyout deciders, two net worths. So these
//  rules are about there being exactly one of it.
// ============================================================================

describe('the pay decision', () => {
    /**
     * The hub's LIVE source.
     *
     * It has to strip JSX block comments as well as line comments, because
     * the shelved row is inside a `{/* ... *\/}` block - and a rule that only
     * strips `//` would read the shelved markup as live and fail on a file
     * that is correct. The reverse of the trap this project hit twice, where
     * a probe passed because `code()` had stripped the very thing it meant to
     * check.
     */
    const hub = () =>
        fs.readFileSync(path.join(__dirname, 'ShareControlHub.tsx'), 'utf8')
            .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
            .split('\n')
            .filter(l => !/^\s*(\/\/|\*)/.test(l))
            .join('\n');

    it('is not still openable from the equity screen', () => {
        expect(hub()).not.toMatch(/onPress=\{openPayPanel\}/);
    });

    it('and the equity screen no longer builds one of its own', () => {
        const src = hub();
        expect(src).not.toMatch(/requestCeoPay/);
        expect(src).not.toMatch(/decidePay\(/);
    });

    it('and it is shelved there rather than deleted', () => {
        const raw = fs.readFileSync(path.join(__dirname, 'ShareControlHub.tsx'), 'utf8');
        expect(raw).toContain('openPayPanel');
        expect(raw).toContain('CeoPayPanel.tsx');
    });

    it('and exactly one file asks the store for a pay change', () => {
        // The rule that would have caught the four buyout deciders.
        const root = path.join(__dirname, '../../..');
        const hits: string[] = [];
        const walk = (dir: string) => {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) { walk(full); continue; }
                if (!/\.tsx?$/.test(entry.name) || /\.test\./.test(entry.name)) continue;
                const body = fs.readFileSync(full, 'utf8')
                    .split('\n')
                    .filter(l => !/^\s*(\/\/|\*)/.test(l))
                    .join('\n');
                if (/requestCeoPay\(/.test(body)) hits.push(entry.name);
            }
        };
        walk(root);
        // One. The store DEFINES `requestCeoPay:` rather than calling it, so
        // it does not appear here - which is the shape this rule wants: one
        // implementation, one caller, no second door.
        expect(hits.sort()).toEqual(['CeoPayPanel.tsx']);
    });
});
