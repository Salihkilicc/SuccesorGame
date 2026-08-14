import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '../../core/theme';

type Props = {
    variant?: 'message' | 'mail';
};

const TypingIndicator = ({ variant = 'message' }: Props) => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const createBounce = (anim: Animated.Value, delay: number) => {
            return Animated.sequence([
                Animated.delay(delay),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(anim, {
                            toValue: -5,
                            duration: 250,
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim, {
                            toValue: 0,
                            duration: 250,
                            useNativeDriver: true,
                        }),
                        Animated.delay(300),
                    ]),
                ),
            ]);
        };

        const anim1 = createBounce(dot1, 0);
        const anim2 = createBounce(dot2, 150);
        const anim3 = createBounce(dot3, 300);

        anim1.start();
        anim2.start();
        anim3.start();

        return () => {
            anim1.stop();
            anim2.stop();
            anim3.stop();
        };
    }, [dot1, dot2, dot3]);

    if (variant === 'mail') {
        return (
            <View style={styles.mailWrap}>
                <View style={styles.mailCard}>
                    <View style={styles.dotsRow}>
                        <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]} />
                        <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }] }]} />
                        <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }] }]} />
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.bubbleWrap}>
            <View style={styles.bubble}>
                <View style={styles.dotsRow}>
                    <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]} />
                    <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }] }]} />
                    <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }] }]} />
                </View>
            </View>
        </View>
    );
};

export default TypingIndicator;

const styles = StyleSheet.create({
    bubbleWrap: {
        alignItems: 'flex-start',
        marginVertical: 4,
    },
    bubble: {
        backgroundColor: theme.colors.surface,
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 12,
        maxWidth: 80,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    mailWrap: {
        marginVertical: 8,
    },
    mailCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        height: 14,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: theme.colors.textMuted,
    },
});
