import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../../../theme';

type Props = {
    visible: boolean;
    type: string;
    rate: number;
    maxLimit: number;
    onClose: () => void;
    onConfirm: (amount: number) => void;
};

const BorrowModal = ({ visible, type, rate, maxLimit, onClose, onConfirm }: Props) => {
    const [amount, setAmount] = useState(1_000_000); // Start at 1M

    // Ensure min range is at least 1M or maxLimit if lower
    const safeMax = Math.max(1_000_000, maxLimit);

    const monthlyCost = (amount * (rate / 100)) / 12;

    const formatCurrency = (val: number) => {
        if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
        if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
        return `$${val}`;
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.subModalBackdrop}>
                <View style={styles.subModalContainer}>
                    <Text style={styles.subModalTitle}>Borrow Capital</Text>
                    <Text style={styles.subModalSubtitle}>{type} • {rate}% APR</Text>

                    <View style={styles.sliderContainer}>
                        <Text style={styles.amountText}>{formatCurrency(amount)}</Text>
                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={1_000_000}
                            maximumValue={safeMax}
                            step={100_000}
                            value={amount}
                            onValueChange={setAmount}
                            minimumTrackTintColor={theme.colors.success}
                            maximumTrackTintColor="#555"
                            thumbTintColor="#FFF"
                        />
                        <View style={styles.limitRow}>
                            <Text style={styles.limitText}>Min: $1M</Text>
                            <Text style={styles.limitText}>Max: {formatCurrency(safeMax)}</Text>
                        </View>
                    </View>

                    <View style={styles.calculationBox}>
                        <Text style={styles.calcLabel}>New Monthly Expense</Text>
                        <Text style={styles.calcValue}>+${Math.round(monthlyCost).toLocaleString()}/mo</Text>
                    </View>

                    <View style={styles.modalActions}>
                        <Pressable onPress={onClose} style={styles.cancelAction}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={() => onConfirm(amount)} style={styles.confirmAction}>
                            <Text style={styles.confirmText}>Confirm Loan</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default BorrowModal;

const styles = StyleSheet.create({
    subModalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    subModalContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#1E222B',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#333',
    },
    subModalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 4,
    },
    subModalSubtitle: {
        fontSize: 14,
        color: '#8A9BA8',
        textAlign: 'center',
        marginBottom: 24,
    },
    sliderContainer: {
        gap: 12,
        marginBottom: 24,
        alignItems: 'center',
    },
    amountText: {
        fontSize: 32,
        fontWeight: '900',
        color: theme.colors.success,
    },
    limitRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    limitText: {
        color: '#666',
        fontSize: 12,
    },
    calculationBox: {
        backgroundColor: '#232730',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#2E3540',
    },
    calcLabel: {
        fontSize: 12,
        color: '#8A9BA8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    calcValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelAction: {
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
    confirmAction: {
        flex: 2,
        padding: 16,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: theme.colors.success,
    },
    confirmText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
});
