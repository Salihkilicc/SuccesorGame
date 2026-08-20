// src/core/newGameIdentity.test.ts
//
// ============================================================================
//  WHOSE NAME IS IT
// ============================================================================
//
//  useIdentityStore promises, in its first line, that who you are is not part
//  of a run: the company is wiped and rebuilt, and the person starting it is
//  the same person.
//
//  A succession broke that promise from the other side. It writes the heir's
//  name into `firstName`, which is correct while that run is going, and the
//  store is the one thing a new game does not wipe - so the next run opened as
//  the heir, with a name the player never chose, and was never asked, because
//  `created` was still true.
//
//  Two fields now: `firstName` is who you are PLAYING and `ownFirstName` is
//  who you ARE.
// ============================================================================

import { useIdentityStore, initialIdentityState } from './store/useIdentityStore';
import { verifyNewGame, startNewGame } from './newGame';
import { runSuccession } from './story/runSuccession';
import { useFamilyStore, initialFamilyState } from './store/useFamilyStore';
import { useStatsStore } from './store/useStatsStore';
import {
    useShareholderStore, INITIAL_BOARD_MEMBERS,
} from '../features/shareholders/stores/useShareholderStore';
import { useStoryStore } from './store/useStoryStore';

beforeEach(() => {
    useIdentityStore.setState({ ...initialIdentityState, _hasHydrated: true });
});

describe('the name you typed', () => {
    it('is recorded when you type it', () => {
        useIdentityStore.getState().setIdentity({
            firstName: 'Gerald', lastName: 'Hale', gender: 'male',
        });
        const s = useIdentityStore.getState();
        expect(s.firstName).toBe('Gerald');
        expect(s.ownFirstName).toBe('Gerald');
    });

    it('and a succession changes what you are called, not who you are', () => {
        useIdentityStore.getState().setIdentity({
            firstName: 'Gerald', lastName: 'Hale', gender: 'male',
        });
        useStoryStore.setState({ ending: 'diedInOffice', flags: {}, seenScenes: [] } as never);
        useStatsStore.setState({ money: 1_000_000, companyValue: 1e9 } as never);
        useShareholderStore.setState({ playerShareCount: 6_500_000, members: [] } as never);
        useFamilyStore.setState({
            ...initialFamilyState,
            _hasHydrated: true,
            children: [{ id: 'a', name: 'Elena Hale', age: 30, gender: 'Female', stats: {} }],
            designatedSuccessorId: 'a',
        } as never);

        runSuccession();

        const s = useIdentityStore.getState();
        expect(s.firstName).toBe('Elena');
        // The promise at the top of useIdentityStore, kept.
        expect(s.ownFirstName).toBe('Gerald');
    });
});

describe('and a new game', () => {
    it('gives it back', async () => {
        // The bug: the next run opened as the heir, and the player was never
        // asked, because `created` was still true.
        useIdentityStore.setState({
            firstName: 'Elena', ownFirstName: 'Gerald', lastName: 'Hale', created: true,
        } as never);

        await startNewGame();

        const s = useIdentityStore.getState();
        expect(s.firstName).toBe('Gerald');
        // And the rest of the promise: a new game does not send a returning
        // player back through onboarding.
        expect(s.created).toBe(true);
        expect(s.lastName).toBe('Hale');
    });

    it('and it takes the heir\'s siblings off the board with it', async () => {
        // Reported: after dying as the heir, New Game carried on with the
        // brothers still sitting as directors. A new game that keeps the last
        // family's shareholders is not a new game.
        useShareholderStore.setState({
            members: [
                { id: 'DIR_HEIR_b', name: 'Marcus Hale', shareCount: 900_000,
                  trait: 'Conservative', trust: 40, isHostile: false, origin: 'Founder' },
            ],
            playerShareCount: 100,
        } as never);

        await startNewGame();

        const members = useShareholderStore.getState().members;
        expect(members.some(m => m.id.startsWith('DIR_HEIR_'))).toBe(false);
        expect(members.some(m => m.name === 'Marcus Hale')).toBe(false);
        expect(members).toHaveLength(INITIAL_BOARD_MEMBERS.length);
    });

    it('and the generation counter starts again at the founder', async () => {
        useFamilyStore.setState({ generation: 4 } as never);
        await startNewGame();
        expect(useFamilyStore.getState().generation).toBe(1);
    });

    it('and the audit finds nothing carried over', async () => {
        await startNewGame();
        expect(verifyNewGame()).toEqual([]);
    });
});
