// src/core/story/fines.test.ts
//
// ============================================================================
//  THE PROPERTY IS "SURVIVABLE AND STILL FELT", NOT ANY PARTICULAR NUMBER
// ============================================================================
//
//  The percentages in fines.ts will move. What must not move is the pair of
//  claims they exist to make, because breaking either one puts back a bug that
//  took a playthrough to find rather than a test:
//
//    A LETTER CANNOT END THE COMPANY. The old literals could and did - the
//    regulator settled at 4.5M against a starting capital of 3M, so a scene
//    written as a bad quarter was the end of the run if it fired early.
//
//    AND IT IS STILL THERE IN THE FIFTEENTH YEAR. The same 4.5M against a
//    grown company is a figure the player does not look up from, which is the
//    same bug wearing the other face.
// ============================================================================

import fs from 'fs';
import path from 'path';

import {
    fineAmount,
    FINE_SHARE,
    FINE_FLOOR,
    FINE_CAP,
    type FineSeverity,
} from './fines';

/** What useStatsStore hands a new game. See START_COMPANY_CAPITAL. */
const START = 3_000_000;

const ORDER: FineSeverity[] = ['minor', 'serious', 'severe', 'ruinous'];

describe('a penalty is survivable', () => {
    it('and never takes more than there is', () => {
        // The whole point. Bankruptcy stays something the player drives into
        // over quarters rather than something one tap does.
        for (const capital of [0, 1, 40_000, START, 900_000_000]) {
            for (const s of ORDER) {
                expect(fineAmount(capital, s)).toBeLessThanOrEqual(capital);
            }
        }
    });

    it('and the worst one in the game leaves a company standing on day one', () => {
        // The conviction used to cost eighteen million against three.
        const worst = fineAmount(START, 'ruinous');
        expect(worst).toBeLessThan(START);
        expect(START - worst).toBeGreaterThan(START * 0.5);
    });

    it('and nonsense in does not produce a nonsense bill', () => {
        expect(fineAmount(NaN, 'severe')).toBe(0);
        expect(fineAmount(-5_000_000, 'severe')).toBe(0);
        expect(Number.isFinite(fineAmount(Infinity, 'ruinous'))).toBe(true);
    });
});

describe('and it is still felt when the company is large', () => {
    it('because it is a share rather than a number', () => {
        const small = fineAmount(START, 'severe');
        const large = fineAmount(START * 100, 'severe');
        expect(large).toBeGreaterThan(small * 50);
    });

    it('and a grown company pays more than the literal it replaced', () => {
        // crises.ts settled at 3.4M flat. At a hundred million of capital that
        // was noise; `severe` is not.
        expect(fineAmount(100_000_000, 'severe')).toBeGreaterThan(3_400_000);
    });

    it('while the floor keeps a broke company from getting away with it', () => {
        expect(fineAmount(500_000, 'minor')).toBe(FINE_FLOOR);
    });

    it('and the cap keeps it from becoming a number nobody can read', () => {
        expect(fineAmount(10_000_000_000, 'ruinous')).toBe(FINE_CAP);
    });
});

describe('the severities are a scale', () => {
    it('and each one hurts more than the last', () => {
        // Above the floor, or they all read the same.
        const capital = 200_000_000;
        const paid = ORDER.map(s => fineAmount(capital, s));
        expect(paid).toEqual([...paid].sort((a, b) => a - b));
        expect(new Set(paid).size).toBe(ORDER.length);
    });

    it('and none of them is a rounding error or an execution', () => {
        for (const s of ORDER) {
            expect(FINE_SHARE[s]).toBeGreaterThanOrEqual(0.01);
            expect(FINE_SHARE[s]).toBeLessThan(0.5);
        }
    });
});

// ============================================================================
//  AND THE SCENES DO NOT QUOTE A FIGURE THEY NO LONGER CONTROL
// ============================================================================
describe('the writing and the money agree', () => {
    const DIR = path.join(__dirname, '..', '..', 'data', 'events');

    it('so no choice carrying a penalty states a price in its own text', () => {
        // The failure this codebase keeps finding: two places holding one
        // fact. `pearOfferHeir` had the salutation quoting a scaling number
        // while the scene paid a literal. A choice reading "Pay fee ($7.5M)"
        // above a `fine` effect would be that again, and it would be wrong on
        // every quarter except one.
        const offenders: string[] = [];
        for (const file of fs.readdirSync(DIR)) {
            if (!file.endsWith('.ts') || file.includes('.test.')) continue;
            const lines = fs.readFileSync(path.join(DIR, file), 'utf8').split('\n');
            lines.forEach((line, i) => {
                if (!/kind:\s*'fine'/.test(line)) return;
                // The choice text sits above the effects block.
                for (let j = i; j >= Math.max(0, i - 8); j--) {
                    const text = lines[j].match(/text:\s*['"`](.*)/);
                    if (!text) continue;
                    if (/\$[\d.]|\d+\s?(M|k)\b|\{[a-zA-Z]*Cost\}/.test(text[1])) {
                        offenders.push(`${file}:${j + 1}  ${text[1].slice(0, 50)}`);
                    }
                    break;
                }
            });
        }
        expect(offenders).toEqual([]);
    });
});
