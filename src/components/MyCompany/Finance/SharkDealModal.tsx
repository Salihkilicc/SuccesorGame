import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import GameModal from '../../common/GameModal';
import { useShareholderStore, type BoardMember } from '../../../features/shareholders/stores/useShareholderStore';
import { useStatsStore } from '../../../core/store';
import { useGameStore } from '../../../core/store/useGameStore';
import { formatMoney } from '../../../core/utils';

type Props = {
    visible: boolean;
    onClose: () => void;
    sharkMember: BoardMember;
};

const SharkDealModal = ({ visible, onClose, sharkMember }: Props) => {
    useLocale();
    const { takeSharkLoan, repaySharkLoan, sharkLoans, members } = useShareholderStore();
    const { update, money } = useStatsStore();
    const { currentMonth } = useGameStore();

    // ------------------------------------------------------------------
    //  ONCE SABIT 10 MILYON VE BELIRSIZ "6 AY" IDI
    // ------------------------------------------------------------------
    //  Oyuncu "6 ay ne, 6 quarter mi? 10M aliyor baskasi yok" dedi.
    //  Ikisi de hakli:
    //
    //   1) Tutar SABITTI. 2 milyonluk sirkette de 2 milyarlik sirkette de
    //      ayni 10 milyon. Erken oyunda kurtaris, gec oyunda anlamsiz.
    //
    //   2) `currentMonth + 6` yaziyordu ama oyun CEYREK ilerliyor (3 ay).
    //      Yani "6 ay" aslinda 2 tur demekti ve ekranda ay olarak
    //      gorunuyordu. Iki farkli zaman birimi ayni alanda.
    //
    //  Artik tutar sirketin degerlemesine gore olceklenir ve vade
    //  CEYREK cinsinden yazilir.
    // ------------------------------------------------------------------
    const valuation = useStatsStore(st => st.companyValue) || 0;
    /** Tefeci degerlemenin en fazla %30'unu verir — otesi kendi riski. */
    const maxLoan = Math.max(2_000_000, Math.round(valuation * 0.30));
    const [loanAmount, setLoanAmount] = React.useState(Math.round(maxLoan * 0.5));
    const LOAN_AMOUNT = Math.min(loanAmount, maxLoan);

    /** Vade CEYREK cinsinden. Motor ay sayiyor, o yuzden x3. */
    const DEADLINE_QUARTERS = 4;
    const deadlineTurn = currentMonth + DEADLINE_QUARTERS * 3;

    /** %30 yillik — bir yilda odenecek toplam. */
    const totalOwed = Math.round(LOAN_AMOUNT * (1 + 0.30));
    /** Odeyemezsen haczedilecek hisse degeri: anaparanin 1.5 kati. */
    const collateralValue = Math.round(LOAN_AMOUNT * 1.5);

    const handleSignAgreement = () => {
        const result = takeSharkLoan(
            sharkMember.id,
            LOAN_AMOUNT,
            deadlineTurn,
            (amount) => {
                // Add cash to company capital
                const { companyCapital } = useStatsStore.getState();
                update({ companyCapital: companyCapital + amount });
            }
        );

        if (result.success) {
            Alert.alert(
                t('alert.dealSigned'),
                `${result.message}\n\n` +
                `You owe ${formatMoney(totalOwed)} within ${DEADLINE_QUARTERS} quarters.\n` +
                `Collateral pledged: ${formatMoney(collateralValue)} of your own shares.\n\n` +
                `⚠️ Miss the date and he takes the shares — not the money.`,
            );
            onClose();
        } else {
            Alert.alert(t('alert.dealFailed'), `❌ ${result.message}`);
        }
    };

    return (
        <GameModal visible={visible} onClose={onClose}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.headerTitle}>{t('finance.offerTerms')}</Text>
                <Text style={styles.headerSubtitle}>{t('finance.privateEquityAgreement')}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
                {/* ----------------------------------------------------------
                    ACTIVE LOANS — there was no way out
                    ----------------------------------------------------------
                    takeSharkLoan was reachable from this screen and
                    repaySharkLoan was called from nowhere in the app. You
                    could pledge your shares to a director and then had no
                    means of ever paying them back; the only exit was
                    collateral seizure. A one-way trap, and not by design.
                   ---------------------------------------------------------- */}
                {(sharkLoans || []).filter(l => l.isActive).map(loan => {
                    const lender = members.find(m => m.id === loan.lenderId);
                    return (
                        <View key={loan.id} style={styles.activeLoanCard}>
                            <Text style={styles.activeLoanTitle}>
                                {t('finance.activeLoanFrom', { v1: lender?.name || '-' })}
                            </Text>
                            <Text style={styles.activeLoanBody}>
                                {t('finance.activeLoanTerms', {
                                    v1: formatMoney(loan.amount),
                                    v2: String(loan.deadlineTurn),
                                })}
                            </Text>
                            <Pressable
                                style={[styles.repayBtn, money < loan.amount && styles.repayBtnDisabled]}
                                disabled={money < loan.amount}
                                onPress={() => {
                                    const r = repaySharkLoan(loan.id, (amount: number) => {
                                        if (money < amount) return false;
                                        update({ money: money - amount });
                                        return true;
                                    });
                                    Alert.alert(
                                        r.success ? t('finance.loanRepaid') : t('finance.cannotRepay'),
                                        r.message,
                                    );
                                }}
                            >
                                <Text style={styles.repayBtnText}>
                                    {money < loan.amount
                                        ? t('finance.needMoreCash', { v1: formatMoney(loan.amount - money) })
                                        : t('finance.repayNow', { v1: formatMoney(loan.amount) })}
                                </Text>
                            </Pressable>
                        </View>
                    );
                })}

                {/* TUTAR — sirketin buyuklugune gore */}
                <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>{t('finance.howMuchDoYouNeed')}</Text>
                    <Text style={styles.amountValue}>{formatMoney(LOAN_AMOUNT)}</Text>
                    <View style={styles.amountRow}>
                        {[0.25, 0.5, 0.75, 1].map(f => (
                            <Pressable
                                key={f}
                                style={[
                                    styles.amountChip,
                                    Math.abs(LOAN_AMOUNT - maxLoan * f) < maxLoan * 0.05 && styles.amountChipActive,
                                ]}
                                onPress={() => setLoanAmount(Math.round(maxLoan * f))}
                            >
                                <Text style={styles.amountChipText}>{Math.round(f * 100)}%</Text>
                            </Pressable>
                        ))}
                    </View>
                    <Text style={styles.amountNote}>
                        He will go up to {formatMoney(maxLoan)} — 30% of what your company is worth.
                        Beyond that even he thinks you are a bad bet.
                    </Text>
                </View>

                {/* SARTLAR — hepsi acik */}
                <View style={styles.termsCard}>
                    <View style={styles.termRow}>
                        <Text style={styles.termLabel}>{t('finance.rate')}</Text>
                        <Text style={styles.termBad}>30% a year</Text>
                    </View>
                    <View style={styles.termRow}>
                        <Text style={styles.termLabel}>{t('finance.dueIn')}</Text>
                        <Text style={styles.termValue}>{DEADLINE_QUARTERS} quarters</Text>
                    </View>
                    <View style={styles.termRow}>
                        <Text style={styles.termLabel}>{t('finance.totalToRepay')}</Text>
                        <Text style={styles.termBad}>{formatMoney(totalOwed)}</Text>
                    </View>
                    <View style={styles.termRow}>
                        <Text style={styles.termLabel}>{t('finance.collateral')}</Text>
                        <Text style={styles.termBad}>{formatMoney(collateralValue)} of your shares</Text>
                    </View>
                </View>
                {/* Lender Info */}
                <View style={styles.lenderCard}>
                    <View style={styles.lenderAvatar}>
                        <Text style={styles.lenderAvatarText}>{sharkMember.name.charAt(0)}</Text>
                    </View>
                    <View>
                        <Text style={styles.lenderName}>{sharkMember.name}</Text>
                        <Text style={styles.lenderRole}>{t('finance.privateEquityInvestor')}</Text>
                    </View>
                </View>

                {/* The Deal */}
                <View style={styles.dealSection}>
                    <Text style={styles.sectionTitle}>{t('finance.theDeal')}</Text>

                    <View style={styles.dealRow}>
                        <Text style={styles.dealLabel}>{t('finance.amount')}</Text>
                        <Text style={styles.dealAmount}>{formatMoney(LOAN_AMOUNT)}</Text>
                    </View>

                    <View style={styles.dealRow}>
                        <Text style={styles.dealLabel}>{t('finance.interestRate')}</Text>
                        <Text style={styles.dealInterest}>0%</Text>
                    </View>

                    <View style={styles.dealRow}>
                        <Text style={styles.dealLabel}>{t('finance.deadline')}</Text>
                        <Text style={styles.dealDeadline}>{DEADLINE_QUARTERS} Quarters</Text>
                    </View>

                    <View style={styles.dealRow}>
                        <Text style={styles.dealLabel}>{t('finance.dueBy')}</Text>
                        <Text style={styles.dealDeadline}>{t('finance.turnV1', { v1: deadlineTurn })}</Text>
                    </View>
                </View>

                {/* The Fine Print - CRITICAL */}
                <View style={styles.warningBox}>
                    <View style={styles.warningHeader}>
                        <Text style={styles.warningHeaderIcon}>⚠️</Text>
                        <Text style={styles.warningHeaderText}>{t('finance.collateralClause')}</Text>
                    </View>
                    <Text style={styles.warningText}>{t('finance.failureToRepayByThe', { v1: ' ' })}<Text style={styles.warningTextBold}>immediate seizure</Text> of your personal shares
                        equivalent to the debt value{' '}
                        <Text style={styles.warningTextBold}>+ 50% penalty</Text>.
                    </Text>
                    <Text style={styles.warningSubtext}>{t('finance.thisMayResultInPermanent')}</Text>
                </View>

                {/* Additional Warnings */}
                <View style={styles.riskBox}>
                    <Text style={styles.riskTitle}>⚡ RISK FACTORS</Text>
                    <Text style={styles.riskItem}>• No grace period or extensions</Text>
                    <Text style={styles.riskItem}>• Seizure is automatic and irreversible</Text>
                    <Text style={styles.riskItem}>• Stock price fluctuations affect seizure amount</Text>
                    <Text style={styles.riskItem}>• May trigger hostile takeover scenarios</Text>
                </View>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.rejectButton,
                            pressed && styles.rejectButtonPressed
                        ]}
                        onPress={onClose}
                    >
                        <Text style={styles.rejectButtonText}>{t('finance.rejectOffer')}</Text>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.signButton,
                            pressed && styles.signButtonPressed
                        ]}
                        onPress={handleSignAgreement}
                    >
                        <Text style={styles.signButtonText}>⚠️ SIGN AGREEMENT</Text>
                    </Pressable>
                </View>

                {/* Legal Disclaimer */}
                <Text style={styles.disclaimer}>
                    By signing, you acknowledge understanding of all terms and accept full responsibility
                    for consequences of default.
                </Text>
            </ScrollView>
        </GameModal>
    );
};

