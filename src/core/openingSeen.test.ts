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

    // ------------------------------------------------------------------
    //  THE GATE THAT IS NOT AN INFERENCE
    // ------------------------------------------------------------------
    //  Two versions of this feature shipped with a closed gate. Both were
    //  chains: six tutorial locks, then a flag earned only going forward.
    //  The fact the question is about is "is this a restart", and that is a
    //  counter with nothing behind it.
    // ------------------------------------------------------------------
    it('is offered to anybody on their second run or later', () => {
        useIdentityStore.setState({ runsStarted: 1 } as never);
        expect(hasSeenTheOpening()).toBe(true);
    });

    it('and the counter alone is enough, with no story at all', () => {
        // The story store is empty here. That is the point: this answer does
        // not depend on any bookkeeping surviving.
        useStoryStore.setState({ ...initialStoryState, _hasHydrated: true });
        useIdentityStore.setState({ runsStarted: 3 } as never);
        expect(hasSeenTheOpening()).toBe(true);
    });

    it('is NOT offered on a first run that has seen nothing', () => {
        // Offering to skip a story they have never watched is offering to
        // skip the game. runsStarted is 0 and the story is empty.
        expect(useIdentityStore.getState().runsStarted).toBe(0);
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


// ============================================================================
//  AND THE PLAYER WHO EXISTED BEFORE THE COUNTER DID
// ============================================================================
//
//  Screenshot: the erase dialog appears, the player confirms, and the company
//  name form comes up. The skip question never renders. Which proves the
//  DIALOG works - it is the same component that drew the erase panel - and
//  that the gate said no.
//
//  It said no correctly, and uselessly. `runsStarted` is incremented by
//  startNewGame, so it can only count runs begun after it was written. Every
//  existing player rehydrates with it undefined, which reads as zero, which
//  reads as a first run.
//
//  The third gate had the same shape as the first two after all: a fact
//  inferred from bookkeeping that did not exist yet. The difference is that
//  this one can be answered honestly at rehydrate time.
// ============================================================================

describe('rehydrating a save from before the counter', () => {
    /** What zustand's persist does: MERGE, so absent keys stay absent. */
    const rehydrate = (persisted: Record<string, unknown>) => {
        useIdentityStore.setState({
            ...initialIdentityState,
            ...persisted,
            runsStarted: undefined as never,
            _hasHydrated: false,
        });
        // The same two lines the store's onRehydrateStorage runs.
        const s = useIdentityStore.getState();
        if (s.created && typeof s.runsStarted !== 'number') {
            useIdentityStore.setState({ runsStarted: 1 } as never);
        } else if (typeof s.runsStarted !== 'number') {
            useIdentityStore.setState({ runsStarted: 0 } as never);
        }
    };

    it('credits somebody who already has an identity with the run they had', () => {
        rehydrate({ created: true, firstName: 'Salih' });
        expect(useIdentityStore.getState().runsStarted).toBe(1);
        expect(hasSeenTheOpening()).toBe(true);
    });

    it('and does not credit a player who has never been created', () => {
        // Genuinely their first launch. They have nothing to skip.
        rehydrate({ created: false });
        expect(useIdentityStore.getState().runsStarted).toBe(0);
        expect(hasSeenTheOpening()).toBe(false);
    });

    it('and the store itself carries that migration, not just this test', () => {
        // The rule above re-runs the logic; this one checks it is in the file
        // that will actually run it. Written after a fix that lived only in a
        // test helper would have passed everything and shipped nothing.
        const fs = require('fs');
        const path = require('path');
        const src = fs.readFileSync(
            path.join(__dirname, 'store', 'useIdentityStore.ts'), 'utf8',
        );
        expect(src).toMatch(/state\.created && typeof state\.runsStarted !== 'number'/);
        expect(src).toMatch(/state\.runsStarted = 1;/);
    });
});
