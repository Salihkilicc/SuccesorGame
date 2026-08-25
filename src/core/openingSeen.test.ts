// src/core/openingSeen.test.ts
//
// ============================================================================
//  DOES THE QUESTION ACTUALLY GET ASKED
// ============================================================================
//
//  newGamePrompt.test.ts reads the source and checks the shape. That is what
//  let the last version of this feature ship broken twice: both times the code
//  said the right thing and the gate was still shut.
//
//      First:  gated on `tutorialCompleted`, which needs all six tutorial
//              locks - including one that needs morale to fall while the
//              father is still alive. Most runs never satisfy it.
//      Then:   gated on `openingSeen`, written when `fatherDead` is raised -
//              which is fine forward and blind backwards, so every save that
//              had already buried the father was still refused the question.
//
//  Both were "correct" by inspection. So this file runs the gate against real
//  store state instead.
// ============================================================================

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn(async () => null),
        setItem: jest.fn(async () => { }),
        removeItem: jest.fn(async () => { }),
    },
}));

import { hasSeenTheOpening } from './newGamePrompt';
import { useIdentityStore, initialIdentityState } from './store/useIdentityStore';
import { useStoryStore, initialStoryState } from './store/useStoryStore';
import { OPENING_ACT } from '../data/story/openingAct';

const freshPlayer = () => {
    useIdentityStore.setState({ ...initialIdentityState, _hasHydrated: true });
    useStoryStore.setState({ ...initialStoryState, _hasHydrated: true });
};

describe('the skip question', () => {
    beforeEach(freshPlayer);

    it('is NOT offered to somebody who has never seen the opening', () => {
        // Offering to skip a story they have never watched is offering to
        // skip the game.
        expect(hasSeenTheOpening()).toBe(false);
    });

    it('and IS offered to a run that has already buried the father', () => {
        // THE REPORTED BUG. This state exists in every save that predates the
        // flag, and it was being refused the question.
        useStoryStore.setState({ flags: { fatherDead: true } } as never);
        expect(hasSeenTheOpening()).toBe(true);
    });

    it('and to one that watched the whole act without the flag set', () => {
        useStoryStore.setState({ seenScenes: [...OPENING_ACT] } as never);
        expect(hasSeenTheOpening()).toBe(true);
    });

    it('and to one that only got as far as the death scene', () => {
        // Mid funeral is still past the part the question is about.
        useStoryStore.setState({ seenScenes: ['father-death'] } as never);
        expect(hasSeenTheOpening()).toBe(true);
    });

    it('but not to one that is only part way through the first year', () => {
        // The father is alive, the invoice scene has been read. Not the same
        // thing at all, and the rule above must not be so loose it says yes.
        useStoryStore.setState({
            seenScenes: ['father-inheritance', 'father-q1', 'father-q1-invoice'],
        } as never);
        expect(hasSeenTheOpening()).toBe(false);
    });

    it('and once it has said yes, it is remembered', () => {
        useStoryStore.setState({ flags: { fatherDead: true } } as never);
        expect(useIdentityStore.getState().openingSeen).toBe(false);

        hasSeenTheOpening();
        expect(useIdentityStore.getState().openingSeen).toBe(true);

        // And it holds when the story store is wiped, which is exactly what
        // startNewGame does a moment later.
        useStoryStore.setState({ ...initialStoryState, _hasHydrated: true });
        expect(hasSeenTheOpening()).toBe(true);
    });

    it('and the flag alone is enough, without the story saying anything', () => {
        // The forward path: a run that raised fatherDead while this code was
        // live already wrote the flag, and the backfill never has to run.
        useIdentityStore.setState({ openingSeen: true } as never);
        expect(hasSeenTheOpening()).toBe(true);
    });
});
