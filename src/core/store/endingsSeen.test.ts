// src/core/store/endingsSeen.test.ts
//
// ============================================================================
//  THE ONE THING ON THE CLOSING SCREEN THAT OUTLIVES THE RUN
// ============================================================================
//
//  "2 of 3 endings found" is the reason to press New Game, and it is only a
//  reason if it is still 2 afterwards. Which means `endingsSeen` has to sit in
//  the store that a new game does NOT wipe, next to the player's name and
//  whether they have been taught, and not in the story store with the flags
//  and the dials that describe one company.
//
//  That is a one-word decision at the top of a file and it is invisible once
//  made: putting it in the story store would work perfectly, right up to the
//  moment somebody starts their second run and the counter says zero.
// ============================================================================

import { useIdentityStore, initialIdentityState } from './useIdentityStore';
import { PERSIST_KEYS } from '../newGame';

beforeEach(() => {
    useIdentityStore.setState({ ...initialIdentityState, _hasHydrated: true });
});

describe('where it is kept', () => {
    it('is a store a new game does not touch', () => {
        // The whole argument, as an assertion. useIdentityStore's key is
        // deliberately absent from the wipe list - see the note at the top of
        // that file - and this is what would catch somebody adding it.
        expect(PERSIST_KEYS).not.toContain('succesor_identity_v1');
    });

    it('and it starts empty', () => {
        expect(useIdentityStore.getState().endingsSeen).toEqual([]);
    });
});

describe('recording one', () => {
    it('remembers it', () => {
        useIdentityStore.getState().markEndingSeen('wentBankrupt');
        expect(useIdentityStore.getState().endingsSeen).toEqual(['wentBankrupt']);
    });

    it('and reaching the same ending twice is still one', () => {
        // Bankruptcy is the ending most players will reach, and several of
        // them will reach it repeatedly. "4 of 3 endings found" is the bug.
        useIdentityStore.getState().markEndingSeen('wentBankrupt');
        useIdentityStore.getState().markEndingSeen('wentBankrupt');
        expect(useIdentityStore.getState().endingsSeen).toEqual(['wentBankrupt']);
    });

    it('and a second one is added rather than replacing the first', () => {
        useIdentityStore.getState().markEndingSeen('wentBankrupt');
        useIdentityStore.getState().markEndingSeen('soldToPear');
        expect(useIdentityStore.getState().endingsSeen)
            .toEqual(['wentBankrupt', 'soldToPear']);
    });

    it('and none of it disturbs who the player is', () => {
        useIdentityStore.setState({ firstName: 'Ada', tutorialCompleted: true });
        useIdentityStore.getState().markEndingSeen('soldToPear');
        expect(useIdentityStore.getState().firstName).toBe('Ada');
        expect(useIdentityStore.getState().tutorialCompleted).toBe(true);
    });
});
