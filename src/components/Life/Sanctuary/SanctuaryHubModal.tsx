import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { theme } from '../../../theme';

type SanctuaryHubModalProps = {
    visible: boolean;
    onClose: () => void;
    onOpenGrooming: () => void;
    onOpenMassage: () => void;
    onOpenSunStudio: () => void;
    onOpenSurgery: () => void;
};

const SanctuaryHubModal = ({
    visible,
    onClose,
    onOpenGrooming,
    onOpenMassage,
    onOpenSunStudio,
    onOpenSurgery,
}: SanctuaryHubModalProps) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.headerTitle}>THE WELLNESS SANCTUARY</Text>
                    <Text style={styles.headerSubtitle}>Luxury Care & Aesthetic Perfection</Text>

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

                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Leave Sanctuary</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
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

export default SanctuaryHubModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    container: {
        width: '100%',
        backgroundColor: '#1A1D24', // Dark medical premium
        borderRadius: theme.radius.lg,
        padding: theme.spacing.xl,
        borderWidth: 1,
        borderColor: '#C5A065', // Gold border
        shadowColor: '#C5A065',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#F0F0F0',
        textAlign: 'center',
        letterSpacing: 2,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#8A9BA8', // Soft Muted Blue
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
        fontStyle: 'italic',
    },
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
    closeButton: {
        marginTop: theme.spacing.xl,
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    closeButtonText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});
