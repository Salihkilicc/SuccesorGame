// src/components/tutorial/TutorialTarget.test.tsx
//
// ============================================================================
//  A COVERED SCREEN MUST NOT SAY WHERE ITS CONTROLS ARE
// ============================================================================
//
//  The first version of the cleanup ran on UNMOUNT, which is the wrong event
//  and produced a bug that was worse than the one it fixed.
//
//  My Company pushes Products onto the root stack, and a stack does not
//  unmount the screen it covers. So the cleanup never ran. The rect measured
//  on My Company survived into Products, the overlay dimmed Products around
//  those coordinates, and the hole landed on whatever sat at that position -
//  the Discover New Tech card. The only pressable thing on the screen was
//  therefore the one control that could not clear the step, and the tutorial
//  could not be completed at all.
//
//  Focus is the honest signal, and this file is here because the difference
//  between focus and mount is invisible in the source and obvious on a phone.
// ============================================================================

import React from 'react';
import { Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import TutorialTarget from './TutorialTarget';
import { useTutorialTargets } from './targets';

// The screen's focus, controlled by the test rather than by a navigator.
// `mock`-prefixed because jest.mock's factory is hoisted above every other
// declaration in the file and may only reach variables named this way.
let mockFocused = true;
jest.mock('@react-navigation/native', () => ({
    useIsFocused: () => mockFocused,
}));

// There is no window under the test renderer, so measureInWindow never calls
// back and the component never publishes on its own. The rect is therefore
// published by the test, and what is under test is the WITHDRAWAL - which is
// the half that was wrong and the half that matters.
const FAKE = { x: 12, y: 34, width: 100, height: 44 };

const publish = () =>
    act(() => {
        useTutorialTargets.getState().setRect('products', FAKE);
    });

const rects = () => useTutorialTargets.getState().rects;

// A focused target polls its own position - scrolling does not fire a layout,
// so the rect has to be refreshed on a timer. Under real timers that interval
// keeps the test process alive after the assertions have passed.
beforeEach(() => {
    jest.useFakeTimers();
    mockFocused = true;
    useTutorialTargets.setState({ rects: {}, activeKey: null });
});

afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
});

const mount = () =>
    renderer.create(
        <TutorialTarget tutorialKey="products"><Text>tile</Text></TutorialTarget>,
    );

describe('a target', () => {
    it('withdraws its position when its screen loses focus', () => {
        let tree: renderer.ReactTestRenderer;
        act(() => { tree = mount(); });
        publish();
        expect(rects().products).toEqual(FAKE);

        // The screen is covered by a push. It is still mounted.
        mockFocused = false;
        act(() => { tree!.update(
            <TutorialTarget tutorialKey="products"><Text>tile</Text></TutorialTarget>,
        ); });

        // THE ASSERTION THIS FILE EXISTS FOR. If this ever fails, the hole
        // moves onto the next screen and lands on a control that cannot
        // clear the step.
        expect(rects().products).toBeUndefined();
    });

    it('still withdraws it when the screen really is torn down', () => {
        let tree: renderer.ReactTestRenderer;
        act(() => { tree = mount(); });
        publish();
        act(() => { tree!.unmount(); });
        expect(rects().products).toBeUndefined();
    });

    it('publishes nothing at all while unfocused', () => {
        mockFocused = false;
        act(() => { mount(); });
        expect(rects().products).toBeUndefined();
    });

    it('renders its children either way, focused or not', () => {
        // The wrapper is layout. A tutorial that hides the control it is
        // pointing at would be a considerably funnier bug than the last one.
        for (const state of [true, false]) {
            mockFocused = state;
            let tree: renderer.ReactTestRenderer;
            act(() => { tree = mount(); });
            expect(JSON.stringify(tree!.toJSON())).toContain('tile');
            act(() => { tree!.unmount(); });
        }
    });

    it('stops polling when it goes away', () => {
        // The poll is the only thing in this component that outlives a
        // render, so it is the only thing that can leak. A target that kept
        // measuring after its screen was gone would publish coordinates for
        // a control that no longer exists - the original bug, with a timer.
        let tree: renderer.ReactTestRenderer;
        act(() => { tree = mount(); });
        act(() => { tree!.unmount(); });
        expect(jest.getTimerCount()).toBe(0);
    });
});

