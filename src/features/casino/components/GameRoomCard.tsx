// src/features/casino/components/GameRoomCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, ImageSourcePropType } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { t, useLocale } from '../../../core/i18n';
import { theme } from '../../../core/theme';

interface GameRoomCardProps {
    title: string;
    subtitle: string;
    image: ImageSourcePropType;
    onPress: () => void;
    locked?: boolean;
    themeColor?: string;
    accentGlow?: string;
    iconName?: string;
    badgeText?: string;
}

export const GameRoomCard: React.FC<GameRoomCardProps> = ({
    title,
    subtitle,
    image,
    onPress,
    locked = false,
    themeColor = theme.colors.primary,
    accentGlow = 'rgba(5, 168, 246, 0.25)',
    iconName = 'cards-playing-outline',
    badgeText,
}) => {
    useLocale();

    return (
        <Pressable
            onPress={locked ? undefined : onPress}
            style={({ pressed }) => [
                styles.container,
                { borderColor: locked ? 'rgba(255,255,255,0.06)' : accentGlow },
                pressed && !locked && styles.pressed,
                locked && styles.lockedContainer,
            ]}
        >
            <Image source={image} style={[styles.image, locked && styles.lockedImage]} resizeMode="cover" />

            {/* Dark Ambient Overlay Gradient */}
            <LinearGradient
                colors={['rgba(28, 36, 44, 0.25)', 'rgba(28, 36, 44, 0.88)', '#1C242C']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />

            {/* Top Badge (Stakes / Type) */}
            {badgeText && !locked && (
                <View style={[styles.topBadge, { backgroundColor: 'rgba(28, 36, 44, 0.7)', borderColor: themeColor }]}>
                    <Text style={[styles.topBadgeText, { color: themeColor }]}>{badgeText}</Text>
                </View>
            )}

            {/* Content Body */}
            <View style={styles.content}>
                <View style={styles.textBlock}>
                    <View style={styles.titleRow}>
                        <MaterialCommunityIcons name={iconName} size={20} color={locked ? theme.colors.textMuted : themeColor} />
                        <Text style={styles.title}>{title.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                </View>

                {!locked ? (
                    <View style={[styles.playButton, { backgroundColor: themeColor }]}>
                        <Text style={styles.playText}>{t('ui.play2') || 'PLAY'}</Text>
                        <MaterialCommunityIcons name="chevron-right" size={16} color="#000000" />
                    </View>
                ) : (
                    <View style={styles.lockBadge}>
                        <MaterialCommunityIcons name="lock" size={14} color={theme.colors.textMuted} />
                        <Text style={styles.lockText}>{t('ui.comingSoon') || 'LOCKED'}</Text>
                    </View>
                )}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 156,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
        marginBottom: 14,
        elevation: 4,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        borderWidth: 1.5,
    },
    pressed: {
        transform: [{ scale: 0.985 }],
        opacity: 0.92,
    },
    lockedContainer: {
        borderColor: 'rgba(255,255,255,0.06)',
    },
    image: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    lockedImage: {
        opacity: 0.25,
    },
    topBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        zIndex: 2,
    },
    topBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: 16,
        zIndex: 1,
    },
    textBlock: {
        flex: 1,
        gap: 3,
        paddingRight: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    playText: {
        color: '#000000',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0.6,
    },
    lockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(28,36,44,0.7)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    lockText: {
        color: theme.colors.textMuted,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
