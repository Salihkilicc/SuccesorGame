// src/data/events/brandScale.test.ts
//
// ============================================================================
//  A BRAND EFFECT THE PLAYER CANNOT SEE IS NOT AN EFFECT
// ============================================================================
//
//  THE BUG THIS EXISTS FOR. `stats.brandValue` holds POINTS - share x 43.3, so
//  an ordinary mid-game company sits near 170. Every scene in the game was
//  written against the 0-100 INDEX instead, which is points / 4.33. Fifty six
//  effects said `amount: 3` meaning three per cent and delivered less than one.
//
//  Nothing failed anywhere. The effect ran, the sink spread it across the
//  categories in proportion to their weight, the store changed and the screen
//  re-rendered. A choice that cost nine hundred thousand moved the number the
//  player was looking at by one and a half per cent, and it was reported as
//  "the choices take the money and do not raise brand" - which was very nearly
//  right.
//
//  So the assertion is not about the numbers being any particular size. It is
//  that each one MOVES THE INDEX ENOUGH TO BE NOTICED, which is the only
//  property that was ever actually wrong and the only one a scale change can
//  quietly break again.
//
//  It reads the data files as TEXT on purpose. Importing them would pull in
//  the i18n loader and four stores through the cast, and this needs to know
//  what is written down rather than what survives module evaluation.
// ============================================================================

import fs from 'fs';
import path from 'path';

import { BRAND_INDEX_SCALE, brandIndex, brandEquilibrium } from '../../core/market/brand';

/**
 * The smallest move worth writing, on the 0-100 index.
 *
 * Below one index point the figure on My Company rounds to the same integer it
 * showed before, so the choice reads to the player as having done nothing.
 */
const VISIBLE_INDEX_POINTS = 0.9;

const DIR = __dirname;

const amounts = (): { file: string; line: number; amount: number }[] => {
    const found: { file: string; line: number; amount: number }[] = [];
    for (const file of fs.readdirSync(DIR)) {
        if (!file.endsWith('.ts') || file.includes('.test.')) continue;
        const lines = fs.readFileSync(path.join(DIR, file), 'utf8').split('\n');
        lines.forEach((text, i) => {
            const m = text.match(/kind:\s*'brand',\s*amount:\s*(-?[\d.]+)/);
            if (m) found.push({ file, line: i + 1, amount: Number(m[1]) });
        });
    }
    return found;
};

describe('brand effects are written in points', () => {
    const all = amounts();

    it('and there are some, because a rule about an empty list passes', () => {
        expect(all.length).toBeGreaterThan(40);
    });

    it('and every one of them moves the number the player is looking at', () => {
        // The whole bug in one assertion. An `amount: 3` written against the
        // old index scale is 0.69 index points and fails here.
        const invisible = all.filter(
            e => Math.abs(e.amount) / BRAND_INDEX_SCALE < VISIBLE_INDEX_POINTS,
        );
        expect(invisible.map(e => `${e.file}:${e.line} amount ${e.amount}`)).toEqual([]);
    });

    it('and none of them is a whole reputation in one line', () => {
        // A mid-sized company's entire brand, gone from one sentence, is a
        // scene taking the run away rather than punishing it. The worst in the
        // game is the conviction, and even that leaves something standing.
        const midGame = brandEquilibrium(4);   // 4% share, about 173 points
        for (const e of all) {
            expect(Math.abs(e.amount)).toBeLessThan(midGame * 0.4);
        }
    });

    it('and the reward side is felt as clearly as the punishment side', () => {
        // Not a claim about how MANY there are of each - that is a balance
        // question and it moves. It is that the biggest thing you can earn is
        // in the same league as the biggest thing that can be done to you, so
        // the system is not one directional by construction.
        const best = Math.max(...all.map(e => e.amount));
        const worst = Math.min(...all.map(e => e.amount));
        expect(brandIndex(best)).toBeGreaterThan(brandIndex(Math.abs(worst)) * 0.5);
    });
});
