import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';

type SectionCardProps = {
    title: string;
    subtitle?: string;
    rightText?: string;
    onPress?: () => void;
    style?: any;
    danger?: boolean;
    selected?: boolean;
    disabled?: boolean;
};

const SectionCard = ({ title, subtitle, rightText, onPress, style, danger, selected, disabled }: SectionCardProps) => {
    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            disabled={disabled || !onPress}
            style={({ pressed }) => [
                styles.card,
                danger && styles.dangerCard,
                selected && styles.selectedCard,
                disabled && { opacity: 0.5 },
                pressed && onPress && !disabled && styles.pressed,
                style
            ]}>
            <View style={styles.content}>
                <Text style={[styles.title, danger && styles.dangerText, selected && styles.selectedText]}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {rightText && (
                <Text style={[styles.rightText, danger && styles.dangerText, selected && styles.selectedText]}>{rightText}</Text>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#2D3748',
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: '#4A5568',
        marginBottom: theme.spacing.sm,
    },
    dangerCard: {
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderColor: '#FF6B6B',
    },
    selectedCard: {
        borderColor: '#C5A065',
        backgroundColor: '#232730',
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.99 }],
    },
    content: {
        flex: 1,
        marginRight: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E2E8F0',
    },
    subtitle: {
        fontSize: 12,
        color: '#A0AEC0',
        marginTop: 2,
    },
    rightText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#C5A065',
    },
    dangerText: {
        color: '#FF6B6B',
    },
    selectedText: {
        color: '#C5A065',
    },
});

export default SectionCard;
