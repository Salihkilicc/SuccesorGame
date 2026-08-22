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

import { PRICE_BOOK, QUOTED, RETURN_ON, quotedAmount, quotedDelta, type Quoted } from './prices';

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

// ============================================================================
//  AND THE OPPORTUNITY PACK IS NOT A DRAIN
// ============================================================================
//
//  What was wrong: across forty one money effects in the whole conversation
//  system, exactly one went the player's way. Every "opportunity" was a
//  purchase - pay three per cent of the company, receive reputation - so the
//  pack the game calls its opportunities was a drain with better manners than
//  the crises.
//
//  These pin the shape of the answer rather than the sizes, because the sizes
//  are balance and balance moves. What must not move is that the money comes
//  back, that it comes back as a letter from a person, and that waiting for it
//  is what makes the spend a decision.
// ============================================================================
describe('what you pay for pays back', () => {
    const DIR = path.join(__dirname, '..', '..', 'data', 'events');
    const read = (f: string) => fs.readFileSync(path.join(DIR, f), 'utf8');

    it('and the return is worth more than the thing cost', () => {
        // A return that quietly drifted below its own price would turn the
        // pack back into what it was, and nothing on screen would say so.
        for (const [cost, back] of Object.entries(RETURN_ON)) {
            for (const capital of [3_000_000, 50_000_000, 400_000_000]) {
                expect(quotedAmount(capital, back as Quoted))
                    .toBeGreaterThan(quotedAmount(capital, cost as Quoted));
            }
        }
    });

    it('and every investment actually schedules its own payoff', () => {
        // The failure this codebase keeps finding: correct code that nothing
        // calls. A payoff scene nothing schedules is a letter that never
        // arrives, and it would look entirely finished in every file.
        const ops = read('corporateOps.ts');
        const payoffs = read('payoffs.ts');
        for (const cost of Object.keys(RETURN_ON)) {
            expect(ops).toContain(`item: '${cost}'`);
        }
        for (const m of ops.matchAll(/conversation: '(event-payoff-[a-z]+)'/g)) {
            expect(payoffs).toContain(`id: '${m[1]}'`);
        }
        expect([...ops.matchAll(/conversation: 'event-payoff-/g)])
            .toHaveLength(Object.keys(RETURN_ON).length);
    });

    it('and it does not arrive on the same afternoon', () => {
        // Paying you immediately makes the decision free. The waiting is the
        // cost, which is what capital expenditure is.
        for (const m of read('corporateOps.ts')
            .matchAll(/conversation: 'event-payoff-[a-z]+', afterQuarters: (\d+)/g)) {
            expect(Number(m[1])).toBeGreaterThanOrEqual(4);
        }
    });

    it('and it arrives from somebody rather than from a counter', () => {
        // The same argument neglect.ts makes about penalties. Every payoff is
        // a letter with a sender.
        const payoffs = read('payoffs.ts');
        const senders = [...payoffs.matchAll(/from: '(\w+)'/g)].map(m => m[1]);
        expect(senders.length).toBe(Object.keys(RETURN_ON).length);
        for (const s of senders) expect(['coo', 'cto', 'cfo']).toContain(s);
    });

    it('while the letter quotes the figure it is about to pay', () => {
        // Otherwise it is a number appearing in the balance with a covering
        // note, which is the thing this whole file exists to stop.
        const payoffs = read('payoffs.ts');
        for (const back of Object.values(RETURN_ON)) {
            expect(payoffs).toContain(PRICE_BOOK[back as Quoted].token);
        }
    });
});
