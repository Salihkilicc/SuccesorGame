// src/data/story/endings.test.ts
//
// ============================================================================
//  THERE IS ONE PLACE THE GAME KEEPS ITS LAST WORDS
// ============================================================================
//
//  Endings used to live in two places. `removedByBoard` had been moved into
//  data/story/endings.ts; `bankrupt` was still four translation keys resolved
//  by a nested ternary inside HomeScreen, which also owned the boolean that
//  decided whether the overlay appeared at all.
//
//  The split was survivable with two endings and would not have been with
//  seven, and the failure it invites is the quiet kind: a new ending is added
//  to the data file, the ternary is not touched because nothing points at it,
//  and the ending renders the bankruptcy text. Nothing throws. The type
//  checker is happy. The player reaches an ending and reads somebody else's.
//
//  ---------------------------------------------------------------------------
//  SO THE TEST READS THE SCREEN AS TEXT
//  ---------------------------------------------------------------------------
//  Same argument as navigation/routes.test.ts, and the same ugliness. What is
//  being checked is the ABSENCE of a second source of truth, and absence
//  cannot be asserted by rendering: a component that still holds the old
//  ternary renders perfectly well for as long as nobody goes bankrupt.
//
//  Comments are stripped first, so the shelved copy of the old markup left in
//  that file for reference does not read as a live second source. The whole
//  point of shelving rather than deleting is that it stays readable, and a
//  test that punishes that would teach the wrong lesson.
// ============================================================================

/// <reference types="node" />
//  Node APIs in a React Native tsconfig. See the identical note in
//  navigation/routes.test.ts: without this, `npx tsc --noEmit` grows by four
//  errors about `fs` and `path`, and a baseline that grows is a baseline
//  nobody reads.
import * as fs from 'fs';
import * as path from 'path';

import { ENDINGS, ENDING_FOR_STATUS, endingById } from './endings';

const SRC = path.join(__dirname, '..', '..');
const HOME_SCREEN = path.join(SRC, 'screens', 'Home', 'HomeScreen.tsx');
const OVERLAY = path.join(SRC, 'components', 'story', 'EndingOverlay.tsx');

/** Block and line comments removed, so shelved code does not count as code. */
const codeOf = (file: string): string =>
    fs.readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');

describe('every ending is a record in this file', () => {
    it('and its id matches the key it is filed under', () => {
        // A mismatch is invisible: `endingById` takes the key, the record
        // carries the other one, and nothing ever compares them.
        for (const [key, ending] of Object.entries(ENDINGS)) {
            expect(ending.id).toBe(key);
        }
    });

    it('and it has something to say', () => {
        // The bankruptcy body used to be "The money ran out." in full. Four
        // words for the ending most players will actually reach.
        for (const ending of Object.values(ENDINGS)) {
            expect(ending.title.length).toBeGreaterThan(0);
            expect(ending.body.length).toBeGreaterThan(80);
        }
    });

    it('and the six that exist are the six that can happen', () => {
        // Reachability checks that every `ending` EFFECT names a real record.
        // Nothing checked the other direction, and an ending nobody can reach
        // is writing that will never be read.
        //
        // The two deaths are not named by an effect at all - core/story/
        // runMortality.ts picks between them - so they would be invisible to
        // that audit in both directions. This list is the only thing that
        // sees them.
        expect(Object.keys(ENDINGS).sort()).toEqual([
            'boughtPear',
            'diedInOffice',
            'diedWithoutAnHeir',
            'removedByBoard',
            'soldToPear',
            'wentBankrupt',
        ]);
    });
});

describe('the quarterly tick names one rather than describing one', () => {
    it('for both of the ways a quarter can end the game', () => {
        expect(Object.keys(ENDING_FOR_STATUS).sort()).toEqual(['bankrupt', 'removed']);
    });

    it('and both names resolve', () => {
        // The one that would end the game on a blank screen, and only for a
        // player who had just gone bankrupt.
        for (const id of Object.values(ENDING_FOR_STATUS)) {
            expect(endingById(id)).toBeDefined();
        }
    });

    it('and an unknown id resolves to nothing rather than to something wrong', () => {
        expect(endingById('')).toBeUndefined();
        expect(endingById('notAnEnding')).toBeUndefined();
    });
});

// ============================================================================
//  AND THE SCREEN HAS NO OPINION ABOUT ANY OF IT
// ============================================================================
describe('HomeScreen', () => {
    const code = codeOf(HOME_SCREEN);

    it('holds no ending prose of its own', () => {
        // The four keys the ternary used. If one of these comes back, the
        // game has its last words in two places again.
        for (const key of [
            'gameover.bankrupt',
            'gameover.bankruptBody',
            'gameover.removed',
            'gameover.removedBody',
        ]) {
            expect(code).not.toContain(key);
        }
    });

    it('and decides nothing by comparing a reason to a string', () => {
        expect(code).not.toMatch(/gameOverReason/);
        expect(code).not.toMatch(/isGameOver/);
    });

    it('and hands the whole thing to one component', () => {
        // The rendering went to components/story/EndingOverlay.tsx, so this
        // screen knows only THAT there is an ending. It used to know what one
        // looks like, which is how the ternary got there in the first place.
        expect(code).toMatch(/<EndingOverlay/);
        expect(code).not.toMatch(/ending\.title/);
        expect(code).not.toMatch(/ending\.body/);
    });

    it('and keeps its own way of ending the game if the store write is lost', () => {
        // `endGame` is called inside a try/catch that swallows a store which
        // is not ready. The fallback for "the ending did not get written"
        // must not be "the game carries on after bankruptcy" - so the screen
        // still watches the tick's status. It just holds an ID now.
        expect(code).toMatch(/ENDING_FOR_STATUS\[result\.status\]/);
    });
});

// ============================================================================
//  AND THE OVERLAY IS TWO SCREENS, IN THAT ORDER
// ============================================================================
//  See the note at the top of core/story/record.ts. The endings file says an
//  ending is "not an epilogue and not a scorecard", the player wants their
//  numbers, and both are satisfied by not putting them on the same page.
// ============================================================================
describe('EndingOverlay', () => {
    const code = codeOf(OVERLAY);

    it('renders the ending it is given and nothing of its own', () => {
        expect(code).toMatch(/ending\.title/);
        expect(code).toMatch(/ending\.body/);
        // No title, no body and no fallback prose anywhere in the component.
        expect(code).not.toMatch(/GAME OVER|YOU ARE OUT/);
    });

    it('and the record is behind a second tap rather than under the prose', () => {
        // If these ever end up on one page the writing dies: the eye finds
        // the figures first, every time.
        expect(code).toMatch(/showRecord/);
        expect(code).toMatch(/setShowRecord\(true\)/);
        expect(code).toMatch(/setShowRecord\(false\)/);
    });

    it('and the title is not the loss red', () => {
        // theme.ts: `danger` is now strictly the loss half of the profit/loss
        // signal. soldToPear is the player getting rich in their first year.
        expect(code).not.toMatch(/colors\.danger/);
        expect(code).not.toMatch(/colors\.error/);
    });

    it('and it counts the endings against what the player has read', () => {
        expect(code).toMatch(/endingsProgress/);
        expect(code).toMatch(/markEndingSeen/);
    });
});
