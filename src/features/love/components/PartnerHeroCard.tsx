import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getPartnerPerks } from '../../../logic/relationshipLogic';
import { theme } from '../../../core/theme';
import { getLoveGradient, getPartnerBadge } from '../utils/loveUIUtils';
import type { PartnerProfile } from '../../../core/types';

interface Props {
    partner: PartnerProfile | null;
    onPress: () => void;
}

const PartnerHeroCard: React.FC<Props> = ({ partner, onPress }) => {
    useLocale();
    if (partner) {
        return (
            <Pressable onPress={onPress} style={styles.partnerCardWrapper}>
                <LinearGradient
                    {...getLoveGradient(partner.love)}
                    start={{ x: 0, y: 0.2 }}
                    end={{ x: 1, y: 0.8 }}
                    style={styles.partnerCardGradient}
                >
                    <View style={[styles.partnerInfo, { paddingLeft: 16 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <Text style={[styles.partnerName, { color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }]}>
                                {partner.name}
                            </Text>
                            <View style={[styles.partnerBadge, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)', flexShrink: 0 }]}>
                                <Text style={[styles.partnerBadgeText, { color: '#FFFFFF', fontSize: 9 }]}>{getPartnerBadge(partner, partner.love)}</Text>
                            </View>
                        </View>

                        <View style={styles.partnerStats}>
                            <Text style={[styles.partnerStatLabel, { color: 'rgba(255,255,255,0.8)' }]}>Love: {partner.love}%</Text>
                            <View style={[styles.partnerBarTrack, { backgroundColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                                <View style={[styles.partnerBarFill, { width: `${partner.love}%`, backgroundColor: '#E06B6B', shadowColor: '#E06B6B', shadowOpacity: 0.8, shadowRadius: 6 }]} />
                            </View>

                            {/* ACTIVE PERKS DISPLAY */}
                            <View style={{ marginTop: 11, width: '100%', overflow: 'hidden' }}>
                                <Text style={{ fontSize: 11.4, color: 'rgba(255,255,255,0.7)', marginBottom: 5, fontWeight: '700', letterSpacing: 0.5 }}>{t('love.activePerks')}</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ gap: 7 }}
                                >
                                    {getPartnerPerks(partner).length > 0 ? (
                                        getPartnerPerks(partner).map(perk => (
                                            <View key={perk.id} style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                backgroundColor: `${perk.color}15`,
                                                paddingVertical: 9,
                                                paddingHorizontal: 11,
                                                borderRadius: 12,
                                                borderLeftWidth: 3,
                                                borderLeftColor: perk.color,
                                                minWidth: 152,
                                                maxWidth: 228
                                            }}>
                                                <Text style={{ fontSize: 22.8, marginRight: 9 }}>{perk.icon}</Text>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{
                                                        color: perk.color,
                                                        fontSize: 11,
                                                        fontWeight: 'bold',
                                                        marginBottom: 2
                                                    }}>
                                                        {perk.title}
                                                    </Text>
                                                    <Text style={{
                                                        color: theme.colors.textSecondary,
                                                        fontSize: 9,
                                                        lineHeight: 11
                                                    }}>
                                                        {perk.desc}
                                                    </Text>
                                                </View>
                                            </View>
                                        ))
                                    ) : (
                                        <View style={{
                                            padding: 12,
                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                            borderRadius: 12,
                                            borderWidth: 1,
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            width: '100%'
                                        }}>
                                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontStyle: 'italic' }}>{t('love.yourPartnerHasNoActive')}</Text>
                                        </View>
                                    )}
                                </ScrollView>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </Pressable>
        );
    }

    // No Partner Fallback
    return (
        <View style={styles.partnerCardWrapper}>
            <LinearGradient
                colors={['#000000', '#31241F', '#523F3E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.partnerCardGradient, { opacity: 0.8 }]}
            >
                <View style={[styles.partnerPhotoContainer, { borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                    <Text style={styles.noPartnerIcon}>?</Text>
                </View>
                <View style={styles.partnerInfo}>
                    <Text style={[styles.partnerName, { color: 'rgba(255,255,255,0.7)' }]}>{t('love.noPartner')}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>{t('love.maybeItSTimeTo')}</Text>
                </View>
            </LinearGradient>
        </View>
    );
};

export default PartnerHeroCard;

const styles = StyleSheet.create({
    partnerCardWrapper: {
        width: '105%',
        marginBottom: 12,
    },
    partnerCardGradient: {
        borderRadius: 26,
        padding: 0,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        shadowColor: '#E06B6B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 18,
        elevation: 10,
    },
    partnerPhotoContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.8)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    noPartnerIcon: {
        fontSize: 28,
        color: theme.colors.textMuted,
    },
    partnerInfo: {
        flex: 1,
        gap: 4,
        overflow: 'hidden',
        paddingVertical: 16,
        paddingRight: 16,
    },
    partnerName: {
        color: theme.colors.textPrimary,
        fontSize: 15,
        fontWeight: '800',
        flexShrink: 1,
    },
    partnerStats: {
        gap: 2,
    },
    partnerStatLabel: {
        color: theme.colors.accent,
        fontSize: 10,
        fontWeight: '700',
    },
    partnerBarTrack: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 999,
        overflow: 'hidden',
        marginTop: 2,
    },
    partnerBarFill: {
        height: '100%',
        backgroundColor: theme.colors.accent,
    },
    partnerBadge: {
        backgroundColor: theme.colors.accent,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
    },
    partnerBadgeText: {
        color: theme.colors.background,
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
});
