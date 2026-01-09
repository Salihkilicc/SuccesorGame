import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../../../core/theme';
import { useStatsStore } from '../../../../core/store/useStatsStore';
import { usePlayerStore } from '../../../../core/store/usePlayerStore';
import GameModal from '../../../../components/common/GameModal';
import GameButton from '../../../../components/common/GameButton';

type SunStudioModalProps = {
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

const SunStudioModal = ({ visible, onClose, handleServicePurchase }: SunStudioModalProps) => {
    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title="SUN STUDIO"
            subtitle="Achieve the perfect glow">

            <View style={styles.options}>
                {/* SPRAY TAN */}
                <Pressable
                    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                    onPress={() => {
                        handleServicePurchase(
                            100,
                            { charisma: usePlayerStore.getState().attributes.charm + 2 },
                            'SPRAY TAN',
                            'You look glowing and ready for summer.',
                            [{ label: 'Charisma', value: '+2', isPositive: true }]
                        );
                    }}
                >
                    <Text style={styles.emoji}>🧴</Text>
                    <Text style={styles.cardTitle}>Instant Spray Tan</Text>
                    <Text style={styles.cardPrice}>$100</Text>
                    <Text style={styles.cardDesc}>Safe, quick, and orange-free guaranteed.</Text>
                    <Text style={styles.statText}>Charisma +2 (Safe)</Text>
                </Pressable>

                {/* UV BED */}
                <Pressable
                    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                    onPress={() => {
                        const burned = Math.random() < 0.1;
                        const player = usePlayerStore.getState();
                        const currentCharm = player.attributes.charm;
                        const currentHealth = player.core.health;

                        if (burned) {
                            handleServicePurchase(
                                250,
                                {
                                    charisma: currentCharm - 2,
                                    health: currentHealth - 1
                                },
                                'SKIN BURN!',
                                'The UV bed was too intense. You look red and painful.',
                                [
                                    { label: 'Charisma', value: '-2', isPositive: false },
                                    { label: 'Health', value: '-1', isPositive: false }
                                ]
                            );
                        } else {
                            handleServicePurchase(
                                250,
                                { charisma: currentCharm + 5 },
                                'DEEP BRONZE',
                                'Perfect, deep tan achieved. You look amazing.',
                                [{ label: 'Charisma', value: '+5', isPositive: true }]
                            );
                        }
                    }}
                >
                    <Text style={styles.emoji}>☀️</Text>
                    <Text style={styles.cardTitle}>UV Solarium Bed</Text>
                    <Text style={styles.cardPrice}>$250</Text>
                    <Text style={styles.cardDesc}>Deep bronze look with a hint of danger.</Text>
                    <Text style={[styles.statText, styles.riskText]}>Charisma +5 (Risk: Skin Burn)</Text>
                </Pressable>
            </View>

            <GameButton
                title="Close"
                variant="ghost"
                onPress={onClose}
                style={{ marginTop: 24 }}
            />
        </GameModal>
    );
};

export default SunStudioModal;

const styles = StyleSheet.create({
    options: {
        gap: theme.spacing.md,
    },
    card: {
        backgroundColor: '#2D3748',
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#4A5568',
    },
    cardPressed: {
        backgroundColor: '#353F4F',
        transform: [{ scale: 0.98 }],
    },
    emoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#F7FAFC',
        marginBottom: 4,
    },
    cardPrice: {
        fontSize: 16,
        color: '#ECC94B',
        fontWeight: '600',
        marginBottom: 8,
    },
    cardDesc: {
        fontSize: 13,
        color: '#CBD5E0',
        textAlign: 'center',
        marginBottom: 8,
    },
    statText: {
        fontSize: 12,
        color: '#68D391',
        fontWeight: '600',
    },
    riskText: {
        color: '#F6AD55',
    },
});
