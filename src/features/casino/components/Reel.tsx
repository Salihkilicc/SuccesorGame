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

export const Reel = ({ finalSymbol, isSpinning, delay, index }: ReelProps) => {
    // Standard Animated Value
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isSpinning) {
            // Spin Loop
            translateY.setValue(0);

            Animated.loop(
                Animated.timing(translateY, {
                    toValue: -SYMBOL_HEIGHT * MOCK_STRIP.length,
                    duration: 500, // Speed of one full loop
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();

        } else {
            // Stop logic
            // We want to stop after the delay
            // Since we can't easily "cancel and land" in standard animated loops without some math,
            // we will stop the loop and then animate to the target.

            // Wait for delay
            setTimeout(() => {
                // Stop the loop
                translateY.stopAnimation((currentValue) => {
                    // Calculate nearest slot or just reset and land?
                    // For smoothness, let's reset to 0 (top) and slide to the target index.

                    const symbolIndex = MOCK_STRIP.indexOf(finalSymbol);
                    const targetIndex = symbolIndex !== -1 ? symbolIndex : 0;

                    // Instant reset to top (virtual wrap) - in a real app we'd calc the offset
                    translateY.setValue(0);

                    Animated.sequence([
                        // Bounce effect landing
                        Animated.timing(translateY, {
                            toValue: -targetIndex * SYMBOL_HEIGHT,
                            duration: 800,
                            easing: Easing.out(Easing.bounce),
                            useNativeDriver: true
                        })
                    ]).start();
                });
            }, delay);
        }
    }, [isSpinning, finalSymbol, delay]);

    return (
        <View style={styles.reelContainer}>
            <Animated.View style={[styles.strip, { transform: [{ translateY }] }]}>
                {/* Render the strip repeatedly for the loop illusion */}
                {[...MOCK_STRIP, ...MOCK_STRIP].map((sym, i) => (
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
        backgroundColor: '#111827',
        borderWidth: 1,
        borderColor: '#374151',
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
