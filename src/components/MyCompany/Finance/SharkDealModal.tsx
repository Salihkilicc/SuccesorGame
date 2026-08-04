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
    const { takeSharkLoan } = useShareholderStore();
    const { update } = useStatsStore();
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
    amountCard: { backgroundColor: '#2A2D35', borderRadius: 12, padding: 16 },
    amountLabel: { fontSize: 12, color: '#8A9BA8', fontWeight: '600' },
    amountValue: { fontSize: 26, color: '#FFF', fontWeight: '800', marginVertical: 6 },
    amountRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    amountChip: { flex: 1, padding: 8, borderRadius: 8, backgroundColor: '#1C1C1E', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    amountChipActive: { borderColor: '#FF6B6B' },
    amountChipText: { fontSize: 12, color: '#FFF', fontWeight: '700' },
    amountNote: { fontSize: 11, color: '#8A9BA8', marginTop: 10, lineHeight: 16 },
    termsCard: { backgroundColor: '#2A1A1A', borderRadius: 12, padding: 16, gap: 10, borderWidth: 1, borderColor: '#FF6B6B' },
    termRow: { flexDirection: 'row', justifyContent: 'space-between' },
    termLabel: { fontSize: 12, color: '#8A9BA8' },
    termValue: { fontSize: 12, color: '#FFF', fontWeight: '700' },
    termBad: { fontSize: 12, color: '#FF6B6B', fontWeight: '700' },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#FF3B30',
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
        color: '#FF6B6B',
        fontStyle: 'italic',
    },
    lenderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2A2D35',
    },
    lenderAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FF3B30',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lenderAvatarText: {
        fontSize: 28,
        fontWeight: '900',
        color: '#000',
    },
    lenderName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    lenderRole: {
        fontSize: 12,
        color: '#8A9BA8',
    },
    dealSection: {
        backgroundColor: '#000000',
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: '#2A2D35',
        gap: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#8A9BA8',
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
        color: '#8A9BA8',
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
        color: '#90EE90',
    },
    dealDeadline: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FF3B30',
    },
    warningBox: {
        backgroundColor: '#1A0000',
        borderRadius: 12,
        padding: 20,
        borderWidth: 2,
        borderColor: '#FF3B30',
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
        color: '#FF3B30',
        letterSpacing: 1,
    },
    warningText: {
        fontSize: 14,
        color: '#FFFFFF',
        lineHeight: 22,
    },
    warningTextBold: {
        fontWeight: '900',
        color: '#FF3B30',
    },
    warningSubtext: {
        fontSize: 12,
        color: '#FF6B6B',
        fontStyle: 'italic',
        marginTop: 8,
    },
    riskBox: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#FF3B30',
        gap: 8,
    },
    riskTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FF3B30',
        letterSpacing: 1,
        marginBottom: 8,
    },
    riskItem: {
        fontSize: 13,
        color: '#FF6B6B',
        lineHeight: 20,
    },
    buttonContainer: {
        gap: 12,
        marginTop: 8,
    },
    rejectButton: {
        backgroundColor: '#2A2D35',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#8A9BA8',
    },
    rejectButtonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    rejectButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#8A9BA8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    signButton: {
        backgroundColor: '#FF3B30',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#FF3B30',
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
        color: '#000000',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    disclaimer: {
        fontSize: 10,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 16,
        marginTop: 8,
    },
});
