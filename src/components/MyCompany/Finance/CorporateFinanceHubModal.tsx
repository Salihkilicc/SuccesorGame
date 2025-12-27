import React, { useMemo } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../../../theme'; // Adjust path if needed
import { useStatsStore } from '../../../store'; // Adjust path if needed

type Props = {
    visible: boolean;
    onClose: () => void;
    onSelectLoan: (type: string, rate: number) => void;
    onSelectRepay: () => void;
};

const CorporateFinanceHubModal = ({ visible, onClose, onSelectLoan, onSelectRepay }: Props) => {
    const {
        companyRevenueMonthly,
        companyExpensesMonthly,
        companyDebtTotal,
        isPublic
    } = useStatsStore();

    const profit = companyRevenueMonthly - companyExpensesMonthly;

    // 1. CREDIT RATING ENGINE
    const creditRating = useMemo(() => {
        // Logic: Profit > 0 && TotalDebt < Revenue -> AAA (5%)
        // Else -> B or C (15-25%)
        // Let's refine "B" vs "C". 
        // If Profit > 0 but Debt >= Revenue -> B (15%)
        // If Profit <= 0 -> C (25%)

        if (profit > 0 && companyDebtTotal < companyRevenueMonthly) {
            return { label: 'AAA', rate: 5, color: theme.colors.success, description: 'Excellent Credit' };
        } else if (profit > 0) {
            return { label: 'B', rate: 15, color: '#FFD700', description: 'Moderate Risk' }; // Goldish
        } else {
            return { label: 'C', rate: 25, color: theme.colors.danger, description: 'High Risk / Junk' };
        }
    }, [profit, companyDebtTotal, companyRevenueMonthly]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>CORPORATE FINANCE HUB</Text>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>×</Text>
                        </Pressable>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.lg }}>

                        {/* 1. Credit Rating Display */}
                        <View style={styles.ratingSection}>
                            <View style={styles.ratingInfo}>
                                <Text style={styles.ratingLabel}>CREDIT RATING</Text>
                                <Text style={[styles.ratingValue, { color: creditRating.color }]}>
                                    {creditRating.label}
                                </Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.ratingInfo}>
                                <Text style={styles.ratingLabel}>BASE INTEREST</Text>
                                <Text style={[styles.ratingValue, { color: creditRating.color }]}>
                                    {creditRating.rate}%
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.ratingDescription}>
                            Current status: {creditRating.description}. Improved ratings unlock lower interest rates.
                        </Text>

                        {/* 2. Loan Tiers / Cards */}
                        <View style={styles.tiersContainer}>
                            <Text style={styles.sectionTitle}>Available Financing</Text>

                            {/* A) Traditional Bank */}
                            <LoanCard
                                title="Traditional Bank"
                                subtitle="Standard commercial loans"
                                interest={`${creditRating.rate}% APR`}
                                icon="🏛️"
                                onPress={() => onSelectLoan('Bank', creditRating.rate)}
                            />

                            {/* B) Corporate Bonds */}
                            <LoanCard
                                title="Corporate Bonds"
                                subtitle="Issue bonds to public markets"
                                interest={`${Math.max(2, creditRating.rate - 2)}% APR`} // Bonds usually cheaper if AAA
                                icon="📜"
                                isLocked={!isPublic}
                                lockReason="Requires IPO"
                                onPress={() => onSelectLoan('Bonds', Math.max(2, creditRating.rate - 2))}
                            />

                            {/* C) Shark / Private Credit */}
                            <LoanCard
                                title="Private Credit / Shark"
                                subtitle="Fast cash, no questions asked"
                                interest="40%+ APR"
                                icon="🦈"
                                isDanger
                                onPress={() => onSelectLoan('Shark', 40)}
                            />
                        </View>

                        {/* 3. Repayment Button */}
                        <Pressable
                            onPress={onSelectRepay}
                            style={({ pressed }) => [styles.repayButton, pressed && styles.repayButtonPressed]}
                        >
                            <Text style={styles.repayButtonText}>Repay Debt</Text>
                        </Pressable>

                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// Sub-component for Cards
