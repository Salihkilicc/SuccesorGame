// src/core/newGamePrompt.ts
//
// ============================================================================
//  THE ONE QUESTION A RETURNING PLAYER IS ASKED
// ============================================================================
//
//  There are two ways into a new game - the Settings screen and the game over
//  card on Home - and the question has to be the same from both, or the answer
//  depends on where the player happened to be standing when they decided to
//  start again.
//
//  A FIRST-TIME PLAYER IS NOT ASKED. They have nothing to skip, and offering to
//  skip a story they have never seen is offering to skip the game.
//
// ---------------------------------------------------------------------------
//  IT WAS ASKING A QUESTION NOBODY COULD REACH
// ---------------------------------------------------------------------------
//  The gate was `tutorialCompleted`, which turns true only when EVERY lock in
//  TUTORIAL_SEQUENCE is cleared. Six of them: two need the player to open the
//  research page, three only engage while the father is alive, and one of
//  those also needs morale to fall below a threshold inside that window.
//
//  A run where the team stayed happy could never complete it. Neither could a
//  run that never opened research. So for most players the flag was false
//  forever and the question never appeared on any new game - reported as the
//  feature having gone, and it had.
//
//  The gate is `openingSeen` now, which is one beat rather than a conjunction
//  of six: the opening act is over when the father is dead. See the note on it
//  in useIdentityStore.
//
// ---------------------------------------------------------------------------
//  AND IT IS NOT AN ALERT ANY MORE
// ---------------------------------------------------------------------------
//  `Alert.alert` cannot be styled, so the one question this game asks between
//  runs arrived as a white iOS sheet in the middle of a dark game. That is the
//  exact complaint ConfirmPanel was built to answer, and there were 61 of
//  these once - see components/common/ConfirmPanel.tsx.
//
//  Which leaves a problem: this is a plain async function, callable from a
//  logic hook, and a themed dialog is a component. So the question is held in
//  a tiny store, and ONE mounted component renders it. The function still
//  returns a promise and still resolves when the run is set up, so neither
//  caller had to change and neither can drift from the other.
// ============================================================================

import { create } from 'zustand';

import { useIdentityStore } from './store/useIdentityStore';
import { startNewGame, type NewGameOptions } from './newGame';

export type NewGameAnswer = 'play' | 'skip';

type QuestionState = {
    /** Whether the question is on screen. */
    asking: boolean;
    /**
     * How to answer it.
     *
     * Null while nothing is being asked. Held here rather than passed down so
     * the dialog does not need to know who raised the question.
     */
    answer: ((choice: NewGameAnswer) => void) | null;
};

export const useNewGameQuestion = create<QuestionState & {
    ask: (answer: (choice: NewGameAnswer) => void) => void;
    clear: () => void;
}>()((set) => ({
    asking: false,
    answer: null,
    ask: (answer) => set({ asking: true, answer }),
    clear: () => set({ asking: false, answer: null }),
}));

/**
 * Start a new game, asking first whether the opening act should be played.
 *
 * Resolves once the run is set up. It does not resolve false any more: the
 * question has no cancel, because both callers have already confirmed the
 * destructive step by the time they get here and a second escape hatch on a
 * decision that is only about pacing is a door to nowhere.
 */
export const startNewGameAsking = (): Promise<boolean> =>
    new Promise(resolve => {
        const go = async (options: NewGameOptions) => {
            await startNewGame(options);
            resolve(true);
        };

        if (!useIdentityStore.getState().openingSeen) {
            void go({});
            return;
        }

        useNewGameQuestion.getState().ask((choice) => {
            useNewGameQuestion.getState().clear();
            void go(choice === 'skip' ? { skipOpening: true } : {});
        });
    });
