import React from 'react';
import { ScrollView, View, StyleSheet, Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import { useAssetsLogic } from '../hooks/useAssetsLogic';
import {
    AssetsHeader,
    InfoCard,
    SummaryRow,
    CategoryCard,
    ActionTile,
    BreakdownSection
} from '../components/AssetsUI';

const AssetsScreen = () => {
    const navigation = useNavigation<any>();
    const { cash, netWorth, report } = useAssetsLogic();

    const formatMoney = (value: number) => {
        const absolute = Math.abs(value);
        if (absolute >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
        if (absolute >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
        if (absolute >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
        return `$${value.toLocaleString()}`;
    };

    return (
        <View style={styles.safeArea}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* HEADER */}
                <AssetsHeader
                    risk={0}
                    strategy={0}
                    onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
                />

                {/* QUARTERLY FINANCIAL OVERVIEW */}
                <View style={styles.summaryCard}>
                    <Text style={styles.sectionTitle}>Quarterly Financial Report</Text>

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryCol}>
                            <SummaryRow label="Net Worth" value={formatMoney(netWorth)} />
                            <SummaryRow label="Cash" value={formatMoney(cash)} marginTop />
                        </View>

                        <View style={styles.summaryCol}>
                            <SummaryRow
                                label="Income (Q)"
                                value={formatMoney(report.totalIncome)}
                                valueColor={theme.colors.success}
                            />
                            <SummaryRow
                                label="Expenses (Q)"
                                value={formatMoney(report.totalExpenses)}
                                valueColor={theme.colors.error}
                                marginTop
                            />
                            <SummaryRow
                                label="Net Flow"
                                value={formatMoney(report.netFlow)}
                                valueColor={report.netFlow >= 0 ? theme.colors.success : theme.colors.error}
                                marginTop
                            />
                        </View>
                    </View>

                    {/* DETAIL BREAKDOWN */}
                    <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border, marginTop: theme.spacing.lg, paddingTop: theme.spacing.md }}>
                        <BreakdownSection title="Income Sources" items={report.incomeBreakdown} isIncome />
                        <BreakdownSection title="Quarterly Expenses" items={report.expenseBreakdown} />
                    </View>
                </View>

                {/* ACTIONS */}
                <View style={styles.actionRow}>
                    <ActionTile
                        title="Market"
                        body="Scan the latest sectors and move quickly on opportunities."
                        variant="market"
                        onPress={() => navigation.navigate('Market')}
                    />
                    <ActionTile
                        title="My Company"
                        body="Review valuation, ownership, and make strategic moves."
                        variant="company"
                        onPress={() => navigation.navigate('MyCompany')}
                    />
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl * 2 + theme.spacing.sm, gap: theme.spacing.md, paddingBottom: theme.spacing.xl * 2 },
    cardGroup: { gap: theme.spacing.sm },
    summaryCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
    sectionTitle: { fontSize: theme.typography.subtitle, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: theme.spacing.md },
    summaryRow: { flexDirection: 'row', gap: theme.spacing.lg },
    summaryCol: { flex: 1, gap: theme.spacing.sm },
    investmentsButton: { backgroundColor: theme.colors.cardSoft, borderRadius: theme.radius.md, padding: theme.spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    incomeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.lg, marginTop: theme.spacing.md },
    categoryGrid: { flexDirection: 'row', gap: theme.spacing.md },
    actionRow: { flexDirection: 'row', gap: theme.spacing.md },
});

export default AssetsScreen;