import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../../theme';

type Props = {
    visible: boolean;
    totalDebt: number;
    cash: number;
    onClose: () => void;
    onRepay: (amount: number) => void;
};

const RepayModal = ({ visible, totalDebt, cash, onClose, onRepay }: Props) => {
    // Determine max repayable (min of total debt or cash)
    const maxRepay = Math.min(totalDebt, cash);

    // If no debt, show simple message
    if (totalDebt <= 0) {
        return (
            <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
                <View style={styles.subModalBackdrop}>
                    <View style={styles.subModalContainer}>
                        <Text style={styles.subModalTitle}>Debt Free</Text>
                        <Text style={styles.subModalSubtitle}>You have no corporate debt!</Text>
                        <Pressable onPress={onClose} style={[styles.confirmAction, { marginTop: 20 }]}>
                            <Text style={styles.confirmText}>Great!</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.subModalBackdrop}>
                <View style={styles.subModalContainer}>
                    <Text style={styles.subModalTitle}>Repay Debt</Text>
                    <Text style={styles.subModalSubtitle}>Reduce interest payments immediately.</Text>

                    <View style={styles.calculationBox}>
                        <Text style={styles.calcLabel}>Total Debt</Text>
                        <Text style={[styles.calcValue, { color: theme.colors.danger }]}>
                            ${(totalDebt / 1_000_000).toFixed(2)}M
                        </Text>
                    </View>

                    <Text style={styles.limitText}>Available Cash: ${(cash / 1_000_000).toFixed(2)}M</Text>

                    <View style={{ gap: 10, marginTop: 20 }}>
                        <Pressable
                            onPress={() => onRepay(maxRepay)}
                            disabled={maxRepay <= 0}
                            style={({ pressed }) => [styles.repayOption, pressed && styles.cardPressed]}
                        >
                            <Text style={styles.repayOptionTitle}>Repay Max Possible</Text>
                            <Text style={styles.repayOptionSub}>${(maxRepay / 1_000_000).toFixed(2)}M</Text>
                        </Pressable>

                        {/* Could add a partial/custom amount option here later */}
                    </View>

                    <View style={styles.modalActions}>
                        <Pressable onPress={onClose} style={styles.cancelAction}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default RepayModal;

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
    limitText: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
    },
    calculationBox: {
        backgroundColor: '#232730',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 10,
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
        marginTop: 20,
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
    repayOption: {
        backgroundColor: '#232730',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
    },
    cardPressed: {
        backgroundColor: '#2A2D36',
    },
    repayOptionTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    repayOptionSub: {
        color: theme.colors.success,
        fontWeight: '700',
        fontSize: 18,
    },
});
