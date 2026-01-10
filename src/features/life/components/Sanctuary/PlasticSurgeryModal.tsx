import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { theme } from '../../../../core/theme';
import { useStatsStore } from '../../../../core/store/useStatsStore';
import { usePlayerStore } from '../../../../core/store/usePlayerStore';
import GameModal from '../../../../components/common/GameModal';
import GameButton from '../../../../components/common/GameButton';
import { useRelationshipBuffs } from '../../../love/hooks/useRelationshipBuffs';

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

    // Get relationship buffs
    const { medicalDiscount, partnerName } = useRelationshipBuffs();
    const hasDiscount = medicalDiscount > 0;

    // Reset state on close
    useEffect(() => {
        if (!visible) {
            setStage('selection');
            setSelectedProcedure(null);
        }
    }, [visible]);

    // Calculate discounted price
    const getDiscountedPrice = (originalPrice: number) => {
        if (!hasDiscount) return originalPrice;
        return Math.floor(originalPrice * (1 - medicalDiscount));
    };

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

        // Apply discount to actual cost
        const finalCost = getDiscountedPrice(selectedProcedure.cost);

        // Simulate operation time
        setTimeout(() => {
            if (isSuccess) {
                handleServicePurchase(
                    finalCost,
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
                    finalCost,
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
            {/* DISCOUNT BANNER */}
            {hasDiscount && stage === 'selection' && (
                <View style={styles.discountBanner}>
                    <Text style={styles.discountIcon}>💝</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.discountTitle}>Partner Perk Active!</Text>
                        <Text style={styles.discountText}>
                            {partnerName} secured you a {Math.round(medicalDiscount * 100)}% medical discount
                        </Text>
                    </View>
                </View>
            )}

            {/* SELECTION STAGE */}
            {stage === 'selection' && (
                <>
                    <ScrollView contentContainerStyle={styles.listContent}>
                        {PROCEDURES.map((proc) => {
                            const discountedPrice = getDiscountedPrice(proc.cost);
                            const isDiscounted = discountedPrice < proc.cost;

                            return (
                                <Pressable
                                    key={proc.name}
                                    style={({ pressed }) => [styles.procItem, pressed && styles.procItemPressed]}
                                    onPress={() => handleSelect(proc)}
                                >
                                    <Text style={styles.procName}>{proc.name}</Text>
                                    <View style={styles.priceContainer}>
                                        {isDiscounted && (
                                            <Text style={styles.originalPrice}>
                                                ${proc.cost.toLocaleString()}
                                            </Text>
                                        )}
                                        <Text style={[styles.procCost, isDiscounted && styles.discountedPrice]}>
                                            ${discountedPrice.toLocaleString()}
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        })}
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
                        Do you wish to proceed with the <Text style={{ fontWeight: 'bold' }}>{selectedProcedure?.name}</Text> for{' '}
                        {hasDiscount && (
                            <Text style={{ color: '#718096', textDecorationLine: 'line-through' }}>
                                ${selectedProcedure?.cost.toLocaleString()}
                            </Text>
                        )}
                        {hasDiscount && ' '}
                        <Text style={{ color: '#C5A065', fontWeight: 'bold' }}>
                            ${selectedProcedure ? getDiscountedPrice(selectedProcedure.cost).toLocaleString() : '0'}
                        </Text>
                        {hasDiscount && (
                            <Text style={{ color: '#48BB78', fontSize: 12 }}>
                                {' '}(Partner Discount!)
                            </Text>
                        )}?
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
    discountBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#48BB7820',
        borderRadius: theme.radius.sm,
        padding: 12,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: '#48BB78',
        gap: 10,
    },
    discountIcon: {
        fontSize: 24,
    },
    discountTitle: {
        color: '#48BB78',
        fontWeight: '700',
        fontSize: 14,
        marginBottom: 2,
    },
    discountText: {
        color: '#F7FAFC',
        fontSize: 12,
    },
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
    priceContainer: {
        alignItems: 'flex-end',
        gap: 2,
    },
    originalPrice: {
        color: '#718096',
        fontSize: 12,
        textDecorationLine: 'line-through',
    },
    procCost: {
        color: '#C5A065',
        fontWeight: '700',
    },
    discountedPrice: {
        color: '#48BB78',
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
