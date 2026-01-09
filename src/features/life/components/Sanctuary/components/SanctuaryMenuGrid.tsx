import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../../../../../core/theme';

type SanctuaryMenuGridProps = {
    onOpenGrooming: () => void;
    onOpenMassage: () => void;
    onOpenSunStudio: () => void;
    onOpenSurgery: () => void;
};

const HubCard = ({
    icon,
    title,
    subtitle,
    onPress,
    isDanger = false,
}: {
    icon: string;
    title: string;
    subtitle: string;
    onPress: () => void;
    isDanger?: boolean;
}) => (
    <Pressable
        onPress={onPress}
        style={({ pressed }) => [
            styles.card,
            isDanger && styles.dangerCard,
            pressed && styles.cardPressed,
        ]}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, isDanger && styles.dangerText]}>
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
}: SanctuaryMenuGridProps) => {
    return (
        <View style={styles.grid}>
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
    cardSubtitle: {
        fontSize: 12,
        color: '#8A9BA8',
    },
    chevron: {
        fontSize: 18,
        color: theme.colors.textMuted,
    },
});

export default SanctuaryMenuGrid;
