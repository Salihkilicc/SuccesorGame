import React, { useRef } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { CasinoTheme } from '../data/casinoData';
import { theme } from '../../../core/theme';

interface CustomChipSelectorProps {
    chips: number[];
    selectedChip: number;
    onSelect: (val: number) => void;
    gameTheme: CasinoTheme;
    /**
     * A smaller rail, for a screen that needs the height elsewhere.
     *
     * Asked for on roulette: "make the bet size part smaller, and stretch the
     * roulette further down". Those are the same request from both ends - the
     * dock and the betting grid are competing for the same screen, and the
     * grid is the thing being played on.
     *
     * A prop rather than a second component, and rather than shrinking the
     * rail everywhere: blackjack and the slot have room and their chips are
     * the only control they have.
     */
    compact?: boolean;
}

const ChipItem = ({
    value,
    isSelected,
    onSelect,
    color,
    compact,
}: {
    value: number;
    isSelected: boolean;
    onSelect: (val: number) => void;
    color: string;
    compact?: boolean;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 1.06,
            useNativeDriver: true,
            speed: 30,
            bounciness: 2,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 30,
            bounciness: 2,
        }).start();
    };

    const formatValue = (val: number) => {
        if (val >= 1_000_000_000) return `$${val / 1_000_000_000}B`;
        if (val >= 1_000_000) return `$${val / 1_000_000}M`;
        if (val >= 1_000) return `$${val / 1_000}k`;
        return `$${val}`;
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => onSelect(value)}
            style={{ alignItems: 'center', marginHorizontal: compact ? 4 : 6 }}
        >
            <Animated.View
                style={[
                    styles.chipContainer,
                    compact && styles.chipContainerSmall,
                    {
                        borderColor: color,
                        backgroundColor: isSelected ? color : 'transparent',
                        transform: [{ scale: scaleAnim }],
                        shadowColor: color,
                        shadowOpacity: isSelected ? 0.6 : 0,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: isSelected ? 5 : 0,
                    },
                ]}
            >
                <View style={[
                    styles.chipInner,
                    compact && styles.chipInnerSmall,
                    { borderColor: isSelected ? '#FFFFFF' : color },
                ]}>
                    <Text
                        style={[
                            styles.chipText,
                            compact && styles.chipTextSmall,
                            { color: isSelected ? '#FFFFFF' : color, fontWeight: '800' },
                        ]}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                    >
                        {formatValue(value)}
                    </Text>
                </View>
            </Animated.View>
        </Pressable>
    );
};

export const CustomChipSelector = ({ chips, selectedChip, onSelect, gameTheme, compact }: CustomChipSelectorProps) => {
    useLocale();
    return (
        <View style={[styles.container, compact && styles.containerSmall]}>
            <Text style={styles.label}>{t('ui.betSize')}</Text>
            <View style={styles.row}>
                {chips.map((chipVal) => (
                    <ChipItem
                        key={chipVal}
                        value={chipVal}
                        isSelected={selectedChip === chipVal}
                        onSelect={onSelect}
                        color={gameTheme.chipColor}
                        compact={compact}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
        alignItems: 'center',
        gap: 8,
    },
    /** The same rail with the air taken out of it. */
    containerSmall: {
        marginVertical: 4,
        gap: 4,
    },
    label: {
        color: theme.colors.textSecondary,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    chipContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 1,
        borderStyle: 'dashed', // Dashed border for poker chip look
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
    },
    chipInner: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipText: {
        fontSize: 12,
    },

    // ----------------------------------------------------------------------
    //  THE COMPACT RAIL
    // ----------------------------------------------------------------------
    //  64 points of chip plus 24 of margin is 88 points of dock, on a screen
    //  whose whole job is a betting grid that does not fit. Forty four still
    //  reads as a chip and still takes a thumb, and it hands about forty
    //  points back to the table. See screens/RouletteGameScreen.tsx.
    // ----------------------------------------------------------------------
    chipContainerSmall: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    chipInnerSmall: {
        width: 37,
        height: 37,
        borderRadius: 18.5,
    },
    chipTextSmall: {
        fontSize: 10,
    },
});
