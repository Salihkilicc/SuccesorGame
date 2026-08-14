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
//  IT ASKS FIRST, AND THE PROMPT IS THE POINT
//  ---------------------------------------------------------------------------
//  A thread can hold a scene the player has not finished, and a swipe is the
//  easiest gesture on a phone to make by accident while scrolling. Undo would
//  be better and is a bigger piece of work; a confirmation is what this can
//  honestly offer today, and the row springs back if the answer is no.
// ============================================================================

import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    PanResponder,
    Alert,
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
    /** Named in the confirmation, so the player knows what they are binning. */
    label: string;
    onDelete: () => void;
};

const SwipeToDelete = ({ children, label, onDelete }: Props) => {
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
                if (g.dx > -DELETE_THRESHOLD) { settle(); return; }
                Alert.alert(
                    'Delete',
                    `Delete ${label}? This cannot be undone.`,
                    [
                        { text: 'Keep', style: 'cancel', onPress: settle },
                        {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => {
                                // Off the edge first, then out of the store, so
                                // the row leaves rather than blinking out from
                                // under the finger.
                                Animated.timing(x, {
                                    toValue: -SCREEN,
                                    duration: 160,
                                    useNativeDriver: true,
                                }).start(() => onDelete());
                            },
                        },
                    ],
                    { cancelable: true, onDismiss: settle },
                );
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
                <Text style={styles.behindText}>Delete</Text>
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
