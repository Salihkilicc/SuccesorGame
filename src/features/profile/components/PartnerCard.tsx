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
import { t, useLocale } from '../../../core/i18n';
import { translateSocialClass } from '../../../data/i18n/profileLoveShopText';
import Portrait from '../../../components/common/Portrait';
import { faceFor } from '../../../core/portraits/faces';

interface PartnerCardProps {
    partner: PartnerProfile | null;
    onPress: () => void;
}

export const PartnerCard: React.FC<PartnerCardProps> = ({
    partner,
    onPress,
}) => {
    useLocale();
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
                    <Text style={styles.emptyTitle}>{t('partner.findPartner')}</Text>
                    <Text style={styles.emptySubtitle}>
                        {t('partner.findPartnerSub')}
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
    const statusLabel = isMarried ? t('partner.married') : t('partner.dating');
    const socialClassLabel = translateSocialClass(partner.stats.socialClass);

    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={onPress}
        >
            {/* ------------------------------------------------------------
                THE PARTNER ROW THE PLAYER ACTUALLY SEES.

                There are two components called PartnerCard. The other one,
                in features/love, is the big card with the picture across the
                top - and NOTHING IMPORTS IT. It was wired up first, and the
                faces went into a component no screen renders; the test
                passed because it mounted the component directly. This is the
                one ProfileScreen puts on the page.

                A partner with no gender on record keeps their initials.
                gender is optional on PartnerProfile because saves older than
                the field have none, and guessing is a coin flip on the one
                person the player sees most.
               ------------------------------------------------------------ */}
            <Portrait
                id={partner.id}
                name={partner.name}
                size={44}
                borderWidth={0}
                fill={theme.colors.surfaceRaised}
                source={faceFor({
                    id: partner.id,
                    name: partner.name,
                    female: partner.gender === undefined
                        ? undefined
                        : partner.gender === 'female',
                    age: partner.stats?.age,
                }) as number | null}
                style={styles.avatar}
            />

            {/* Name and Subtitle */}
            <View style={styles.infoBlock}>
                <Text style={styles.partnerName} numberOfLines={1}>
                    {partner.name}
                </Text>
                <Text style={styles.partnerSub}>
                    {t('partner.partner')} • {statusLabel} • {socialClassLabel}
                </Text>
            </View>

            {/* Relationship Score Pill + Chevron */}
            <View style={styles.rightBlock}>
                <View style={styles.lovePill}>
                    <Text style={styles.loveText}>
                        {t('partner.lovePercent', { pct: String(lovePercent) })}
                    </Text>
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
    /** Only the row spacing. The circle itself is Portrait's, through props. */
    avatar: {
        marginRight: 12,
    },
    // SHELVED, not deleted: the circle this row drew before it could hold a
    // face. Same 44 points, same radius, same raised fill, passed to Portrait
    // now so one component owns what an avatar looks like everywhere.
    //
    // avatar: {
    //     width: 44,
    //     height: 44,
    //     borderRadius: 22,
    //     backgroundColor: theme.colors.surfaceRaised,
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //     marginRight: 12,
    // },
    // avatarText: {
    //     color: theme.colors.textPrimary,
    //     fontSize: 15,
    //     fontWeight: '800',
    // },
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
