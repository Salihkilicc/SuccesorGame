// src/core/newGamePrompt.test.ts
//
// ============================================================================
//  THE QUESTION NOBODY COULD REACH
// ============================================================================
//
//  "Play the first year again, or start past it" is the only question this game
//  asks between runs, and it stopped appearing. Reported as the feature having
//  gone.
//
//  It had not gone. It was gated on `tutorialCompleted`, which turns true only
//  when EVERY lock in TUTORIAL_SEQUENCE is cleared, and the sequence is six
//  locks with three different kinds of gate on them:
//
//      rnd-lab, rnd-hire     need the player to open the research page
//      q1-open-product       only engages while the father is alive
//      q1-marketing          alive, and capital of at least 500,000
//      morale-bonus          alive, capital, AND morale below a threshold
//
//  A run where the team stayed happy through the first year cannot clear
//  `morale-bonus`. A run that never opened research cannot clear the first two.
//  So for most players the flag was false forever and the question never came.
//
//  ---------------------------------------------------------------------------
//  THE SHAPE OF THE MISTAKE
//  ---------------------------------------------------------------------------
//  A conjunction of six optional things standing in for one fact. The fact the
//  question actually needs is "has this player watched the opening end", and
//  that has a single beat: the father dies. Everything else in the game already
//  gates on it.
//
//  This file tests both halves - that the gate is reachable, and that the thing
//  it is now gated on is recorded when it happens.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { TUTORIAL_SEQUENCE } from '../data/tutorial/sequence';
import { isComplete, emptyLockState } from './tutorial/locks';
import { en } from './i18n/en';
import { tr } from './i18n/tr';

const read = (p: string) => fs.readFileSync(path.join(__dirname, p), 'utf8');

const code = (p: string) =>
    read(p)
        .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

describe('the old gate', () => {
    it('needed every tutorial lock, including ones a run may never engage', () => {
        // The measurement, not the accusation. Three of the six are gated on
        // the father being alive and one of those also on morale falling.
        const gated = TUTORIAL_SEQUENCE.filter(l =>
            (l.canEngage ?? []).some(c =>
                c.kind === 'flag' || c.kind === 'noFlag' || c.kind === 'moraleAtMost',
            ),
        );
        expect(TUTORIAL_SEQUENCE.length).toBeGreaterThan(0);
        expect(gated.length).toBe(TUTORIAL_SEQUENCE.length);
    });

    it('and a player who cleared most of them still had none of it', () => {
        // Five of six is not five sixths of a question. It is no question.
        const nearly = {
            ...emptyLockState(),
            completed: TUTORIAL_SEQUENCE.slice(0, -1).map(l => l.id),
        };
        expect(isComplete(TUTORIAL_SEQUENCE, nearly)).toBe(false);
    });
});

describe('the gate now', () => {
    it('is a single beat that every run reaches', () => {
        const src = code('newGamePrompt.ts');
        expect(src).toMatch(/useIdentityStore\.getState\(\)\.openingSeen/);
        expect(src).not.toMatch(/tutorialCompleted/);
    });

    it('and that beat is recorded where a new game cannot erase it', () => {
        // The identity store is deliberately absent from newGame's reset list,
        // which is what lets a name and an ending survive a run. The same
        // reasoning applies to what you have watched.
        const identity = code('store/useIdentityStore.ts');
        expect(identity).toMatch(/openingSeen: boolean/);
        expect(identity).toMatch(/markOpeningSeen: \(\) => set\(\{ openingSeen: true \}\)/);
        // Persisted, or it lasts until the app closes.
        expect(identity).toMatch(/openingSeen: state\.openingSeen/);

        const newGame = code('newGame.ts');
        expect(newGame).not.toMatch(/useIdentityStore\.getState\(\)\.reset\(\)/);
    });

    it('and it is recorded from the one place that raises the flag', () => {
        // Every story effect goes through `gameSink.flag`, which calls
        // `raise`. Hooking anywhere else would catch some deaths and not
        // others.
        const story = code('store/useStoryStore.ts');
        expect(story).toMatch(/if \(flag === 'fatherDead'\)/);
        expect(story).toMatch(/markOpeningSeen\(\)/);

        const sink = code('story/gameSink.ts');
        expect(sink).toMatch(/flag: \(flag\) => useStoryStore\.getState\(\)\.raise\(flag\)/);
    });

    it('and a first time player is still not asked', () => {
        // Offering to skip a story they have never seen is offering to skip
        // the game.
        const src = code('newGamePrompt.ts');
        expect(src).toMatch(/if \(!useIdentityStore\.getState\(\)\.openingSeen\)/);
    });
});

describe('the question itself', () => {
    it('is a themed panel rather than a system alert', () => {
        const src = code('newGamePrompt.ts');
        expect(src).not.toMatch(/Alert\.alert/);
        expect(src).not.toMatch(/from 'react-native'/);

        const dialog = code('../components/story/NewGameQuestion.tsx');
        expect(dialog).toMatch(/<ConfirmPanel/);
        expect(dialog).toMatch(/choices=\{\[/);
    });

    it('and it is mounted once, above the navigator', () => {
        // Both screens that can start a new game are torn down by starting
        // one, so a dialog owned by either would unmount while waiting for its
        // own answer.
        const nav = code('../navigation/RootNavigator.tsx');
        expect(nav).toMatch(/<NewGameQuestion \/>/);
        expect((nav.match(/<NewGameQuestion \/>/g) ?? []).length).toBe(1);
    });

    it('and both doors into a new game still ask the same one', () => {
        // The property the original file was written to protect.
        const settings = code('../features/os/logic/useSettingsLogic.ts');
        const home = code('../screens/Home/HomeScreen.tsx');
        expect(settings).toMatch(/startNewGameAsking\(\)/);
        expect(home).toMatch(/startNewGameAsking\(\)/);
        // And neither reaches past it to the unasked version.
        expect(settings).not.toMatch(/startNewGame\(/);
        expect(home).not.toMatch(/[^g]startNewGame\(/);
    });

    it('and its words exist in both catalogues, with no dashes', () => {
        const keys = [
            'newGame.title', 'newGame.summary',
            'newGame.play', 'newGame.playWhy',
            'newGame.skip', 'newGame.skipWhy',
        ];
        for (const key of keys) {
            for (const catalogue of [en, tr] as Record<string, string>[]) {
                expect(catalogue[key]).toBeTruthy();
                expect(catalogue[key]).not.toMatch(/—/);
                expect(catalogue[key]).not.toMatch(/\s-\s/);
            }
        }
    });

    it('and it cannot be dismissed into a half torn down save', () => {
        // The old Alert said `cancelable: false`. The backdrop still has to do
        // something, so it answers "play" - the choice a player who has not
        // decided anything would want.
        const dialog = code('../components/story/NewGameQuestion.tsx');
        expect(dialog).toMatch(/onCancel=\{\(\) => answer\('play'\)\}/);
    });
});
