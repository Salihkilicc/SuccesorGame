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

beforeEach(() => {
    mockFocused = true;
    useTutorialTargets.setState({ rects: {} });
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
        }
    });
});
