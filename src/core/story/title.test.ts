// src/core/story/title.test.ts
//
// ============================================================================
//  THE LINE UNDER THE NAME
// ============================================================================
//
//  What is worth testing here is not the arithmetic. It is the three claims
//  the catalogue makes, each of which is quiet enough to be reversed by
//  somebody tidying up:
//
//    THE TWO LADDERS INTERLEAVE. A successor at a billion is not automatically
//    wearing a better title than his father wore at a billion. He is wearing a
//    different one at the same altitude.
//
//    THE CASINO DOES NOT WAG THE DOG. A Titan of Industry who also gambles is
//    still a Titan.
//
//    AND IT FITS. `numberOfLines={1}` does not wrap, it truncates, and it
//    truncates only for the players who earned the longest one.
// ============================================================================

import {
    titleFor,
    earnedTitles,
    rungFor,
    TITLES,
    COMPANY_RUNGS,
    HOUSE_RUNGS,
    DISGRACE_BELOW,
    CELEBRATED_ABOVE,
    MACAU_REPUTATION,
    HIGH_ROLLER_REPUTATION,
    LARGE_FAMILY,
    type TitleWorld,
} from './title';

const world = (over: Partial<TitleWorld> = {}): TitleWorld => ({
    companyValue: 0,
    standing: 50,
    netWorth: 0,
    generation: 1,
    children: 0,
    casinoReputation: 0,
    gender: 'male',
    flags: {},
    ...over,
});

const at = (companyValue: number, over: Partial<TitleWorld> = {}) =>
    titleFor(world({ companyValue, ...over }));

describe('the company ladder', () => {
    it('starts at what he actually inherited', () => {
        // A player whose first title is "Chief Executive" has been flattered
        // in the opening minute of a game about earning it. He has a factory.
        expect(at(4_500_000)).toBe('Factory Owner');
        expect(at(0)).toBe('Factory Owner');
    });

    it('and has eight rungs, so the line moves more than six times in a life', () => {
        expect(COMPANY_RUNGS).toHaveLength(8);
        expect(HOUSE_RUNGS).toHaveLength(8);
    });

    it('and every one of them is reachable, in order', () => {
        // A threshold typed one zero out would skip a rung and nothing else
        // in the game would say so.
        // Walked off the thresholds themselves rather than off powers of ten:
        // two of the rungs sit at 50M and 250M, so a powers-of-ten sweep
        // cannot reach them and would pass while reporting six of eight.
        const seen: string[] = [];
        for (const rung of COMPANY_RUNGS) {
            expect(rungFor(rung.at)).toBe(rung.title);
            // And the quarter before it is still the previous one.
            if (rung.at > 0) expect(rungFor(rung.at - 1)).not.toBe(rung.title);
            seen.push(rungFor(rung.at));
        }
        expect(seen).toEqual(COMPANY_RUNGS.map(r => r.title));
    });

    it('and the top one is a trillion, because a comfortable top rung is not one', () => {
        expect(at(999_000_000_000)).toBe('Titan of Industry');
        expect(at(1_000_000_000_000)).toBe('Colossus');
    });

    it('and nonsense in does not put a NaN on the home screen', () => {
        expect(at(NaN)).toBe('Factory Owner');
        expect(at(-1)).toBe('Factory Owner');
        expect(titleFor(world({ companyValue: 1e9, standing: NaN }))).toBe('Magnate');
    });
});

describe('the adjective', () => {
    it('is nothing at all, most of the time', () => {
        expect(at(1_000_000_000, { standing: 50 })).toBe('Magnate');
        expect(at(1_000_000_000, { standing: DISGRACE_BELOW })).toBe('Magnate');
        expect(at(1_000_000_000, { standing: CELEBRATED_ABOVE - 1 })).toBe('Magnate');
    });

    it('and sours when the world has stopped giving you the benefit of the doubt', () => {
        expect(at(1_000_000_000, { standing: DISGRACE_BELOW - 1 })).toBe('Disgraced Magnate');
        expect(at(4_000_000, { standing: 5 })).toBe('Disgraced Factory Owner');
    });

    it('and warms when it has started giving you rather too much', () => {
        expect(at(1_000_000_000, { standing: CELEBRATED_ABOVE })).toBe('Celebrated Magnate');
    });

    it('while a conviction beats every other word', () => {
        // The one thing in this game a player cannot work off. It holds at a
        // standing that would otherwise read as celebrated, which is the case
        // that matters: money and a good year do not undo it.
        expect(at(1_000_000_000, { standing: 95, flags: { fbiGuilty: true } }))
            .toBe('Convicted Magnate');
    });

    it('and it decorates the company rung and nothing else', () => {
        // "Disgraced The One Who Bought Pear" is not English, and "Celebrated
        // Founder of a Dynasty" is thirty one characters. Everything outside
        // the ladder is already a judgement.
        expect(at(0, { standing: 2, flags: { ownsPear: true } }))
            .toBe('The One Who Bought Pear');
        expect(at(1_000_000_000, { standing: 2, generation: 3 }))
            .toBe('Head of the House');
    });
});

