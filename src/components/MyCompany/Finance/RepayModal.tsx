import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { theme } from '../../../core/theme';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import { useStatsStore } from '../../../core/store';

type Props = {
    visible: boolean;
    onClose: () => void;
};

const RepayModal = ({ visible, onClose }: Props) => {
    const { companyCapital, update } = useStatsStore();
    const { loans, totalDebt, repayLoan } = useCorporateFinanceStore();

    const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
    const [repayAmount, setRepayAmount] = useState(0);

    const selectedLoan = loans.find(l => l.id === selectedLoanId);

    const handleRepay = (loanId: string, amount: number) => {
        const result = repayLoan(
            loanId,
            amount,
            (cashToSpend) => {
                update({ companyCapital: companyCapital - cashToSpend });
            }
        );

        if (result.success) {
            setSelectedLoanId(null);
            setRepayAmount(0);
            if (loans.length === 1) {
                // Last loan repaid, close modal
                onClose();
            }
        } else {
            console.warn('[RepayModal] Repayment failed:', result.message);
        }
    };

    // If no debt, show simple message
    if (totalDebt <= 0) {
        return (
            <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
                <View style={styles.backdrop}>
                    <View style={styles.container}>
                        <Text style={styles.title}>Debt Free</Text>
                        <Text style={styles.subtitle}>You have no corporate debt!</Text>
                        <Pressable onPress={onClose} style={styles.confirmButton}>
                            <Text style={styles.confirmText}>Great!</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.container}>
                    <Text style={styles.title}>Repay Debt</Text>
                    <Text style={styles.subtitle}>
                        Total Debt: ${(totalDebt / 1_000_000).toFixed(2)}M • Cash: ${(companyCapital / 1_000_000).toFixed(2)}M
                    </Text>

                    <ScrollView style={styles.loansScroll} showsVerticalScrollIndicator={false}>
                        {loans.map((loan) => {
                            const maxRepayable = Math.min(loan.remaining, companyCapital);

                            return (
                                <View key={loan.id} style={styles.loanCard}>
                                    <View style={styles.loanHeader}>
                                        <View>
                                            <Text style={styles.loanType}>{loan.type} Loan</Text>
                                            <Text style={styles.loanRate}>{loan.interestRate}% APR</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.loanRemainingLabel}>Remaining</Text>
                                            <Text style={styles.loanRemaining}>
                                                ${(loan.remaining / 1_000_000).toFixed(2)}M
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.loanDetails}>
                                        <View style={styles.loanDetailItem}>
                                            <Text style={styles.loanDetailLabel}>Monthly Payment</Text>
                                            <Text style={styles.loanDetailValue}>
                                                ${(loan.monthlyPayment / 1_000).toFixed(0)}K
                                            </Text>
                                        </View>
                                        <View style={styles.loanDetailItem}>
                                            <Text style={styles.loanDetailLabel}>Can Repay</Text>
                                            <Text style={[styles.loanDetailValue, { color: '#90EE90' }]}>
                                                ${(maxRepayable / 1_000_000).toFixed(2)}M
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Repayment Options */}
                                    <View style={styles.repayOptions}>
                                        {/* Partial Repayment (50%) */}
                                        {maxRepayable >= loan.remaining * 0.5 && (
                                            <Pressable
                                                style={({ pressed }) => [
                                                    styles.repayButton,
                                                    pressed && styles.repayButtonPressed
                                                ]}
                                                onPress={() => handleRepay(loan.id, loan.remaining * 0.5)}
                                            >
                                                <Text style={styles.repayButtonLabel}>Pay 50%</Text>
                                                <Text style={styles.repayButtonValue}>
                                                    ${(loan.remaining * 0.5 / 1_000_000).toFixed(2)}M
                                                </Text>
                                            </Pressable>
                                        )}

                                        {/* Full Repayment */}
                                        {maxRepayable >= loan.remaining && (
                                            <Pressable
                                                style={({ pressed }) => [
                                                    styles.repayButton,
                                                    styles.repayButtonFull,
                                                    pressed && styles.repayButtonPressed
                                                ]}
                                                onPress={() => handleRepay(loan.id, loan.remaining)}
                                            >
                                                <Text style={[styles.repayButtonLabel, { color: '#000' }]}>
                                                    Pay Full
                                                </Text>
                                                <Text style={[styles.repayButtonValue, { color: '#000' }]}>
                                                    ${(loan.remaining / 1_000_000).toFixed(2)}M
                                                </Text>
                                            </Pressable>
                                        )}

                                        {/* Max Possible (if less than full) */}
                                        {maxRepayable > 0 && maxRepayable < loan.remaining && (
                                            <Pressable
                                                style={({ pressed }) => [
                                                    styles.repayButton,
                                                    pressed && styles.repayButtonPressed
                                                ]}
                                                onPress={() => handleRepay(loan.id, maxRepayable)}
                                            >
                                                <Text style={styles.repayButtonLabel}>Pay Max</Text>
                                                <Text style={styles.repayButtonValue}>
                                                    ${(maxRepayable / 1_000_000).toFixed(2)}M
                                                </Text>
                                            </Pressable>
                                        )}
                                    </View>

                                    {maxRepayable === 0 && (
                                        <Text style={styles.insufficientText}>
                                            Insufficient cash to repay
                                        </Text>
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>

                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeText}>Close</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

export default RepayModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 420,
        maxHeight: '80%',
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#2A2D35',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        color: '#8A9BA8',
        textAlign: 'center',
        marginBottom: 20,
    },
    loansScroll: {
        maxHeight: 400,
        marginBottom: 20,
    },
    loanCard: {
        backgroundColor: '#2A2D35',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    loanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    loanType: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 2,
    },
    loanRate: {
        fontSize: 13,
        color: '#FFD700',
        fontWeight: '600',
    },
    loanRemainingLabel: {
        fontSize: 11,
        color: '#8A9BA8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    loanRemaining: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FF6B6B',
    },
    loanDetails: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    loanDetailItem: {
        flex: 1,
    },
    loanDetailLabel: {
        fontSize: 11,
        color: '#8A9BA8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    loanDetailValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
    repayOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    repayButton: {
        flex: 1,
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#90EE90',
    },
    repayButtonFull: {
        backgroundColor: '#FFD700',
        borderColor: '#FFD700',
    },
    repayButtonPressed: {
        opacity: 0.7,
    },
    repayButtonLabel: {
        fontSize: 11,
        color: '#8A9BA8',
        fontWeight: '600',
        marginBottom: 4,
    },
    repayButtonValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#90EE90',
    },
    insufficientText: {
        fontSize: 12,
        color: '#FF6B6B',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    closeButton: {
        backgroundColor: '#2A2D35',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    closeText: {
        color: '#AAA',
        fontWeight: '600',
        fontSize: 15,
    },
    confirmButton: {
        backgroundColor: '#FFD700',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    confirmText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 16,
    },
});
