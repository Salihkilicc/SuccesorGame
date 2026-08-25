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

/**
 * The destructive step, asked before anything is torn down.
 *
 * ---------------------------------------------------------------------------
 *  IT WAS THE ALERT THE PLAYER WAS ACTUALLY SEEING
 * ---------------------------------------------------------------------------
 *  The skip question became a themed panel and the report came back saying it
 *  still looked like a warning. It did, because Settings raises its OWN
 *  `Alert.alert('New Game', 'All progress will be erased...')` first and the
 *  themed one only appears after it is answered. Two dialogs, one flow, and
 *  the white iOS sheet was the one that arrived first.
 *
 *  It lives here rather than on the settings screen so both steps of starting
 *  a new game are asked by the same mounted component - see
 *  components/story/NewGameQuestion.tsx.
 * ---------------------------------------------------------------------------
 */
export type NewGameConfirm = 'erase' | 'cancel';

type QuestionState = {
    /**
     * Which question is on screen, if any.
     *
     * `skip` is the pacing choice, `erase` is the destructive confirmation.
     * One field rather than two booleans, because two booleans can both be
     * true and this is a sequence.
     */
    mode: null | 'skip' | 'erase';
    /** Whether the question is on screen. */
    asking: boolean;
    /**
     * How to answer it.
     *
     * Null while nothing is being asked. Held here rather than passed down so
     * the dialog does not need to know who raised the question.
     */
    answer: ((choice: NewGameAnswer | NewGameConfirm) => void) | null;
};

export const useNewGameQuestion = create<QuestionState & {
    ask: (answer: (choice: NewGameAnswer) => void) => void;
    askConfirm: (answer: (choice: NewGameConfirm) => void) => void;
    clear: () => void;
}>()((set) => ({
    mode: null,
    asking: false,
    answer: null,
    ask: (answer) => set({ mode: 'skip', asking: true, answer: answer as (c: NewGameAnswer | NewGameConfirm) => void }),
    askConfirm: (answer) => set({ mode: 'erase', asking: true, answer: answer as (c: NewGameAnswer | NewGameConfirm) => void }),
    clear: () => set({ mode: null, asking: false, answer: null }),
}));

/**
 * Ask whether a run may be thrown away, in the game's own dialog.
 *
 * Separate from `startNewGameAsking` on purpose: the game over card does NOT
 * ask this, because confirming that progress will be erased is noise when the
 * run is already over. Only the settings screen has something to warn about.
 */
export const confirmNewGame = (): Promise<boolean> =>
    new Promise(resolve => {
        useNewGameQuestion.getState().askConfirm((choice) => {
            useNewGameQuestion.getState().clear();
            resolve(choice === 'erase');
        });
    });

/**
 * Whether this player has watched the opening act end.
 *
 * ---------------------------------------------------------------------------
 *  A FLAG THAT COULD ONLY BE EARNED GOING FORWARD
 * ---------------------------------------------------------------------------
 *  `openingSeen` is written when `fatherDead` is raised. Correct for every run
 *  started after that code existed, and useless for every run started before
 *  it: the death had already happened, the flag was never written, and so the
 *  question never appeared for exactly the people who wanted it - the ones who
 *  had already sat through the first year.
 *
 *  Reported as the skip system not being asked about, after it had already
 *  been "fixed" once. It had: the gate moved off a conjunction of six tutorial
 *  locks and onto one beat. What it did not do was look at the beat that had
 *  already passed.
 *
 * ---------------------------------------------------------------------------
 *  SO IT ASKS THE RUN, AND THEN REMEMBERS
 * ---------------------------------------------------------------------------
 *  The story store still holds the evidence while the old run is standing:
 *  `fatherDead` is raised, or the opening conversations are in `seenScenes`.
 *  Read here, BEFORE `startNewGame` tears that store down, and written to the
 *  identity store so the next run does not have to look again.
 *
 *  Both signals rather than one, because a run that skipped the act has the
 *  flag and the scenes, and a run that played it has both too - but a save
 *  mid-way through the funeral has only the flag, and that player has still
 *  seen the part the question is about.
 */
export const hasSeenTheOpening = (): boolean => {
    const identity = useIdentityStore.getState();

    // ----------------------------------------------------------------------
    //  THE PLAIN FACT FIRST
    // ----------------------------------------------------------------------
    //  "Yeniden baslayinca sorsun." A run counter answers that with no chain
    //  of inference behind it, and it is why this line is above the others:
    //  the two gates before it were both correct-looking chains with a link
    //  that could be missing, and both shipped shut.
    // ----------------------------------------------------------------------
    if ((identity.runsStarted || 0) >= 1) return true;

    // A run that got past the funeral and then chose New Game, on its first
    // time through. Narrower, and still a yes.
    if (identity.openingSeen) return true;

    try {
        // Lazily, because this module is imported by screens and the story
        // store pulls in half the engine behind it.
        const story = require('./store/useStoryStore').useStoryStore.getState();
        const { OPENING_ACT } = require('../data/story/openingAct');

        const seen = !!story.flags?.fatherDead
            || (story.seenScenes ?? []).includes('father-death')
            || OPENING_ACT.every((id: string) => (story.seenScenes ?? []).includes(id));

        if (seen) {
            // Record it, so the next run reads one field instead of three.
            useIdentityStore.getState().markOpeningSeen();
            return true;
        }

        if (__DEV__) {
            console.log(
                '[newGame] not offering the skip:',
                `runsStarted=${identity.runsStarted ?? 0}`,
                `openingSeen=${identity.openingSeen}`,
                `fatherDead=${!!story.flags?.fatherDead}`,
                `scenes=${(story.seenScenes ?? []).length}`,
            );
        }
    } catch (e) {
        console.warn('[newGame] could not read the story for the opening', e);
    }

    return false;
};

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

        if (!hasSeenTheOpening()) {
            void go({});
            return;
        }

        useNewGameQuestion.getState().ask((choice) => {
            useNewGameQuestion.getState().clear();
            void go(choice === 'skip' ? { skipOpening: true } : {});
        });
    });
