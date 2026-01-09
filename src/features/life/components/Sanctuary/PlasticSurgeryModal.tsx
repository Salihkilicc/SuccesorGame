import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { theme } from '../../../../core/theme';
import { useStatsStore } from '../../../../core/store/useStatsStore';
import { usePlayerStore } from '../../../../core/store/usePlayerStore';
import GameModal from '../../../../components/common/GameModal';
import GameButton from '../../../../components/common/GameButton';

type PlasticSurgeryModalProps = {
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

const PROCEDURES = [
    { name: 'Botox Injection', cost: 2000 },
    { name: 'Eyelid Surgery', cost: 5000 },
    { name: 'Nose Job (Rhinoplasty)', cost: 12000 },
    { name: 'Liposuction', cost: 15000 },
    { name: 'Full Face Lift', cost: 25000 },
];

const PlasticSurgeryModal = ({ visible, onClose, handleServicePurchase }: PlasticSurgeryModalProps) => {
    const [selectedProcedure, setSelectedProcedure] = useState<{ name: string, cost: number } | null>(null);
    const [stage, setStage] = useState<'selection' | 'warning' | 'processing'>('selection');

    // Reset state on close
    useEffect(() => {
        if (!visible) {
            setStage('selection');
            setSelectedProcedure(null);
        }
    }, [visible]);

    const handleSelect = (proc: { name: string, cost: number }) => {
        setSelectedProcedure(proc);
        setStage('warning');
    };

    const handleConfirm = () => {
        if (!selectedProcedure) return;

        setStage('processing');

        // Random Outcome Logic
        // 75% Success Rate
        const isSuccess = Math.random() < 0.75;
        const { core, attributes } = usePlayerStore.getState();
        const currentCharm = attributes.charm;
        const { stress, health } = core;

        // Simulate operation time
        setTimeout(() => {
            if (isSuccess) {
                handleServicePurchase(
                    selectedProcedure.cost,
                    {
                        charisma: currentCharm + 20,
                        stress: Math.max(0, stress - 10)
                    },
                    'SURGERY SUCCESSFUL',
                    'You look radiant and years younger.',
                    [
                        { label: 'Charisma', value: '+20', isPositive: true },
                        { label: 'Stress', value: '-10', isPositive: true }
                    ]
                );
            } else {
                handleServicePurchase(
                    selectedProcedure.cost,
                    {
                        charisma: Math.max(0, currentCharm - 15),
                        stress: stress + 20,
                        health: Math.max(0, health - 10)
                    },
                    'SURGERY BOTCHED',
                    'The results are unnatural. You need time to recover.',
                    [
                        { label: 'Charisma', value: '-15', isPositive: false },
                        { label: 'Stress', value: '+20', isPositive: false },
                        { label: 'Health', value: '-10', isPositive: false }
                    ]
                );
            }
        }, 3000); // 3 seconds of suspense
    };

    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title="PLASTIC SURGERY"
            subtitle="Redefine Yourself. At a Cost."
        >
            {/* SELECTION STAGE */}
            {stage === 'selection' && (
                <>
                    <ScrollView contentContainerStyle={styles.listContent}>
                        {PROCEDURES.map((proc) => (
                            <Pressable
                                key={proc.name}
                                style={({ pressed }) => [styles.procItem, pressed && styles.procItemPressed]}
                                onPress={() => handleSelect(proc)}
                            >
                                <Text style={styles.procName}>{proc.name}</Text>
                                <Text style={styles.procCost}>${proc.cost.toLocaleString()}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                    <GameButton title="Cancel" variant="secondary" onPress={onClose} />
                </>
            )}

            {/* WARNING STAGE */}
            {stage === 'warning' && (
                <View style={styles.warningContent}>
                    <Text style={styles.warningTitle}>⚠️ SCALPEL WARNING ⚠️</Text>
                    <Text style={styles.warningText}>
                        Surgery carries significant risks. Results are NOT guaranteed.{'\n\n'}
                        If complications arise, you may suffer permanent loss of Charisma and Health.{'\n\n'}
                        Do you wish to proceed with the <Text style={{ fontWeight: 'bold' }}>{selectedProcedure?.name}</Text> for <Text style={{ color: '#C5A065' }}>${selectedProcedure?.cost.toLocaleString()}</Text>?
                    </Text>
                    <View style={styles.buttonGroup}>
                        <GameButton title="YES, I ACCEPT THE RISK" variant="danger" onPress={handleConfirm} style={{ flex: 1 }} />
                        <GameButton title="No, take me back" variant="secondary" onPress={() => setStage('selection')} style={{ flex: 1 }} />
                    </View>
                </View>
            )}

            {/* PROCESSING STAGE */}
            {stage === 'processing' && (
                <View style={styles.processingContent}>
                    <ActivityIndicator size="large" color="#C5A065" />
                    <Text style={styles.processingText}>Performing Surgery...</Text>
                    <Text style={styles.processingSubText}>Anesthesia administered.</Text>
                </View>
            )}
        </GameModal>
    );
};

export default PlasticSurgeryModal;

const styles = StyleSheet.create({
    listContent: {
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    procItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#2D3748',
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: '#4A5568',
    },
    procItemPressed: {
        backgroundColor: '#232730',
        borderColor: '#C5A065',
    },
    procName: {
        color: '#F7FAFC',
        fontWeight: '600',
    },
    procCost: {
        color: '#C5A065',
        fontWeight: '700',
    },
    // WARNING STYLES
    warningContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    warningTitle: {
        color: '#E53E3E',
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 20,
    },
    warningText: {
        color: '#FFF',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },
    // PROCESSING STYLES
    processingContent: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 16,
    },
    processingText: {
        color: '#C5A065',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 10,
    },
    processingSubText: {
        color: '#718096',
        fontSize: 14,
    },
});
