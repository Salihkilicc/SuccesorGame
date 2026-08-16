// src/features/profile/components/PartnerCard.tsx
//
// ============================================================================
//  PARTNER ROW COMPONENT
// ============================================================================
//
//  Clean, minimal row showing Partner Name, relationship status/love level,
//  and a right chevron. Tapping opens the full Partner Dossier Modal.
//
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';
import { PartnerProfile } from '../../../data/relationshipTypes';

interface PartnerCardProps {
    partner: PartnerProfile | null;
    onPress: () => void;
}

export const PartnerCard: React.FC<PartnerCardProps> = ({
    partner,
    onPress,
}) => {
    if (!partner) {
        return (
            <Pressable
                style={({ pressed }) => [styles.emptyCard, pressed && styles.cardPressed]}
                onPress={onPress}
            >
                <View style={styles.emptyAvatar}>
                    <MaterialCommunityIcons name="heart-plus" size={24} color="#05A8F6" />
                </View>
                <View style={styles.infoBlock}>
                    <Text style={styles.emptyTitle}>FIND A ROMANTIC PARTNER</Text>
                    <Text style={styles.emptySubtitle}>
                        VIP Lounge, Galas & Elite Encounters
                    </Text>
                </View>
                <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color={theme.colors.textMuted}
                />
            </Pressable>
        );
    }

    const lovePercent = Math.max(0, Math.min(100, partner.love));
    const isMarried = partner.isMarried;
    const initials = partner.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={onPress}
        >
            {/* Avatar Initials */}
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
            </View>

            {/* Name and Subtitle */}
            <View style={styles.infoBlock}>
                <Text style={styles.partnerName} numberOfLines={1}>
                    {partner.name}
                </Text>
                <Text style={styles.partnerSub}>
                    Partner • {isMarried ? 'Married' : 'Dating'} • {partner.stats.socialClass}
                </Text>
            </View>

            {/* Relationship Score Pill + Chevron */}
            <View style={styles.rightBlock}>
                <View style={styles.lovePill}>
                    <Text style={styles.loveText}>{lovePercent}% Love</Text>
                </View>
                <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color={theme.colors.textMuted}
                />
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface, // Solid surface, NO border
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardPressed: {
        backgroundColor: theme.colors.surfaceRaised,
        transform: [{ scale: 0.99 }],
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.surfaceRaised,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: theme.colors.textPrimary,
        fontSize: 15,
        fontWeight: '800',
    },
    infoBlock: {
        flex: 1,
        justifyContent: 'center',
    },
    partnerName: {
        color: theme.colors.textPrimary,
        fontSize: 16,
        fontWeight: '700',
    },
    partnerSub: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    rightBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    lovePill: {
        backgroundColor: '#183D5C',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    loveText: {
        color: '#7DD3FC',
        fontSize: 11,
        fontWeight: '700',
    },
    emptyCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    emptyAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#183D5C',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    emptyTitle: {
        color: '#05A8F6',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    emptySubtitle: {
        color: theme.colors.textMuted,
        fontSize: 12,
    },
});

export default PartnerCard;
