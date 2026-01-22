import React from 'react';
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
    return (
        <View style={styles.grid}>
            {/* VIP MEMBERSHIP CARD */}
            {!isVIPMember && (
                <HubCard
                    icon="👑"
                    title="VIP Platinum Access"
                    subtitle="$20,000 - FREE Massages This Quarter"
                    onPress={onBuyMembership}
                    isVIP
                />
            )}
            {isVIPMember && (
                <View style={styles.vipActiveBanner}>
                    <Text style={styles.vipActiveIcon}>👑</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.vipActiveTitle}>VIP Platinum Member</Text>
                        <Text style={styles.vipActiveText}>All massages are FREE this quarter!</Text>
                    </View>
                </View>
            )}

            <HubCard
                icon="💈"
                title="Grooming Lounge"
                subtitle="Hair, Beard & Style"
                onPress={onOpenGrooming}
            />
            <HubCard
                icon="💆"
                title="Royal Massage"
                subtitle="Thai, Deep Tissue & More"
                onPress={onOpenMassage}
            />
            <HubCard
                icon="☀️"
                title="Sun Studio"
                subtitle="Tanning & Skin Care"
                onPress={onOpenSunStudio}
            />
            <HubCard
                icon="💉"
                title="Plastic Surgery Clinic"
                subtitle="High Risk, High Reward"
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
        backgroundColor: '#232730',
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: '#2E3540',
    },
    dangerCard: {
        borderColor: '#552222',
        backgroundColor: '#2A1A1A',
    },
    vipCard: {
        borderWidth: 2,
        borderColor: '#C5A065',
        backgroundColor: '#2A2520',
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
        color: '#E0E0E0',
        marginBottom: 2,
    },
    dangerText: {
        color: '#FF6B6B',
    },
    vipText: {
        color: '#C5A065',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#8A9BA8',
    },
    chevron: {
        fontSize: 18,
        color: theme.colors.textMuted,
    },
    vipActiveBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#C5A06520',
        borderRadius: theme.radius.md,
        padding: 12,
        borderWidth: 2,
        borderColor: '#C5A065',
        gap: 10,
    },
    vipActiveIcon: {
        fontSize: 28,
    },
    vipActiveTitle: {
        color: '#C5A065',
        fontWeight: '700',
        fontSize: 15,
        marginBottom: 2,
    },
    vipActiveText: {
        color: '#F7FAFC',
        fontSize: 12,
    },
});

export default SanctuaryMenuGrid;
