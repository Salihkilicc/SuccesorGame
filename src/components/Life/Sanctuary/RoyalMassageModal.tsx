import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { theme } from '../../../theme';
import GameModal from '../../common/GameModal';
import GameButton from '../../common/GameButton';

import { useStatsStore } from '../../../store/useStatsStore';
import { usePlayerStore } from '../../../store/usePlayerStore';

type RoyalMassageModalProps = {
    visible: boolean;
    onClose: () => void;
    handleServicePurchase: (
        cost: number,
        statUpdates: Record<string, number>,
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
        <GameModal
            visible={visible}
            onClose={onClose}
            title="ROYAL MASSAGE"
            subtitle="Rejuvenate your body and soul">

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {MASSAGE_OPTIONS.map((option) => (
                    <Pressable
                        key={option.name}
                        style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
                        onPress={() => {
                            const { core } = usePlayerStore.getState();
                            handleServicePurchase(
                                option.cost,
                                {
                                    stress: Math.max(0, core.stress - option.stress),
                                    health: Math.min(100, core.health + option.health)
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

            <GameButton
                title="Close"
                variant="ghost"
                onPress={onClose}
                style={{ marginTop: 24 }}
            />
        </GameModal>
    );
};

export default RoyalMassageModal;

const styles = StyleSheet.create({
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
});
