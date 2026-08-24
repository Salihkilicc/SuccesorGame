// src/features/casino/components/Reel.tsx
//
// ============================================================================
//  THE STRIP DRAWS ICONS NOW
// ============================================================================
//  It rendered whatever string it was handed inside a <Text> at forty point,
//  which worked because the strip was emoji - thirteen of them across three
//  machines, in a codebase that has twice removed emoji for doing an icon's
//  job. The names it receives are MaterialCommunityIcons now. See
//  logic/slotsData.ts.
//
//  The fallback strip mattered more than it looks: an empty `symbols` array
//  fell through to eight fruit machine emoji, so a machine with a bad config
//  silently became a different game.
// ============================================================================
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';

const SYMBOL_HEIGHT = 80;

interface ReelProps {
    /** MaterialCommunityIcons names. */
    symbols: string[];
    /** The icon name this reel comes to rest on. */
    finalSymbol: string;
    /** The room's colour, so a reel looks like where it is. */
    tint?: string;
    isSpinning: boolean;
    delay: number;
    index: number;
}

/** If a machine hands over nothing, show that rather than another game. */
const MOCK_STRIP = ['help-circle-outline'];

export const Reel = ({ symbols, finalSymbol, isSpinning, delay, index, tint }: ReelProps) => {
    // Fallback if symbols is empty
    const stripSymbols = symbols && symbols.length > 0 ? symbols : MOCK_STRIP;

    // Standard Animated Value
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const totalHeight = SYMBOL_HEIGHT * stripSymbols.length;

        if (isSpinning) {
            // Spin Loop (Top to Bottom: -H -> 0)
            translateY.setValue(-totalHeight);

            Animated.loop(
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 500 + (stripSymbols.length * 20),
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();

        } else {
            // Stop logic
            setTimeout(() => {
                translateY.stopAnimation(() => {
                    const symbolIndex = stripSymbols.indexOf(finalSymbol);
                    const targetIndex = symbolIndex !== -1 ? symbolIndex : 0;

                    // Reset to -H (top of the "previous" set) and slide down to target
                    translateY.setValue(-totalHeight);

                    Animated.sequence([
                        Animated.timing(translateY, {
                            toValue: -targetIndex * SYMBOL_HEIGHT,
                            duration: 400,
                            easing: Easing.out(Easing.poly(2)),
                            useNativeDriver: true
                        })
                    ]).start();
                });
            }, delay);
        }
    }, [isSpinning, finalSymbol, delay, stripSymbols]);

    return (
        <View style={styles.reelContainer}>
            <Animated.View style={[styles.strip, { transform: [{ translateY }] }]}>
                {/* Render the strip repeatedly for the loop illusion */}
                {[...stripSymbols, ...stripSymbols, ...stripSymbols].map((sym, i) => (
                    <View key={i} style={styles.symbolContainer}>
                        <MaterialCommunityIcons
                            name={sym}
                            size={38}
                            color={tint ?? theme.colors.textPrimary}
                        />
                    </View>
                ))}
            </Animated.View>

            <View style={styles.shadeTop} />
            <View style={styles.shadeBottom} />
        </View>
    );
};

const styles = StyleSheet.create({
    reelContainer: {
        width: 80,
        height: SYMBOL_HEIGHT * 3, // Show 3 symbols
        overflow: 'hidden',
        backgroundColor: '#434B50',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 8,
    },
    strip: {
        flexDirection: 'column',
    },
    symbolContainer: {
        height: SYMBOL_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // `symbol` was a 40pt font size. The icon carries its own size now.
    shadeTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        backgroundColor: 'rgba(28,36,44,0.5)',
        zIndex: 10,
    },
    shadeBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        backgroundColor: 'rgba(28,36,44,0.5)',
        zIndex: 10,
    }
});
