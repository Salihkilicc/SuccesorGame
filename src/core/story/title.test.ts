// src/core/story/title.test.ts
//
// ============================================================================
//  THE LINE UNDER THE NAME
// ============================================================================
//
//  Three things are checked and only one of them is about the writing.
//
//  THE LADDER, which is arithmetic and would be dull except that the first
//  rung is a design decision: a game about earning it must not open by calling
//  the player a chief executive in its first minute.
//
//  THE ADJECTIVE, which is the whole point of the file. A conviction beats
//  every other word because it is the one thing in this game a player cannot
//  work off.
//
//  THE LENGTH, which is the failure nobody would notice. The card renders this
//  with `numberOfLines={1}`, so a long title does not wrap, it truncates -
//  and it truncates only for the players who earned the longest one.
// ============================================================================

import {
    titleFor,
    rungFor,
    TITLE_RUNGS,
    DISGRACE_BELOW,
    CELEBRATED_ABOVE,
} from './title';

const at = (companyValue: number, standing = 50, flags = {}) =>
    titleFor({ companyValue, standing, flags });

describe('the rung', () => {
    it('starts at what he actually inherited', () => {
        // A player whose first title is "Chief Executive" has been flattered
        // in the opening minute of a game about earning it. He has a factory.
        expect(at(4_500_000)).toBe('Factory Owner');
        expect(at(0)).toBe('Factory Owner');
    });

    it('and climbs with the company', () => {
        expect(at(25_000_000)).toBe('Chief Executive');
        expect(at(250_000_000)).toBe('Industrialist');
        expect(at(2_000_000_000)).toBe('Magnate');
        expect(at(20_000_000_000)).toBe('Tycoon');
        expect(at(200_000_000_000)).toBe('Titan of Industry');
        expect(at(3_000_000_000_000)).toBe('Titan of Industry');
    });

    it('and never goes backwards on the way up', () => {
        const seen: string[] = [];
        for (let e = 5; e <= 13; e++) {
            const r = rungFor(Math.pow(10, e));
            if (seen[seen.length - 1] !== r) seen.push(r);
        }
        // Every rung is reachable, and in order. A threshold typed one zero
        // out would skip one and nothing else would say so.
        expect(seen).toEqual(TITLE_RUNGS.map(r => r.title));
    });

    it('and nonsense in does not put a NaN on the home screen', () => {
        expect(at(NaN)).toBe('Factory Owner');
        expect(at(-1)).toBe('Factory Owner');
        expect(titleFor({ companyValue: 1e9, standing: NaN, flags: {} })).toBe('Industrialist');
    });
});

describe('the adjective', () => {
    it('is nothing at all, most of the time', () => {
        // Most players are neither disgraced nor celebrated and the line
        // should not editorialise about them.
        expect(at(2_000_000_000, 50)).toBe('Magnate');
        expect(at(2_000_000_000, DISGRACE_BELOW)).toBe('Magnate');
        expect(at(2_000_000_000, CELEBRATED_ABOVE - 1)).toBe('Magnate');
    });

    it('and sours when the world has stopped giving you the benefit of the doubt', () => {
        expect(at(2_000_000_000, DISGRACE_BELOW - 1)).toBe('Disgraced Magnate');
        expect(at(4_000_000, 5)).toBe('Disgraced Factory Owner');
    });

    it('and warms when it has started giving you rather too much', () => {
        expect(at(2_000_000_000, CELEBRATED_ABOVE)).toBe('Celebrated Magnate');
        expect(at(300_000_000_000, 100)).toBe('Celebrated Titan of Industry');
    });

    it('while a conviction beats every other word', () => {
        // The one thing in this game a player cannot work off. It holds even
        // at a standing that would otherwise read as celebrated, which is the
        // case that matters: money and a good year do not undo it.
        expect(at(2_000_000_000, 95, { fbiGuilty: true })).toBe('Convicted Magnate');
        expect(at(2_000_000_000, 5, { fbiGuilty: true })).toBe('Convicted Magnate');
    });
});

describe('and one thing that is not a rung at all', () => {
    it('replaces the whole line', () => {
        // One player in a thousand ever sees it and they should see nothing
        // else. Not "Celebrated Titan of Industry" with a footnote.
        expect(at(3_000_000_000_000, 100, { ownsPear: true }))
            .toBe('The One Who Bought Pear');
    });

    it('even over a conviction, because it is the larger fact', () => {
        expect(at(4_000_000, 2, { ownsPear: true, fbiGuilty: true }))
            .toBe('The One Who Bought Pear');
    });
});

// ============================================================================
//  AND IT FITS
// ============================================================================
describe('every title this can produce', () => {
    const ADJECTIVES = ['', 'Disgraced', 'Celebrated', 'Convicted'];

    const everyTitle = (): string[] => {
        const out = ['The One Who Bought Pear'];
        for (const rung of TITLE_RUNGS) {
            for (const adj of ADJECTIVES) {
                out.push(adj ? `${adj} ${rung.title}` : rung.title);
            }
        }
        return out;
    };

    it('fits on one line', () => {
        // `numberOfLines={1}` does not wrap, it truncates, and it would
        // truncate only for the players who earned the longest one. Thirty
        // characters is comfortable on the narrowest phone the card renders
        // on; the longest this file can produce is 28.
        for (const title of everyTitle()) {
            expect(title.length).toBeLessThanOrEqual(30);
        }
    });

    it('and none of them has a dash in it', () => {
        const DASH = /[—–]|(?:^|\s)-(?:\s|$)/;
        expect(everyTitle().filter(t => DASH.test(t))).toEqual([]);
    });

    it('and every one of them is reachable', () => {
        // The guard against a rung or an adjective that exists in the file
        // and cannot happen in the game.
        const produced = new Set<string>();
        for (const rung of TITLE_RUNGS) {
            for (const s of [0, 50, 100]) {
                produced.add(titleFor({ companyValue: rung.at, standing: s, flags: {} }));
                produced.add(titleFor({
                    companyValue: rung.at, standing: s, flags: { fbiGuilty: true },
                }));
            }
        }
        produced.add(titleFor({ companyValue: 0, standing: 0, flags: { ownsPear: true } }));
        expect(produced.size).toBe(everyTitle().length);
    });
});

// ============================================================================
//  AND IT IS ON THE SCREEN
// ============================================================================
//  The placeholder it replaces was live for months because nothing ever asked
//  whether that line said anything. A title system nobody renders would be
//  the same mistake with better writing in it.
// ============================================================================
/// <reference types="node" />
import * as fs from 'fs';
import * as path from 'path';

const HOME = path.join(__dirname, '..', '..', 'screens', 'Home', 'HomeScreen.tsx');
const homeCode = () => fs.readFileSync(HOME, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

describe('the home screen', () => {
    it('renders the title under the name', () => {
        expect(homeCode()).toMatch(/readTitle\(\)/);
        expect(homeCode()).toMatch(/\{displayTitle\}/);
    });

    it('and no longer renders the bio placeholder', () => {
        // "Beta Tester, CEO Edition", from a field whose setter is never
        // called from anywhere in the app.
        expect(homeCode()).not.toMatch(/displayBio/);
    });

    it('and subscribes to the story slices the title reads', () => {
        // `readTitle` uses getState(), which does not subscribe. Without
        // these two, a conviction would change the title and the line would
        // not repaint until the next quarter moved a stat.
        expect(homeCode()).toMatch(/useStoryStore\(s => s\.flags\)/);
        expect(homeCode()).toMatch(/useStoryStore\(s => s\.dials\.publicReputation\)/);
    });
});
