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

    it('with nobody old enough, you died without an heir', () => {
        // Which has to be reachable, or naming a successor costs nothing.
        setup(80, [kid('a', 9)]);
        const out = runMortality(certainly);
        expect(out.successor).toBeNull();
        expect(useStoryStore.getState().ending).toBe('diedWithoutAnHeir');
    });

    it('and with no family at all, the same', () => {
        setup(80, []);
        expect(runMortality(certainly).ending).toBe('diedWithoutAnHeir');
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
