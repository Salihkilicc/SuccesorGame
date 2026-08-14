import React from 'react';
import { t, useLocale } from '../../../../../core/i18n';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../../../../../core/theme';

type SanctuaryMenuGridProps = {
    onOpenGrooming: () => void;
    onOpenMassage: () => void;
    onOpenSunStudio: () => void;
    onOpenSurgery: () => void;
    onBuyMembership: () => void;
    isVIPMember: boolean;
};

const HubCard = ({
    icon,
    title,
    subtitle,
    onPress,
    isDanger = false,
    isVIP = false,
}: {
    icon: string;
    title: string;
    subtitle: string;
    onPress: () => void;
    isDanger?: boolean;
    isVIP?: boolean;
}) => (
    <Pressable
        onPress={onPress}
        style={({ pressed }) => [
            styles.card,
            isDanger && styles.dangerCard,
            isVIP && styles.vipCard,
            pressed && styles.cardPressed,
        ]}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, isDanger && styles.dangerText, isVIP && styles.vipText]}>
                {title}
            </Text>
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.chevron}>→</Text>
    </Pressable>
);

const SanctuaryMenuGrid = ({
    onOpenGrooming,
    onOpenMassage,
    onOpenSunStudio,
    onOpenSurgery,
    onBuyMembership,
    isVIPMember,
}: SanctuaryMenuGridProps) => {
    useLocale();
    return (
        <View style={styles.grid}>
            {/* VIP MEMBERSHIP CARD */}
            {!isVIPMember && (
                <HubCard
                    icon="👑"
                    title={t('life.vipPlatinumAccess')}
                    subtitle="$20,000, FREE Massages This Quarter"
                    onPress={onBuyMembership}
                    isVIP
                />
            )}
            {isVIPMember && (
                <View style={styles.vipActiveBanner}>
                    <Text style={styles.vipActiveIcon}>👑</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.vipActiveTitle}>{t('life.vipPlatinumMember')}</Text>
                        <Text style={styles.vipActiveText}>{t('life.allMassagesAreFreeThis')}</Text>
                    </View>
                </View>
            )}

            <HubCard
                icon="💈"
                title={t('life.groomingLounge')}
                subtitle={t('life.hairBeardStyle')}
                onPress={onOpenGrooming}
            />
            <HubCard
                icon="💆"
                title={t('life.royalMassage')}
                subtitle={t('life.thaiDeepTissueMore')}
                onPress={onOpenMassage}
            />
            <HubCard
                icon="☀️"
                title={t('life.sunStudio2')}
                subtitle={t('life.tanningSkinCare')}
                onPress={onOpenSunStudio}
            />
            <HubCard
                icon="💉"
                title={t('life.plasticSurgeryClinic')}
                subtitle={t('life.highRiskHighReward')}
                isDanger
                onPress={onOpenSurgery}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    grid: {
        gap: theme.spacing.md,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#434B50', // Dark Navy
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)', // Deep Forest Green
    },
    dangerCard: {
        borderColor: 'rgba(255,255,255,0.48)', // Bamboo
        backgroundColor: '#434B50',
    },
    vipCard: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)', // Light Green
        backgroundColor: '#CFD0D2', // Dark Pine
    },
    cardPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.99 }],
    },
    cardIcon: {
        fontSize: 24,
        marginRight: theme.spacing.md,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    dangerText: {
        color: '#FFFFFF',
    },
    vipText: {
        color: theme.colors.onLight,
    },
    cardSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.48)',
    },
    chevron: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.48)',
    },
    vipActiveBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#434B50',
        borderRadius: theme.radius.md,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        gap: 10,
    },
    vipActiveIcon: {
        fontSize: 28,
    },
    vipActiveTitle: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
        marginBottom: 2,
    },
    vipActiveText: {
        color: '#FFFFFF',
        fontSize: 12,
    },
});

export default SanctuaryMenuGrid;
