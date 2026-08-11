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
// ============================================================================

import React, { useCallback, useRef } from 'react';
import { View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import { useTutorialTargets } from './targets';

type Props = {
    /** Matches `highlight` on a lock. */
    tutorialKey: string;
    style?: ViewStyle;
    children: React.ReactNode;
};

const TutorialTarget = ({ tutorialKey, style, children }: Props) => {
    const setRect = useTutorialTargets(s => s.setRect);
    const ref = useRef<View>(null);

    const measure = useCallback((_: LayoutChangeEvent) => {
        // measureInWindow, not onLayout's own numbers: onLayout reports a
        // position relative to the parent, and the overlay is drawn against
        // the window. Using the parent-relative one puts the hole roughly
        // where the control is, which is worse than obviously wrong.
        ref.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) setRect(tutorialKey, { x, y, width, height });
        });
    }, [tutorialKey, setRect]);

    return (
        <View ref={ref} style={style} onLayout={measure} collapsable={false}>
            {children}
        </View>
    );
};

export default TutorialTarget;
