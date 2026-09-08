// src/core/story/barredContinues.test.ts
//
// ============================================================================
//  THE ENDING THAT CONTRADICTED ITSELF, AND THE LADDER THAT WAS NOT ONE
// ============================================================================
//
//  `barredForManipulation` ended with "Somebody else will run it now. You will
//  be able to watch", and `runManipulation` called `endGame` on it. The game
//  told the player they would watch and then shut the run.
//
//  Reported from the other end - barred at a hundred per cent ownership with
//  nothing illegal done. That false positive was fixed separately; this is the
//  ending itself, which was on the wrong side of the game's own grammar.
//
//  TEN ENDINGS, and they split cleanly. Lose the company and it is over: sold,
//  bankrupt, removed by the board, convicted. Die and the dynasty carries on,
//  which is the entire game. A bar takes the JOB and leaves the company, the
//  shares and the house - so it belongs with the second group, and the game
//  already has a door for the job changing hands.
//
//  It also makes the three verdicts a ladder. They were: a fine costs money,
//  barred ends the run, convicted ends the run. Two rungs at one height. Now
//  they are a fine, a generation, and prison.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { ENDINGS } from '../../data/story/endings';

const src = (...p: string[]) =>
    fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8');

const overlay = src('components', 'story', 'EndingOverlay.tsx');
const succession = src('core', 'story', 'runSuccession.ts');

describe('being barred hands the chair on', () => {
    it('the ending is one you can walk out of', () => {
        expect(overlay).toMatch(/barredForManipulation: 'barred'/);
    });

    it('and the two death endings still are, which is what it joined', () => {
        expect(overlay).toMatch(/diedInOffice: 'death'/);
        expect(overlay).toMatch(/diedWithHeirTooYoung: 'death'/);
    });

    it('and nothing else was let through with it', () => {
        // ------------------------------------------------------------------
        //  THE CONTROL
        // ------------------------------------------------------------------
        //  A change that made every ending continuable would pass the test
        //  above and destroy the game. Bankruptcy has no company to hand on;
        //  the board removal has already taken it; both Pear endings are the
        //  player choosing to stop; prison is prison.
        // ------------------------------------------------------------------
        const table = /const CONTINUABLE[\s\S]*?\n\};/.exec(overlay)?.[0] ?? '';
        expect(table).toBeTruthy();
        const listed = [...table.matchAll(/^\s{4}(\w+):/gm)].map(m => m[1]);
        expect(listed.sort()).toEqual(
            ['barredForManipulation', 'diedInOffice', 'diedWithHeirTooYoung']);
        for (const shut of ['wentBankrupt', 'removedByBoard', 'soldToPear',
                            'boughtPear', 'convictedOfManipulation',
                            'diedWithoutAnHeir', 'soldWhatYouInherited']) {
            expect({ shut, listed: listed.includes(shut) })
                .toEqual({ shut, listed: false });
        }
    });

    it('and prison still ends it, so the verdicts are a real ladder', () => {
        // The whole argument for softening one rung is that the rung above it
        // still bites. If this ever changes, the change above was a mistake.
        expect(ENDINGS.convictedOfManipulation).toBeDefined();
        expect(overlay).not.toMatch(/convictedOfManipulation: '/);
    });
});

describe('and a bar is not a death', () => {
    it('the succession is told which it is', () => {
        expect(succession).toMatch(/export type SuccessionReason = 'death' \| 'barred'/);
        expect(succession).toMatch(/runSuccession = \(reason: SuccessionReason = 'death'\)/);
        expect(overlay).toMatch(/runSuccession\(CONTINUABLE\[ending\.id\] \?\? 'death'\)/);
    });

    it('and no estate is settled when nobody died', () => {
        // ------------------------------------------------------------------
        //  WHAT THIS IS GUARDING
        // ------------------------------------------------------------------
        //  `settleTheEstate` assesses duty on the collection and SELLS pieces
        //  to pay it, then posts a letter from the executors that opens with
        //  "your late father". Running it on a living, barred director would
        //  take a yacht off them to pay a tax nobody levied, and put a
        //  condolence letter in their inbox.
        // ------------------------------------------------------------------
        const at = succession.indexOf('settleTheEstate();');
        expect(at).toBeGreaterThan(0);
        const before = succession.slice(0, at);
        expect(before.lastIndexOf("if (reason === 'death')"))
            .toBeGreaterThan(before.lastIndexOf('const runSuccession'));
    });

    it('and it is the only step that asks', () => {
        // Everything else about a succession is the same either way: the heir
        // takes the name, the estate divides, the board turns over. A second
        // branch here would be a second story to keep straight.
        expect(succession.match(/reason === 'death'/g)).toHaveLength(1);
        expect(succession).not.toMatch(/reason === 'barred'/);
    });
});

describe('and the words agree with what happens now', () => {
    const body = ENDINGS.barredForManipulation.body;

    it('it no longer promises a run it was closing', () => {
        expect(body).not.toContain('Somebody else will run it now');
    });

    it('and it says who takes the chair, which is the point', () => {
        expect(body).toMatch(/chair goes to your\s+child/);
    });

    it('and it still says what is NOT taken, because that is the whole verdict', () => {
        expect(body).toMatch(/shares/);
        expect(body).toMatch(/house/);
    });

    it('and there is not a dash in it, in either ending', () => {
        // The house rule. Hyphenated words are fine; a dash used as punctuation
        // is not, and a rewrite is exactly where one gets in.
        for (const id of ['barredForManipulation', 'convictedOfManipulation']) {
            const text = `${ENDINGS[id].title} ${ENDINGS[id].body}`;
            expect({ id, dash: /—|–| - /.test(text) }).toEqual({ id, dash: false });
        }
    });
});
