// src/components/common/SwipeToDelete.tsx
//
// ============================================================================
//  DRAG A ROW LEFT TO THROW IT AWAY
// ============================================================================
//
//  The inbox and the messages list both fill up and neither had any way to
//  empty. `deleteMail` had been on the mail store since it was written and
//  nothing called it; `removeThread` arrived with the father's death and was
//  reachable only by dying. Two working deletes and no way for a player to
//  reach either - which is this codebase's recurring failure, and this time it
//  is the gesture that was missing rather than the function.
//
//  ---------------------------------------------------------------------------
//  PANRESPONDER, NOT A LIBRARY
//  ---------------------------------------------------------------------------
//  react-native-gesture-handler is not in this project and adding a native
//  dependency for one gesture means a pod install, a rebuild, and a second way
//  of handling touches that the rest of the app does not use. PanResponder
//  ships with React Native and does this one thing adequately.
//
//  The cost is honest: no velocity-based fling, and the row does not rubber-
//  band at the end of its travel. Neither is worth a native module.
//
//  ---------------------------------------------------------------------------
//  IT DOES NOT ASK
//  ---------------------------------------------------------------------------
//  The first version put an Alert in the way. It was wrong for the job: the
//  whole point of the gesture is clearing five finished threads in five
//  seconds, and a box after each one turns a sweep into an interrogation.
//
//  So the confirmation is gone and the DISTANCE does the work instead. An
//  ordinary row goes at a quarter of the screen. A row carrying something that
//  cannot come back needs most of the screen, which is a deliberate movement
//  rather than a flick and is still one gesture.
//
//  That is a worse guard than a box and a much better control, and the trade
//  is worth stating: a player CAN lose an unplayed scene to a long accidental
//  swipe. They cannot lose one to a careless one.
// ============================================================================

import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    PanResponder,
    Dimensions,
} from 'react-native';

import { theme } from '../../core/theme';

const { width: SCREEN } = Dimensions.get('window');

/**
 * How far left the row must go before the delete counts.
 *
 * A quarter of the screen. Short enough to be one movement, long enough that
 * the horizontal component of a scroll cannot reach it by accident.
 */
export const DELETE_THRESHOLD = SCREEN * 0.25;

/**
 * And how far a row that is carrying something has to go.
 *
 * Most of the screen. There is no dialog any more, so this is the only thing
 * standing between a careless flick and a scene nobody will ever read - and it
 * has to be reachable, because the player is allowed to throw these away. A
 * deliberate movement rather than a flick.
 */
export const GUARDED_THRESHOLD = SCREEN * 0.6;

/**
 * How much sideways movement claims the gesture from the list.
 *
 * The second number is what stops the row fighting the scroll view: the drag
 * has to be more horizontal than vertical before this responder takes it, so a
 * finger travelling down the list is never intercepted.
 */
const CLAIM_DX = 12;
const CLAIM_RATIO = 1.6;

type Props = {
    children: React.ReactNode;
    /**
     * What this row is, for anything that needs to name it.
     *
     * @orphan-ok-symbol label
     *
     * DELIBERATELY UNUSED as of the commit that removed the confirmation - it
     * was the only thing that read it. Kept because the next thing this
     * component wants is an undo toast, and a toast has to say what it undid.
     */
    label: string;
    /**
     * This row is carrying something that cannot come back.
     *
     * A finished conversation and an unplayed one look identical in a list,
     * and the whole reason this gesture exists is to clear the finished ones.
     * A guarded row needs a longer swipe and says so on the panel behind it.
     */
    guarded?: boolean;
    onDelete: () => void;
};

const SwipeToDelete = ({ children, label, guarded, onDelete }: Props) => {
    const x = useRef(new Animated.Value(0)).current;
    const settle = () =>
        Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();

    const responder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_e, g) =>
                g.dx < -CLAIM_DX && Math.abs(g.dx) > Math.abs(g.dy) * CLAIM_RATIO,
            onPanResponderMove: (_e, g) => {
                // Left only. Dragging a row to the right does not mean
                // anything here, and letting it move implies it might.
                x.setValue(Math.min(0, g.dx));
            },
            onPanResponderRelease: (_e, g) => {
                const needed = guarded ? GUARDED_THRESHOLD : DELETE_THRESHOLD;
                if (g.dx > -needed) { settle(); return; }
                // Off the edge first, then out of the store, so the row leaves
                // rather than blinking out from under the finger.
                Animated.timing(x, {
                    toValue: -SCREEN,
                    duration: 160,
                    useNativeDriver: true,
                }).start(() => onDelete());
            },
            onPanResponderTerminate: settle,
        }),
    ).current;

    return (
        <View style={styles.root}>
            {/* ------------------------------------------------------------
                BEHIND THE ROW, IN THE ONE COLOUR THAT MEANS THIS

                `destructive` and not a red fill. Red in this game means
                "this is costing you" and it is a TEXT token - a red panel
                would be the third thing red says, and the rule is that a
                colour which means something means one thing. See the palette
                note in core/theme.ts.

                White on it measures 5.77.
               ------------------------------------------------------------ */}
            <View style={styles.behind} pointerEvents="none">
                {/* The panel is the only warning there is now, so a guarded
                    row says what it is rather than saying Delete twice as
                    loudly. `label` is not repeated here - the row itself is
                    directly on top of this and already says who it is from. */}
                <Text style={styles.behindText}>
                    {guarded ? 'Not played yet' : 'Delete'}
                </Text>
            </View>

            <Animated.View
                style={{ transform: [{ translateX: x }] }}
                {...responder.panHandlers}>
                {children}
            </Animated.View>
        </View>
    );
};

export default SwipeToDelete;

const styles = StyleSheet.create({
    root: { position: 'relative' },
    behind: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: theme.colors.destructive,
        borderRadius: theme.radius.lg,
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingRight: theme.spacing.lg,
    },
    behindText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
