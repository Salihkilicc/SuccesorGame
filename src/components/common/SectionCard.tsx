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
        backgroundColor: '#422B71', // Dark Gray
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        marginBottom: theme.spacing.sm,
    },
    dangerCard: {
        backgroundColor: 'rgba(199,52,202,0.1)',
        borderColor: 'rgba(255,255,255,0.08)',
    },
    selectedCard: {
        borderColor: 'rgba(255,255,255,0.08)', // Gold
        backgroundColor: '#422B71',
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
        color: '#FFFFFF', // White
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.48)', // Text Secondary
        marginTop: 2,
    },
    rightText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#C8C0EF', // Apple Blue
    },
    dangerText: {
        color: '#C734CA',
    },
    selectedText: {
        color: '#C734CA', // Gold
    },
});

export default SectionCard;
