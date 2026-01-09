import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../../core/theme';
import { Product } from '../../../core/store/useProductStore';
import GameModal from '../../common/GameModal';
import SectionCard from '../../common/SectionCard';
import GameButton from '../../common/GameButton';

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

    return (
        <GameModal
            visible={visible}
            onClose={() => { }} // Block manual close, must use Done button
            title="📊 Monthly Report"
            subtitle="Performance Summary"
        >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>

                {/* Financial Summary */}
                <View style={styles.summaryCard}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Total Revenue</Text>
                        <Text style={[styles.value, { color: theme.colors.success }]}>
                            +${(totalRevenue / 1000).toFixed(1)}k
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Total Expenses</Text>
                        <Text style={[styles.value, { color: theme.colors.danger }]}>
                            -${(totalExpenses / 1000).toFixed(1)}k
                        </Text>
                    </View>
                    <View style={[styles.row, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Net Profit</Text>
                        <Text style={[styles.totalValue, { color: netProfit >= 0 ? theme.colors.success : theme.colors.danger }]}>
                            {netProfit >= 0 ? '+' : ''}${(netProfit / 1000).toFixed(1)}k
                        </Text>
                    </View>
                </View>

                {/* Product List */}
                <View style={{ gap: 8 }}>
                    <Text style={styles.sectionTitle}>PRODUCT BREAKDOWN</Text>
                    {reports.map((report) => (
                        <View key={report.product.id} style={{ gap: 4 }}>
                            <SectionCard
                                title={report.product.name}
                                subtitle={`Sold: ${report.unitsSold.toLocaleString()} units`}
                                rightText={`$${(report.revenue / 1000).toFixed(1)}k`}
                                onPress={() => onConfigureProduct(report.product.id)}
                                style={styles.productCard}
                            />
                            {/* Render events below if any */}
                            {report.events.length > 0 && (
                                <View style={styles.eventsList}>
                                    {report.events.map((e, idx) => (
                                        <Text key={idx} style={styles.eventText}>• {e}</Text>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                <GameButton
                    title="Done / Next Month"
                    onPress={onDone}
                    variant="primary"
                    style={{ marginTop: 8 }}
                />

            </ScrollView>
        </GameModal>
    );
};

const styles = StyleSheet.create({
    summaryCard: {
        backgroundColor: theme.colors.cardSoft,
        borderRadius: 12,
        padding: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    value: {
        fontSize: 14,
        fontWeight: '700',
    },
    totalRow: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: theme.colors.textMuted,
        letterSpacing: 0.5,
        marginLeft: 4,
    },
    productCard: {
        // SectionCard handles most, we just add specific spacing or color overrides if needed
    },
    eventsList: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        gap: 2,
    },
    eventText: {
        fontSize: 11,
        color: theme.colors.danger,
        fontStyle: 'italic',
    },
});

export default MonthlyReportModal;
