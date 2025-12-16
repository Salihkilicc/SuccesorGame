import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { theme } from '../../../theme';

import { useStatsStore } from '../../../store/useStatsStore';

type RoyalMassageModalProps = {
    visible: boolean;
    onClose: () => void;
    handleServicePurchase: (
        cost: number,
        statUpdates: Partial<typeof useStatsStore.getState>,
        resultTitle: string,
        resultMessage: string,
        displayStats: { label: string; value: string; isPositive: boolean }[]
    ) => void;
};

const MASSAGE_OPTIONS = [
    { name: 'Foot Reflexology', cost: 150, stress: 10, health: 0, desc: 'Quick relief for tired feet.' },
    { name: 'Traditional Thai Massage', cost: 300, stress: 25, health: 2, desc: 'Full body stretching and relief.' },
    { name: 'Hot Stone Therapy', cost: 500, stress: 40, health: 0, desc: 'Deep relaxation with heated stones.' },
    { name: 'Sultan’s Hamam Experience', cost: 1200, stress: 80, health: 5, desc: 'The ultimate royal cleansing ritual.' },
];

const RoyalMassageModal = ({ visible, onClose, handleServicePurchase }: RoyalMassageModalProps) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.headerTitle}>ROYAL MASSAGE</Text>
                    <Text style={styles.headerSubtitle}>Rejuvenate your body and soul</Text>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {MASSAGE_OPTIONS.map((option) => (
                            <Pressable
                                key={option.name}
                                style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
                                onPress={() => {
                                    const currentStats = useStatsStore.getState();
                                    handleServicePurchase(
                                        option.cost,
                                        {
                                            stress: Math.max(0, currentStats.stress - option.stress),
                                            health: Math.min(100, currentStats.health + option.health)
                                        },
                                        option.name,
                                        `You enjoyed a ${option.name}.`,
                                        [
                                            { label: 'Stress', value: `-${option.stress}`, isPositive: true },
                                            ...(option.health > 0 ? [{ label: 'Health', value: `+${option.health}`, isPositive: true }] : [])
                                        ]
                                    );
                                }}
                            >
                                <View style={styles.optionHeader}>
                                    <Text style={styles.optionName}>{option.name}</Text>
                                    <Text style={styles.optionCost}>${option.cost}</Text>
                                </View>
                                <Text style={styles.optionDesc}>{option.desc}</Text>
                                <View style={styles.statsRow}>
                                    <Text style={styles.statText}>Stress -{option.stress}</Text>
                                    {option.health > 0 && (
                                        <Text style={[styles.statText, styles.healthText]}>Health +{option.health}</Text>
                                    )}
                                </View>
                            </Pressable>
                        ))}
                    </ScrollView>

                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

export default RoyalMassageModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    container: {
        width: '100%',
        backgroundColor: '#1E222A',
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: '#C5A065',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#E2E8F0',
        textAlign: 'center',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#A0AEC0',
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
        fontStyle: 'italic',
    },
    scrollContent: {
        gap: theme.spacing.md,
    },
    optionCard: {
        backgroundColor: '#2D3748',
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: '#4A5568',
    },
    optionCardPressed: {
        backgroundColor: '#232730',
        borderColor: '#C5A065',
        transform: [{ scale: 0.98 }],
    },
    optionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    optionName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F7FAFC',
    },
    optionCost: {
        fontSize: 16,
        fontWeight: '700',
        color: '#C5A065',
    },
    optionDesc: {
        fontSize: 13,
        color: '#CBD5E0',
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statText: {
        fontSize: 12,
        color: '#68D391', // Green
        fontWeight: '600',
    },
    healthText: {
        color: '#63B3ED', // Blue
    },
    closeButton: {
        marginTop: theme.spacing.lg,
        alignItems: 'center',
        padding: 10,
    },
    closeButtonText: {
        color: '#A0AEC0',
        textDecorationLine: 'underline',
    },
});
