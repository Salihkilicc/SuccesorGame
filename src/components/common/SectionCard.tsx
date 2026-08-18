import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';
import InfoDot from './InfoDot';

type SectionCardProps = {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    rightText?: string;
    rightContent?: React.ReactNode;
    info?: { title: string; text: string; detail?: string };
    onPress?: () => void;
    style?: any;
    danger?: boolean;
    selected?: boolean;
    disabled?: boolean;
};

const SectionCard = ({ title, subtitle, icon, rightText, rightContent, info, onPress, style, danger, selected, disabled }: SectionCardProps) => {
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
            {icon ? (
                <View style={styles.iconContainer}>
                    {icon}
                </View>
            ) : null}
            <View style={styles.content}>
                <Text style={[styles.title, danger && styles.dangerText, selected && styles.selectedText]}>{title}</Text>
                {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            <View style={styles.rightWrap}>
                {info && (
                    <InfoDot title={info.title} text={info.text} detail={info.detail} />
                )}
                {rightContent}
                {rightText && (
                    <Text style={[styles.rightText, danger && styles.dangerText, selected && styles.selectedText]}>{rightText}</Text>
                )}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#434B50', // Dark Gray
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        marginBottom: theme.spacing.sm,
    },
    iconContainer: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    dangerCard: {
        backgroundColor: 'rgba(5,168,246,0.1)',
        borderColor: 'rgba(255,255,255,0.08)',
    },
    selectedCard: {
        borderColor: 'rgba(255,255,255,0.08)', // Gold
        backgroundColor: '#434B50',
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
        color: '#FFFFFF', // Apple Blue
    },
    rightWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dangerText: {
        color: theme.colors.warning,
    },
    selectedText: {
        color: theme.colors.textPrimary, // Gold
    },
});

export default SectionCard;
