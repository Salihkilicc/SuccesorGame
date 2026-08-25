// src/components/MyCompany/Finance/financeHub.test.ts
//
// ============================================================================
//  THE SCREEN THE LOAN IS ASKED FOR FROM
// ============================================================================
//
//  Two small things, and both are the same kind: something that matters was
//  drawn at the same weight as something that does not.
//
//  ---------------------------------------------------------------------------
//  THE GRADE HAD STOPPED SAYING ANYTHING
//  ---------------------------------------------------------------------------
//  Six of the seven grades used to be painted in the loss red, AAA included,
//  and the fix for that made six of them plain WHITE. Correct in one way - the
//  letter already carries the ranking, so colour was repeating it - and it went
//  one step too far: AAA and BBB were then drawn identically, and the only
//  colour on the page was the junk case.
//
//  A ladder inside the palette. No green and no orange: green is profit and
//  orange is brand value, and a credit grade wearing either would be answering
//  a different question. Red stays on junk alone, which is the one place rule 3
//  allows it.
//
//  ---------------------------------------------------------------------------
//  AND THE ONE ACTION READ AS ANOTHER ROW
//  ---------------------------------------------------------------------------
//  Request a new loan is the only thing this screen is FOR, and it sat at the
//  same height as the information rows above it, finishing hard against the nav
//  bar clearance.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { theme, palette } from '../../../core/theme';

const src = () =>
    fs.readFileSync(path.join(__dirname, 'CorporateFinanceHubModal.tsx'), 'utf8')
        .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

/** The grade ladder, read out of the source rather than re-typed here. */
const ladder = () => {
    const s = src();
    const body = s.slice(s.indexOf('const getCreditRating'), s.indexOf('const rating ='));
    return [...body.matchAll(/label: '(\w+)', color: (\w+)/g)].map(m => ({
        grade: m[1], colour: m[2],
    }));
};

describe('the credit grade', () => {
    it('is drawn in more than two colours again', () => {
        const distinct = new Set(ladder().map(r => r.colour));
        expect(ladder().length).toBe(7);
        expect(distinct.size).toBeGreaterThanOrEqual(4);
    });

    it('and the ladder only ever steps down, never back up', () => {
        // The thing a "colour by score" can get wrong: a grade in the middle
        // brighter than the one above it. Ranked by where each colour sits.
        const rank: Record<string, number> = { best: 3, solid: 2, thin: 1, };
        const rows = ladder();
        const scored = rows.map(r => rank[r.colour] ?? 0);
        for (let i = 1; i < scored.length; i++) {
            expect(scored[i]).toBeLessThanOrEqual(scored[i - 1]);
        }
    });

    it('and takes its colours from the palette rather than from hexes', () => {
        const s = src();
        expect(s).toMatch(/const best = palette\.blueLight;/);
        expect(s).toMatch(/const solid = theme\.colors\.primary;/);
        expect(s).toMatch(/const thin = theme\.colors\.textSecondary;/);
    });

    it('and keeps the loss red for the one grade that is a loss', () => {
        // Rule 3: green and red mean profit and loss and nothing else. Junk
        // debt is genuinely that; BB is not.
        const rows = ladder();
        const red = rows.filter(r => r.colour.includes('negative'));
        expect(red).toHaveLength(0);
        // The junk row uses the token directly rather than the local name.
        expect(src()).toMatch(/label: 'C', color: theme\.colors\.negative/);
    });

    it('and does not reach for green or brand orange', () => {
        const s = src();
        const fn = s.slice(s.indexOf('const getCreditRating'), s.indexOf('const rating ='));
        expect(fn).not.toMatch(/success|positive|colors\.up/);
        expect(fn).not.toMatch(/palette\.orange/);
    });

    it('and the two ends are actually different, measured', () => {
        // Not "two token names" - two different values. Aliases in this theme
        // share hexes and have been mistaken for each other before.
        expect(palette.blueLight).not.toBe(theme.colors.textSecondary);
        expect(theme.colors.primary).not.toBe(palette.blueLight);
    });
});

describe('the request loan button', () => {
    it('is taller than the rows above it', () => {
        const s = src();
        expect(s).toMatch(/btn: \{[\s\S]{0,300}paddingVertical: theme\.spacing\.lg/);
        expect(s).not.toMatch(/btn: \{[\s\S]{0,300}paddingVertical: theme\.spacing\.md/);
    });

    it('and its label is bigger than a body line', () => {
        const s = src();
        expect(s).toMatch(/btnPrimaryText: \{[^}]*fontSize: theme\.typography\.subtitle/);
        expect(theme.typography.subtitle).toBeGreaterThan(theme.typography.body + 1);
    });

    it('and has room under it rather than ending against the bar', () => {
        const s = src();
        expect(s).toMatch(/actions: \{[\s\S]{0,300}marginBottom: theme\.spacing\.xl/);
    });

    it('and its icon reads on the light fill it sits on', () => {
        // The primary is a light blue. A white glyph on it is the same
        // mistake the avatar initial made - see the note in HomeScreen.
        expect(src()).toMatch(/name="bank-plus" size=\{20\} color=\{theme\.colors\.onLight\}/);
    });

    it('and the repay button beside it keeps its own weight', () => {
        // Secondary is a dark surface, so ITS glyph stays white. Two fills,
        // two answers, and getting them the same way round is the rule.
        expect(src()).toMatch(/name="cash-refund" size=\{20\} color="#FFFFFF"/);
    });
});
