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

import { verifyNewGame } from './newGame';
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
