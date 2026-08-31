// src/features/casino/components/GameRoomCard.tsx
//
// ============================================================================
//  THE FOUR CARDS THAT WERE SHOWING NOTHING
// ============================================================================
//
//  Reported as "fotolari yok", and they were not: the four thumbnails are
//  JPEGs with a .png extension.
//
//      blackjack_thumb.png   FFD8FF ... JFIF     670 KB
//      poker_thumb.png       FFD8FF ... JFIF     676 KB
//      roulette_thumb.png    FFD8FF ... JFIF     640 KB
//      slots_thumb.png       FFD8FF ... JFIF     575 KB
//
//  Metro decides how to decode an asset from its extension, so every one of
//  them failed and the cards drew an empty box under the gradient. Two and a
//  half megabytes of bundle for four blank rectangles.
//
//  ---------------------------------------------------------------------------
//  AND THE REPLACEMENT IS NOT A CORRECTED PHOTOGRAPH
//  ---------------------------------------------------------------------------
//  Asked for directly: "sen oyuna uygun sembol temasina uygun her birine bul
//  resimlerinin yerine koy". Which is the better answer anyway. Each casino
//  already carries a full palette in data/casinoData.ts - a primary, a glow,
//  a gradient - and a photograph fights all of it. A large symbol in the
//  room's own colour makes Athens and Macau look like different places
//  without four more files to keep in step.
//
//  The `image` prop is gone. Nothing on the card reads a file now.
// ============================================================================
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { t, useLocale } from '../../../core/i18n';
import { theme } from '../../../core/theme';
import { translateCasinoBadge } from '../../../data/i18n/casinoText';

interface GameRoomCardProps {
    title: string;
    subtitle: string;
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
    onPress,
    locked = false,
    themeColor = theme.colors.primary,
    accentGlow = 'rgba(5, 168, 246, 0.25)',
    iconName = 'cards-playing-outline',
    badgeText,
}) => {
    useLocale();
    const displayBadge = badgeText ? translateCasinoBadge(badgeText) : '';

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
            {/* The room's own colour, washing out downwards so the text at
                the bottom sits on the ground rather than on the colour. */}
            <LinearGradient
                colors={[
                    locked ? 'rgba(255,255,255,0.03)' : accentGlow,
                    'rgba(28, 36, 44, 0.85)',
                    '#1C242C',
                ]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 1 }}
            />

            {/* The symbol, oversized and half off the edge, which is what a
                photograph was doing badly. Faint, because the title has to
                stay the loudest thing on the card. */}
            <MaterialCommunityIcons
                name={iconName}
                size={128}
                color={locked ? theme.colors.textMuted : themeColor}
                style={styles.watermark}
            />

            {/* Top Badge (Stakes / Type) */}
            {displayBadge !== '' && !locked && (
                <View style={[styles.topBadge, { backgroundColor: 'rgba(28, 36, 44, 0.7)', borderColor: themeColor }]}>
                    <Text style={[styles.topBadgeText, { color: themeColor }]}>{displayBadge}</Text>
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
                        <Text style={styles.lockText}>{t('ui.locked') || 'LOCKED'}</Text>
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
    watermark: {
        position: 'absolute',
        right: -18,
        top: -10,
        opacity: 0.22,
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
