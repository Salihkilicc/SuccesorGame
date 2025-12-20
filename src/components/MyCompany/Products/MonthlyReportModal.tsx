import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    ScrollView,
} from 'react-native';
import { theme } from '../../../theme';
import { Product } from '../../../store/useProductStore';

interface ProductReport {
    product: Product;
    unitsSold: number;
    revenue: number;
    events: string[];
}

interface Props {
    visible: boolean;
    reports: ProductReport[];
    totalRevenue: number;
    totalExpenses: number;
    onConfigureProduct: (productId: string) => void;
    onDone: () => void;
}

const MonthlyReportModal = ({
    visible,
    reports,
    totalRevenue,
    totalExpenses,
    onConfigureProduct,
    onDone,
}: Props) => {
    const netProfit = totalRevenue - totalExpenses;
    const hasEvents = reports.some((r) => r.events.length > 0);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>📊 Monthly Performance Report</Text>
                        <Text style={styles.subtitle}>Product Sales Summary</Text>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}>
                        {/* Product Reports */}
                        {reports.map((report) => (
                            <View key={report.product.id} style={styles.productReport}>
                                <View style={styles.productHeader}>
                                    <Text style={styles.productName}>{report.product.name}</Text>
                                    <Pressable
                                        onPress={() => onConfigureProduct(report.product.id)}
                                        style={({ pressed }) => [
                                            styles.configBtn,
                                            pressed && styles.configBtnPressed,
                                        ]}>
                                        <Text style={styles.configBtnText}>Configure</Text>
                                    </Pressable>
                                </View>

                                <View style={styles.productStats}>
                                    <View style={styles.stat}>
                                        <Text style={styles.statLabel}>Units Sold</Text>
                                        <Text style={styles.statValue}>
                                            {report.unitsSold.toLocaleString()}
                                        </Text>
                                    </View>
                                    <View style={styles.stat}>
                                        <Text style={styles.statLabel}>Revenue</Text>
                                        <Text style={[styles.statValue, { color: theme.colors.success }]}>
                                            ${(report.revenue / 1000).toFixed(1)}k
                                        </Text>
                                    </View>
                                </View>

                                {/* Events */}
                                {report.events.length > 0 && (
                                    <View style={styles.eventsContainer}>
                                        {report.events.map((event, idx) => (
                                            <Text key={idx} style={styles.eventText}>
                                                {event}
                                            </Text>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))}

                        {/* Summary */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Financial Summary</Text>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Total Revenue</Text>
                                <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
                                    +${(totalRevenue / 1000).toFixed(1)}k
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Total Expenses</Text>
                                <Text style={[styles.summaryValue, { color: theme.colors.danger }]}>
                                    -${(totalExpenses / 1000).toFixed(1)}k
                                </Text>
                            </View>
                            <View style={[styles.summaryRow, styles.summaryTotal]}>
                                <Text style={styles.summaryTotalLabel}>Net Profit</Text>
                                <Text
                                    style={[
                                        styles.summaryTotalValue,
                                        { color: netProfit >= 0 ? theme.colors.success : theme.colors.danger },
                                    ]}>
                                    {netProfit >= 0 ? '+' : ''}${(netProfit / 1000).toFixed(1)}k
                                </Text>
                            </View>
                        </View>

                        {/* Actions */}
                        <Pressable
                            onPress={onDone}
                            style={({ pressed }) => [
                                styles.doneBtn,
                                pressed && styles.doneBtnPressed,
                            ]}>
                            <Text style={styles.doneBtnText}>Done / Next Month</Text>
                        </Pressable>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    content: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        maxHeight: '90%',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    header: {
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    subtitle: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    scrollContent: {
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    productReport: {
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        gap: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productName: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    configBtn: {
        backgroundColor: theme.colors.card,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    configBtnPressed: {
        opacity: 0.7,
    },
    configBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.textSecondary,
    },
    productStats: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    stat: {
        flex: 1,
    },
    statLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        color: theme.colors.textMuted,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    eventsContainer: {
        gap: 4,
        marginTop: 4,
    },
    eventText: {
        fontSize: 12,
        color: theme.colors.danger,
        lineHeight: 16,
    },
    summaryCard: {
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        gap: theme.spacing.sm,
        borderWidth: 2,
        borderColor: theme.colors.border,
    },
    summaryTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        marginBottom: 4,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    summaryTotal: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    summaryTotalLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    summaryTotalValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    doneBtn: {
        backgroundColor: theme.colors.success,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        marginTop: theme.spacing.sm,
    },
    doneBtnPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    doneBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#000',
    },
});

export default MonthlyReportModal;
