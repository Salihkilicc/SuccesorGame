// src/features/assets/staffingButton.test.ts
//
// ============================================================================
//  THE STAFFING BUTTON HOLDS FOUR SENTENCES OF VERY DIFFERENT LENGTHS
// ============================================================================
//
//  The same button says one of four things depending on what you just did,
//  and the four are not close to the same width:
//
//      CONFIRM            7      ONAYLA                  6
//      NO CHANGE          9      DEGISIKLIK YOK         14
//      ARRIVES IN Q4     13      Q4'TE GELIYOR          13
//      UPDATED IN Q4     13      Q4'TE GUNCELLENDI      17
//
//  A button laid out against the English fits every English state and none of
//  the worst Turkish one. This is the department cards on My Company again:
//  the box was sized for the language the screen was written in, and the
//  failure only shows up in the other one.
//
//  ---------------------------------------------------------------------------
//  WHY THIS IS A TEST AND NOT A NUMBER SOMEBODY TUNED
//  ---------------------------------------------------------------------------
//  Shrinking the font until Turkish fits works until somebody adds a fifth
//  state or a third language. `numberOfLines={1}` with `adjustsFontSizeToFit`
//  makes the label a function of the box rather than the box a function of the
//  label, and that holds without anybody measuring anything again.
//
//  Both copies matter. The laboratory and the facility panel have their own
//  button and the same four states, and fixing one and not the other is how
//  the app ends up disagreeing with itself about the same control.
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const BUTTONS = [
    ['the laboratory', 'src/features/assets/screens/LaboratoryScreen.tsx'],
    ['the facility panel', 'src/features/assets/components/FacilityPanel.tsx'],
] as const;

describe('the staffing button fits its label in either language', () => {
    for (const [where, file] of BUTTONS) {
        it(`${where} shrinks the label rather than growing the button`, () => {
            const source = read(file);

            // Anchored on the label itself rather than on the style name.
            // The facility panel has TWO buttons wearing `primaryBtnText` -
            // this one and the upgrade button above it - so a style name finds
            // whichever comes first, which is not the one under test. The four
            // states only belong to this button.
            const at = source.indexOf("t('staff.confirm')");
            expect(at).toBeGreaterThan(-1);

            // Back to the start of the <Text> that carries them.
            const opening = source.slice(source.lastIndexOf('<Text', at), at);

            expect(opening).toMatch(/numberOfLines=\{1\}/);
            expect(opening).toMatch(/adjustsFontSizeToFit/);
            expect(opening).toMatch(/minimumFontScale=\{0\.[0-9]+\}/);
        });

        it(`${where} takes all four states from the catalogue`, () => {
            const source = read(file);
            for (const key of ['staff.confirm', 'staff.arrivesInQ', 'staff.updatedInQ', 'staff.noChange']) {
                expect(source).toContain(`t('${key}'`);
            }
        });
    }

    it('and the Turkish quarter reads as Turkish', () => {
        // "Q4 DE" is not a Turkish phrase. The suffix takes an apostrophe
        // after a numeral, and it was missing in the first draft.
        const tr = read('src/core/i18n/tr.ts');
        for (const key of ['staff.arrivesInQ', 'staff.updatedInQ']) {
            const line = tr.split('\n').find(l => l.includes(`'${key}':`));
            expect(line).toBeDefined();
            // The apostrophe is escaped in the source, so this is looking for
            // `{quarter}\'` as it is actually written.
            expect(line).toContain("{quarter}\\'");
        }
    });
});
