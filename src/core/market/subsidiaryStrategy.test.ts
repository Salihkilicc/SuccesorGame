// src/core/market/subsidiaryStrategy.test.ts
//
// ============================================================================
//  A FIFTH OF THE EMPIRE COULD NOT BE RUN WELL, AND NOTHING SAID SO
// ============================================================================
//
//  Reported as "nobody understands My Empire, should I add hints or visual
//  feedback". The answer turned out to be that hints would have been lying,
//  because two things were wrong underneath the screen.
//
//  ONE. `evaluateSubsidiaries` had a hand-written condition for four sectors:
//  Technology, Industrial, Retail and Finance. The market data ships:
//
//      Technology  12 buyable      rule
//      Industrial  10 buyable      rule
//      Health       8 buyable      NO RULE
//      Finance      7 buyable      rule
//      Retail       0 buyable      rule, and nothing to apply it to
//
//  Eight of the thirty seven companies a player can buy fell through to the
//  bad branch EVERY quarter whatever the player did - 52% chance of a decline
//  and 8% chance of a crash, forever. The player reads that as their own
//  mistake. And an unrecognised sector fell back to 'Conglomerate', which
//  matched nothing either, so "we forgot to write an entry" was a difficulty
//  setting.
//
//  TWO. The rule was a combination lock. Four dials, ten points, and one hint
//  that named two of the four sectors and none of the numbers.
//
//  ---------------------------------------------------------------------------
//  AND THE HINT IS DELIBERATELY NOT THE ANSWER
//  ---------------------------------------------------------------------------
//  Asked for as "make the threshold visible, but do not make it too obvious or
//  it gets simple". So the screen shows an OUTLOOK that moves as the dials
//  move. Measured, one dial at a time on a Technology company:
//
//      R&D 0..3   under resourced
//      R&D 4      holding up
//      R&D 5+     compounding
//      workforce 1, whatever else   people are leaving
//
//  Four words and no numbers. The edge is findable in two experiments, which
//  is a puzzle; "R&D needs 4" is a form.
// ============================================================================

import {
    DEFAULT_FOCUS,
    SECTOR_FOCUS,
    STRATEGY_POINTS,
    WORKFORCE_FLOOR,
    focusCost,
    focusFor,
    noteFor,
    outlookOf,
    strategyVerdict,
    type Strategy,
} from './subsidiaryStrategy';

/** The cheapest strategy that satisfies a sector. */
const cheapest = (sector: string): Strategy => {
    const f = focusFor(sector);
    const s: Strategy = { marketing: 0, rnd: 0, production: 0, workforce: WORKFORCE_FLOOR };
    for (const d of f.dials) s[d] = Math.max(s[d], f.min);
    return s;
};

const ALL = [...Object.keys(SECTOR_FOCUS), 'Conglomerate', 'Energy', 'Health', ''];

describe('every sector can be run well', () => {
    it('including Health, which is the one that could not be', () => {
        // THE DEFECT. Eight buyable companies with no winning condition.
        expect(SECTOR_FOCUS.Health).toBeDefined();
        expect(strategyVerdict('Health', cheapest('Health')).good).toBe(true);
    });

    it('and a sector nobody wrote down gets the default, not a death sentence', () => {
        // `sector` is read off `category` and falls back to 'Conglomerate'.
        // Before this, that fallback matched nothing at all.
        for (const s of ['Conglomerate', 'Energy', 'Media', '']) {
            expect(focusFor(s)).toBe(DEFAULT_FOCUS);
            expect(strategyVerdict(s, cheapest(s)).good).toBe(true);
        }
    });

    it('and every one of them fits inside the ten points', () => {
        // A requirement that cannot be paid for is the same defect wearing a
        // different hat.
        for (const s of ALL) {
            expect(focusCost(focusFor(s))).toBeLessThanOrEqual(STRATEGY_POINTS);
            const c = cheapest(s);
            expect(c.marketing + c.rnd + c.production + c.workforce)
                .toBeLessThanOrEqual(STRATEGY_POINTS);
        }
    });

    it('and there is room left over to overshoot, or nothing could ever compound', () => {
        for (const s of ALL) {
            const c = cheapest(s);
            const spent = c.marketing + c.rnd + c.production + c.workforce;
            expect(STRATEGY_POINTS - spent).toBeGreaterThanOrEqual(1);
        }
    });

    it('and no sector asks for workforce as a substitute for the floor', () => {
        // Health does name workforce, and it asks for THREE, which is above
        // the floor of two. A focus dial at or under the floor would be free.
        for (const s of ALL) {
            const f = focusFor(s);
            if (f.dials.includes('workforce')) expect(f.min).toBeGreaterThan(WORKFORCE_FLOOR);
        }
    });

    it('and Retail keeps its entry even though nothing ships with it', () => {
        // One line, correct, and deleting it means rediscovering it the day
        // somebody adds a retailer.
        expect(SECTOR_FOCUS.Retail).toBeDefined();
    });
});

