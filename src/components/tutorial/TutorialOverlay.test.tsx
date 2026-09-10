// src/components/tutorial/TutorialOverlay.test.tsx
//
// ============================================================================
//  IS THE TEACHING LAYER ACTUALLY ON
// ============================================================================
//
//  Every other test in this area asks whether the SEQUENCE is well formed:
//  locks.test.ts validates the data, targets.test.ts checks the keys line up,
//  TutorialTarget.test.tsx checks a screen publishes and withdraws its
//  coordinates. All of them passed, all of them were right, and the tutorial
//  did not appear in the game.
//
//  Because the component that draws it began with `return null;`. Somebody
//  shelved the overlay in a bulk commit and left a paragraph explaining that
//  turning it back on was a design decision for later. Nothing failed. The
//  data was correct, the targets were correct, the conditions were correct,
//  and the one component that renders any of it rendered nothing - the house
//  signature: correct data that nothing reads.
//
//  So this file tests the LAST STEP, the one no other test covered: given a
//  lock that should be up and a control that has published its position, is
//  there anything on the screen.
//
//  Reported three times before it was found: "bu oyunda tutorial mesajlari
//  gelmedi", "arge ogreticisi hala calismiyor", "oyuna yeniden basliyorum
//  play diyorum tutoriali ve giriyorum calismiyor".
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';

import TutorialOverlay from './TutorialOverlay';
import { useTutorialTargets } from './targets';
import { useStoryStore } from '../../core/store/useStoryStore';
import { useIdentityStore } from '../../core/store/useIdentityStore';
import { useStatsStore } from '../../core/store/useStatsStore';
import { TUTORIAL_SEQUENCE } from '../../data/tutorial/sequence';
import { emptyLockState } from '../../core/tutorial/locks';
import { line, lockKey } from '../../data/i18n/storyText';
import { castNow } from '../../core/story/castNow';

jest.mock('@react-navigation/native', () => ({ useIsFocused: () => true }));

const RECT = { x: 40, y: 500, width: 200, height: 60 };

const lockNamed = (id: string) => {
    const found = TUTORIAL_SEQUENCE.find(l => l.id === id);
    if (!found) throw new Error(`no lock ${id}`);
    return found;
};

/** What the card should be saying, in whatever language the app is in. */
const words = (id: string) => line(lockKey(id), lockNamed(id).instruction);

const text = (tree: renderer.ReactTestRenderer) => JSON.stringify(tree.toJSON());

// Every tree this file mounts, so afterEach can take them down again.
// Without it a previous test's overlay is still mounted and still
// subscribed, so the NEXT test's store writes re-render it - and it
// delivers a scene into the test that was checking nothing had been
// delivered yet. Cost twenty minutes; noted so it is not re-paid.
const mounted: renderer.ReactTestRenderer[] = [];

const draw = () => {
    let tree: renderer.ReactTestRenderer;
    act(() => { tree = renderer.create(<TutorialOverlay />); });
    mounted.push(tree!);
    return tree!;
};

afterEach(() => {
    act(() => { for (const tree of mounted.splice(0)) tree.unmount(); });
});

beforeEach(() => {
    useTutorialTargets.setState({ rects: {} });
    useStoryStore.setState({
        locks: emptyLockState(),
        flags: {},
        dials: useStoryStore.getState().dials,
        seenScenes: [],
        pending: [],
        sceneProgress: {},
    } as any);
    useIdentityStore.setState({ tutorialCompleted: false } as any);
    useStatsStore.setState({ companyCapital: 2_000_000, money: 500_000 } as any);
});

