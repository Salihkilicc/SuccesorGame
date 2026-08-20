// src/core/story/standing.test.ts
//
// ============================================================================
//  WHAT MONEY IS WORTH, AND WHAT IT IS NOT WORTH
// ============================================================================
//
//  Two things are asserted and the second one is the design.
//
//  The first is the curve: logarithmic, floored, capped, and it does not
//  produce a NaN on the last screen of anybody's evening.
//
//  The second is the LIMIT. Twenty points is a fifth of the range, and the
//  whole judgement in this file is that it has to stay a fifth. A disgraced
//  billionaire must remain disgraced, so the FBI conviction has to outweigh
//  every dollar in the game, and that is checked here rather than left as an
//  intention in a comment.
// ============================================================================

import {
    wealthPrestige,
    standing,
    WEALTH_PRESTIGE_FLOOR,
    WEALTH_PRESTIGE_CEILING,
    WEALTH_PRESTIGE_MAX,
} from './standing';

describe('what being rich is worth', () => {
    it('nothing at all, until it is real money', () => {
        // A player with a factory and fifty thousand dollars is not somebody
        // anybody has heard about.
        expect(wealthPrestige(0)).toBe(0);
        expect(wealthPrestige(50_000)).toBe(0);
        expect(wealthPrestige(WEALTH_PRESTIGE_FLOOR)).toBe(0);
    });

    it('and everything it is going to be worth, past the ceiling', () => {
        expect(wealthPrestige(WEALTH_PRESTIGE_CEILING)).toBe(WEALTH_PRESTIGE_MAX);
        expect(wealthPrestige(3_000_000_000_000)).toBe(WEALTH_PRESTIGE_MAX);
    });

    it('and each factor of ten is worth the same in between', () => {
        // Which is also how people talk about money: ten million to a hundred
        // feels like a hundred million to a billion, and it is not the same
        // number of dollars.
        const a = wealthPrestige(100_000_000) - wealthPrestige(10_000_000);
        const b = wealthPrestige(1_000_000_000) - wealthPrestige(100_000_000);
        expect(a).toBeCloseTo(b, 6);
    });

    it('so the numbers a player will actually see are these', () => {
        expect(Math.round(wealthPrestige(100_000_000))).toBe(7);
        expect(Math.round(wealthPrestige(1_000_000_000))).toBe(13);
        expect(Math.round(wealthPrestige(10_000_000_000))).toBe(20);
    });

    it('and it never goes backwards', () => {
        let last = -1;
        for (let e = 4; e <= 13; e++) {
            const now = wealthPrestige(Math.pow(10, e));
            expect(now).toBeGreaterThanOrEqual(last);
            last = now;
        }
    });

    it('and nonsense in does not become a score', () => {
        // NaN and Infinity both read as "I do not trust this number" and both
        // give nothing, which is the safe direction: a broken figure that
        // silently awards the maximum is a bug that looks like a feature.
        expect(wealthPrestige(NaN)).toBe(0);
        expect(wealthPrestige(Infinity)).toBe(0);
        expect(wealthPrestige(-500_000_000)).toBe(0);
    });
});

describe('how the world sees you', () => {
    it('is what you did, plus what you are worth', () => {
        expect(standing(50, 0)).toBe(50);
        expect(standing(50, 1_000_000_000)).toBeCloseTo(50 + wealthPrestige(1e9), 6);
    });

    it('and it stops at a hundred', () => {
        // Stated out loud because every reader of this number treats it as a
        // percentage. 95 and ten billion computes to 115, which is harmless
        // in the courtship sum and quietly breaks the first thing that ever
        // divides by it.
        expect(standing(95, 10_000_000_000)).toBe(100);
        expect(standing(100, 3_000_000_000_000)).toBe(100);
    });

    it('and it does not go below nothing', () => {
        expect(standing(-40, 0)).toBe(0);
    });
});

// ============================================================================
//  AND THE THING IT MUST NOT DO
// ============================================================================
describe('a disgraced billionaire', () => {
    it('stays disgraced', () => {
        // data/events/fbi.ts is minus thirty five in one go, and being rich
        // cannot buy it back. Money is worth twenty at the absolute most, so
        // the conviction outweighs every dollar in the game by fifteen.
        const FBI = -35;
        const richest = wealthPrestige(3_000_000_000_000);
        expect(richest).toBeLessThan(Math.abs(FBI));

        const before = standing(70, 3_000_000_000_000);
        const after = standing(70 + FBI, 3_000_000_000_000);
        expect(after).toBeLessThan(before);
        // And he is now below where an ordinary, solvent, unindicted person
        // sits, which is the whole point of the ceiling being twenty.
        expect(after).toBeLessThan(standing(50, 0) + 6);
    });

    it('while an honest man with nothing is not beaten by money alone', () => {
        // Reputation runs the full hundred and money runs twenty, so being
        // well thought of is worth five times being rich. Which is the claim
        // the courtship system was written on.
        expect(standing(80, 0)).toBeGreaterThan(standing(40, 3_000_000_000_000));
    });
});

// ============================================================================
//  AND IT IS ACTUALLY WIRED TO SOMETHING
// ============================================================================
//  The failure this codebase keeps finding is correct code that nothing calls.
//  A prestige bonus computed by a pure function nobody imports would pass
//  every test above and change nothing about the game.
//
//  Read as text, because what is being checked is that three specific call
//  sites ask `readStanding()` rather than reading the dial raw, and a call
//  that is absent cannot be asserted by running anything.
// ============================================================================
/// <reference types="node" />
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.join(__dirname, '..', '..');
const codeOf = (p: string) => fs.readFileSync(path.join(SRC, p), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

describe('every room that asks the same question', () => {
    const sites = [
        'features/love/logic/runCourtship.ts',
        'features/os/screens/MailDetailScreen.tsx',
    ];

    it('gets the same answer', () => {
        for (const site of sites) {
            const code = codeOf(site);
            expect(code).toMatch(/readStanding\(\)/);
        }
    });

    it('and none of them reads the raw dial any more', () => {
        // The bug this replaces: a billionaire and a man with a factory
        // getting the same answer from the same room.
        for (const site of sites) {
            expect(codeOf(site)).not.toMatch(/publicReputation:\s*useStoryStore/);
        }
    });

    it('and there is one place the money is added', () => {
        // Not three copies of `rep + wealthPrestige(worth)`, which is how the
        // three sites would drift the first time the cap moved.
        expect(codeOf('core/story/world.ts')).toMatch(/export const readStanding/);
    });
});
