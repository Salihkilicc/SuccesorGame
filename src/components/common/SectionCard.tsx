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
        backgroundColor: '#0F0E0D', // Dark Gray
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: theme.spacing.sm,
    },
    dangerCard: {
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderColor: '#E06B6B',
    },
    selectedCard: {
        borderColor: '#E9B8C9', // Gold
        backgroundColor: '#0F0E0D',
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
        color: '#EDE8E4', // White
    },
    subtitle: {
        fontSize: 12,
        color: '#8A807B', // Text Secondary
        marginTop: 2,
    },
    rightText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#123AB8', // Apple Blue
    },
    dangerText: {
        color: '#E06B6B',
    },
    selectedText: {
        color: '#E9B8C9', // Gold
    },
});

export default SectionCard;