// ============================================================================
//  THE ONE WITH THE RING FOLLOWS PER FRAME; THE REST KEEP THE CHEAP TIMER
// ============================================================================
//
//  Reported from a device: the highlight did not look fixed to the control, it
//  looked like it was sliding. That is what a 250ms poll looks like against a
//  finger moving a list continuously - the ring lands four times a second,
//  always behind, always in steps.
//
//  The timer cannot simply be made faster. It runs on EVERY focused target,
//  and most of them are not being pointed at; per frame for all of them is a
//  native measurement per view per frame for nothing. So the overlay publishes
//  which key has the ring and only that one upgrades.
//
//  WHAT THIS FILE IS DEFENDING is that split. Both halves are easy to lose:
//  drop the rAF branch and the lag comes back, drop the interval branch and
//  the overlay never learns a control exists, and NEITHER shows up as a
//  failure anywhere else. The second one is the nastier regression, because
//  the tutorial then simply never appears, which is a bug this project has
//  already shipped once.
// ============================================================================

describe('how often a target re-measures', () => {
    /**
     * Counting the two mechanisms rather than counting measurements.
     *
     * `measureInWindow` never calls back under the test renderer, so the
     * measurements themselves are unobservable. What IS observable is which
     * scheduler the component reached for, and that is the decision under
     * test.
     */
    const spies = () => {
        const raf = jest.spyOn(global, 'requestAnimationFrame');
        const interval = jest.spyOn(global, 'setInterval');
        return {
            raf,
            interval,
            restore: () => { raf.mockRestore(); interval.mockRestore(); },
        };
    };

    it('uses the cheap timer when it is not the one being pointed at', () => {
        const s = spies();
        let tree: renderer.ReactTestRenderer;
        act(() => { tree = mount(); });

        expect(s.interval).toHaveBeenCalled();
        expect(s.raf).not.toHaveBeenCalled();

        act(() => { tree!.unmount(); });
        s.restore();
    });

    it('follows per frame once the overlay names it', () => {
        act(() => { useTutorialTargets.getState().setActiveKey('products'); });

        const s = spies();
        let tree: renderer.ReactTestRenderer;
        act(() => { tree = mount(); });

        // The assertion that the reported bug is fixed.
        expect(s.raf).toHaveBeenCalled();
        expect(s.interval).not.toHaveBeenCalled();

        act(() => { tree!.unmount(); });
        s.restore();
    });

    it('switches over when the ring arrives while it is already mounted', () => {
        // The ordinary case in the game: the player is on the screen and a
        // lock engages underneath them. The target must not stay on the slow
        // timer just because it mounted before the lock.
        let tree: renderer.ReactTestRenderer;
        act(() => { tree = mount(); });

        const s = spies();
        act(() => { useTutorialTargets.getState().setActiveKey('products'); });

        expect(s.raf).toHaveBeenCalled();

        act(() => { tree!.unmount(); });
        s.restore();
    });

    it('does not follow a ring that belongs to a different control', () => {
        act(() => { useTutorialTargets.getState().setActiveKey('rndLab'); });

        const s = spies();
        let tree: renderer.ReactTestRenderer;
        act(() => { tree = mount(); });

        expect(s.raf).not.toHaveBeenCalled();
        expect(s.interval).toHaveBeenCalled();

        act(() => { tree!.unmount(); });
        s.restore();
    });

    it('stops the frame loop on unmount', () => {
        act(() => { useTutorialTargets.getState().setActiveKey('products'); });

        const cancel = jest.spyOn(global, 'cancelAnimationFrame');
        let tree: renderer.ReactTestRenderer;
        act(() => { tree = mount(); });
        act(() => { tree!.unmount(); });

        // A loop left running re-measures a view that is gone, forever.
        expect(cancel).toHaveBeenCalled();
        cancel.mockRestore();
    });

    it('stops following and withdraws when the screen loses focus', () => {
        act(() => { useTutorialTargets.getState().setActiveKey('products'); });
        let tree: renderer.ReactTestRenderer;
        act(() => { tree = mount(); });
        publish();

        const cancel = jest.spyOn(global, 'cancelAnimationFrame');
        mockFocused = false;
        act(() => { tree!.update(
            <TutorialTarget tutorialKey="products"><Text>tile</Text></TutorialTarget>,
        ); });

        expect(cancel).toHaveBeenCalled();
        expect(rects()).not.toHaveProperty('products');

        cancel.mockRestore();
        act(() => { tree!.unmount(); });
    });
});