// ============================================================================
//  THE HOUSE
// ============================================================================
describe('a successor', () => {
    const heir = (companyValue: number) =>
        at(companyValue, { generation: 2 });

    it('wears a different set entirely', () => {
        expect(heir(0)).toBe('The Inheritor');
        expect(heir(250_000_000)).toBe('The Second Founder');
        expect(heir(1_000_000_000)).toBe('Head of the House');
        expect(heir(1_000_000_000_000)).toBe('Founder of a Dynasty');
    });

    it('at the same altitude as his father, not above it', () => {
        // The claim the interleaved ranks exist for. An heir at a billion has
        // done something DIFFERENT from a founder at a billion, and only one
        // of the two words is a compliment. Neither is a promotion.
        for (const rung of COMPANY_RUNGS) {
            const founder = at(rung.at);
            const successor = heir(rung.at);
            expect(successor).not.toBe(founder);
        }
    });

    it('while the founder never sees any of them', () => {
        const founderTitles = earnedTitles(world({
            companyValue: 3_000_000_000_000, generation: 1,
        })).map(t => t.id);
        expect(founderTitles.some(id => id.startsWith('house-'))).toBe(false);
    });
});

// ============================================================================
//  THE TABLES
// ============================================================================
describe('the casino', () => {
    it('is worth a title, twice', () => {
        expect(at(0, { casinoReputation: HIGH_ROLLER_REPUTATION })).toBe('High Roller');
        expect(at(0, { casinoReputation: MACAU_REPUTATION })).toBe('Known in Macau');
    });

    it('and Macau is the seventh room, which is where it stops', () => {
        expect(at(0, { casinoReputation: MACAU_REPUTATION - 1 })).toBe('High Roller');
        expect(at(0, { casinoReputation: 1000 })).toBe('Known in Macau');
    });

    it('but it does not wag the dog', () => {
        // A Titan of Industry who also gambles is still a Titan. Ranking the
        // casino titles at the top would demote him, which is the tail wagging
        // the dog and the reason they sit at the height they feel like.
        expect(at(100_000_000_000, { casinoReputation: 1000 })).toBe('Titan of Industry');
        expect(at(1_000_000_000_000, { casinoReputation: 1000 })).toBe('Colossus');
    });

    it('while a small operator who lives at the tables wears it', () => {
        // And this is the case they are FOR: somebody whose life the balance
        // sheet does not record.
        expect(at(20_000_000, { casinoReputation: MACAU_REPUTATION }))
            .toBe('Known in Macau');
    });
});

// ============================================================================
//  AND THE FOUR THAT ARE NOT A RUNG
// ============================================================================
describe('the ones you cannot climb to', () => {
    it('a spotless record with money behind it', () => {
        // Standing is capped at 100 and getting there needs a clean record AND
        // real money, so this is the one title that wants both halves of the
        // prestige system at once.
        expect(at(1_000_000_000, { standing: 100 })).toBe('Beyond Reproach');
    });

    it('and the wealth half said out loud, which wants the person not the company', () => {
        expect(at(1_000_000_000, { standing: 100, netWorth: 10_000_000_000 }))
            .toBe('The Richest Man Alive');
        expect(at(1_000_000_000, {
            standing: 100, netWorth: 10_000_000_000, gender: 'female',
        })).toBe('The Richest Woman Alive');
    });

    it('and a dynasty measured the blunt way', () => {
        // The number is in the label because twenty two children is funnier
        // and sadder than "a large family".
        expect(at(1_000_000_000, { children: LARGE_FAMILY })).toBe('Patriarch of 20');
        expect(at(1_000_000_000, { children: 22, gender: 'female' }))
            .toBe('Matriarch of 22');
    });

    it('but not for an ordinary number of them', () => {
        expect(at(1_000_000_000, { children: LARGE_FAMILY - 1 })).toBe('Magnate');
    });

    it('and one that replaces the whole line', () => {
        expect(at(3_000_000_000_000, {
            standing: 100, netWorth: 1e11, children: 30, casinoReputation: 1000,
            generation: 4, flags: { ownsPear: true },
        })).toBe('The One Who Bought Pear');
    });
});

// ============================================================================
//  AND IT FITS
// ============================================================================
describe('every title this can produce', () => {
    const ADJECTIVES = ['', 'Disgraced ', 'Celebrated ', 'Convicted '];

    const everyString = (): string[] => {
        const out: string[] = [];
        const sample = world({ children: 22, gender: 'female' });
        for (const def of TITLES) {
            const label = typeof def.label === 'function' ? def.label(sample) : def.label;
            if (def.decorated) {
                for (const adj of ADJECTIVES) out.push(`${adj}${label}`);
            } else {
                out.push(label);
            }
        }
        return out;
    };

    it('fits on one line', () => {
        // The longest is "Celebrated Titan of Industry" at 28. Thirty is
        // comfortable on the narrowest phone the card renders on.
        const tooLong = everyString().filter(s => s.length > 30);
        expect(tooLong).toEqual([]);
    });

    it('and none of them has a dash in it', () => {
        const DASH = /[—–]|(?:^|\s)-(?:\s|$)/;
        expect(everyString().filter(t => DASH.test(t))).toEqual([]);
    });

    it('and no two of them are the same words', () => {
        const labels = TITLES.map(t =>
            typeof t.label === 'function' ? t.id : t.label);
        expect(new Set(labels).size).toBe(labels.length);
    });

    it('and no two of them share a rank', () => {
        // A tie is resolved by array order, which is nobody's intention and
        // would silently pick a different winner the first time somebody
        // reordered the file.
        const ranks = TITLES.map(t => t.rank);
        expect(new Set(ranks).size).toBe(ranks.length);
    });

    it('and there are twenty two of them', () => {
        // Eight, eight, two and four. If this number moves, something was
        // added without a line in the header saying what track it is on.
        expect(TITLES).toHaveLength(22);
    });
});

// ============================================================================
//  AND IT IS ON THE SCREEN
// ============================================================================
//  The placeholder it replaces was live for months because nothing ever asked
//  whether that line said anything. A title system nobody renders would be the
//  same mistake with better writing in it.
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
