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
    it('is a plain fact rather than a chain of inference', () => {
        // ----------------------------------------------------------------
        //  THIRD GATE, AND THE FIRST ONE WITHOUT A CHAIN
        // ----------------------------------------------------------------
        //  tutorialCompleted needed six locks. openingSeen needed a flag that
        //  could only be earned forwards. Both looked right and both shipped
        //  shut, because each was an inference standing in for the fact the
        //  question was asked about: is this a restart.
        //
        //  A counter has no chain. It is incremented in one place and it is
        //  persisted outside the wipe.
        // ----------------------------------------------------------------
        const src = code('newGamePrompt.ts');
        expect(src).toMatch(/if \(\(identity\.runsStarted \|\| 0\) >= 1\) return true;/);
        expect(src).toMatch(/if \(identity\.openingSeen\) return true;/);
        expect(src).not.toMatch(/tutorialCompleted/);
    });

    it('and the counter is incremented where a run actually begins', () => {
        const newGame = code('newGame.ts');
        expect(newGame).toMatch(/countRunStarted\(\)/);
        // Before the wipe, not after - the identity store is not wiped, but
        // counting after a teardown is a habit that breaks the day it is.
        const countAt = newGame.indexOf('countRunStarted()');
        const wipeAt = newGame.indexOf('resetInMemoryStores()');
        expect(countAt).toBeGreaterThan(-1);
        expect(wipeAt).toBeGreaterThan(countAt);
    });

    it('and it survives a new game, like the name and the endings do', () => {
        const identity = code('store/useIdentityStore.ts');
        expect(identity).toMatch(/runsStarted: number;/);
        expect(identity).toMatch(/runsStarted: state\.runsStarted,/);
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
        // the game. Behaviourally pinned in openingSeen.test.ts; this is the
        // one door it has to come through.
        const src = code('newGamePrompt.ts');
        expect(src).toMatch(/if \(!hasSeenTheOpening\(\)\)/);
    });

    it('and when it says no, it says why', () => {
        // Two gates shipped shut and neither could be diagnosed from the
        // outside. The next one at least names its own reason.
        const src = code('newGamePrompt.ts');
        expect(src).toMatch(/not offering the skip/);
        expect(src).toMatch(/runsStarted=/);
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


// ============================================================================
//  AND THE WARNING THE PLAYER WAS ACTUALLY SEEING
// ============================================================================
//
//  The skip question became a themed panel, and the report came back saying it
//  still looked like a warning. It did. Settings raised its OWN Alert.alert
//  first - "All progress will be erased and a fresh run will be set up. Are
//  you sure?" - and the themed one only appeared after that was answered.
//
//  Two dialogs in one flow, and the white iOS sheet went first. Theming one
//  half of a sequence is not theming the sequence.
// ============================================================================

describe('the destructive step', () => {
    it('is asked by the same mounted component as the pacing one', () => {
        // ------------------------------------------------------------------
        //  THREE PANELS NOW, AND THE COUNT IS STILL THE POINT
        // ------------------------------------------------------------------
        //  It asserted exactly two, which was the whole guarantee: one
        //  component owns every question in this flow, so a second dialog
        //  cannot appear from somewhere else and arrive first. A third
        //  question joined them - "Change your character", which warns about
        //  the run AND about being asked who you are - and it lives here for
        //  the same reason the other two do.
        //
        //  Still an exact count rather than "at least": the number going up
        //  should be a decision somebody makes on purpose and writes down,
        //  which is what this line makes it.
        // ------------------------------------------------------------------
        const dialog = code('../components/story/NewGameQuestion.tsx');
        expect(dialog).toMatch(/mode === 'erase'/);
        expect(dialog).toMatch(/mode === 'newCharacter'/);
        expect(dialog).toMatch(/tone="danger"/);
        expect((dialog.match(/<ConfirmPanel/g) ?? []).length).toBe(3);
    });

    it('and the character question warns about more than the erase one does', () => {
        // Its own copy, not the erase panel relabelled. The erase warning
        // says the run goes; this one has to say the run goes and that the
        // player is about to be asked their name, gender and company.
        const dialog = code('../components/story/NewGameQuestion.tsx');
        expect(dialog).toMatch(/newGame\.characterTitle/);
        expect(dialog).not.toMatch(/mode === 'newCharacter'[\s\S]{0,400}newGame\.eraseTitle/);
    });

    it('and settings no longer raises its own alert for it', () => {
        const settings = code('../features/os/logic/useSettingsLogic.ts');
        expect(settings).toMatch(/confirmNewGame\(\)/);
        expect(settings).not.toMatch(/Alert\.alert\(\s*'New Game'/);
        expect(settings).not.toMatch(/Alert\.alert\(\s*t\('newgame\.title'\)/);
        // ------------------------------------------------------------------
        //  Alert is still right for an unexpected failure, and that one stays.
        // ------------------------------------------------------------------
        //  This used to look for the literal `Alert.alert('Error'`, which is
        //  the same mistake the untranslated sweep was making: it pinned the
        //  ENGLISH rather than the behaviour. The moment the failure alert was
        //  translated, a test about which dialogs Settings raises started
        //  failing over a word.
        //
        //  The claim is that Settings still warns when starting over fails. It
        //  is a translated string now, so the key is what to look for.
        // ------------------------------------------------------------------
        expect(settings).toMatch(/Alert\.alert\(t\('ui\.error'\), t\('newgame\.couldNotStart'\)\)/);
    });

    it('and a cancel stops before anything is torn down', () => {
        // The order is the whole point: ask, then erase. A confirm that runs
        // after the reset is a confirmation of nothing.
        const settings = code('../features/os/logic/useSettingsLogic.ts');
        const body = settings.slice(settings.indexOf('handleNewGame'));
        const askAt = body.indexOf('confirmNewGame()');
        const goAt = body.indexOf('startNewGameAsking()');
        expect(askAt).toBeGreaterThan(-1);
        expect(goAt).toBeGreaterThan(askAt);
        expect(body).toMatch(/if \(!\(await confirmNewGame\(\)\)\) return;/);
    });

    it('and the game over card does NOT ask it', () => {
        // Confirming that progress will be erased is noise when the run is
        // already over. Deliberate, and worth pinning so a later tidy does not
        // "make them consistent".
        //
        // ------------------------------------------------------------------
        //  THE CALL SITE, NOT THE FILE
        // ------------------------------------------------------------------
        //  This said `expect(home).not.toMatch(/confirmNewGame/)`, which was
        //  true for the wrong reason: HomeScreen has TWO ways to start over,
        //  and the other one - New Game in the drawer, pressed while a run is
        //  alive - was raising its own Alert.alert with a destructive button.
        //  So the file did not mention the themed confirm, and the assertion
        //  read that as the game over card being right rather than as the
        //  drawer being wrong.
        //
        //  A file-wide `not.toMatch` cannot tell two call sites apart. These
        //  look at the handlers.
        // ------------------------------------------------------------------
        const home = code('../screens/Home/HomeScreen.tsx');
        expect(home).toMatch(/startNewGameAsking\(\)/);

        // The ending overlay goes straight there, with nothing in between.
        // (The old game over card had its own button and is shelved in a
        // comment, which `code()` strips - so only the live door counts.)
        expect(home).toMatch(/onNewGame=\{handleRestart\}/);

        // And the drawer, which erases a LIVE save, confirms first.
        expect(home).toMatch(/if \(await confirmNewGame\(\)\) await handleRestart\(\);/);

        // Whichever door, the raw system dialog is gone: `style:
        // 'destructive'` is an iOS word that Android never reads, so that
        // warning had two identical grey buttons on the device it was
        // reported from.
        expect(home).not.toMatch(/newgame\.eraseWarning/);
    });

    it('and its words exist in both catalogues, with no dashes', () => {
        const keys = [
            'newGame.eraseTitle', 'newGame.eraseSummary', 'newGame.eraseNote',
            'newGame.eraseConfirm', 'newGame.eraseCancel',
        ];
        for (const key of keys) {
            for (const catalogue of [en, tr] as Record<string, string>[]) {
                expect(catalogue[key]).toBeTruthy();
                expect(catalogue[key]).not.toMatch(/—/);
                expect(catalogue[key]).not.toMatch(/\s-\s/);
            }
        }
    });
});


// ============================================================================
//  AND A FLAG THAT COULD ONLY BE EARNED GOING FORWARD
// ============================================================================
//
//  The gate moved off six tutorial locks and onto one beat: `openingSeen`,
//  written when `fatherDead` is raised. Correct for every run started after
//  that code existed, and useless for every run started before it - the death
//  had already happened, so the flag was never written, and the question never
//  appeared for exactly the people who wanted it.
//
//  Reported as the skip system still not being asked about. It had been fixed
//  once and the fix could not see backwards.
// ============================================================================

describe('a run that already passed the funeral', () => {
    const src = () => code('newGamePrompt.ts');

    it('is recognised from the story it is standing in', () => {
        const s = src();
        expect(s).toMatch(/story\.flags\?\.fatherDead/);
        expect(s).toMatch(/includes\('father-death'\)/);
        expect(s).toMatch(/OPENING_ACT\.every/);
    });

    it('and is read BEFORE the store that holds it is torn down', () => {
        // `startNewGame` resets the story store. Reading after it would find
        // an empty one every time, which is the same bug with more steps.
        const s = src();
        const gateAt = s.indexOf('if (!hasSeenTheOpening())');
        const resetAt = s.indexOf('await startNewGame(options)');
        expect(gateAt).toBeGreaterThan(-1);
        expect(resetAt).toBeGreaterThan(-1);
        // The gate is evaluated inside the promise body, the reset only inside
        // `go`, which the gate decides whether to call.
        expect(s.slice(gateAt)).toMatch(/void go\(\{\}\);/);
    });

    it('and having been read once, it is written down', () => {
        // So the next run reads one field instead of three, and so a player
        // who skips the act still counts as having seen it.
        expect(src()).toMatch(/markOpeningSeen\(\)/);
    });

    it('and the reader cannot throw on a screen', () => {
        // It is called from the settings screen and from the game over card.
        // A store that has not hydrated is not a reason to crash a menu.
        const s = src();
        const fn = s.slice(s.indexOf('export const hasSeenTheOpening'));
        expect(fn).toMatch(/try \{/);
        expect(fn).toMatch(/catch \(e\)/);
        expect(fn).toMatch(/return false;/);
    });

    it('and the forward path still works, so both halves are live', () => {
        // The backfill does not replace the flag being written when the death
        // actually happens - that is still the cheap path.
        const story = code('store/useStoryStore.ts');
        expect(story).toMatch(/if \(flag === 'fatherDead'\)/);
        expect(story).toMatch(/markOpeningSeen\(\)/);
    });
});
