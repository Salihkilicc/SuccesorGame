// src/core/story/successorWord.test.ts
//
// ============================================================================
//  ONE RELATIONSHIP, ONE WORD
// ============================================================================
//
//  The code said successor and the screens said heir.
//
//  `designatedSuccessorId`, `successorFor`, `planSuccession`, `runSuccession`,
//  `isDesignatedSuccessor`, `handleDesignateSuccessor`, `activeSuccessorBanner`,
//  and the cast entry whose role is literally 'Successor' - all of it, in the
//  source, consistently. And then a HEIR badge, "Designate as Primary Heir",
//  "Designated Primary Heir to the Hale Empire", "Dynasty Heir Born", "4 Heirs",
//  "Newborn Heir", "Your Heir".
//
//  The player only ever reads the second set. So the game called the single
//  most important relationship in it by a name its own source does not use,
//  in a game called Succesor.
//
//  ---------------------------------------------------------------------------
//  AND THE OTHER SENSE OF THE WORD STAYS
//  ---------------------------------------------------------------------------
//  "Heir" also means somebody who INHERITED money, which is a fact about a
//  stranger rather than a role in your company: the `BillionaireHeir` social
//  class, "Heir/Heiress" as a job at a nightclub, "Billionaire Industrial Heir"
//  on a partner's profile. Those are not this, and a blanket rename would have
//  taken them too. The rule below is about the succession screens only.
// ============================================================================

import fs from 'fs';
import path from 'path';

import { FALLBACK_CHILD_NAME } from '../store/useFamilyStore';

const SRC = path.join(__dirname, '..', '..');
const read = (...p: string[]) => fs.readFileSync(path.join(SRC, ...p), 'utf8');

/**
 * Comments in this codebase discuss the bug at length and quote the old
 * wording. The rule is about what reaches the screen.
 */
const code = (...p: string[]) => read(...p)
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
    .split('\n')
    .filter(l => !/^\s*\/\//.test(l))
    // Trailing comments too. `backgroundColor: '#353842', // primary heir` is
    // a note to the next reader, not something anybody sees.
    .map(l => l.replace(/\s\/\/.*$/, ''))
    .join('\n');

/**
 * The cast KEY is not a word, it is an address.
 *
 * `heir` indexes the cast and every scene in data/story points at it -
 * `speaker: 'heir'`, `from: 'heir'` - and storyKeys.ts builds translation keys
 * out of it. Renaming it would rewrite four data files and every key derived
 * from them to change nothing the player can see, and would strand the
 * translations of scenes already written. So the address keeps its old spelling
 * and the NAME hanging off it is the thing that got fixed.
 */
const CAST_KEY = /^\s*(heir:\s*\{|id:\s*'heir',|speaker:\s*'heir',|from:\s*'heir',)\s*$/;

/** Where the succession is shown to the player. */
const SCREENS: readonly string[][] = [
    ['features', 'profile', 'screens', 'FamilyMemberScreen.tsx'],
    ['features', 'profile', 'components', 'FamilySuccessionList.tsx'],
    ['features', 'profile', 'components', 'FamilyMemberDetailModal.tsx'],
    ['features', 'profile', 'logic', 'useProfileLogic.ts'],
    ['logic', 'relationshipEvents.ts'],
    ['data', 'story', 'cast.ts'],
];

/**
 * The word on its own, not inside a longer one.
 *
 * `BillionaireHeir` and `heirInWaiting` are identifiers and they do not reach
 * the player, so the boundary is what does the work here.
 */
const LOOSE_HEIR = /(^|[^A-Za-z])heirs?([^A-Za-z]|$)/i;

describe('the word the player reads', () => {
    it.each(SCREENS)('is not heir, in %s/%s', (...p) => {
        const offenders = code(...p)
            .split('\n')
            .filter(l => LOOSE_HEIR.test(l) && !CAST_KEY.test(l));
        expect(offenders).toEqual([]);
    });

    it('and the stand-in in the cast says it too', () => {
        // Story scenes never name a child, because the player names them and
        // no data file can hold that. This entry is what the thread header
        // falls back to. See data/story/cast.ts.
        expect(code('data', 'story', 'cast.ts')).toContain("name: 'Your Successor'");
        expect(code('data', 'story', 'cast.ts')).toContain("role: 'Successor'");
    });
});

describe('an unnamed child', () => {
    it('is called the same thing in all three places that name one', () => {
        // The store on write, the store on rehydrate, and the screen on read.
        // Three copies of one literal is how the word drifted in the first
        // place, so they share a constant now.
        expect(FALLBACK_CHILD_NAME).toBe('Successor');
        for (const p of [
            ['core', 'store', 'useFamilyStore.ts'],
            ['features', 'profile', 'screens', 'FamilyMemberScreen.tsx'],
            ['features', 'profile', 'logic', 'useProfileLogic.ts'],
        ]) {
            expect(code(...p)).toContain('FALLBACK_CHILD_NAME');
        }
    });
});

describe('the other heir', () => {
    it('is left alone, because it means something else', () => {
        // Somebody who inherited money. A description of a stranger at a bar,
        // not a role in your company.
        expect(read('features', 'life', 'components', 'NightOut', 'logic', 'nightOutUtils.ts'))
            .toContain('Heir/Heiress');
        expect(read('features', 'love', 'data', 'jobsData.ts'))
            .toContain('Billionaire Industrial Heir');
        expect(read('core', 'store', 'useFamilyStore.ts'))
            .toContain('BillionaireHeir');
    });
});
