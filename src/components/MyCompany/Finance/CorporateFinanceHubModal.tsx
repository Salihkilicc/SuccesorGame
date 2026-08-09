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
import { StatRow, RowGroup, DetailLine, DetailNote } from '../../common/Disclosure';


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

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.body}>

                {/* ------------------------------------------------------------
                    THE CREDIT SCORE IS THE SCREEN'S ONE HEADLINE
                    ------------------------------------------------------------
                    Everything below is a consequence of it: what you can
                    borrow, at what rate, and whether Marcus is your only
                    remaining option. It stays big; the rest became rows.
                   ------------------------------------------------------------ */}
                <View style={styles.hero}>
                    <Text style={styles.heroLabel}>{t('finance.creditScore')}</Text>
                    <View style={styles.heroRow}>
                        <Text style={[styles.heroValue, { color: rating.color }]}>{creditScore}</Text>
                        <View style={styles.heroBadge}>
                            <Text style={[styles.heroGrade, { color: rating.color }]}>{rating.label}</Text>
                            <Text style={styles.heroGradeNote}>{rating.description}</Text>
                        </View>
                    </View>

                    <View style={styles.capacityTrack}>
                        <View
                            style={[
                                styles.capacityFill,
                                {
                                    width: `${Math.min(100, (totalDebt / Math.max(1, totalDebt + borrowingCapacity)) * 100)}%`,
                                    backgroundColor: leverage > 60 ? theme.colors.warning : theme.colors.primary,
                                },
                            ]}
                        />
                    </View>
                    <Text style={styles.capacityNote}>
                        {formatMoney(borrowingCapacity)} still available · {formatMoney(totalDebt)} drawn
                    </Text>
                </View>

                {/* The position, number first, the working behind each one. */}
                <RowGroup title={t('finance.totalDebt')}>
                    <StatRow
                        label={t('finance.totalDebt')}
                        value={formatMoney(totalDebt)}
                        why={loans.length ? `across ${loans.length} loan${loans.length > 1 ? 's' : ''}` : 'nothing borrowed'}
                    />
                    <StatRow
                        label={t('finance.monthlyInterest')}
                        value={formatMoney(monthlyInterest)}
                        why="charged every quarter whether you profit or not"
                    />
                    <StatRow
                        label={t('finance.leverage')}
                        value={`${leverage.toFixed(1)}%`}
                        why={leverage > 60 ? 'above the level lenders are comfortable with' : 'within a normal range'}
                        valueColor={leverage > 60 ? theme.colors.warning : undefined}
                    />
                    <StatRow
                        label={t('finance.borrowingCapacity')}
                        value={formatMoney(borrowingCapacity)}
                        why="what a bank would still lend against your earnings"
                        detail={
                            <DetailNote>
                                Banks lend against EBITDA, not valuation. A high company value does
                                not raise this number - profit does.
                            </DetailNote>
                        }
                    />
                </RowGroup>

                {/* Each loan is a row that opens into its terms. */}
                <RowGroup title={t('finance.activeLoans')}>
                    {loans.length === 0 ? (
                        <StatRow
                            label={t('finance.noActiveDebt')}
                            value="—"
                            why={t('finance.cleanBalanceSheet')}
                        />
                    ) : (
                        loans.map(loan => (
                            <StatRow
                                key={loan.id}
                                label={`${loan.name} Loan`}
                                value={formatMoney(loan.balance)}
                                why={`${loan.rate}% APR`}
                                detail={
                                    <>
                                        <DetailLine label={t('finance.remaining')} value={formatMoney(loan.balance)} />
                                        <DetailLine
                                            label={t('finance.monthly')}
                                            value={formatMoney((loan.balance * loan.rate) / 4)}
                                        />
                                        <DetailLine label="Rate" value={`${loan.rate}% APR`} strong />
                                    </>
                                }
                            />
                        ))
                    )}
                </RowGroup>

                {/* Ways to raise money, in order of how much they cost you. */}
                <RowGroup title="Raise money">
                    <StatRow
                        label={`💸  ${t('finance.injection')}`}
                        value="›"
                        why={t('finance.personalInvestment')}
                    />
                    {!!sharkMember && (
                        <StatRow
                            label={`⚠️  ${t('finance.privateEquityInjection')}`}
                            value="›"
                            why={`from ${sharkMember.name} — no credit check, secured on your own shares`}
                            valueColor={theme.colors.warning}
                        />
                    )}
                </RowGroup>

                <View style={styles.actions}>
                    <Pressable
                        onPress={() => setShowInjection(true)}
                        style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && styles.btnPressed]}>
                        <Text style={styles.btnSecondaryText}>{t('finance.injection')}</Text>
                    </Pressable>
                    {!!sharkMember && (
                        <Pressable
                            onPress={() => setSharkDealModalVisible(true)}
                            style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && styles.btnPressed]}>
                            <Text style={styles.btnSecondaryText}>{sharkMember.name.split(' ')[0]}</Text>
                        </Pressable>
                    )}
                </View>

            </ScrollView>

            {/* ----------------------------------------------------------------
                PINNED, not the last thing in the scroll body.
                ----------------------------------------------------------------
                As a scroll child it needed enough padding under it to clear the
                floating nav bar, and on a short page that padding showed as a
                dead gap beneath the button. Pinned, the gap is only what the
                bar actually needs.
               ---------------------------------------------------------------- */}
            <View style={styles.footer}>
                {totalDebt > 0 && (
                    <Pressable
                        onPress={onRepayDebt}
                        style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && styles.btnPressed]}>
                        <Text style={styles.btnSecondaryText}>{t('finance.repayDebt')}</Text>
                    </Pressable>
                )}
                <Pressable
                    onPress={onRequestLoan}
                    style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.btnPressed]}>
                    <Text style={styles.btnPrimaryText}>{t('finance.requestNewLoan')}</Text>
                </Pressable>
            </View>

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
    body: { padding: theme.spacing.md, paddingBottom: theme.spacing.sm, gap: theme.spacing.md },

    // --- The one headline -------------------------------------------------
    hero: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    heroLabel: {
        color: theme.colors.textMuted,
        fontSize: theme.typography.caption,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.md },
    heroValue: { fontSize: 44, fontWeight: '900', letterSpacing: -1.5, lineHeight: 48 },
    heroBadge: { flex: 1, paddingBottom: 6 },
    heroGrade: { fontSize: theme.typography.subtitle, fontWeight: '800', letterSpacing: 0.5 },
    heroGradeNote: { color: theme.colors.textSecondary, fontSize: theme.typography.caption },

    capacityTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.surfaceHigh,
        overflow: 'hidden',
        marginTop: theme.spacing.xs,
    },
    capacityFill: { height: '100%', borderRadius: 3 },
    capacityNote: { color: theme.colors.textMuted, fontSize: theme.typography.caption },

    // --- Actions ----------------------------------------------------------
    actions: { flexDirection: 'row', gap: theme.spacing.sm },
    footer: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        // The floating bar sits 36 from the bottom and is ~78 tall, so this is
        // what it takes to sit just clear of it - and nothing more.
        paddingBottom: 122,
    },
    btn: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.md,
        alignItems: 'center',
    },
    btnPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
    btnPrimary: { backgroundColor: theme.colors.primary },
    // Primary is the bright blue, a light fill - so the label is black.
    btnPrimaryText: { color: theme.colors.onLight, fontWeight: '800', fontSize: theme.typography.body + 1 },
    btnSecondary: {
        backgroundColor: theme.colors.surfaceHigh,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
    },
    btnSecondaryText: { color: theme.colors.textPrimary, fontWeight: '700', fontSize: theme.typography.body + 1 },

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
        color: theme.colors.textPrimary,
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
        color: theme.colors.textPrimary,
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
        color: theme.colors.textMuted,
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
        color: theme.colors.warning,
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