const LoanCard = ({
    title,
    subtitle,
    interest,
    icon,
    onPress,
    isLocked = false,
    lockReason,
    isDanger = false
}: {
    title: string;
    subtitle: string;
    interest: string;
    icon: string;
    onPress: () => void;
    isLocked?: boolean;
    lockReason?: string;
    isDanger?: boolean;
}) => (
    <Pressable
        onPress={isLocked ? undefined : onPress}
        style={({ pressed }) => [
            styles.card,
            isLocked && styles.cardLocked,
            isDanger && styles.cardDanger,
            !isLocked && pressed && styles.cardPressed
        ]}>
        <View style={styles.cardLeft}>
            <Text style={styles.cardIcon}>{isLocked ? '🔒' : icon}</Text>
            <View style={{ gap: 2 }}>
                <Text style={[
                    styles.cardTitle,
                    isLocked && styles.textLocked,
                    isDanger && styles.textDanger
                ]}>{title}</Text>
                <Text style={styles.cardSubtitle}>{subtitle}</Text>
                {isLocked && <Text style={styles.lockReason}>{lockReason}</Text>}
            </View>
        </View>

        {!isLocked && (
            <View style={styles.cardRight}>
                <Text style={[styles.interestRate, isDanger && styles.textDanger]}>{interest}</Text>
                <Text style={styles.chevron}>→</Text>
            </View>
        )}
    </Pressable>
);

export default CorporateFinanceHubModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    container: {
        height: '90%',
        backgroundColor: '#15171E', // Very dark blue/grey
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: theme.spacing.lg,
        paddingBottom: 40,
        borderWidth: 1,
        borderColor: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        marginTop: theme.spacing.sm,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 1,
    },
    closeButton: {
        padding: theme.spacing.sm,
        backgroundColor: '#2A2D35',
        borderRadius: 20,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
        marginTop: -2,
    },
    ratingSection: {
        flexDirection: 'row',
        backgroundColor: '#1E222B',
        borderRadius: 16,
        padding: theme.spacing.lg,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2E3540',
    },
    ratingInfo: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    divider: {
        width: 1,
        height: '80%',
        backgroundColor: '#333',
        marginHorizontal: theme.spacing.md,
    },
    ratingLabel: {
        fontSize: 12,
        color: '#8A9BA8',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    ratingValue: {
        fontSize: 32,
        fontWeight: '900',
        // color set dynamically
    },
    ratingDescription: {
        textAlign: 'center',
        color: '#8A9BA8',
        fontSize: 13,
        marginTop: -theme.spacing.sm,
        fontStyle: 'italic',
    },
    tiersContainer: {
        gap: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#E0E0E0',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: theme.spacing.xs,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#232730',
        padding: theme.spacing.lg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#2E3540',
    },
    cardPressed: {
        backgroundColor: '#2A2D36',
        transform: [{ scale: 0.99 }],
    },
    cardLocked: {
        opacity: 0.6,
        backgroundColor: '#1A1C20',
        borderColor: '#222',
    },
    cardDanger: {
        borderColor: '#552222',
        backgroundColor: '#251515',
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        flex: 1,
    },
    cardIcon: {
        fontSize: 24,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F0F0F0',
    },
    textLocked: {
        color: '#777',
    },
    textDanger: {
        color: '#FF6B6B',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#8A9BA8',
    },
    lockReason: {
        fontSize: 10,
        color: '#FFD700', // Gold warning
        fontWeight: '700',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    cardRight: {
        alignItems: 'flex-end',
        gap: 2,
    },
    interestRate: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4CAF50', // Success green default
    },
    chevron: {
        fontSize: 18,
        color: '#555',
    },
    // Sub-Modal Styles
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
    amountText: {
        fontSize: 32,
        fontWeight: '900',
        color: theme.colors.success,
    },
    limitRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    limitText: {
        color: '#666',
        fontSize: 12,
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
    repayButton: {
        backgroundColor: '#1E222B', // Dark card
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.success, // Green border
        marginTop: 8,
    },
    repayButtonPressed: {
        backgroundColor: '#232730',
    },
    repayButtonText: {
        color: theme.colors.success,
        fontWeight: '700',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    repayOption: {
        backgroundColor: '#232730',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
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
