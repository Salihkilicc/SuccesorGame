import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import { useStatsStore } from '../../../core/store';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';
import { formatMoney } from '../../../core/utils';

type Props = {
    visible: boolean;
    onClose: () => void;
};

const RepayModal = ({ visible, onClose }: Props) => {
    useLocale();
    const navigation = useNavigation<any>();
    const { companyCapital, update } = useStatsStore();
    const { loans, totalDebt, repayLoan } = useCorporateFinanceStore();

    const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
    const [repayAmount, setRepayAmount] = useState(0);

    const selectedLoan = loans.find(l => l.id === selectedLoanId);

    const handleHomePress = () => {
        onClose();
        navigation.navigate('Home');
    };

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
                    <View style={styles.centeredView}>
                        <View style={styles.container}>
                            <Text style={styles.title}>{t('finance.debtFree')}</Text>
                            <Text style={styles.subtitle}>{t('finance.youHaveNoCorporateDebt')}</Text>
                            <Pressable onPress={onClose} style={styles.confirmButton}>
                                <Text style={styles.confirmText}>{t('finance.great')}</Text>
                            </Pressable>
                        </View>
                    </View>
                    {/* Persistent Bottom Bar */}
                    <CrystalNavBar activeTab="Company" variant="dark" />
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.centeredView}>
                    <View style={styles.container}>
                        <Text style={styles.title}>{t('finance.repayDebt')}</Text>
                        <Text style={styles.subtitle}>
                            Total Debt: {formatMoney(totalDebt)} • Cash: {formatMoney(companyCapital)}
                        </Text>

                        <ScrollView style={styles.loansScroll} showsVerticalScrollIndicator={false}>
                            {loans.map((loan) => {
                                const maxRepayable = Math.min(loan.balance, companyCapital);

                                return (
                                    <View key={loan.id} style={styles.loanCard}>
                                        <View style={styles.loanHeader}>
                                            <View>
                                                <Text style={styles.loanType}>{loan.name} Loan</Text>
                                                <Text style={styles.loanRate}>{loan.rate}% APR</Text>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={styles.loanRemainingLabel}>{t('finance.remaining')}</Text>
                                                <Text style={styles.loanRemaining}>
                                                    {formatMoney(loan.balance)}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.loanDetails}>
                                            <View style={styles.loanDetailItem}>
                                                <Text style={styles.loanDetailLabel}>{t('finance.monthlyPayment')}</Text>
                                                <Text style={styles.loanDetailValue}>
                                                    {formatMoney(((loan.balance * loan.rate) / 4))}
                                                </Text>
                                            </View>
                                            <View style={styles.loanDetailItem}>
                                                <Text style={styles.loanDetailLabel}>{t('finance.canRepay')}</Text>
                                                <Text style={[styles.loanDetailValue, { color: '#5FB37A' }]}>
                                                    {formatMoney(maxRepayable)}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Repayment Options */}
                                        <View style={styles.repayOptions}>
                                            {/* Partial Repayment (50%) */}
                                            {maxRepayable >= loan.balance * 0.5 && (
                                                <Pressable
                                                    style={({ pressed }) => [
                                                        styles.repayButton,
                                                        pressed && styles.repayButtonPressed
                                                    ]}
                                                    onPress={() => handleRepay(loan.id, loan.balance * 0.5)}
                                                >
                                                    <Text style={styles.repayButtonLabel}>{t('finance.pay50')}</Text>
                                                    <Text style={styles.repayButtonValue}>
                                                        {formatMoney(loan.balance * 0.5)}
                                                    </Text>
                                                </Pressable>
                                            )}

                                            {/* Full Repayment */}
                                            {maxRepayable >= loan.balance && (
                                                <Pressable
                                                    style={({ pressed }) => [
                                                        styles.repayButton,
                                                        styles.repayButtonFull,
                                                        pressed && styles.repayButtonPressed
                                                    ]}
                                                    onPress={() => handleRepay(loan.id, loan.balance)}
                                                >
                                                    <Text style={[styles.repayButtonLabel, { color: '#000' }]}>{t('finance.payFull')}</Text>
                                                    <Text style={[styles.repayButtonValue, { color: '#000' }]}>
                                                        {formatMoney(loan.balance)}
                                                    </Text>
                                                </Pressable>
                                            )}

                                            {/* Max Possible (if less than full) */}
                                            {maxRepayable > 0 && maxRepayable < loan.balance && (
                                                <Pressable
                                                    style={({ pressed }) => [
                                                        styles.repayButton,
                                                        pressed && styles.repayButtonPressed
                                                    ]}
                                                    onPress={() => handleRepay(loan.id, maxRepayable)}
                                                >
                                                    <Text style={styles.repayButtonLabel}>{t('finance.payMax')}</Text>
                                                    <Text style={styles.repayButtonValue}>
                                                        {formatMoney(maxRepayable)}
                                                    </Text>
                                                </Pressable>
                                            )}
                                        </View>

                                        {maxRepayable === 0 && (
                                            <Text style={styles.insufficientText}>{t('finance.insufficientCashToRepay')}</Text>
                                        )}
                                    </View>
                                );
                            })}
                        </ScrollView>

                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeText}>{t('finance.close')}</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Persistent Bottom Bar */}
                <CrystalNavBar activeTab="Company" variant="dark" />
            </View>
        </Modal>
    );
};

export default RepayModal;

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
        maxHeight: '80%',
        backgroundColor: '#0F0E0D',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#181614',
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
        fontSize: 12,
        color: '#8A807B',
        textAlign: 'center',
        marginBottom: 20,
    },
    loansScroll: {
        maxHeight: 400,
        marginBottom: 20,
    },
    loanCard: {
        backgroundColor: '#181614',
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
        color: '#E9B8C9',
        fontWeight: '600',
    },
    loanRemainingLabel: {
        fontSize: 11,
        color: '#8A807B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    loanRemaining: {
        fontSize: 18,
        fontWeight: '800',
        color: '#E06B6B',
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
        color: '#8A807B',
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
        backgroundColor: '#0F0E0D',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#5FB37A',
    },
    repayButtonFull: {
        backgroundColor: '#E9B8C9',
        borderColor: '#E9B8C9',
    },
    repayButtonPressed: {
        opacity: 0.7,
    },
    repayButtonLabel: {
        fontSize: 11,
        color: '#8A807B',
        fontWeight: '600',
        marginBottom: 4,
    },
    repayButtonValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#5FB37A',
    },
    insufficientText: {
        fontSize: 12,
        color: '#E06B6B',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    closeButton: {
        backgroundColor: '#181614',
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
        backgroundColor: '#E9B8C9',
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
