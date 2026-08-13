// src/components/tutorial/TutorialTarget.tsx
//
// ============================================================================
//  "THIS IS THE THING THE LOCK MEANS"
// ============================================================================
//
//  Wrap a control in this and give it a key. When a lock names that key, the
//  overlay knows where the hole goes.
//
//  MEASURED RATHER THAN DESCRIBED. The alternative is for each lock to carry
//  coordinates, which would be wrong the first time anybody changed a
//  layout - and wrong silently, because a hole in the wrong place still looks
//  deliberate. The control reports where it actually is.
//
//  It re-measures on layout, so a scroll or a rotation moves the hole with it
//  rather than leaving it behind.
//
//  ---------------------------------------------------------------------------
//  THE MEASUREMENT IS TIED TO FOCUS, NOT TO MOUNT
//  ---------------------------------------------------------------------------
//  This was written as a cleanup on unmount, and unmount is the wrong event.
//
//  My Company pushes Products onto the root stack, and a stack does not
//  unmount the screen it covers. So the cleanup never ran: the rect measured
//  on My Company survived into the Products screen, the overlay dimmed
//  Products around a hole at those coordinates, and the hole landed on
//  whatever happened to be at that position - the Discover New Tech panel.
//
//  Which produced the worst possible version of a tutorial. The only
//  touchable area on the screen was the wrong control, so the player could
//  not press the product they were being told to press, and the step could
//  never clear.
//
//  Focus is the honest signal. A covered screen is not the screen the player
//  is looking at, whether or not React has torn it down. The rect is
//  published while this control's screen is in front and withdrawn the moment
//  it is not.
// ============================================================================

import React, { useCallback, useEffect, useRef } from 'react';
import { View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useTutorialTargets } from './targets';

/**
 * How often a focused target checks whether it has moved.
 *
 * Fast enough that the ring keeps up with a flick-scroll, slow enough to be
 * free. The store ignores an identical measurement, so a screen that is not
 * moving does not re-render at all.
 */
const MEASURE_EVERY_MS = 250;

type Props = {
    /** Matches `highlight` on a lock. */
    tutorialKey: string;
    style?: ViewStyle;
    children: React.ReactNode;
};

const TutorialTarget = ({ tutorialKey, style, children }: Props) => {
    const setRect = useTutorialTargets(s => s.setRect);
    const clearRect = useTutorialTargets(s => s.clearRect);
    const ref = useRef<View>(null);
    const focused = useIsFocused();

    const measure = useCallback(() => {
        // measureInWindow, not onLayout's own numbers: onLayout reports a
        // position relative to the parent, and the overlay is drawn against
        // the window. Using the parent-relative one puts the hole roughly
        // where the control is, which is worse than obviously wrong.
        ref.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) setRect(tutorialKey, { x, y, width, height });
        });
    }, [tutorialKey, setRect]);

    const onLayout = useCallback((_: LayoutChangeEvent) => {
        // A layout that happens while this screen is covered is not news the
        // overlay can use - publishing it would put a hole on somebody else's
        // screen, which is the bug this whole file is about.
        if (focused) measure();
    }, [focused, measure]);

    useEffect(() => {
        if (!focused) {
            clearRect(tutorialKey);
            return;
        }
        // Re-measured on the way back rather than trusting the old numbers:
        // coming back from another screen does not necessarily fire a layout,
        // and the page may have been scrolled since.
        measure();

        // ------------------------------------------------------------------
        //  AND KEPT MEASURED, BECAUSE SCROLLING DOES NOT FIRE A LAYOUT
        // ------------------------------------------------------------------
        //  The marketing row sits inside a scrolling sheet. onLayout runs
        //  when the view is laid out, not when it moves past the viewport,
        //  so the published rect was wherever the row happened to be when
        //  the sheet opened - and it stayed there while the player scrolled
        //  the row itself somewhere else.
        //
        //  A poll rather than plumbing onScroll through every screen that
        //  ever holds a target: the callers should not have to know a
        //  tutorial exists, which is the rule the whole targets module is
        //  built on. measureInWindow is a native call, and setRect drops
        //  identical measurements, so a still screen costs one native
        //  measurement every quarter second and re-renders nothing.
        // ------------------------------------------------------------------
        const tick = setInterval(measure, MEASURE_EVERY_MS);
        return () => {
            clearInterval(tick);
            clearRect(tutorialKey);
        };
    }, [focused, tutorialKey, measure, clearRect]);

    return (
        <View ref={ref} style={style} onLayout={onLayout} collapsable={false}>
            {children}
        </View>
    );
};

export default TutorialTarget;
