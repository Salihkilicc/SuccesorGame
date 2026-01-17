import React from 'react';
import { View, ScrollView, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import { useFinancialReportLogic } from '../hooks/useFinancialReportLogic';
import { formatCurrency } from '../hooks/NativeEconomy';

const FinancialReportScreen = () => {
    const navigation = useNavigation();
    const { data } = useFinancialReportLogic();

    const renderExpenseRow = (label: string, amount: number) => (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.expenseValue}>-{formatCurrency(amount)}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Header with Back Button */}
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backTxt}>←</Text>
                    </Pressable>
                    <Text style={styles.headerTitle}>Quarterly Financial Report</Text>
                </View>

                {/* Expenses Section */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Expenses Breakdown</Text>
                    {renderExpenseRow('Salaries', data.expenses.salaries)}
                    {renderExpenseRow('Factory Overhead', data.expenses.factoryOverhead)}
                    {renderExpenseRow('Production Costs', data.expenses.productionCosts)}
                    {renderExpenseRow('Marketing', data.expenses.marketing)}

                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <Text style={styles.totalLabel}>Total Expenses</Text>
                        <Text style={styles.totalExpenseValue}>-{formatCurrency(data.expenses.total)}</Text>
                    </View>
                </View>

                {/* Net Profit Summary */}
                <View style={styles.summaryCard}>
                    <View style={styles.row}>
                        <Text style={styles.summaryLabel}>Total Revenue</Text>
                        <Text style={styles.revenueValue}>+{formatCurrency(data.totalRevenue)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.summaryLabel}>Net Profit</Text>
                        <Text style={[
                            styles.netProfitValue,
                            { color: data.netProfit >= 0 ? theme.colors.success : theme.colors.error }
                        ]}>
                            {data.netProfit >= 0 ? '+' : ''}{formatCurrency(data.netProfit)}
                        </Text>
                    </View>
                </View>

                {/* Product Performance Table */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Product Performance</Text>

                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeadText, { flex: 2 }]}>Product</Text>
                        <Text style={[styles.tableHeadText, { flex: 1, textAlign: 'center' }]}>Prod.</Text>
                        <Text style={[styles.tableHeadText, { flex: 1, textAlign: 'center' }]}>Sold</Text>
                        <Text style={[styles.tableHeadText, { flex: 1, textAlign: 'center' }]}>Stock</Text>
                        <Text style={[styles.tableHeadText, { flex: 1.5, textAlign: 'right' }]}>Profit</Text>
                    </View>

                    {/* Table Rows */}
                    {data.products.length === 0 ? (
                        <Text style={styles.emptyText}>No active products.</Text>
                    ) : (
                        data.products.map(product => (
                            <View key={product.id} style={styles.tableRow}>
                                <Text style={[styles.cellText, { flex: 2 }]}>{product.name}</Text>
                                <Text style={[styles.cellText, { flex: 1, textAlign: 'center' }]}>{product.produced}</Text>
                                <Text style={[styles.cellText, { flex: 1, textAlign: 'center' }]}>{product.sold}</Text>
                                <Text style={[
                                    styles.cellText,
                                    {
                                        flex: 1,
                                        textAlign: 'center',
                                        color: product.isCriticalStock ? theme.colors.warning : theme.colors.textPrimary
                                    }
                                ]}>
                                    {product.stock}
                                </Text>
                                <Text style={[
                                    styles.cellText,
                                    {
                                        flex: 1.5,
                                        textAlign: 'right',
                                        color: product.profit >= 0 ? theme.colors.success : theme.colors.error
                                    }
                                ]}>
                                    {formatCurrency(product.profit)}
                                </Text>
                            </View>
                        ))
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    container: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: theme.colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    backTxt: {
        fontSize: 20,
        color: theme.colors.textPrimary,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        flex: 1, // Allow text to take remaining space
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    summaryCard: {
        backgroundColor: theme.colors.cardSoft,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    label: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    expenseValue: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.error,
    },
    summaryLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.textPrimary,
    },
    revenueValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.success,
    },
    netProfitValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.sm,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    totalExpenseValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.error,
    },
    // Table Styles
    tableHeader: {
        flexDirection: 'row',
        paddingBottom: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        marginBottom: theme.spacing.sm,
    },
    tableHeadText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: theme.spacing.xs,
        alignItems: 'center',
    },
    cellText: {
        fontSize: 12,
        color: theme.colors.textPrimary,
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        padding: theme.spacing.md
    }
});

export default FinancialReportScreen;
