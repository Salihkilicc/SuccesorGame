import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, ScrollView, Pressable, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../../../core/theme';
import { useStatsStore } from '../../../core/store';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import { useShareholderStore } from '../../../features/shareholders/stores/useShareholderStore';
import GameModal from '../../common/GameModal';
import GameButton from '../../common/GameButton';
import SharkDealModal from './SharkDealModal';
import CapitalInjectionModal from './CapitalInjectionModal';
import { formatMoney } from '../../../core/utils';
import ScreenHeader from '../../common/ScreenHeader';


type Props = {
    /** Render as a route rather than a popup - see components/common/ScreenHost. */
    asScreen?: boolean;
    visible: boolean;
    onClose: () => void;
    onRequestLoan: () => void;
    onRepayDebt: () => void;
};

const CorporateFinanceHubModal = ({ visible, onClose, onRequestLoan, onRepayDebt, asScreen }: Props) => {
    useLocale();
    // Navigation removed as it was only used for BottomStatsBar
    const { companyValue, companyCapital } = useStatsStore();
    const {
        creditScore,
        totalDebt,
        loans,
        getAssessment,
        getCurrentLeverage,
        getMonthlyInterestTotal,
        refreshCreditScore,
        subsidiaries // [NEW] Access to check count for badge
    } = useCorporateFinanceStore();

    const { members } = useShareholderStore();
    const [sharkDealModalVisible, setSharkDealModalVisible] = useState(false);
    const [showInjection, setShowInjection] = useState(false);


    // Find Shark board members
    const sharkMember = members.find((m) => m.trait === 'Shark');

    // Refresh credit score when modal opens
    React.useEffect(() => {
        if (visible) {
            refreshCreditScore(companyValue, companyCapital);
        }
    }, [visible, companyValue, companyCapital, refreshCreditScore]);

    // ------------------------------------------------------------------
    //  ONCE BU EKRAN 100M YAZIP BANKA 6M VERIYORDU.
    //
    //  Cunku iki farkli kapasite vardi:
    //    burasi  -> DEGERLEME x kaldirac   (hayale borc verir)
    //    banka   -> EBITDA x kaldirac      (nakit akisina borc verir)
    //
    //  Dogrusu ikincisi. Bankalar degerlemeye degil kazanca borc verir;
    //  degerleme dususte buhar olur, faiz odemesi olmaz. Tek kaynak:
    //  credit.ts / assessCredit.
    // ------------------------------------------------------------------
    const assessment = getAssessment();
    const borrowingCapacity = assessment.headroom;
    const leverage = getCurrentLeverage(companyValue);
    const monthlyInterest = getMonthlyInterestTotal();

    // ------------------------------------------------------------------
    //  CREDIT RATING
    // ------------------------------------------------------------------
    //  Six of these seven grades used to be painted with the loss red -
    //  including AAA. The best rating a company can hold was drawn in the
    //  colour that means "you are losing money", which is worse than merely
    //  ugly: it made the grade unreadable as information.
    //
    //  Red now appears on ONE grade, and only because junk debt genuinely is
    //  the loss case. Everything investment grade is plain white; the letter
    //  itself already carries the ranking, so colour does not need to repeat
    //  it. Below investment grade gets the caution blue.
    // ------------------------------------------------------------------
    const getCreditRating = () => {
        const good = theme.colors.textPrimary;
        const caution = theme.colors.warning;
        if (creditScore >= 800) return { label: 'AAA', color: good, description: t('finance.excellent') };
        if (creditScore >= 750) return { label: 'AA', color: good, description: t('finance.veryGood') };
        if (creditScore >= 700) return { label: 'A', color: good, description: t('finance.good') };
        if (creditScore >= 650) return { label: 'BBB', color: good, description: t('finance.fair') };
        if (creditScore >= 600) return { label: 'BB', color: caution, description: t('finance.moderate') };
        if (creditScore >= 500) return { label: 'B', color: caution, description: t('finance.risky') };
        return { label: 'C', color: theme.colors.negative, description: t('finance.junk') };
    };

    const rating = getCreditRating();

    return (
        <GameModal
            asScreen={asScreen}
            visible={visible}
            onClose={onClose}
        >
            <ScreenHeader
                title={t('finance.corporateFinance')}
                subtitle={t('finance.premiumPrivateBanking')}
                onBack={onClose}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: 24 }}>

                {/* --- NAVIGATION GRID --- */}
                <View style={styles.navGrid}>
                    {/* OWNER INJECTION BUTTON */}
                    <TouchableOpacity style={[styles.navCard, { borderColor: 'rgba(255,255,255,0.06)', flex: 1 }]} onPress={() => setShowInjection(true)}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(207,208,210,0.2)' }]}>
                            <Text style={{ fontSize: 24 }}>💸</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{t('finance.injection')}</Text>
                            <Text style={styles.cardDesc}>{t('finance.personalInvestment')}</Text>
                        </View>
                        <Text style={{ color: '#FFFFFF', fontSize: 18 }}>→</Text>
                    </TouchableOpacity>
                </View>

                {/* HERO: Credit Score */}
                <View style={styles.heroSection}>
                    <Text style={styles.heroLabel}>{t('finance.creditScore')}</Text>
                    <View style={styles.scoreContainer}>
                        <Text style={[styles.scoreNumber, { color: rating.color }]}>
                            {creditScore}
                        </Text>
                        <View style={styles.ratingBadge}>
                            <Text style={[styles.ratingText, { color: rating.color }]}>
                                {rating.label}
                            </Text>
                            <Text style={styles.ratingDescription}>{rating.description}</Text>
                        </View>
                    </View>

                    {/* Borrowing Capacity Progress Bar */}
                    <View style={styles.capacityContainer}>
                        <Text style={styles.capacityLabel}>{t('finance.borrowingCapacity')}</Text>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${Math.min(100, (totalDebt / (totalDebt + borrowingCapacity)) * 100)}%`,
                                        backgroundColor: leverage > 60 ? '#FF8A8A' : '#FF8A8A'
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.capacityValue}>
                            {formatMoney(borrowingCapacity)} Available
                        </Text>
                    </View>
                </View>

                {/* STATS GRID */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>{t('finance.totalDebt')}</Text>
                        <Text style={[styles.statValue, { color: '#FF8A8A' }]}>
                            {formatMoney(totalDebt)}
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>{t('finance.monthlyInterest')}</Text>
                        <Text style={[styles.statValue, { color: '#FF8A8A' }]}>
                            {formatMoney(monthlyInterest)}
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>{t('finance.leverage')}</Text>
                        <Text style={[styles.statValue, { color: leverage > 60 ? '#FF8A8A' : '#CFD0D2' }]}>
                            {leverage.toFixed(1)}%
                        </Text>
                    </View>
                </View>

                {/* ACTIVE LOANS */}
                <View>
                    <Text style={styles.sectionTitle}>{t('finance.activeLoans')}</Text>
                    {loans.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateIcon}>✓</Text>
                            <Text style={styles.emptyStateText}>{t('finance.noActiveDebt')}</Text>
                            <Text style={styles.emptyStateSubtext}>{t('finance.cleanBalanceSheet')}</Text>
                        </View>
                    ) : (
                        <View style={styles.loansList}>
                            {loans.map((loan) => (
                                <View key={loan.id} style={styles.loanCard}>
                                    <View style={styles.loanHeader}>
                                        <Text style={styles.loanType}>{loan.name} Loan</Text>
                                        <Text style={styles.loanRate}>{loan.rate}% APR</Text>
                                    </View>
                                    <View style={styles.loanDetails}>
                                        <View>
                                            <Text style={styles.loanDetailLabel}>{t('finance.remaining')}</Text>
                                            <Text style={styles.loanDetailValue}>
                                                {formatMoney(loan.balance)}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text style={styles.loanDetailLabel}>{t('finance.monthly')}</Text>
                                            <Text style={styles.loanDetailValue}>
                                                {formatMoney(((loan.balance * loan.rate) / 4))}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* SHARK DEAL - SPECIAL OFFER */}
                {sharkMember && (
                    <View>
                        <Text style={styles.sectionTitle}>⚠️ Special Offer</Text>
                        <Pressable
                            style={({ pressed }) => [
                                styles.sharkDealCard,
                                pressed && styles.sharkDealCardPressed
                            ]}
                            onPress={() => setSharkDealModalVisible(true)}
                        >
                            <View style={styles.sharkDealHeader}>
                                <View style={styles.sharkAvatar}>
                                    <Text style={styles.sharkAvatarText}>
                                        {sharkMember.name.charAt(0)}
                                    </Text>
                                </View>
                                <View style={styles.sharkDealInfo}>
                                    <Text style={styles.sharkDealTitle}>{t('finance.privateEquityInjection')}</Text>
                                    <Text style={styles.sharkDealSubtitle}>
                                        from {sharkMember.name}
                                    </Text>
                                </View>
                                <View style={styles.instantBadge}>
                                    <Text style={styles.instantBadgeText}>{t('finance.instantCash')}</Text>
                                </View>
                            </View>
                            <View style={styles.sharkDealFooter}>
                                <Text style={styles.sharkDealWarning}>
                                    ⚡ No credit check required • Equity-backed financing
                                </Text>
                            </View>
                        </Pressable>
                    </View>
                )}



                {/* CTA BUTTONS */}
                <View style={styles.ctaContainer}>
                    {totalDebt > 0 && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.repayButton,
                                pressed && styles.repayButtonPressed
                            ]}
                            onPress={onRepayDebt}
                        >
                            <Text style={styles.repayButtonText}>{t('finance.repayDebt')}</Text>
                        </Pressable>
                    )}

                    <Pressable
                        style={({ pressed }) => [
                            styles.ctaButton,
                            pressed && styles.ctaButtonPressed
                        ]}
                        onPress={onRequestLoan}
                    >
                        <Text style={styles.ctaButtonText}>{t('finance.requestNewLoan')}</Text>
                    </Pressable>
                </View>

            </ScrollView>

            {/* Shark Deal Modal */}
            {sharkMember && (
                <SharkDealModal
                    visible={sharkDealModalVisible}
                    onClose={() => setSharkDealModalVisible(false)}
                    sharkMember={sharkMember}
                />
            )}

            <CapitalInjectionModal
                visible={showInjection}
                onClose={() => setShowInjection(false)}
            />


        </GameModal>
    );
};

export default CorporateFinanceHubModal;

const styles = StyleSheet.create({
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        paddingTop: 10,
        position: 'relative',
        minHeight: 50,
    },
    closeButton: {
        position: 'absolute',
        left: 0,
        padding: 10,
        zIndex: 10,
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 1,
        marginBottom: 4,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.48)',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    heroSection: {
        backgroundColor: '#434B50',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    heroLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.48)',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        textAlign: 'center',
        marginBottom: 12,
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 24,
    },
    scoreNumber: {
        fontSize: 56,
        fontWeight: '900',
        letterSpacing: -2,
    },
    ratingBadge: {
        alignItems: 'flex-start',
    },
    ratingText: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: 1,
    },
    ratingDescription: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.48)',
        fontWeight: '600',
    },
    capacityContainer: {
        gap: 8,
    },
    capacityLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.48)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#323A40',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    capacityValue: {
        fontSize: 14,
        color: '#FF8A8A',
        fontWeight: '700',
        textAlign: 'right',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#434B50',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.48)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    emptyState: {
        backgroundColor: '#434B50',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    emptyStateIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.48)',
    },
    loansList: {
        gap: 12,
    },
    loanCard: {
        backgroundColor: '#434B50',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    loanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    loanType: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    loanRate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF8A8A',
    },
    loanDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    loanDetailLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.48)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    loanDetailValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    ctaContainer: {
        gap: 12,
    },
    repayButton: {
        backgroundColor: '#323A40',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    repayButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    repayButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    ctaButton: {
        backgroundColor: '#434B50',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#1C242C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    ctaButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    ctaButtonText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    // Shark Deal Styles
    sharkDealCard: {
        backgroundColor: '#434B50',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        shadowColor: '#1C242C',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 12,
    },
    sharkDealCardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    sharkDealHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    sharkAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#434B50',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sharkAvatarText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    sharkDealInfo: {
        flex: 1,
    },
    sharkDealTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    sharkDealSubtitle: {
        fontSize: 12,
        color: '#FF8A8A',
        fontWeight: '600',
    },
    instantBadge: {
        backgroundColor: '#434B50',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    instantBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    sharkDealFooter: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
        paddingTop: 12,
    },
    sharkDealWarning: {
        fontSize: 11,
        color: '#FF8A8A',
        fontStyle: 'italic',
        textAlign: 'center',
    },

    // Navigation Grid for Top Buttons
    navGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    navCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#434B50',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        gap: 12,
    },

    // Existing Action Card Styles used by navigation buttons
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    cardDesc: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.48)',
    },
});
