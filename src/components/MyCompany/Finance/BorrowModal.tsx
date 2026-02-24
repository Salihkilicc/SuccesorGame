import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import { PercentageSelector } from '../../atoms/PercentageSelector';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import { useStatsStore } from '../../../core/store';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';

type Props = {
    visible: boolean;
    onClose: () => void;
};

const BorrowModal = ({ visible, onClose }: Props) => {
    const navigation = useNavigation<any>();
    const { companyValue, companyCapital, update } = useStatsStore();
    const {
        takeLoan,
        getBorrowingCapacity,
        getInterestRate,
        creditScore
    } = useCorporateFinanceStore();

    const [amount, setAmount] = useState(1_000_000);
    const [selectedType, setSelectedType] = useState<'Bank' | 'Bonds' | 'Shark'>('Bank');

    const borrowingCapacity = getBorrowingCapacity(companyValue);
    const baseRate = getInterestRate() * 100; // Convert to percentage

    // Calculate rates for each loan type
    const bankRate = baseRate;
    const bondsRate = Math.max(2, baseRate - 2);
    const sharkRate = 40;

    // Get current rate based on selected type
    const getCurrentRate = () => {
        switch (selectedType) {
            case 'Bank': return bankRate;
            case 'Bonds': return bondsRate;
            case 'Shark': return sharkRate;
        }
    };

    const currentRate = getCurrentRate();

    // Calculate monthly payment preview
    const calculateMonthlyPayment = () => {
        const annualRate = currentRate / 100;
        const monthlyRate = annualRate / 12;
        const term = 12;
        return (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) /
            (Math.pow(1 + monthlyRate, term) - 1);
    };

    const monthlyPayment = calculateMonthlyPayment();

    const handleConfirm = () => {
        const result = takeLoan(
            amount,
            companyValue,
            selectedType,
            currentRate,
            (cashToAdd) => {
                update({ companyCapital: companyCapital + cashToAdd });
            }
        );

        if (result.success) {
            onClose();
        } else {
            // Could show error toast here
            console.warn('[BorrowModal] Loan failed:', result.message);
        }
    };

    const handleHomePress = () => {
        onClose();
        navigation.navigate('Home');
    };

    // Reset amount when modal opens
    useEffect(() => {
        if (visible) {
            setAmount(Math.min(1_000_000, borrowingCapacity));
        }
    }, [visible, borrowingCapacity]);

    const safeMax = Math.max(1_000_000, borrowingCapacity);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.centeredView}>
                    <View style={styles.container}>
                        <Text style={styles.title}>Request New Loan</Text>
                        <Text style={styles.subtitle}>
                            Credit Score: {creditScore} • {borrowingCapacity > 0 ? `$${(borrowingCapacity / 1_000_000).toFixed(1)}M Available` : 'No Capacity'}
                        </Text>

                        {/* Loan Type Selection */}
                        <View style={styles.typeSelector}>
                            <Pressable
                                style={[styles.typeButton, selectedType === 'Bank' && styles.typeButtonActive]}
                                onPress={() => setSelectedType('Bank')}
                            >
                                <Text style={styles.typeEmoji}>🏛️</Text>
                                <Text style={[styles.typeLabel, selectedType === 'Bank' && styles.typeLabelActive]}>
                                    Bank
                                </Text>
                                <Text style={styles.typeRate}>{bankRate.toFixed(1)}%</Text>
                            </Pressable>

                            <Pressable
                                style={[styles.typeButton, selectedType === 'Bonds' && styles.typeButtonActive]}
                                onPress={() => setSelectedType('Bonds')}
                            >
                                <Text style={styles.typeEmoji}>📜</Text>
                                <Text style={[styles.typeLabel, selectedType === 'Bonds' && styles.typeLabelActive]}>
                                    Bonds
                                </Text>
                                <Text style={styles.typeRate}>{bondsRate.toFixed(1)}%</Text>
                            </Pressable>

                            <Pressable
                                style={[styles.typeButton, selectedType === 'Shark' && styles.typeButtonActive]}
                                onPress={() => setSelectedType('Shark')}
                            >
                                <Text style={styles.typeEmoji}>🦈</Text>
                                <Text style={[styles.typeLabel, selectedType === 'Shark' && styles.typeLabelActive]}>
                                    Shark
                                </Text>
                                <Text style={[styles.typeRate, { color: '#FF6B6B' }]}>{sharkRate}%</Text>
                            </Pressable>
                        </View>

                        {/* Amount Selector */}
                        <View style={styles.sliderContainer}>
                            <PercentageSelector
                                label="Loan Amount"
                                value={amount}
                                min={1_000_000}
                                max={safeMax}
                                onChange={setAmount}
                                unit="$"
                            />
                        </View>

                        {/* Live Preview */}
                        <View style={styles.previewContainer}>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>Interest Rate</Text>
                                <Text style={styles.previewValue}>{currentRate.toFixed(1)}% APR</Text>
                            </View>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>Monthly Payment</Text>
                                <Text style={[styles.previewValue, { color: '#FFD700' }]}>
                                    ${Math.round(monthlyPayment).toLocaleString()}
                                </Text>
                            </View>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>Term</Text>
                                <Text style={styles.previewValue}>12 Months</Text>
                            </View>
                        </View>

                        {/* Warning */}
                        {amount > borrowingCapacity * 0.9 && (
                            <Text style={styles.warningText}>
                                ⚠️ Approaching maximum credit limit
                            </Text>
                        )}

                        {/* Actions */}
                        <View style={styles.actions}>
                            <Pressable onPress={onClose} style={styles.cancelButton}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                onPress={handleConfirm}
                                style={({ pressed }) => [
                                    styles.confirmButton,
                                    pressed && styles.confirmButtonPressed
                                ]}
                            >
                                <Text style={styles.confirmText}>Sign Loan Agreement</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Persistent Bottom Bar */}
                <CrystalNavBar activeTab="Company" variant="dark" />
            </View>
        </Modal>
    );
};

export default BorrowModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        // No padding here
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#FFD700',
        marginBottom: 80, // Space for Bottom Bar
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#8A9BA8',
        textAlign: 'center',
        marginBottom: 24,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    typeButton: {
        flex: 1,
        backgroundColor: '#2A2D35',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeButtonActive: {
        borderColor: '#FFD700',
        backgroundColor: '#1C1C1E',
    },
    typeEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    typeLabel: {
        fontSize: 12,
        color: '#8A9BA8',
        fontWeight: '600',
        marginBottom: 2,
    },
    typeLabelActive: {
        color: '#FFF',
    },
    typeRate: {
        fontSize: 14,
        color: '#FFD700',
        fontWeight: '700',
    },
    sliderContainer: {
        marginBottom: 24,
    },
    previewContainer: {
        backgroundColor: '#2A2D35',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        marginBottom: 16,
    },
    previewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    previewLabel: {
        fontSize: 13,
        color: '#8A9BA8',
        fontWeight: '600',
    },
    previewValue: {
        fontSize: 15,
        color: '#FFF',
        fontWeight: '700',
    },
    warningText: {
        color: '#ffdd57',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 16,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#2A2D35',
    },
    cancelText: {
        color: '#AAA',
        fontWeight: '600',
    },
    confirmButton: {
        flex: 2,
        padding: 16,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    confirmButtonPressed: {
        opacity: 0.8,
    },
    confirmText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 15,
    },
});
