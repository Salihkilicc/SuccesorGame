import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import { useStatsStore } from '../../../core/store';
import { formatMoney } from '../../../core/utils';
import ScreenHeader from '../../common/ScreenHeader';
import ScreenHost from '../../common/ScreenHost';

const getLoanVisual = (kind?: string, name?: string) => {
    const k = (kind || name || '').toLowerCase();
    if (k.includes('shark')) return { icon: 'shark', color: '#F87171' };
    if (k.includes('mezzanine')) return { icon: 'scale-balance', color: '#38BDF8' };
    if (k.includes('secured')) return { icon: 'factory', color: '#FBBF24' };
    if (k.includes('bond')) return { icon: 'certificate-outline', color: '#A78BFA' };
    return { icon: 'bank-outline', color: '#60A5FA' };
};

type Props = {
    /** Render as a route rather than a popup - see components/common/ScreenHost. */
    asScreen?: boolean;
    visible: boolean;
    onClose: () => void;
};

const RepayModal = ({ visible, onClose, asScreen }: Props) => {
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
            <ScreenHost asScreen={asScreen} visible={visible} transparent animationType="fade" onRequestClose={onClose}>
                <View style={styles.backdrop}>
                    <View style={styles.centeredView}>
                        <View style={styles.container}>
                            <ScreenHeader title={t('finance.debtFree')} onBack={onClose} />
                            <View style={styles.debtFreeContent}>
                                <View style={styles.debtFreeBadge}>
                                    <MaterialCommunityIcons name="shield-check-outline" size={48} color="#34D399" />
                                </View>
                                <Text style={styles.subtitle}>{t('finance.youHaveNoCorporateDebt')}</Text>
                                <Pressable onPress={onClose} style={styles.confirmButton}>
                                    <Text style={styles.confirmText}>{t('finance.great')}</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                    {/* Persistent Bottom Bar */}
                </View>
            </ScreenHost>
        );
    }

    return (
        <ScreenHost asScreen={asScreen} visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.centeredView}>
                    <View style={styles.container}>
                        <ScreenHeader
                            title={t('finance.repayDebt')}
                            subtitle={`${formatMoney(totalDebt)} owed · ${formatMoney(companyCapital)} cash`}
                            onBack={onClose}
                        />

                        <ScrollView style={styles.loansScroll} contentContainerStyle={styles.loansContent} showsVerticalScrollIndicator={false}>
                            {loans.map((loan) => {
                                const maxRepayable = Math.min(loan.balance, companyCapital);
                                const visual = getLoanVisual(loan.kind, loan.name);

                                return (
                                    <View key={loan.id} style={styles.loanCard}>
                                        <View style={styles.loanHeader}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                <View style={[styles.loanIconBadge, { backgroundColor: `${visual.color}15`, borderColor: `${visual.color}35` }]}>
                                                    <MaterialCommunityIcons name={visual.icon} size={22} color={visual.color} />
                                                </View>
                                                <View>
                                                    <Text style={styles.loanType}>{loan.name} Loan</Text>
                                                    <Text style={styles.loanRate}>{loan.rate}% APR</Text>
                                                </View>
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
                                                <Text style={[styles.loanDetailValue, { color: '#FFFFFF' }]}>
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
                                                    <Text style={[styles.repayButtonLabel, { color: '#FFFFFF' }]}>{t('finance.payFull')}</Text>
                                                    <Text style={[styles.repayButtonValue, { color: '#FFFFFF' }]}>
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

                    </View>
                </View>

                {/* Persistent Bottom Bar */}
            </View>
        </ScreenHost>
    );
};

export default RepayModal;

const styles = StyleSheet.create({
    loansContent: { padding: theme.spacing.md, paddingBottom: 120, gap: theme.spacing.sm },
    // Full-bleed, matching Borrow and every other destination.
    backdrop: { flex: 1, backgroundColor: theme.colors.background },
    centeredView: { flex: 1 },
    container: { flex: 1, backgroundColor: theme.colors.background },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.48)',
        textAlign: 'center',
        marginBottom: 20,
    },
    debtFreeContent: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        marginTop: 40,
    },
    debtFreeBadge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(52, 211, 153, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(52, 211, 153, 0.35)',
        marginBottom: 20,
    },
    loansScroll: {
        maxHeight: 400,
        marginBottom: 20,
    },
    loanCard: {
        backgroundColor: '#323A40',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    loanIconBadge: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    loanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    loanType: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    loanRate: {
        fontSize: 13,
        color: theme.colors.textPrimary,
        fontWeight: '600',
    },
    loanRemainingLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.48)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    loanRemaining: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.textPrimary,
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
        color: 'rgba(255,255,255,0.48)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    loanDetailValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    repayOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    repayButton: {
        flex: 1,
        backgroundColor: '#434B50',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    repayButtonFull: {
        backgroundColor: '#434B50',
        borderColor: 'rgba(255,255,255,0.08)',
    },
    repayButtonPressed: {
        opacity: 0.7,
    },
    repayButtonLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.48)',
        fontWeight: '600',
        marginBottom: 4,
    },
    repayButtonValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    insufficientText: {
        fontSize: 12,
        color: theme.colors.textPrimary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    closeButton: {
        backgroundColor: '#323A40',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    closeText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
    },
    confirmButton: {
        backgroundColor: '#434B50',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    confirmText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 16,
    },
});
