// src/features/assets/screens/departmentCards.test.ts
//
// ============================================================================
//  THE FOUR CARDS ON MY COMPANY ARE THE SAME HEIGHT
// ============================================================================
//
//  Reported from the device, in Turkish: the equity card runs taller than the
//  other three. The cause was not the figure on it. It was the title.
//
//      Financing        -> Finansman            one line
//      Products         -> Urunler              one line
//      R&D Investment   -> Ar-Ge Yatirimi       one line
//      Equity           -> Hisse & Sahiplik     TWO lines
//
//  `minHeight: 120` lets a card grow to fit its content, so the one card whose
//  title wrapped became the one card that was taller. In English all four are
//  short and the grid looks deliberate, which is why this survived: the bug is
//  invisible in the language the screen was built in.
//
//  ---------------------------------------------------------------------------
//  WHY THE FIX IS A RESERVED BOX RATHER THAN A SMALLER FONT
//  ---------------------------------------------------------------------------
//  Shrinking the text until Turkish happens to fit is a fix that holds for one
//  language and one translation of one word. Reserving two lines for the title
//  and one for the figure holds for every word in every language, because the
//  height stops being a function of the text at all.
//
//  So this test does not check that the words are short. It checks that the
//  boxes are fixed, which is the property that makes the length irrelevant.
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..', '..', '..');
const SCREEN = path.join(
    ROOT, 'src', 'features', 'assets', 'screens', 'MyCompanyScreen.tsx',
);
const source = () => fs.readFileSync(SCREEN, 'utf8');

/** The body of one entry in the StyleSheet. */
const style = (name: string): string => {
    const s = source();
    const at = s.indexOf(`  ${name}: {`);
    expect(at).toBeGreaterThan(-1);
    return s.slice(at, s.indexOf('\n  },', at));
};

const numberIn = (block: string, prop: string): number | null => {
    const m = block.match(new RegExp(`${prop}:\\s*(\\d+)`));
    return m ? Number(m[1]) : null;
};

