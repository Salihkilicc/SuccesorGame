import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../../core/theme'; // Adjust path if needed
import { useStatsStore } from '../../../core/store'; // Adjust path if needed
import GameModal from '../../common/GameModal';
import SectionCard from '../../common/SectionCard';
import GameButton from '../../common/GameButton';

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
    // CRITICAL: Logic preserved as requested
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
        <GameModal
            visible={visible}
            onClose={onClose}
            title="CORPORATE FINANCE HUB"
            subtitle="Manage your company's debt and credit standing"
        >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.lg }}>

                {/* 1. Credit Rating Display - Visual Improvement */}
                <View>
                    <Text style={styles.sectionTitle}>Credit Standing</Text>
                    <SectionCard
                        title={`Credit Rating: ${creditRating.label}`}
                        subtitle={creditRating.description}
                        rightText={`${creditRating.rate}% Base`}
                        style={{ borderLeftWidth: 4, borderLeftColor: creditRating.color }}
                    />
                </View>

                {/* 2. Loan Tiers / Cards */}
                <View style={styles.tiersContainer}>
                    <Text style={styles.sectionTitle}>Available Financing</Text>

                    {/* A) Traditional Bank */}
                    <SectionCard
                        title="Traditional Bank 🏛️"
                        subtitle="Standard commercial loans"
                        rightText={`${creditRating.rate}% APR`}
                        onPress={() => onSelectLoan('Bank', creditRating.rate)}
                    />

                    {/* B) Corporate Bonds */}
                    <SectionCard
                        title={!isPublic ? "Corporate Bonds 🔒" : "Corporate Bonds 📜"}
                        subtitle={!isPublic ? "Requires IPO to issue bonds" : "Issue bonds to public markets"}
                        rightText={`${Math.max(2, creditRating.rate - 2)}% APR`}
                        style={!isPublic ? { opacity: 0.6 } : {}}
                        onPress={!isPublic ? undefined : () => onSelectLoan('Bonds', Math.max(2, creditRating.rate - 2))}
                    />

                    {/* C) Shark / Private Credit */}
                    <SectionCard
                        title="Private Credit / Shark 🦈"
                        subtitle="Fast cash, no questions asked"
                        rightText="40%+ APR"
                        danger
                        onPress={() => onSelectLoan('Shark', 40)}
                    />
                </View>

                {/* 3. Repayment Button */}
                <GameButton
                    title="Repay Debt"
                    variant="secondary"
                    onPress={onSelectRepay}
                />

            </ScrollView>
        </GameModal>
    );
};

export default CorporateFinanceHubModal;

const styles = StyleSheet.create({
    tiersContainer: {
        gap: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#E0E0E0',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: theme.spacing.xs,
        marginLeft: 4,
    },
});
