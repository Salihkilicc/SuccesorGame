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

    it('and both shrink to fit rather than wrapping past their box', () => {
        // A fixed height without this clips a long word instead of growing,
        // which trades one visible bug for a worse one.
        const card = source();
        const at = card.indexOf('const DepartmentCard');
        const body = card.slice(at, card.indexOf('const formatCompactNumber', at));

        expect(body).toMatch(/numberOfLines=\{2\}[\s\S]*?adjustsFontSizeToFit/);
        expect(body).toMatch(/numberOfLines=\{1\}[\s\S]*?adjustsFontSizeToFit/);
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
