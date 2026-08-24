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

// 80 -> 64. Three of these is the height of the machine, so the twenty four
// points saved here are twenty four the SPIN button gets back. See
// screens/SlotsGameScreen.tsx, which no longer scrolls.
const SYMBOL_HEIGHT = 64;

interface ReelProps {
    /** MaterialCommunityIcons names. */
    symbols: string[];
    /** The icon name this reel comes to rest on. */
    finalSymbol: string;
    /**
     * What colour to draw an icon in.
     *
     * A FUNCTION rather than one tint, which is the whole change: every
     * symbol on the strip used to arrive in the room's single colour, so a
     * machine read as a column of identical shapes. The colour climbs with
     * the payout now - see logic/slotsData.ts - so the reel teaches the
     * table without anybody reading it.
     */
    colourOf?: (icon: string) => string;
    /** The room's colour, for the payline rule. */
    tint?: string;
    isSpinning: boolean;
    delay: number;
    index: number;
}

/** If a machine hands over nothing, show that rather than another game. */
const MOCK_STRIP = ['help-circle-outline'];

export const Reel = ({ symbols, finalSymbol, isSpinning, delay, index, colourOf, tint }: ReelProps) => {
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
                            color={colourOf?.(sym) ?? theme.colors.textPrimary}
                        />
                    </View>
                ))}
            </Animated.View>

            <View style={styles.shadeTop} pointerEvents="none" />
            <View style={styles.shadeBottom} pointerEvents="none" />

            {/* ----------------------------------------------------------
                THE LINE THAT PAYS

                Three rows were drawn identically, so the row that decides
                the money looked exactly like the two that decorate it. A
                player could not tell where to look. This is a hairline
                either side of the middle band, in the room's colour, so
                the payline reads as the payline.
               ---------------------------------------------------------- */}
            <View
                pointerEvents="none"
                style={[styles.payline, { borderColor: tint ?? theme.colors.border }]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    reelContainer: {
        width: 72,
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
    payline: {
        position: 'absolute',
        top: SYMBOL_HEIGHT,
        height: SYMBOL_HEIGHT,
        left: 0,
        right: 0,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        // No fill: a tinted band would sit under the icons and fight the
        // colour they are carrying. Two lines say the same thing.
        backgroundColor: 'transparent',
    },
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
