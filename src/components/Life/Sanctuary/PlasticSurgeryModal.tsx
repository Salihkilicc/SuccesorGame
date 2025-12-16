import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { theme } from '../../../theme';
import { useStatsStore } from '../../../store/useStatsStore';

type PlasticSurgeryModalProps = {
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
        const currentStats = useStatsStore.getState();

        // Simulate operation time
        setTimeout(() => {
            if (isSuccess) {
                handleServicePurchase(
                    selectedProcedure.cost,
                    {
                        charisma: currentStats.charisma + 20,
                        stress: Math.max(0, currentStats.stress - 10)
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
                        charisma: Math.max(0, currentStats.charisma - 15),
                        stress: currentStats.stress + 20,
                        health: Math.max(0, currentStats.health - 10)
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
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}>
            <View style={styles.overlay}>

                {/* SELECTION STAGE */}
                {stage === 'selection' && (
                    <View style={styles.container}>
                        <Text style={styles.headerTitle}>PLASTIC SURGERY</Text>
                        <Text style={styles.headerSubtitle}>Redefine Yourself. At a Cost.</Text>

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

                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>Cancel</Text>
                        </Pressable>
                    </View>
                )}

                {/* WARNING STAGE */}
                {stage === 'warning' && (
                    <View style={styles.warningContainer}>
                        <Text style={styles.warningTitle}>⚠️ SCALPEL WARNING ⚠️</Text>
                        <Text style={styles.warningText}>
                            Surgery carries significant risks. Results are NOT guaranteed.{'\n\n'}
                            If complications arise, you may suffer permanent loss of Charisma and Health.{'\n\n'}
                            Do you wish to proceed with the <Text style={{ fontWeight: 'bold' }}>{selectedProcedure?.name}</Text> for <Text style={{ color: '#C5A065' }}>${selectedProcedure?.cost.toLocaleString()}</Text>?
                        </Text>

                        <Pressable style={styles.confirmButton} onPress={handleConfirm}>
                            <Text style={styles.confirmButtonText}>YES, I ACCEPT THE RISK</Text>
                        </Pressable>

                        <Pressable onPress={() => setStage('selection')} style={styles.cancelLink}>
                            <Text style={styles.cancelLinkText}>No, take me back</Text>
                        </Pressable>
                    </View>
                )}

                {/* PROCESSING STAGE */}
                {stage === 'processing' && (
                    <View style={styles.processingContainer}>
                        <ActivityIndicator size="large" color="#C5A065" />
                        <Text style={styles.processingText}>Performing Surgery...</Text>
                        <Text style={styles.processingSubText}>Anesthesia administered.</Text>
                    </View>
                )}

            </View>
        </Modal>
    );
};

export default PlasticSurgeryModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },

    // SHARED CONTAINER STYLES
    container: {
        width: '100%',
        backgroundColor: '#1A1D24',
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: '#4A5568',
    },
    warningContainer: {
        width: '100%',
        backgroundColor: '#000',
        borderRadius: theme.radius.lg,
        padding: theme.spacing.xl,
        borderWidth: 2,
        borderColor: '#E53E3E', // Red border for warning
        alignItems: 'center',
    },
    processingContainer: {
        alignItems: 'center',
        gap: 20,
    },

    // TEXT STYLES
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#E2E8F0',
        textAlign: 'center',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#A0AEC0',
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
        fontStyle: 'italic',
    },
    listContent: {
        gap: theme.spacing.sm,
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
    closeButton: {
        marginTop: theme.spacing.lg,
        alignItems: 'center',
        padding: 10,
    },
    closeButtonText: {
        color: '#A0AEC0',
    },

    // WARNING STYLES
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
    confirmButton: {
        backgroundColor: '#E53E3E',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 16,
    },
    cancelLink: {
        marginTop: 20,
    },
    cancelLinkText: {
        color: '#718096',
        textDecorationLine: 'underline',
    },

    // PROCESSING STYLES
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
