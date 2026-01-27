import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Vibration, Platform } from 'react-native';
import { CasinoTheme } from '../data/casinoData';
import { theme } from '../../../core/theme';

interface CustomChipSelectorProps {
    chips: number[];
    selectedChip: number;
    onSelect: (val: number) => void;
    gameTheme: CasinoTheme;
}

const ChipItem = ({
    value,
    isSelected,
    onSelect,
    color
}: {
    value: number;
    isSelected: boolean;
    onSelect: (val: number) => void;
    color: string;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 1.2,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10,
        }).start();

        // Haptic feedback simulation
        if (Platform.OS === 'ios') {
            const type = isSelected ? 'impactLight' : 'selection'; // Logical placeholder if using expo-haptics, but here we use Vibration
            Vibration.vibrate(10); // Light vibration
        } else {
            Vibration.vibrate(20);
        }
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10,
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
            style={{ alignItems: 'center', marginHorizontal: 6 }}
        >
            <Animated.View
                style={[
                    styles.chipContainer,
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
                <View style={[styles.chipInner, { borderColor: isSelected ? '#FFF' : color }]}>
                    <Text
                        style={[
                            styles.chipText,
                            { color: isSelected ? '#FFF' : color, fontWeight: '800' },
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

export const CustomChipSelector = ({ chips, selectedChip, onSelect, gameTheme }: CustomChipSelectorProps) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>BET SIZE</Text>
            <View style={styles.row}>
                {chips.map((chipVal) => (
                    <ChipItem
                        key={chipVal}
                        value={chipVal}
                        isSelected={selectedChip === chipVal}
                        onSelect={onSelect}
                        color={gameTheme.chipColor}
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
        borderWidth: 2,
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
});
