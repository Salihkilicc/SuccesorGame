import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../core/theme';

type GameButtonProps = {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'danger' | 'ghost' | 'secondary';
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
};

const GameButton = ({ onPress, title, variant = 'primary', style, textStyle, disabled }: GameButtonProps) => {
    const getButtonStyle = () => {
        switch (variant) {
            case 'danger': return styles.dangerButton;
            case 'ghost': return styles.ghostButton;
            case 'secondary': return styles.secondaryButton;
            default: return styles.primaryButton;
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'danger': return styles.dangerText;
            case 'ghost': return styles.ghostText;
            case 'secondary': return styles.secondaryText;
            default: return styles.primaryText;
        }
    };

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
                styles.baseButton,
                getButtonStyle(),
                pressed && styles.pressed,
                disabled && styles.disabled,
                style
            ]}>
            <Text style={[styles.baseText, getTextStyle(), textStyle]}>{title}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    baseButton: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    disabled: {
        opacity: 0.5,
    },
    baseText: {
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    // Primary
    primaryButton: {
        backgroundColor: '#C5A065', // Gold
        borderColor: '#C5A065',
    },
    primaryText: {
        color: '#1A202C',
    },
    // Secondary
    secondaryButton: {
        backgroundColor: '#2D3748',
        borderColor: '#4A5568',
    },
    secondaryText: {
        color: '#E2E8F0',
    },
    // Danger
    dangerButton: {
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderColor: '#FF6B6B',
    },
    dangerText: {
        color: '#FF6B6B',
    },
    // Ghost
    ghostButton: {
        backgroundColor: 'transparent',
    },
    ghostText: {
        color: theme.colors.textSecondary,
        textDecorationLine: 'underline',
    },
});

export default GameButton;
