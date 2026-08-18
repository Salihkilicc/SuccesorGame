import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    PanResponder,
    Dimensions,
    Pressable,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { theme } from '../../core/theme';

const { width: SCREEN } = Dimensions.get('window');

/**
 * How far left the row must go before the delete counts for full swipe.
 *
 * A quarter of the screen. Short enough to be one movement, long enough that
 * the horizontal component of a scroll cannot reach it by accident.
 */
export const DELETE_THRESHOLD = SCREEN * 0.25;

/**
 * And how far a row that is carrying something has to go for full swipe.
 *
 * Most of the screen for direct drag fling. Alternatively, partial swipe
 * reveals the Delete button which can be tapped directly.
 */
export const GUARDED_THRESHOLD = SCREEN * 0.6;

const ACTION_WIDTH = 80;
const CLAIM_DX = 10;

type Props = {
    children: React.ReactNode;
    /**
     * What this row is, for accessibility / naming.
     */
    label: string;
    /**
     * This row is carrying something that cannot come back.
     */
    guarded?: boolean;
    onDelete: () => void;
};

const SwipeToDelete = ({ children, label, guarded, onDelete }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const isOpenRef = useRef(false);
    const isDeleting = useRef(false);
    const x = useRef(new Animated.Value(0)).current;

    const settle = () => {
        isOpenRef.current = false;
        setIsOpen(false);
        Animated.spring(x, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
        }).start();
    };

    const open = () => {
        isOpenRef.current = true;
        setIsOpen(true);
        Animated.spring(x, {
            toValue: -ACTION_WIDTH,
            useNativeDriver: true,
            bounciness: 2,
        }).start();
    };

    const triggerDelete = () => {
        if (isDeleting.current) return;
        isDeleting.current = true;
        Animated.timing(x, {
            toValue: -SCREEN,
            duration: 180,
            useNativeDriver: true,
        }).start(() => onDelete());
    };

    const responder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onStartShouldSetPanResponderCapture: () => false,
            onMoveShouldSetPanResponderCapture: (_e, g) =>
                Math.abs(g.dx) > CLAIM_DX && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
            onMoveShouldSetPanResponder: (_e, g) =>
                Math.abs(g.dx) > CLAIM_DX && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
            onPanResponderTerminationRequest: () => false,
            onPanResponderGrant: () => {
                x.stopAnimation();
            },
            onPanResponderMove: (_e, g) => {
                if (isDeleting.current) return;
                const base = isOpenRef.current ? -ACTION_WIDTH : 0;
                const nextVal = Math.min(0, base + g.dx);
                x.setValue(nextVal);
            },
            onPanResponderRelease: (_e, g) => {
                if (isDeleting.current) return;
                const base = isOpenRef.current ? -ACTION_WIDTH : 0;
                const totalOffset = base + g.dx;
                const needed = guarded ? GUARDED_THRESHOLD : DELETE_THRESHOLD;

                // 1. Full swipe past threshold or fast flick left
                if (totalOffset <= -needed || g.vx < -0.55) {
                    triggerDelete();
                    return;
                }

                // 2. Swiping right when already open closes the row
                if (isOpenRef.current && g.dx > 20) {
                    settle();
                    return;
                }

                // 3. Partial swipe left opens the action button
                if (totalOffset < -ACTION_WIDTH * 0.45) {
                    open();
                    return;
                }

                // 4. Default: snap back to closed
                settle();
            },
            onPanResponderTerminate: settle,
        }),
    ).current;

    return (
        <View style={styles.root}>
            {/* Behind Action Panel */}
            <View style={styles.behindContainer}>
                <Pressable
                    style={styles.deleteButton}
                    onPress={triggerDelete}
                    accessibilityRole="button"
                    accessibilityLabel={guarded ? `Delete ${label} (not played yet)` : `Delete ${label}`}>
                    <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FFFFFF" />
                    <Text style={styles.behindText} numberOfLines={1}>
                        {guarded ? 'Not played' : 'Delete'}
                    </Text>
                </Pressable>
            </View>

            {/* Foreground Row */}
            <Animated.View
                style={{ transform: [{ translateX: x }] }}
                {...responder.panHandlers}>
                {children}

                {/* Tap on row while open closes the row instead of triggering row navigation */}
                {isOpen && (
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={settle}
                    />
                )}
            </Animated.View>
        </View>
    );
};

export default SwipeToDelete;

const styles = StyleSheet.create({
    root: {
        position: 'relative',
        overflow: 'hidden',
        borderRadius: theme.radius.lg,
    },
    behindContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: theme.colors.destructive,
        borderRadius: theme.radius.lg,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    deleteButton: {
        width: ACTION_WIDTH,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 4,
    },
    behindText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
});