describe('the department cards do not grow with their words', () => {
    it('the title reserves two lines whether it needs them or not', () => {
        const title = style('deptTitle');

        const height = numberIn(title, 'height');
        const lineHeight = numberIn(title, 'lineHeight');
        expect(height).not.toBeNull();
        expect(lineHeight).not.toBeNull();

        // `minHeight` would defeat the whole thing: it is what the card had.
        expect(title).not.toMatch(/minHeight/);

        // Exactly two lines. Not "about two".
        expect(height).toBe(lineHeight! * 2);
    });

    it('the figure under it reserves exactly one', () => {
        const sub = style('deptSub');
        expect(numberIn(sub, 'height')).toBe(numberIn(sub, 'lineHeight'));
        expect(sub).not.toMatch(/minHeight/);
    });

    it('lets the TITLE shrink, because Turkish wraps it and English does not', () => {
        // Two lines are reserved and the words that fill them vary by a lot:
        // "Equity" against "Hisse & Sahiplik". This one earns the shrink.
        const card = source();
        const at = card.indexOf('const DepartmentCard');
        const body = card.slice(at, card.indexOf('const formatCompactNumber', at));

        expect(body).toMatch(/numberOfLines=\{2\}[\s\S]*?adjustsFontSizeToFit/);
    });

    // ----------------------------------------------------------------------
    //  AND DOES NOT LET THE FIGURE SHRINK AT ALL
    // ----------------------------------------------------------------------
    //  This is the assertion that was wrong, not just absent, and it is worth
    //  saying how. It used to require `adjustsFontSizeToFit` on BOTH lines,
    //  on the reasoning that a fixed height without it clips instead of
    //  growing. The reasoning was fine and the conclusion was backwards.
    //
    //  `adjustsFontSizeToFit` fits text to the box in BOTH DIRECTIONS. The
    //  box was `height: 17`; a fourteen point font wants about twenty points
    //  of line. So the prop did exactly what it was told and shrank the text
    //  until the HEIGHT fitted, throwing away every font size set above it.
    //
    //  The figure was reported as ant sized twice, and raising the point size
    //  changed nothing either time, because font size was never the lever.
    //  The box is cut for the font now, and the prop is gone.
    // ----------------------------------------------------------------------
    it('does not let the figure shrink at all', () => {
        const card = source();
        const at = card.indexOf('const DepartmentCard');
        const body = card.slice(at, card.indexOf('const formatCompactNumber', at));

        // The subtitle is the Text that follows the title's closing tag.
        const sub = body.slice(body.indexOf('styles.deptSub'));
        expect(sub).not.toMatch(/adjustsFontSizeToFit/);
        expect(sub).not.toMatch(/minimumFontScale/);

        // The safety valve stays: one ellipsis beats one taller card.
        expect(sub).toMatch(/numberOfLines=\{1\}/);
    });

    it('gives the title a box its own font fits inside too', () => {
        // Found by measuring, not by a report: at 19 against 15 the title was
        // being shrunk on every card in every language by the same mechanism,
        // and stayed legible only because it is white and heavy. The shrink
        // should answer long words, never a tight box.
        const title = style('deptTitle');
        const fontSize = numberIn(title, 'fontSize')!;
        const lineHeight = numberIn(title, 'lineHeight')!;

        expect(lineHeight / fontSize).toBeGreaterThanOrEqual(1.33);
    });

    it('gives the figure a box its own font fits inside', () => {
        // The general form of the bug. A fixed height below what the font
        // actually occupies is a squeeze whether or not anything is currently
        // reading it, and it is invisible in the stylesheet: 17 looks like a
        // deliberate number next to a 13.
        const sub = style('deptSub');
        const fontSize = numberIn(sub, 'fontSize')!;
        const lineHeight = numberIn(sub, 'lineHeight')!;

        expect(lineHeight / fontSize).toBeGreaterThanOrEqual(1.35);
    });

    // ----------------------------------------------------------------------
    //  AND IT HAS TO BE READABLE, WHICH IS A DIFFERENT PROPERTY
    // ----------------------------------------------------------------------
    //  Every assertion above is about the card's SHAPE, and the card passed
    //  all of them while the figure on it could not be read. Reported from a
    //  device: you could not tell what the debt was.
    //
    //  Two causes, compounding. The colour was a hardcoded
    //  `rgba(255,255,255,0.48)`, which measures 3.42 against surfaceRaised and
    //  is the audit's floor for LARGE text. And `minimumFontScale: 0.7` let
    //  twelve points shrink to 8.4.
    //
    //  The subtitle is the information on the card. The title says
    //  "Financing"; this says how much the debt is.
    // ----------------------------------------------------------------------
    it('the figure is not styled as a footnote', () => {
        const sub = style('deptSub');

        // No hardcoded white. The theme's own `textSecondary` is 0.72 and
        // measures 5.56 there; the rgba it replaced was the same idea at an
        // opacity nobody had measured.
        expect(sub).not.toMatch(/rgba\(255,\s*255,\s*255/);
        expect(sub).toMatch(/theme\.colors\.textSecondary/);

        // It carries a number, so it reads as one.
        expect(numberIn(sub, 'fontSize')).toBeGreaterThanOrEqual(13);
        expect(sub).toMatch(/fontWeight/);
    });

    it('renders the figure at the size the stylesheet says', () => {
        // With nothing able to override it, the declared size IS the size on
        // screen. That was not true before and it is the whole point.
        expect(numberIn(style('deptSub'), 'fontSize')).toBeGreaterThanOrEqual(14);
    });

    it('and every subtitle comes from the catalogue', () => {
        // They were template literals: `${n} Active`, `${n}% Owned`. On screen,
        // in English, invisible to a sweep that reported zero.
        const grid = source();
        const at = grid.indexOf('<View style={styles.grid}>');
        const body = grid.slice(at, grid.indexOf('{/* OPERATIONS', at));

        const subtitles = [...body.matchAll(/subtitle=\{([^}]*(?:\}[^}]*)*?)\}\n/g)]
            .map(m => m[1].trim());
        expect(subtitles.length).toBe(4);
        for (const s of subtitles) expect(s.startsWith("t('company.")).toBe(true);
    });
});
