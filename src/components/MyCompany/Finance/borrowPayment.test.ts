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
import { assessCredit } from '../../../core/market/credit';
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
        // Both labels went through `t()` in the translation pass; the
        // breakdown being there is what this asserts and it still is.
        expect(s).toMatch(/DetailLine label=\{t\('fin\.interest'\)\}/);
        expect(s).toMatch(/DetailLine label=\{t\('fin\.principal'\)\}/);
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


// ============================================================================
//  THE WARNING ABOUT NOTHING
// ============================================================================
//
//  "This puts you at INFINITY leverage." Reported as an alarm the player could
//  not read, and it was firing on the FIRST loan of every run.
//
//  The screen needed EBITDA to say what a loan would do to the covenant and it
//  did not have it, so it reconstructed one by dividing debt by leverage. For a
//  company with no debt that is zero over zero: the divisor came out zero, the
//  ratio came out Infinity, and the branch that prints a symbol for it ran.
//
//  Every founder takes a first loan with no debt, so every founder saw it.
// ============================================================================

describe('the covenant warning', () => {
    it('does not invent a ratio when there is nothing to divide by', () => {
        // ----------------------------------------------------------------
        //  SCOPED TO THE WARNING, AND MY FIRST VERSION WAS NOT
        // ----------------------------------------------------------------
        //  It forbade `Infinity` anywhere in the file and failed on a correct
        //  one: the HEADER prints an infinity symbol too, and there it is the
        //  truth. A company with debt and no earnings has infinite leverage
        //  and saying so is the point.
        //
        //  The bug was never the symbol. It was computing a ratio out of zero
        //  over zero and then dressing the result as a warning.
        // ----------------------------------------------------------------
        const s = src();
        const warning = s.slice(s.indexOf('const ebitda = assessment.ebitda'), s.indexOf('{!!error &&'));
        expect(warning).toBeTruthy();
        expect(warning).toMatch(/if \(ebitda <= 0\) return null;/);
        expect(warning).not.toMatch(/Infinity/);
        expect(warning).not.toMatch(/∞/);
        // And nowhere does it work its way back to EBITDA by division.
        expect(s).not.toMatch(/\/ assessment\.leverage/);
    });

    it('and reads the measurement rather than working back to it', () => {
        expect(src()).toMatch(/const ebitda = assessment\.ebitda \|\| 0;/);
    });

    it('and the assessment publishes it, because it already had it', () => {
        // One measurement, published, rather than every reader inventing its
        // own way back to it.
        const clean = assessCredit(0, 8_000_000, 6_000_000, 0);
        expect(clean.ebitda).toBe(8_000_000);
        expect(clean.leverage).toBe(0);
    });

    it('and the header leverage it sits under is right, which is why it stays', () => {
        // Asked whether "0.0x leverage" works. It does: no debt IS zero
        // leverage. The infinity belongs to a company that has debt and no
        // earnings to service it, and there it is the truth.
        expect(assessCredit(20_000_000, 8_000_000, 6_000_000, 1_400_000).leverage)
            .toBeCloseTo(2.5, 3);
        expect(assessCredit(5_000_000, 0, 0, 350_000).leverage).toBe(Infinity);
    });

    it('and the real distress message still fires', () => {
        // Removing a warning must not remove the one that means something.
        expect(src()).toMatch(/distress\.message/);
        expect(src()).toMatch(/if \(!distress\.canBorrow\)/);
    });
});

// ============================================================================
//  AND THE BUTTON AT THE END OF IT
// ============================================================================

describe('signing', () => {
    it('is one button, not a decision shared with a cancel', () => {
        const s = src();
        expect(s).not.toMatch(/styles\.cancelButton/);
        expect(s).toMatch(/t\('bank\.sign'\)/);
    });

    it('and it is the primary fill, with the label that fill takes', () => {
        // Primary is a LIGHT blue, so the text is black. Rule 1 in the theme.
        const s = src();
        expect(s).toMatch(/confirmPrimary: \{ backgroundColor: theme\.colors\.primary \}/);
        expect(s).toMatch(/confirmText: \{[\s\S]{0,200}color: theme\.colors\.primaryText/);
        expect(s).not.toMatch(/confirmButton: \{[\s\S]{0,300}backgroundColor: '#434B50'/);
    });

    it('and the fill is its own style, so the audit can see it', () => {
        // ----------------------------------------------------------------
        //  THE CHECKER READS SHAPE, NOT INTENT
        // ----------------------------------------------------------------
        //  With the fill buried among padding, radius and shadow, the palette
        //  audit reported "primaryText on background fill = 1.34" - black
        //  text measured against the dark PAGE, because it could not tell the
        //  label's nearest painted ancestor was this button.
        //
        //  The finance hub next door has never been flagged, and the only
        //  difference is that its fill is a single-property style. This rule
        //  keeps that shape, because the alternative is a correct button that
        //  the audit calls broken every time somebody runs it.
        // ----------------------------------------------------------------
        expect(src()).toMatch(/styles\.confirmButton, styles\.confirmPrimary/);
    });

    it('and fills the row now that nothing shares it', () => {
        expect(src()).toMatch(/confirmButton: \{\s*\n\s*flex: 1,/);
    });

    it('and the cancel is shelved rather than deleted', () => {
        const raw = fs.readFileSync(path.join(__dirname, 'BorrowModal.tsx'), 'utf8');
        expect(raw).toContain('cancelButton');
    });
});

describe('the space between the amount and what it costs', () => {
    it('is the body gap and nothing on top of it', () => {
        // 24 of margin plus the 12 the body already puts between blocks, so
        // thirty six points of nothing between the slider and the figure it
        // decides. They are one thought.
        const s = src();
        expect(s).toMatch(/sliderContainer: \{[\s\S]{0,500}marginBottom: 0,/);
        expect(s).not.toMatch(/sliderContainer: \{[\s\S]{0,500}marginBottom: 24,/);
    });
});
