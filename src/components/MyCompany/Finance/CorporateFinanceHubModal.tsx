import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TouchableOpacity } from 'react-native';
import { theme } from '../../../core/theme';
import { useStatsStore } from '../../../core/store';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import GameModal from '../../common/GameModal';
import GameButton from '../../common/GameButton';

type Props = {
    visible: boolean;
    onClose: () => void;
    onRequestLoan: () => void;
    onRepayDebt: () => void;
};

const CorporateFinanceHubModal = ({ visible, onClose, onRequestLoan, onRepayDebt }: Props) => {
    const { companyValue, companyCapital } = useStatsStore();
    const {
        creditScore,
        totalDebt,
        loans,
        getBorrowingCapacity,
        getCurrentLeverage,
        getMonthlyInterestTotal,
        refreshCreditScore
    } = useCorporateFinanceStore();

    // Refresh credit score when modal opens
    React.useEffect(() => {
        if (visible) {
            refreshCreditScore(companyValue, companyCapital);
        }
    }, [visible, companyValue, companyCapital, refreshCreditScore]);

    const borrowingCapacity = getBorrowingCapacity(companyValue);
    const leverage = getCurrentLeverage(companyValue);
    const monthlyInterest = getMonthlyInterestTotal();

    // Credit Rating Display
    const getCreditRating = () => {
        if (creditScore >= 800) return { label: 'AAA', color: '#FFD700', description: 'Excellent' };
        if (creditScore >= 750) return { label: 'AA', color: '#FFD700', description: 'Very Good' };
        if (creditScore >= 700) return { label: 'A', color: '#90EE90', description: 'Good' };
        if (creditScore >= 650) return { label: 'BBB', color: '#FFA500', description: 'Fair' };
        if (creditScore >= 600) return { label: 'BB', color: '#FFA500', description: 'Moderate' };
        if (creditScore >= 500) return { label: 'B', color: '#FF6B6B', description: 'Risky' };
        return { label: 'C', color: '#FF0000', description: 'Junk' };
    };

    const rating = getCreditRating();

    return (
        <GameModal
            visible={visible}
            onClose={onClose}
        >
            {/* Custom Header with Close Button */}
            <View style={styles.customHeader}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>CORPORATE FINANCE</Text>
                    <Text style={styles.headerSubtitle}>Premium Private Banking</Text>
                </View>
                {/* Spacer to balance the absolute close button if needed, but absolute works best */}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.lg }}>

                {/* HERO: Credit Score */}
                <View style={styles.heroSection}>
                    <Text style={styles.heroLabel}>CREDIT SCORE</Text>
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
                        <Text style={styles.capacityLabel}>Borrowing Capacity</Text>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${Math.min(100, (totalDebt / (totalDebt + borrowingCapacity)) * 100)}%`,
                                        backgroundColor: leverage > 60 ? '#FF6B6B' : '#FFD700'
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.capacityValue}>
                            ${(borrowingCapacity / 1_000_000).toFixed(1)}M Available
                        </Text>
                    </View>
                </View>

                {/* STATS GRID */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Debt</Text>
                        <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
                            ${(totalDebt / 1_000_000).toFixed(2)}M
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Monthly Interest</Text>
                        <Text style={[styles.statValue, { color: '#FFA500' }]}>
                            ${(monthlyInterest / 1_000).toFixed(0)}K
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Leverage</Text>
                        <Text style={[styles.statValue, { color: leverage > 60 ? '#FF6B6B' : '#90EE90' }]}>
                            {leverage.toFixed(1)}%
                        </Text>
                    </View>
                </View>

                {/* ACTIVE LOANS */}
                <View>
                    <Text style={styles.sectionTitle}>Active Loans</Text>
                    {loans.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateIcon}>✓</Text>
                            <Text style={styles.emptyStateText}>No Active Debt</Text>
                            <Text style={styles.emptyStateSubtext}>Clean Balance Sheet</Text>
                        </View>
                    ) : (
                        <View style={styles.loansList}>
                            {loans.map((loan) => (
                                <View key={loan.id} style={styles.loanCard}>
                                    <View style={styles.loanHeader}>
                                        <Text style={styles.loanType}>{loan.type} Loan</Text>
                                        <Text style={styles.loanRate}>{loan.interestRate}% APR</Text>
                                    </View>
                                    <View style={styles.loanDetails}>
                                        <View>
                                            <Text style={styles.loanDetailLabel}>Remaining</Text>
                                            <Text style={styles.loanDetailValue}>
                                                ${(loan.remaining / 1_000_000).toFixed(2)}M
                                            </Text>
                                        </View>
                                        <View>
                                            <Text style={styles.loanDetailLabel}>Monthly</Text>
                                            <Text style={styles.loanDetailValue}>
                                                ${(loan.monthlyPayment / 1_000).toFixed(0)}K
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

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
                            <Text style={styles.repayButtonText}>Repay Debt</Text>
                        </Pressable>
                    )}

                    <Pressable
                        style={({ pressed }) => [
                            styles.ctaButton,
                            pressed && styles.ctaButtonPressed
                        ]}
                        onPress={onRequestLoan}
                    >
                        <Text style={styles.ctaButtonText}>Request New Loan</Text>
                    </Pressable>
                </View>

            </ScrollView>
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
        color: '#F0F0F0',
        letterSpacing: 1,
        marginBottom: 4,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#8A9BA8',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    heroSection: {
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 24,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    heroLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#8A9BA8',
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
        color: '#8A9BA8',
        fontWeight: '600',
    },
    capacityContainer: {
        gap: 8,
    },
    capacityLabel: {
        fontSize: 12,
        color: '#8A9BA8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#2A2D35',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    capacityValue: {
        fontSize: 14,
        color: '#FFD700',
        fontWeight: '700',
        textAlign: 'right',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2A2D35',
    },
    statLabel: {
        fontSize: 11,
        color: '#8A9BA8',
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
        color: '#E0E0E0',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    emptyState: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2A2D35',
    },
    emptyStateIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#90EE90',
        marginBottom: 4,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#8A9BA8',
    },
    loansList: {
        gap: 12,
    },
    loanCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2A2D35',
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
        color: '#FFF',
    },
    loanRate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFD700',
    },
    loanDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    loanDetailLabel: {
        fontSize: 11,
        color: '#8A9BA8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    loanDetailValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    ctaContainer: {
        gap: 12,
    },
    repayButton: {
        backgroundColor: '#2A2D35',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#90EE90',
    },
    repayButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    repayButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#90EE90',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    ctaButton: {
        backgroundColor: '#FFD700',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#FFD700',
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
        color: '#000',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
