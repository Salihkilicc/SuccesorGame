// src/core/story/runMortality.test.ts
//
// ============================================================================
//  THE QUARTER YOU DIE IN
// ============================================================================
//
//  Two things are being checked and only one of them is obvious.
//
//  The obvious one: which ending, and it turns on whether anybody is old
//  enough to take over.
//
//  The other one is ORDERING, and it is the kind of bug that only shows up to
//  a player who has an unusually bad quarter. Bankruptcy, a board removal and
//  a death are all decided inside the same tick. If mortality ran first, or
//  ran without checking, a player whose capital went negative in the quarter
//  they were due to die would have the death overwrite the bankruptcy notice,
//  and the last thing they ever read would be about the wrong event.
// ============================================================================

import { runMortality } from './runMortality';
import { useGameStore } from '../store/useGameStore';
import { useFamilyStore } from '../store/useFamilyStore';
import { useStoryStore } from '../store/useStoryStore';
import { ENDINGS } from '../../data/story/endings';

const kid = (id: string, age: number) => ({
    id, name: id, age, gender: 'male', stats: {},
} as any);

const setup = (age: number, children: any[] = [], successorId: string | null = null) => {
    useStoryStore.setState({ ending: null } as never);
    useGameStore.setState({ age } as never);
    useFamilyStore.setState({ children, designatedSuccessorId: successorId } as never);
};

/** Certain death, so the test is about the consequence rather than the die. */
const certainly = () => 0;
/** Certainly not. */
const survives = () => 0.9999999;

describe('most quarters', () => {
    it('nothing happens', () => {
        setup(70);
        const out = runMortality(survives);
        expect(out.died).toBe(false);
        expect(useStoryStore.getState().ending).toBeNull();
    });

    it('and being young is proof against any roll', () => {
        // The curve is flat at zero below the start age, so even a die that
        // always comes up worst cannot take a run away at thirty.
        setup(30);
        expect(runMortality(certainly).died).toBe(false);
    });
});

describe('the quarter it does', () => {
    it('with somebody old enough, you died in office', () => {
        setup(80, [kid('a', 40)]);
        const out = runMortality(certainly);
        expect(out.died).toBe(true);
        expect(out.successor?.id).toBe('a');
        expect(useStoryStore.getState().ending).toBe('diedInOffice');
    });

    it('and it is the one you named', () => {
        setup(80, [kid('a', 40), kid('b', 20)], 'b');
        expect(runMortality(certainly).successor?.id).toBe('b');
    });

    it('with a child too young, the chair WAITS rather than the run ending', () => {
        // THE DEFECT, and this test used to encode it. `heirInWaiting` has
        // existed since it was asked for as "heir kac yasinda olsa da
        // gecilmeli", with a long note and a full set of tests, and nothing
        // called it - so a family with a nine year old in it got the barren
        // ending. Reported as "I choose an heir and I do not get a successor;
        // he was eleven".
        setup(80, [kid('a', 9)]);
        const out = runMortality(certainly);
        expect(useStoryStore.getState().ending).toBe('diedWithHeirTooYoung');
        // And the child is named, so the overlay has somebody to offer.
        expect(out.successor?.id).toBe('a');
    });

    it('and a newborn is still somebody, because that is the case that needed it', () => {
        setup(80, [kid('a', 0)]);
        expect(runMortality(certainly).ending).toBe('diedWithHeirTooYoung');
    });

    it('but with no family at all it really is the barren ending', () => {
        // Which has to stay reachable, or the ending is unreachable writing.
        setup(80, []);
        const out = runMortality(certainly);
        expect(out.successor).toBeNull();
        expect(useStoryStore.getState().ending).toBe('diedWithoutAnHeir');
    });

    it('and the overlay offers the chair for the waiting ending too', () => {
        // The other half of the same bug. `CONTINUABLE` was one string, so
        // even once the ending was named the button that carries the dynasty
        // on would not have appeared, and the run would have ended anyway.
        const fs = require('fs');
        const path = require('path');
        const src = fs.readFileSync(
            path.join(__dirname, '..', '..', 'components', 'story', 'EndingOverlay.tsx'), 'utf8',
        );
        // The list became a TABLE when being barred joined it: the endings
        // that continue, each with the reason the chair changed hands, since
        // a bar must not settle an estate. Both death endings are still on
        // it and that is what this test is about. See barredContinues.test.
        expect(src).toMatch(/diedWithHeirTooYoung: 'death'/);
        expect(src).toMatch(/diedInOffice: 'death'/);
        // And it asks who is waiting, not only who can take it today.
        expect(src).toMatch(/heirInWaiting\(candidates\)\?\.heir/);
    });

    it('and the succession plan already knew how to wait, which is the sting', () => {
        // `planSuccession` has handled this from the start and returns the
        // years. All that was ever missing was an ending naming it.
        const { planSuccession } = require('./succession');
        const plan = planSuccession({
            children: [{ id: 'a', name: 'Ada Hale', age: 9, gender: 'Female' }],
            lastName: 'Hale',
            designatedSuccessorId: 'a',
            survivingParent: null,
            estate: { cash: 100, shares: 100 },
            generation: 1,
        });
        expect(plan).not.toBeNull();
        expect(plan.yearsHeld).toBeGreaterThan(0);
    });

    it('and both of the endings it can name exist', () => {
        // The failure this catches ends the game on a blank overlay.
        expect(ENDINGS.diedInOffice).toBeDefined();
        expect(ENDINGS.diedWithoutAnHeir).toBeDefined();
    });
});

// ============================================================================
//  AND IT NEVER TALKS OVER SOMETHING ELSE
// ============================================================================
describe('a game that is already over', () => {
    it('does not also end', () => {
        // The bankruptcy notice must not be replaced by a death notice in
        // the one quarter a player gets both.
        setup(90);
        useStoryStore.getState().endGame('wentBankrupt');
        const out = runMortality(certainly);
        expect(out.died).toBe(false);
        expect(useStoryStore.getState().ending).toBe('wentBankrupt');
    });

    it('nor after the board has already removed you', () => {
        // "You died in office" is not true of somebody who was voted out
        // this quarter and is no longer the chief executive of anything.
        setup(90, [kid('a', 40)]);
        useStoryStore.getState().endGame('removedByBoard');
        runMortality(certainly);
        expect(useStoryStore.getState().ending).toBe('removedByBoard');
    });
});
