// src/core/newGame.test.ts
//
// ============================================================================
//  THE AUDIT HAD TO AGREE WITH THE GAME, AND IT DID NOT
// ============================================================================
//
//  verifyNewGame() exists to catch a store that forgot to reset - a silent
//  bug where the game opens, runs, and only the numbers are wrong. In a dev
//  build it interrupts with an alert, on the reasoning that a console warning
//  is easy to miss.
//
//  It held its own copy of the expected values as literals, and one of them
//  drifted: `employeeCount` and `targetHeadcount` were compared against 20
//  while START_EMPLOYEES has been 22. So the alert fired on EVERY new game,
//  for two fields, always, and always wrongly.
//
//  Which is worse than having no check at all. An alarm that always fires is
//  an alarm people learn to dismiss, and the day something really did survive
//  a reset it would have arrived in the same box they had been dismissing for
//  weeks.
//
//  A check must not keep a second copy of the fact it is checking. That is
//  precisely the failure mode this file was written to catch, and it was
//  inside the file.
// ============================================================================

import { verifyNewGame, startNewGame } from './newGame';
import { useStatsStore, initialStatsState, START_EMPLOYEES } from './store/useStatsStore';
import { useGameStore, initialGameState } from './store/useGameStore';
import { useShareholderStore, INITIAL_BOARD_MEMBERS } from '../features/shareholders/stores/useShareholderStore';

const asPlayed = () => {
    // Reset to the opening state the way the game does, then verify. The
    // board is SEATED rather than emptied, because that is what
    // resetInMemoryStores does - initializeGame() puts the four directors
    // back, and an audit run against an unseated board would report a
    // problem the player could never have.
    useStatsStore.setState({ ...initialStatsState });
    useGameStore.setState({ ...initialGameState });
    useShareholderStore.getState().initializeGame();
};

describe('the new-game audit', () => {
    it('passes on a game that has just been reset', () => {
        // If this fails, either a store really did keep something or the
        // audit has drifted from the game again. The message names the field.
        asPlayed();
        expect(verifyNewGame()).toEqual([]);
    });

    it('reads the headcount from the store rather than remembering it', () => {
        // The literal that broke it. This asserts the two agree, so moving
        // START_EMPLOYEES can never again make the audit cry wolf.
        asPlayed();
        expect(initialStatsState.employeeCount).toBe(START_EMPLOYEES);
        expect(initialStatsState.targetHeadcount).toBe(START_EMPLOYEES);
        expect(verifyNewGame().filter(p => /employeeCount|targetHeadcount/.test(p)))
            .toEqual([]);
    });

    it('reads the board size from the register too', () => {
        asPlayed();
        expect(useShareholderStore.getState().members.length)
            .toBe(INITIAL_BOARD_MEMBERS.length);
        expect(verifyNewGame().filter(p => /memberCount/.test(p))).toEqual([]);
    });

    it('still notices when something genuinely survives', () => {
        // The check has to keep working, or silencing the false alarm has
        // just switched the real one off with it.
        asPlayed();
        useStatsStore.setState({ employeeCount: 91 } as never);
        const problems = verifyNewGame();
        expect(problems.some(p => p.includes('employeeCount'))).toBe(true);
        asPlayed();
    });

    it('and notices a stale quarter on the game store', () => {
        asPlayed();
        useGameStore.setState({ currentMonth: 34 } as never);
        expect(verifyNewGame().some(p => p.includes('currentMonth'))).toBe(true);
        asPlayed();
    });
});

// ============================================================================
//  A SECOND RUN IS NOT THE FIRST ONE AGAIN
// ============================================================================
//  Somebody who has finished this game will start it again, and the opening
//  act is a fixed year of the same writing: the father explains the company,
//  teaches four lessons, dies. It is the best material in the game and it is
//  the same material every time.
//
//  Both of these hang off useIdentityStore, which a new game deliberately does
//  not wipe - who you are is not part of a run. See the note at the top of
//  that file.
// ============================================================================

import { OPENING_ACT } from '../data/story/openingAct';
import { FLOOR_HINT_IDS } from '../data/story/floorHints';