export default SharkDealModal;

const styles = StyleSheet.create({
    activeLoanCard: { backgroundColor: '#020626', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    activeLoanTitle: { color: '#C734CA', fontWeight: '800', fontSize: 13, marginBottom: 4 },
    activeLoanBody: { color: '#C734CA', fontSize: 11, lineHeight: 16, marginBottom: 10 },
    repayBtn: { backgroundColor: '#7B68D7', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
    repayBtnDisabled: { backgroundColor: '#0B0635' },
    repayBtnText: { color: '#020626', fontWeight: '800', fontSize: 13 },
    amountCard: { backgroundColor: '#07062E', borderRadius: 12, padding: 16 },
    amountLabel: { fontSize: 12, color: 'rgba(255,255,255,0.48)', fontWeight: '600' },
    amountValue: { fontSize: 26, color: '#FFFFFF', fontWeight: '800', marginVertical: 6 },
    amountRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    amountChip: { flex: 1, padding: 8, borderRadius: 8, backgroundColor: '#020626', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
    amountChipActive: { borderColor: 'rgba(255,255,255,0.08)' },
    amountChipText: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
    amountNote: { fontSize: 11, color: 'rgba(255,255,255,0.48)', marginTop: 10, lineHeight: 16 },
    termsCard: { backgroundColor: '#020626', borderRadius: 12, padding: 16, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    termRow: { flexDirection: 'row', justifyContent: 'space-between' },
    termLabel: { fontSize: 12, color: 'rgba(255,255,255,0.48)' },
    termValue: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
    termBad: { fontSize: 12, color: '#C734CA', fontWeight: '700' },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    warningIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#C734CA',
        fontStyle: 'italic',
    },
    lenderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#020626',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    lenderAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#0B0635',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lenderAvatarText: {
        fontSize: 28,
        fontWeight: '900',
        color: '#020626',
    },
    lenderName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    lenderRole: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.48)',
    },
    dealSection: {
        backgroundColor: '#020626',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        gap: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.48)',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    dealRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dealLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.48)',
        fontWeight: '600',
    },
    dealAmount: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -1,
    },
    dealInterest: {
        fontSize: 24,
        fontWeight: '800',
        color: '#7B68D7',
    },
    dealDeadline: {
        fontSize: 24,
        fontWeight: '800',
        color: '#C734CA',
    },
    warningBox: {
        backgroundColor: '#020626',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        gap: 12,
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    warningHeaderIcon: {
        fontSize: 20,
    },
    warningHeaderText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#C734CA',
        letterSpacing: 1,
    },
    warningText: {
        fontSize: 14,
        color: '#FFFFFF',
        lineHeight: 22,
    },
    warningTextBold: {
        fontWeight: '900',
        color: '#C734CA',
    },
    warningSubtext: {
        fontSize: 12,
        color: '#C734CA',
        fontStyle: 'italic',
        marginTop: 8,
    },
    riskBox: {
        backgroundColor: '#020626',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        gap: 8,
    },
    riskTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#C734CA',
        letterSpacing: 1,
        marginBottom: 8,
    },
    riskItem: {
        fontSize: 13,
        color: '#C734CA',
        lineHeight: 20,
    },
    buttonContainer: {
        gap: 12,
        marginTop: 8,
    },
    rejectButton: {
        backgroundColor: '#07062E',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.48)',
    },
    rejectButtonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    rejectButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.48)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    signButton: {
        backgroundColor: '#0B0635',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#020626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 12,
    },
    signButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    signButtonText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#020626',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    disclaimer: {
        fontSize: 10,
        color: '#1A0A4A',
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 16,
        marginTop: 8,
    },
});