describe('the overlay', () => {
    // ------------------------------------------------------------------
    //  THE ONE THAT WAS FAILING
    // ------------------------------------------------------------------
    it('draws the lock the player has just triggered', () => {
        // Walking into research is what raises this. It is the whole trigger
        // for the laboratory lesson.
        act(() => { useStoryStore.setState({ flags: { rndOpened: true } } as any); });
        act(() => { useTutorialTargets.getState().setRect('rndLab', RECT); });

        const tree = draw();
        expect(text(tree)).toContain(words('rnd-lab'));
    });

    it('puts a name on the card, and it is not the father', () => {
        act(() => { useStoryStore.setState({ flags: { rndOpened: true } } as any); });
        act(() => { useTutorialTargets.getState().setRect('rndLab', RECT); });

        const said = text(draw());
        expect(said).toContain((castNow('cto')?.name ?? '').toUpperCase());
        expect(said).not.toContain((castNow('father')?.name ?? '').toUpperCase());
    });

    // ------------------------------------------------------------------
    //  AND THE THREE SILENCES THAT ARE CORRECT
    // ------------------------------------------------------------------
    //  Each of these looks identical on a phone - a screen with nothing on
    //  it - which is why the real failure hid among them for so long. Held
    //  here so that turning the overlay on cannot start it shouting.
    // ------------------------------------------------------------------
    it('says nothing while the control is on a screen the player is not on', () => {
        act(() => { useStoryStore.setState({ flags: { rndOpened: true } } as any); });
        // No rect published: the laboratory tile is not on this screen.
        expect(text(draw())).not.toContain(words('rnd-lab'));
    });

    it('says nothing before anything has triggered it', () => {
        act(() => { useTutorialTargets.getState().setRect('rndLab', RECT); });
        expect(text(draw())).not.toContain(words('rnd-lab'));
    });

    it('says nothing at all once the tutorial is switched off', () => {
        act(() => {
            useStoryStore.setState({
                flags: { rndOpened: true },
                locks: { ...emptyLockState(), disabled: true },
            } as any);
            useTutorialTargets.getState().setRect('rndLab', RECT);
        });
        expect(text(draw())).not.toContain(words('rnd-lab'));
    });

    // ------------------------------------------------------------------
    //  IT HAS TO NOTICE THE WORLD MOVING WHILE IT IS ON SCREEN
    // ------------------------------------------------------------------
    //  This component subscribed to `locks` and `rects` and to nothing
    //  else, then built its World from four stores it was not watching. So
    //  it re-rendered when a lock was recorded or a control was measured,
    //  and NOT when the player did the thing the lock was asking for.
    //
    //  It survived in the one case anybody tests by hand: pressing the
    //  laboratory tile navigates away, the target withdraws its rect, and
    //  the rect change forces the render that notices the flag. Luck,
    //  through an unrelated store, on one step out of seven.
    //
    //  Both of the following are the same missing subscription seen from
    //  the two sides that matter - the step that will not clear, and the
    //  step that will not lift.
    // ------------------------------------------------------------------
    it('clears the step when the flag it was waiting for is raised', () => {
        act(() => {
            useStoryStore.setState({ flags: { rndOpened: true } } as any);
            useTutorialTargets.getState().setRect('rndLab', RECT);
        });
        const tree = draw();
        expect(text(tree)).toContain(words('rnd-lab'));

        // The player opens the laboratory, and does not leave the screen.
        act(() => { useStoryStore.getState().raise('rndLabOpened'); });

        expect(useStoryStore.getState().locks.completed).toContain('rnd-lab');
        expect(text(tree)).not.toContain(words('rnd-lab'));
    });

    it('stops asking for something the company can no longer afford', () => {
        act(() => {
            useStoryStore.setState({ flags: { rndOpened: true, rndLabOpened: true } } as any);
            useTutorialTargets.getState().setRect('rndHire', RECT);
        });
        const tree = draw();
        expect(text(tree)).toContain(words('rnd-hire'));

        // A quarter closes badly and the capital goes.
        act(() => { useStatsStore.setState({ companyCapital: 1_000 } as any); });

        expect(text(tree)).not.toContain(words('rnd-hire'));
    });

    // ------------------------------------------------------------------
    //  AND THE WORDS ARRIVE WITH THE DIM, NOT THREE MONTHS AFTER IT
    // ------------------------------------------------------------------
    //  The lock's conversation was queued by the quarterly tick, which is
    //  the right moment for every step the calendar brings and the wrong
    //  one for the only step the PLAYER brings. Somebody taps into
    //  research in the middle of a quarter, the screen dims, Priya's name
    //  is on the card, and the letter explaining what she is talking
    //  about turns up at the next tick.
    // ------------------------------------------------------------------
    it('sends the scene the moment the lock goes live', () => {
        act(() => {
            useStoryStore.setState({ flags: { rndOpened: true } } as any);
            useTutorialTargets.getState().setRect('rndLab', RECT);
        });
        expect(useStoryStore.getState().seenScenes).not.toContain('cto-research');

        draw();

        expect(useStoryStore.getState().seenScenes).toContain('cto-research');
        // Delivered, not parked in the queue waiting for a tick.
        expect(useStoryStore.getState().pending
            .some(p => p.conversationId === 'cto-research')).toBe(false);
    });

    it('and does not send it twice when the effect runs again', () => {
        act(() => {
            useStoryStore.setState({ flags: { rndOpened: true } } as any);
            useTutorialTargets.getState().setRect('rndLab', RECT);
        });
        draw();
        draw();
        const seen = useStoryStore.getState().seenScenes
            .filter(id => id === 'cto-research');
        expect(seen).toHaveLength(1);
    });

    // ------------------------------------------------------------------
    //  AND THE STEP CLEARS ITSELF WHEN THE PLAYER DOES THE THING
    // ------------------------------------------------------------------
    //  Nothing else in the app calls completeLock for a condition-cleared
    //  step. If this effect is ever lost, every lock stays active forever
    //  and the sequence never advances past its first entry.
    // ------------------------------------------------------------------
    it('records a step the player has already satisfied', () => {
        act(() => {
            useStoryStore.setState({ flags: { rndOpened: true, rndLabOpened: true } } as any);
            useTutorialTargets.getState().setRect('rndHire', RECT);
        });
        draw();
        expect(useStoryStore.getState().locks.completed).toContain('rnd-lab');
    });
});
