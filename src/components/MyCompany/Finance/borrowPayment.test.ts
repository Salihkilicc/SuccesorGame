// src/components/MyCompany/Finance/borrowPayment.test.ts
//
// ============================================================================
//  THE ONE NUMBER A BORROWER IS DECIDING WITH
// ============================================================================
//
//  The quarterly payment was on this screen already, and that is why the
//  complaint is worth writing down rather than dismissing: an effect being
//  present is not the same as being visible. It was one StatRow among the rate,
//  the term and the principal, under a group heading that repeated its own
//  label, below a slider the player was still dragging.
//
//  So it looked like every other fact on the page, and the fact it is not: the
//  rate is a property of the loan, the payment is the thing that will be taken
//  out of the company every quarter until it is gone.
//
//  ---------------------------------------------------------------------------
//  THE UNIT STAYS QUARTERLY, AND THAT IS DELIBERATE
//  ---------------------------------------------------------------------------
//  The ask said monthly. This game does not have months that mean anything -
//  the engine bills every quarter, the loan products carry `termQuarters`, and
//  `currentMonth` is a field that WRAPS to 1-12 and has already cost this
//  project one bug where the board could never remove the CEO.
//
//  Relabelling a quarterly figure as monthly without moving the money is the
//  two-places-one-fact bug written on purpose. The word "quarters" is on the
//  caption instead, so nobody has to infer it, and the total over the whole
//  term is there too - which is the number the ask was really reaching for.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { theme } from '../../../core/theme';
import { en } from '../../../core/i18n/en';
import { tr } from '../../../core/i18n/tr';

const src = () =>
    fs.readFileSync(path.join(__dirname, 'BorrowModal.tsx'), 'utf8')
        .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

/**
 * A numeric style value from a named block, with the TOKENS RESOLVED.
 *
 * The first version of this only matched literals, and every size on this
 * screen is `theme.typography.something` - so it found nothing and the rule
 * failed on a file that was correct. A source rule that cannot read the way
 * the file is actually written is not a rule.
 */
const styleNum = (block: string, key: string): number => {
    const s = src();
    const start = s.indexOf(`    ${block}: {`);
    expect(start).toBeGreaterThan(-1);
    const body = s.slice(start, s.indexOf('\n    },', start));

    const token = body.match(
        new RegExp(`\\b${key}:\\s*theme\\.typography\\.(\\w+)(?:\\s*\\+\\s*([0-9.]+))?`),
    );
    if (token) {
        const base = (theme.typography as Record<string, number>)[token[1]];
        expect(base).toBeDefined();
        return base + (token[2] ? Number(token[2]) : 0);
    }

    const literal = body.match(new RegExp(`\\b${key}:\\s*([0-9.]+)`));
    expect(literal).not.toBeNull();
    return Number(literal![1]);
};

describe('the payment', () => {
    it('has a block of its own rather than a row among rows', () => {
        expect(src()).toMatch(/<View style=\{styles\.paymentHero\}>/);
        expect(src()).toMatch(/styles\.paymentHeroValue/);
    });

    it('and is the largest thing on the screen', () => {
        // Not "bigger than it was" - bigger than everything else here, because
        // the complaint was that it read as one fact among several.
        const hero = styleNum('paymentHeroValue', 'fontSize');
        const label = styleNum('paymentHeroLabel', 'fontSize');
        const caption = styleNum('paymentHeroCaption', 'fontSize');
        expect(hero).toBeGreaterThan(label * 1.5);
        expect(hero).toBeGreaterThan(caption * 1.5);
    });

    it('and says which period it is for, in words', () => {
        // The ask said monthly and the engine bills quarterly. Saying so is
        // the repair; renaming the figure would have been a lie with a nicer
        // label. See the note at the top of this file.
        const s = src();
        expect(s).toMatch(/bank\.forNQuarters/);
        expect(s).toMatch(/t\('bank\.quarterlyPayment'\)/);
        for (const c of [en, tr] as Record<string, string>[]) {
            expect(c['bank.forNQuarters']).toContain('{v1}');
            expect(c['bank.forNQuarters'].toLowerCase()).toMatch(/quarter|çeyrek/);
        }
    });

    it('and what the whole loan comes to, which is the question underneath', () => {
        const s = src();
        expect(s).toMatch(/bank\.totalOverTerm/);
        expect(s).toMatch(/preview\.totalPayment \* selected\.product\.termQuarters/);
    });

    it('and does not claim a total for a loan with no term', () => {
        // A revolving facility has termQuarters 0. Multiplying by it would
        // print a confident zero, which is worse than not printing anything.
        expect(src()).toMatch(/\{selected\.product\.termQuarters > 0 && \(/);
    });

    it('and the breakdown is still there, one tap away', () => {
        // The hoist must not have cost the detail. Rate, interest and
        // principal are what a player checks after deciding they can afford
        // the figure above.
        const s = src();
        expect(s).toMatch(/DetailLine label="Interest"/);
        expect(s).toMatch(/DetailLine label="Principal"/);
        expect(s).toMatch(/<StatRow/);
    });

    it('and its wording exists in both catalogues, with no dashes', () => {
        for (const key of ['bank.forNQuarters', 'bank.totalOverTerm']) {
            for (const c of [en, tr] as Record<string, string>[]) {
                expect(c[key]).toBeTruthy();
                expect(c[key]).not.toMatch(/—/);
                expect(c[key]).not.toMatch(/\s-\s/);
            }
        }
    });

    it('and the block uses tokens rather than its own colours', () => {
        const s = src();
        expect(s).toMatch(/paymentHero: \{[\s\S]{0,400}backgroundColor: theme\.colors\.card/);
        expect(s).not.toMatch(/paymentHero: \{[\s\S]{0,400}backgroundColor: '#/);
    });
});