describe('the workforce floor still overrides everything', () => {
    it('a perfectly focused company with nobody in it is not well run', () => {
        const v = strategyVerdict('Technology', { marketing: 0, rnd: 8, production: 0, workforce: 1 });
        expect(v.good).toBe(false);
        expect(v.neglected).toBe(true);
    });

    it('and that is the one rule the screen already stated, so it does not move', () => {
        expect(WORKFORCE_FLOOR).toBe(2);
    });
});

describe('the outlook is a word, not the answer', () => {
    const tech = (rnd: number, workforce = 3): Strategy =>
        ({ marketing: 0, rnd, production: 0, workforce });

    it('and it walks up as the player finds the edge', () => {
        expect(outlookOf('Technology', tech(0))).toBe('underResourced');
        expect(outlookOf('Technology', tech(3))).toBe('underResourced');
        expect(outlookOf('Technology', tech(4))).toBe('steady');
        expect(outlookOf('Technology', tech(5))).toBe('compounding');
    });

    it('and neglect trumps the lot, however good the focus is', () => {
        expect(outlookOf('Technology', tech(6, 1))).toBe('neglected');
    });

    it('and it never names a dial or a number, which is the whole request', () => {
        // "Show the threshold but do not make it too obvious." The outlook is
        // one of four fixed words; if one of them ever starts carrying an
        // argument, this is the test that says the hint became a manual.
        for (const s of ALL) {
            for (let n = 0; n <= 6; n++) {
                const o = outlookOf(s, { marketing: n, rnd: n, production: n, workforce: n });
                expect(['compounding', 'steady', 'underResourced', 'neglected']).toContain(o);
            }
        }
    });
});

