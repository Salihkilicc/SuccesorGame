import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

const SYMBOL_HEIGHT = 80;

interface ReelProps {
    symbols: string[];
    finalSymbol: string;
    isSpinning: boolean;
    delay: number;
    index: number;
}

const MOCK_STRIP = ['🍒', '🍋', '🍇', '💎', '7️⃣', '🔔', '🍀', '🍊'];

export const Reel = ({ symbols, finalSymbol, isSpinning, delay, index }: ReelProps) => {
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
                        <Text style={styles.symbol}>{sym}</Text>
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
        backgroundColor: '#0F0E0D',
        borderWidth: 1,
        borderColor: '#2A2624',
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
    symbol: {
        fontSize: 40,
    },
    shadeTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 10,
    },
    shadeBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 10,
    }
});
