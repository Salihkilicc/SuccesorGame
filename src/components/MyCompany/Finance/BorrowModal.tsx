import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../../theme';
import { PercentageSelector } from '../../atoms/PercentageSelector';
import { useBorrowLogic } from '../../../features/finance/hooks/useBorrowLogic';

type Props = {
    visible: boolean;
    type: string;
    rate: number;
    maxLimit: number; // Keep for display or constraint if needed, but hook handles logic
    onClose: () => void;
    onConfirm?: (amount: number) => void; // Optional now as hook handles it, but keep for compat if needed (though we will ignore it in favor of hook)
};

const BorrowModal = ({ visible, type, rate, maxLimit, onClose }: Props) => {

    // Use the Hook
    const {
        amount,
        setAmount,
        maxBorrowable,
        monthlyInterestCost,
        handleConfirm
    } = useBorrowLogic(visible, onClose, rate);

    // Ensure min range is at least 1M
    const safeMax = Math.max(1_000_000, maxBorrowable);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.subModalBackdrop}>
                <View style={styles.subModalContainer}>
                    <Text style={styles.subModalTitle}>Borrow Capital</Text>
                    <Text style={styles.subModalSubtitle}>{type} • {rate}% APR</Text>

                    <View style={styles.sliderContainer}>
                        <PercentageSelector
                            label="Loan Amount"
                            value={amount}
                            min={1_000_000}
                            max={safeMax} // Use calculated max from hook (based on valuation)
                            onChange={setAmount}
                            unit="$"
                        />
                    </View>

                    <View style={styles.calculationBox}>
                        <Text style={styles.calcLabel}>New Monthly Expense</Text>
                        <Text style={styles.calcValue}>+${Math.round(monthlyInterestCost).toLocaleString()}/mo</Text>
                    </View>

                    {/* Warning if trying to borrow close to limit */}
                    {amount > maxBorrowable * 0.9 && (
                        <Text style={styles.warningText}>
                            ⚠️ Approaching maximum credit limit
                        </Text>
                    )}

                    <View style={styles.modalActions}>
                        <Pressable onPress={onClose} style={styles.cancelAction}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={handleConfirm} style={styles.confirmAction}>
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
    warningText: {
        color: '#ffdd57',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 16,
        fontWeight: '600'
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
