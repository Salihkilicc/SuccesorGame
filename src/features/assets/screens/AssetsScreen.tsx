import React from 'react';
import { ScrollView, View, StyleSheet, Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import { useAssetsLogic } from '../hooks/useAssetsLogic';
import AppScreen from '../../../components/layout/AppScreen';
import {
    SummaryRow,
    BreakdownSection
} from '../components/AssetsUI';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';

const AssetsScreen = () => {
    const navigation = useNavigation<any>();
    const { cash, netWorth, report, personality } = useAssetsLogic();

    const formatMoney = (value: number) => {
        const absolute = Math.abs(value);
        if (absolute >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
        if (absolute >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
        if (absolute >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
        return `$${value.toLocaleString()}`;
    };

    const backButton = (
        <Pressable
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
            <Text style={styles.backIcon}>←</Text>
        </Pressable>
    );

    return (
        <AppScreen title="ASSETS" subtitle="Wealth Management" leftNode={backButton} compact>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>


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
                        {/* NEW: Assets Section */}
                        <BreakdownSection title="Current Assets" items={report.assetsBreakdown} />
                        <View style={{ height: 12 }} />

                        <BreakdownSection title="Income Sources" items={report.incomeBreakdown} isIncome />
                        <BreakdownSection title="Quarterly Expenses" items={report.expenseBreakdown} />
                    </View>
                </View>



            </ScrollView>

            <CrystalNavBar activeTab="Company" variant="dark" />
        </AppScreen>
    );
};

const styles = StyleSheet.create({
    content: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, gap: theme.spacing.md, paddingBottom: 120 }, // Increased paddingBottom
    summaryCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
    sectionTitle: { fontSize: theme.typography.subtitle, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: theme.spacing.md },
    summaryRow: { flexDirection: 'row', gap: theme.spacing.lg },
    summaryCol: { flex: 1, gap: theme.spacing.sm },
    backButton: { width: 32, height: 32, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.card },
    backButtonPressed: { backgroundColor: theme.colors.cardSoft, transform: [{ scale: 0.97 }] },
    backIcon: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '700' },
});

export default AssetsScreen;