describe('starting again, having been through it once', () => {
    const player = () => require('./store/useIdentityStore').useIdentityStore;
    const story = () => require('./store/useStoryStore').useStoryStore;
    const messages = () => require('./store/useMessageStore').useMessageStore;

    const returning = (completed: boolean) =>
        player().setState({ tutorialCompleted: completed, created: true });

    it('does not teach a player who has already been taught', async () => {
        // It used to, with a "Skip the whole tutorial" button on it - a dimmed
        // screen, a card and a tap to reach the state they were always going
        // to choose.
        returning(true);
        await startNewGame();
        expect(story().getState().locks.disabled).toBe(true);
    });

    it('and you are yourself again, face as well as name', async () => {
        // ------------------------------------------------------------------
        //  THE FACE HAD THE SAME BUG THE NAME ALREADY HAD
        // ------------------------------------------------------------------
        //  A succession writes the heir's first name into identity, and this
        //  store survives a new game on purpose, so the next run used to open
        //  as Elena. That was found and fixed with `ownFirstName`.
        //
        //  `ceoId` is the same field one along: it names the child who took
        //  the chair, and left behind it would open a brand new game with the
        //  previous run's grandchild looking out of the profile header.
        //
        //  Written because the clearing code passed with nothing testing it:
        //  probed by deleting the whole block from newGame and all 43 tests
        //  here stayed green.
        // ------------------------------------------------------------------
        returning(true);
        player().setState({
            firstName: 'Elena', ownFirstName: 'Salih', ceoId: 'child-elena',
        });
        await startNewGame();
        expect(player().getState().firstName).toBe('Salih');
        expect(player().getState().ceoId).toBeUndefined();
    });

    it('but still teaches a first-time player', async () => {
        returning(false);
        await startNewGame();
        expect(story().getState().locks.disabled).toBe(false);
    });

    it('and plays the opening act unless asked not to', async () => {
        returning(true);
        await startNewGame();
        expect(story().getState().seenScenes).toEqual([]);
        expect(story().getState().flags.fatherDead).toBeUndefined();
    });

    it('while skipping it puts the whole year behind them', async () => {
        returning(true);
        await startNewGame({ skipOpening: true });
        const seen = story().getState().seenScenes;
        for (const id of OPENING_ACT) expect(seen).toContain(id);
    });

    it('with the father dead, because that is the one fact the rest reads', async () => {
        returning(true);
        await startNewGame({ skipOpening: true });
        expect(story().getState().flags.fatherDead).toBe(true);
        // And NOT the Pear answer, which is a choice the player did not make.
        expect(story().getState().flags.refusedPear).toBeUndefined();
        expect(story().getState().flags.refusedPearPublicly).toBeUndefined();
    });

    it('and no dead man at the top of the messages list', async () => {
        returning(true);
        messages().setState({
            threads: [{
                id: 'father', name: 'Your Father', role: 'Chairman',
                initials: 'YF', unread: 1, messages: [],
            }],
        });
        await startNewGame({ skipOpening: true });
        expect(messages().getState().threads.some((t: any) => t.id === 'father')).toBe(false);
    });

    it('and the skip happens AFTER the wipe, not before it', async () => {
        // The whole correctness argument for `applyReturningPlayer` being a
        // separate step. Written before the reset, every line of it would be
        // deleted by the reset - and the symptom would be "skip does nothing",
        // one screen away from where the bug is.
        returning(true);
        await startNewGame({ skipOpening: true });
        // The act AND the seven floor hints. Two lists rather than one,
        // because they are silenced for different reasons - see the note in
        // applyReturningPlayer. The count is asserted rather than the
        // contents so this fails if either list stops being applied.
        expect(story().getState().seenScenes.length)
            .toBe(OPENING_ACT.length + FLOOR_HINT_IDS.length);
        for (const id of FLOOR_HINT_IDS) {
            expect(story().getState().seenScenes).toContain(id);
        }
    });

    it('and seedOpening does not message when opening was skipped', async () => {
        returning(true);
        await startNewGame({ skipOpening: true });
        require('./story/deliver').seedOpening();
        expect(messages().getState().threads.some((t: any) => t.id === 'father')).toBe(false);
        expect(story().getState().pending.length).toBe(0);
    });
});
