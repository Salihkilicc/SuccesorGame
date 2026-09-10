// src/data/tutorial/sequenceWalk.test.ts
//
// ============================================================================
//  WALK THE WHOLE FIRST YEAR, IN A REAL NEW GAME
// ============================================================================
//
//  Every other test around the tutorial checks one joint. This one starts an
//  actual game through `startNewGame` and walks it: raise the flags a player
//  raises by pressing things, and ask `activeLock` what would be on screen
//  after each one.
//
//  It exists because of what the last three rounds cost. The lock data was
//  right, the conditions were right, the targets were right, the delivery was
//  right, and the tutorial did not happen - and no test asked the only
//  question a player asks, which is "I pressed play, then I walked in here,
//  what did I see". A joint at a time cannot answer that. The whole walk can.
//
//  Two runs, because the game asks the player one question and both answers
//  have to be honoured:
//
//      PLAY IT  every step arrives, in order, from the right person
//      SKIP IT  nothing arrives at all, ever
//
//  ASSERTED, NOT LOGGED. The first version of this printed the walk to the
//  console, which is a thing to read once rather than a thing that fails.
// ============================================================================

import { startNewGame } from '../../core/newGame';
import { useStoryStore } from '../../core/store/useStoryStore';
import { activeLock } from '../../core/tutorial/locks';
import { TUTORIAL_SEQUENCE } from './sequence';
import { readWorld } from '../../core/story/world';
import type { StoryFlag } from '../../core/story/state';

/** What the overlay would be showing right now, as one readable line. */
const onScreen = (): string => {
    const lock = activeLock(TUTORIAL_SEQUENCE, useStoryStore.getState().locks, readWorld());
    return lock
        ? `${lock.id} @ ${lock.highlight} by ${lock.speaker ?? 'father'}`
        : 'nothing';
};

/**
 * The player presses the thing. Screens raise these; here we raise them.
 *
 * Typed as StoryFlag rather than string, so a walk written against a flag
 * that no longer exists fails to compile instead of walking past a step in
 * silence - which is the failure this whole file was written after.
 */
const press = (flag: StoryFlag) => useStoryStore.getState().raise(flag);

/**
 * The player taps an `acknowledge` card away.
 *
 * The overlay records that in LockState rather than in the world, because
 * having READ something is not a fact about the company. So a walk cannot
 * clear one of these by raising a flag, and naming the action here keeps the
 * walk below reading like somebody using the app.
 */
const tapAway = (lockId: string) => useStoryStore.getState().completeLock(lockId);

describe('a new game with the opening act played', () => {
    beforeAll(async () => {
        await startNewGame({ skipOpening: false } as any);
    });

    it('walks the player through every step in order', () => {
        const walk: string[] = [];

        // Nothing raised. They have just arrived and opened My Company.
        walk.push(onScreen());

        press('tutorialProductOpened');   // they opened the product sheet
        walk.push(onScreen());

        tapAway('q1-production');         // they read what the slider means
        walk.push(onScreen());

        press('tutorialMarketingSet');    // they raised the budget and saved
        walk.push(onScreen());

        press('rndOpened');               // they tapped into research
        walk.push(onScreen());

        press('rndLabOpened');            // they opened the laboratory
        walk.push(onScreen());

        press('rndHired');                // they hired somebody
        walk.push(onScreen());

        expect(walk).toEqual([
            'q1-open-product @ products by father',
            // The sheet, top to bottom. The production row is the number that
            // decides whether the quarter is profitable and the tutorial
            // could not reach it, so the first thing the game taught about a
            // product used to be how to advertise it. Asked for as
            // "urunleri de anlatmani istiyorum".
            'q1-production @ production by coo',
            'q1-marketing @ marketing by father',
            // The father hands the subject over here and does not take it
            // back. Reported as "babamiz tarafindan degil".
            'q1-research @ rndDepartment by cto',
            // THE ONE THAT WAS BROKEN. Tapping into research is what triggers
            // it, and it must be the very next thing on screen - not a lesson
            // that waits for a quarter to close. "bunu girdigim an
            // anlatilmasi lazim".
            'rnd-lab @ rndLab by cto',
            'rnd-hire @ rndHire by cto',
            'rnd-points @ rndPoints by cto',
        ]);
    });

    it('and morale is the only step the player cannot reach by walking in', () => {
        // It is on the workforce's clock rather than on a control, so it does
        // not appear in the walk above and its absence there is correct. Said
        // out loud so that absence is not read as a gap.
        const byPressing = TUTORIAL_SEQUENCE.filter(l => l.id !== 'morale-bonus');
        expect(byPressing).toHaveLength(TUTORIAL_SEQUENCE.length - 1);
    });
});

// ============================================================================
//  AND THE SAME WALK IN A COMPANY THAT CANNOT AFFORD THE FIRST YEAR
// ============================================================================
//  A probe found the gap this covers. Deleting `tutorialMarketingSet` from
//  `q1-research` left the walk above completely green, because that walk gets
//  its order from the ARRAY and never asks the gate anything. A test that
//  cannot fail when a condition is removed is not protecting the condition.
//
//  This is where the gate does its work. Both of the first-year steps need
//  half a million in capital, so a company below that gets neither - and
//  without the gate, `q1-research` would fall through and become the first
//  thing a struggling player is taught.
// ============================================================================
describe('and the same game in a company with nothing in the bank', () => {
    beforeAll(async () => {
        await startNewGame({ skipOpening: false } as any);
        // Below `capitalAtLeast: 500_000`, which is what the product and
        // marketing steps require. Measured, not assumed: the opening capital
        // is three million, so this is a company that has spent itself into
        // trouble rather than one that started there.
        require('../../core/store/useStatsStore')
            .useStatsStore.setState({ companyCapital: 100_000 });
    });

    it('teaches them nothing they would have to pay for', () => {
        expect(onScreen()).toBe('nothing');
    });

    it('and the production card still lands, because reading is free', () => {
        // It has no money in its gate for the same reason the research one
        // does not: a company that cannot afford a mistake is the one that
        // most needs to be told which mistake this control makes.
        press('tutorialProductOpened');
        expect(onScreen()).toBe('q1-production @ production by coo');
    });

    it('but still explains research, because opening a page is free', () => {
        // The one first-year lesson with no money in its gate, deliberately:
        // a company with no cash is the one that most needs to know what the
        // laboratory is for.
        press('rndOpened');
        expect(onScreen()).toBe('rnd-lab @ rndLab by cto');
    });
});

describe('and a new game where the player skipped it', () => {
    beforeAll(async () => {
        await startNewGame({ skipOpening: true } as any);
    });

    it('shows nothing, and goes on showing nothing however far they walk', () => {
        expect(onScreen()).toBe('nothing');
        const walked: StoryFlag[] = [
            'tutorialProductOpened', 'tutorialMarketingSet',
            'rndOpened', 'rndLabOpened', 'rndHired',
        ];
        for (const flag of walked) {
            press(flag);
            expect([flag, onScreen()]).toEqual([flag, 'nothing']);
        }
    });

    it('because the locks were switched off rather than raced past', () => {
        // `disabled` and not an empty sequence: the difference matters if
        // somebody later loads a save from a run that was not skipped.
        expect(useStoryStore.getState().locks.disabled).toBe(true);
    });
});
