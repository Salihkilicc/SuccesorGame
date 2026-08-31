// src/components/MyCompany/Management/overtimeSwitch.test.ts
//
// ============================================================================
//  THE ONE CONTROL IN THE APP THAT PICKED ITS OWN COLOUR
// ============================================================================
//
//  Reported as "the overtime toggle on the team screen goes green when it is
//  on, make it blue".
//
//  It was not choosing green. `<Switch value={...} onValueChange={...} />`
//  with no `trackColor` renders the platform default, which on iOS is the
//  system green #34C759. Nothing in the theme file put it there and nothing
//  in the theme file could have taken it away: it is the only widget in this
//  codebase that has a colour when you give it none.
//
//  Which makes it the one place a rule can be broken without anyone writing
//  the rule down wrong. Theme rule 4 reserves green and red for profit and
//  loss, and reserves them as TEXT rather than fills. This was a green FILL
//  on a control about how many hours the factory runs.
//
//  SettingsScreen had already answered this question - accent blue on, raised
//  surface off, white thumb - so the fix is that answer rather than a new one.
// ============================================================================

import fs from 'fs';
import path from 'path';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (...p: string[]) => fs.readFileSync(path.join(SRC, ...p), 'utf8');

describe('the overtime toggle', () => {
    const src = () => read('components', 'MyCompany', 'Management', 'EmployeesModule.tsx');

    it('is blue when it is on, not the platform green', () => {
        // THE DEFECT, as the absence it actually was.
        expect(src()).not.toMatch(/<Switch value=\{overtimeEnabled\} onValueChange=\{setOvertime\} \/>/);
        expect(src()).toMatch(/trackColor=\{\{[\s\S]*?true: theme\.colors\.primary,[\s\S]*?\}\}/);
    });

    it('and grey when it is off, so off reads as off rather than as broken', () => {
        expect(src()).toMatch(/false: theme\.colors\.surfaceRaised,/);
        expect(src()).toMatch(/ios_backgroundColor=\{theme\.colors\.surfaceRaised\}/);
    });

    it('and the knob stays light on both, because it sits on both fills', () => {
        expect(src()).toMatch(/thumbColor=\{overtimeEnabled \? '#FFFFFF' : 'rgba\(255,255,255,0\.6\)'\}/);
    });

    it('and the colour it uses is the accent, which is blue', () => {
        // If the token itself ever moves, this is the test that says the
        // request was "make it blue" and not "make it theme.colors.primary".
        const { theme } = require('../../../core/theme');
        expect(theme.colors.primary).toBe('#05A8F6');
    });
});

describe('and no other switch in the app is left to the platform', () => {
    it('every Switch names its track colours', () => {
        // The rule rather than the instance. A `<Switch>` with no trackColor
        // is green on iOS, so an unstyled one anywhere is this same defect
        // waiting in a different screen.
        const files: string[] = [];
        const walk = (dir: string) => {
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, e.name);
                if (e.isDirectory()) walk(full);
                else if (/\.tsx$/.test(e.name)) files.push(full);
            }
        };
        walk(SRC);

        const offenders: string[] = [];
        for (const f of files) {
            const text = fs.readFileSync(f, 'utf8');
            // Each <Switch ...> element, up to its closing bracket.
            for (const m of text.matchAll(/<Switch\b[\s\S]*?\/>/g)) {
                if (!/trackColor/.test(m[0])) offenders.push(path.relative(SRC, f));
            }
        }
        expect(offenders).toEqual([]);
    });
});
