// src/core/story/prices.test.ts
//
// ============================================================================
//  THE SENTENCE AND THE LEDGER
// ============================================================================
//
//  There is one claim worth pinning here and it is not any of the shares. It
//  is that a scene which QUOTES a figure and a choice which CHARGES one are
//  reading the same function.
//
//  They were not, in seven places at once, for as long as those scenes have
//  existed: the text computed a share of company capital and the effect took a
//  literal, so the button said one million and charged one and a half. The
//  game has had this bug before under a different name, which is why the test
//  is about the PAIRING rather than about the numbers.
// ============================================================================

import fs from 'fs';
import path from 'path';

import { PRICE_BOOK, QUOTED, quotedAmount, quotedDelta, type Quoted } from './prices';

const START = 3_000_000;

describe('the price book', () => {
    it('scales, so one figure is not fatal early and free late', () => {
        for (const item of QUOTED) {
            const small = quotedAmount(START, item);
            const large = quotedAmount(START * 200, item);
            expect(large).toBeGreaterThan(small);
        }
    });

    it('and clamps at both ends', () => {
        for (const item of QUOTED) {
            const { min, max } = PRICE_BOOK[item];
            expect(quotedAmount(0, item)).toBe(min);
            expect(quotedAmount(1e12, item)).toBe(max);
        }
    });

    it('and nonsense in does not produce a nonsense invoice', () => {
        for (const item of QUOTED) {
            expect(quotedAmount(NaN, item)).toBe(PRICE_BOOK[item].min);
            expect(quotedAmount(-1e9, item)).toBe(PRICE_BOOK[item].min);
        }
    });

    it('while the direction lives in one place rather than two', () => {
        // A scene deciding the sign for itself is how a treasury gain becomes
        // a treasury charge in the one branch nobody replayed.
        expect(quotedDelta(START, 'cfoTreasuryGain')).toBeGreaterThan(0);
        expect(quotedDelta(START, 'opsAutomation')).toBeLessThan(0);
    });

    it('and the one thing the company earns is worth earning', () => {
        // The single money-positive choice in the whole conversation system
        // paid five hundred thousand flat forever. At a hundred million of
        // capital that is a rounding error on a letter about yield.
        expect(quotedAmount(100_000_000, 'cfoTreasuryGain')).toBeGreaterThan(500_000);
    });
});

// ============================================================================
//  AND EVERY QUOTE HAS A CHARGE BEHIND IT
// ============================================================================
describe('the scenes', () => {
    const DIR = path.join(__dirname, '..', '..', 'data', 'events');

    const files = () => fs.readdirSync(DIR)
        .filter(f => f.endsWith('.ts') && !f.includes('.test.'))
        .map(f => ({ name: f, text: fs.readFileSync(path.join(DIR, f), 'utf8') }));

    it('never charge a literal next to a figure they quote', () => {
        // The bug, stated as a rule. A choice whose text interpolates
        // {techPatentCost} and whose effects say `capital: -800_000` is
        // telling the player two different numbers.
        const offenders: string[] = [];
        for (const { name, text } of files()) {
            const lines = text.split('\n');
            lines.forEach((line, i) => {
                const quoted = QUOTED.find(q => line.includes(PRICE_BOOK[q].token));
                if (!quoted) return;
                // The effects block sits just below the text.
                const below = lines.slice(i, i + 12).join('\n');
                if (/kind:\s*'(capital|cash)',\s*amount:/.test(below)) {
                    offenders.push(`${name}:${i + 1} quotes ${quoted} and charges a literal`);
                }
            });
        }
        expect(offenders).toEqual([]);
    });

    it('and every `quoted` effect names an entry that exists', () => {
        // A typo here would charge nothing at all and look entirely correct.
        const bad: string[] = [];
        for (const { name, text } of files()) {
            for (const m of text.matchAll(/kind:\s*'quoted',\s*item:\s*'(\w+)'/g)) {
                if (!QUOTED.includes(m[1] as Quoted)) bad.push(`${name}: ${m[1]}`);
            }
        }
        expect(bad).toEqual([]);
    });

    it('and the book has no entry nothing uses', () => {
        // The other direction, which is the one this codebase keeps finding:
        // correct code that nothing calls.
        const all = files().map(f => f.text).join('\n');
        const unused = QUOTED.filter(q => !all.includes(`item: '${q}'`));
        expect(unused).toEqual([]);
    });
});