describe('and the report sentence explains the quarter that already happened', () => {
    it('names the weakest dial only once it has cost something', () => {
        // The one place a dial is named. A hint bought with a bad result
        // rather than given away on the strategy screen.
        const n = noteFor('Health', { marketing: 4, rnd: 1, production: 0, workforce: 5 }, -0.03);
        expect(n.key).toBe('empire.noteUnderResourced');
        expect(n.dial).toBe('rnd');
    });

    it('and blames the workforce first when that is what is wrong', () => {
        expect(noteFor('Technology', { marketing: 0, rnd: 6, production: 0, workforce: 1 }, 0.02).key)
            .toBe('empire.noteNeglected');
    });

    it('and separates a surge from an ordinary good quarter', () => {
        const good = cheapest('Technology');
        expect(noteFor('Technology', good, 0.17).key).toBe('empire.noteSurge');
        expect(noteFor('Technology', good, 0.03).key).toBe('empire.noteGrowing');
    });

    it('and says so when a well run company still went down', () => {
        // Otherwise the first bad quarter after doing everything right reads
        // as "the dials do nothing", which is the belief this whole prompt is
        // about.
        expect(noteFor('Technology', cheapest('Technology'), -0.02).key)
            .toBe('empire.noteWellRunButDown');
    });

    it('and every key it can produce exists in both languages', () => {
        const fs = require('fs');
        const path = require('path');
        const keys = new Set<string>();
        for (const s of ALL) {
            for (const n of [0, 1, 3, 4, 6]) {
                for (const ch of [-0.05, 0.03, 0.2]) {
                    keys.add(noteFor(s, { marketing: n, rnd: n, production: n, workforce: n }, ch).key);
                }
            }
        }
        expect(keys.size).toBeGreaterThan(2);
        for (const f of ['tr', 'en'] as const) {
            const src = fs.readFileSync(path.join(__dirname, '..', 'i18n', `${f}.ts`), 'utf8');
            for (const k of keys) expect(`${f}:${k}:${src.includes(`'${k}'`)}`).toContain('true');
            for (const d of ['marketing', 'rnd', 'production', 'workforce']) {
                expect(src).toContain(`'empire.dial.${d}'`);
            }
            for (const o of ['compounding', 'steady', 'underResourced', 'neglected']) {
                expect(src).toContain(`'empire.outlook.${o}'`);
            }
        }
    });

    it('and none of those lines uses a dash', () => {
        const fs = require('fs');
        const path = require('path');
        for (const f of ['tr', 'en'] as const) {
            const lines = fs.readFileSync(path.join(__dirname, '..', 'i18n', `${f}.ts`), 'utf8')
                .split('\n').filter((l: string) => /^\s*'empire\./.test(l));
            expect(lines.length).toBeGreaterThan(10);
            for (const l of lines) {
                expect(l).not.toMatch(/[—–]/);
                expect(l.replace(/^.*?':/, '')).not.toMatch(/ - /);
            }
        }
    });
});

describe('the wiring', () => {
    const fs = require('fs');
    const path = require('path');
    const read = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8');

    it('the quarterly evaluation asks the table rather than four hand-written ifs', () => {
        const src = read('features', 'finance', 'stores', 'useCorporateFinanceStore.ts');
        expect(src).toMatch(/strategyVerdict\(sector, strategy as any\)\.good/);
        // THE DEFECT, gone. Health was invisible to all four of these.
        expect(src).not.toMatch(/const isTechGood = sector === 'Technology'/);
        expect(src).not.toMatch(/const isRetailGood/);
    });

    it('and it writes down WHY, so the report has something to read', () => {
        const src = read('features', 'finance', 'stores', 'useCorporateFinanceStore.ts');
        expect(src).toMatch(/lastNote: noteFor\(sector, strategy as any, changePercent\)/);
        // A key, not a sentence: the player can change language.
        expect(src).toMatch(/lastNote\?: SubsidiaryNote;/);
    });

    it('and the report actually shows it, which is the part that was missing', () => {
        const src = read('features', 'assets', 'screens', 'QuarterlyReportModal.tsx');
        expect(src).toMatch(/t\('empire\.reportTitle'\)/);
        expect(src).toMatch(/s\.lastNote\?\.key \|\| 'empire\.noteGrowing'/);
        // Only once there is an empire to report on.
        expect(src).toMatch(/\{empire\.length > 0 && \(/);
    });

    it('and it does not paint a subsidiary in the profit colours', () => {
        // Theme rule 4: green and red are the company's own profit and loss.
        const src = read('features', 'assets', 'screens', 'QuarterlyReportModal.tsx');
        const row = src.slice(src.indexOf('empireChange,'), src.indexOf('empireChange,') + 260);
        expect(row).toMatch(/theme\.colors\.up : theme\.colors\.down/);
        expect(row).not.toMatch(/positive|negative/);
    });

    it('and the strategy screen shows the outlook off the LIVE dials', () => {
        // Off the saved strategy it would only ever tell you what you already
        // did, which is not a hint, it is a receipt.
        const src = read('components', 'MyCompany', 'Finance', 'SubsidiaryDetailModal.tsx');
        expect(src).toMatch(/outlookOf\(company\.sector, strategy\)/);
        expect(src).not.toMatch(/outlookOf\(company\.sector, company\.strategy\)/);
    });
});
