// src/core/newGamePrompt.ts
//
// ============================================================================
//  THE ONE QUESTION A RETURNING PLAYER IS ASKED
// ============================================================================
//
//  There are two ways into a new game - the Settings screen and the game-over
//  card on Home - and the question has to be the same from both, or the answer
//  depends on where the player happened to be standing when they decided to
//  start again.
//
//  A FIRST-TIME PLAYER IS NOT ASKED. They have nothing to skip, and offering to
//  skip a story they have never seen is offering to skip the game.
// ============================================================================

import { Alert } from 'react-native';

import { useIdentityStore } from './store/useIdentityStore';
import { startNewGame, type NewGameOptions } from './newGame';

/**
 * Start a new game, asking first whether the opening act should be played.
 *
 * Resolves once the run is set up, or `false` if the player backed out - which
 * only happens from the box, since a caller that has already confirmed the
 * destructive step does not get a second chance to cancel here.
 */
export const startNewGameAsking = (): Promise<boolean> =>
    new Promise(resolve => {
        const go = async (options: NewGameOptions) => {
            await startNewGame(options);
            resolve(true);
        };

        if (!useIdentityStore.getState().tutorialCompleted) {
            void go({});
            return;
        }

        Alert.alert(
            'The first year',
            'You have played the opening before — your father, the phone call, '
            + 'the letter that followed it.\n\nPlay it again, or start with all '
            + 'of that already behind you?',
            [
                { text: 'Play it again', onPress: () => void go({}) },
                { text: 'Skip it', onPress: () => void go({ skipOpening: true }) },
            ],
            { cancelable: false },
        );
    });
