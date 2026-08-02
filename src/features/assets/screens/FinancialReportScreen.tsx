import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../core/theme';
import { useGameStore } from '../../../core/store/useGameStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { formatMoney, formatNumber, formatPercent, formatSignedMoney } from '../../../core/utils';
import { EXPENSE_EXPLANATIONS, normalizeQuarterReport } from '../../../core/reportTypes';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';
import CollapsibleSection from '../../../components/common/CollapsibleSection';
import InfoDot from '../../../components/common/InfoDot';

// ============================================================================
//  FINANSAL RAPOR EKRANI
// ============================================================================
//  ONEMLI: Bu ekran ESKIDEN kendi tahminini uretiyordu
//  (useFinancialReportLogic — fabrika giderini adet basina 30.000.000 sayan
//  ucuncu bir finans modeli). Artik useGameStore.lastQuarterReport'u okuyor,
//  yani ceyrek raporu modaliyla BIREBIR ayni sayilari gosteriyor.
//
//  Bir kalem burada gorunuyorsa motor onu gercekten tahsil etmistir.
// ============================================================================

const Row = ({
    label,
    amount,
    explanation,
    negative,
    subtotal,
    emphasis,
}: {
    label: string;
    amount: number;
    explanation?: string;
    negative?: boolean;
    subtotal?: boolean;
    emphasis?: boolean;
}) => {
    const color = emphasis
        ? amount >= 0
            ? theme.colors.success
            : theme.colors.error
        : negative
            ? '#E57373'
            : subtotal
                ? '#FFD700'
                : theme.colors.textPrimary;

    return (
        <View style={[styles.row, subtotal && styles.rowSubtotal, emphasis && styles.rowEmphasis]}>
            <View style={styles.rowTop}>
                <View style={styles.labelRow}>
                    <Text style={[styles.label, (subtotal || emphasis) && styles.labelStrong]}>{label}</Text>
                    {/* Uzun aciklama ⓘ arkasinda */}
                    {explanation ? <InfoDot title={label} text={explanation} small /> : null}
                </View>
                <Text style={[styles.value, { color }, emphasis && styles.valueBig]}>
                    {negative ? `-${formatMoney(Math.abs(amount))}` : formatMoney(amount)}
                </Text>
            </View>
        </View>
    );
};

const FinancialReportScreen = () => {
    const navigation = useNavigation();
    // Eski kayitlarda yeni alanlar olmayabilir — normalize et.
    const rawReport = useGameStore(state => state.lastQuarterReport);
    const report = React.useMemo(() => normalizeQuarterReport(rawReport), [rawReport]);
    const companyCapital = useStatsStore(state => state.companyCapital);
    const money = useStatsStore(state => state.money);

    const header = (
        <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={styles.backTxt}>←</Text>
            </Pressable>
            <View>
                <Text style={styles.headerTitle}>Financial Report</Text>
                <Text style={styles.headerSub}>{report ? report.periodLabel : 'No data yet'}</Text>
            </View>
        </View>
    );

    if (!report) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.container}>
                    {header}
                    <View style={styles.card}>
                        <Text style={styles.emptyText}>
                            No quarter has been completed yet. Advance time from the Home screen to generate your
                            first report.
                        </Text>
                    </View>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Current Balances</Text>
                        <Row label="Company Capital" amount={companyCapital || 0} />
                        <Row label="Personal Cash" amount={money || 0} />
                    </View>
                </ScrollView>
                <CrystalNavBar activeTab="Company" variant="dark" hideDots />
            </SafeAreaView>
        );
    }

    const e = report.expenses;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                {header}

                {/* Ozet */}
                <View style={[styles.heroCard, { borderColor: report.netProfit >= 0 ? '#FFD700' : theme.colors.error }]}>
                    <Text style={styles.heroLabel}>NET INCOME</Text>
                    <Text
                        style={[
                            styles.heroValue,
                            { color: report.netProfit >= 0 ? theme.colors.success : theme.colors.error },
                        ]}
                    >
                        {formatSignedMoney(report.netProfit)}
                    </Text>
                    <Text style={styles.heroSub}>
                        {formatPercent(report.netMargin)} net · {formatPercent(report.grossMargin)} gross
                    </Text>
                </View>

                {/* Gelir tablosu */}
                <CollapsibleSection
                    title="INCOME STATEMENT"
                    note="Where every dollar went, line by line"
                    info="Revenue minus the cost of making your goods gives Gross Profit. Subtract operating costs for EBIT, then interest, and what remains is Net Income."
                    summary={formatSignedMoney(report.netProfit)}
                    summaryColor={report.netProfit >= 0 ? theme.colors.success : theme.colors.error}
                >

                    <Row
                        label="Revenue"
                        amount={report.revenue}
                        explanation={`${formatNumber(report.unitsSold)} units sold this quarter.`}
                    />
                    <Row
                        label="Cost of Goods Sold"
                        amount={e.cogs}
                        negative
                        explanation={EXPENSE_EXPLANATIONS.cogs}
                    />
                    <Row label="Gross Profit" amount={report.grossProfit} subtotal />

                    <Text style={styles.groupLabel}>OPERATING EXPENSES</Text>
                    <Row label="Marketing" amount={e.marketing} negative explanation={EXPENSE_EXPLANATIONS.marketing} />
                    <Row label="Storage" amount={e.storage} negative explanation={EXPENSE_EXPLANATIONS.storage} />
                    <Row
                        label="Factory Overhead"
                        amount={e.factoryOverhead}
                        negative
                        explanation={EXPENSE_EXPLANATIONS.factoryOverhead}
                    />
                    <Row label="Research & Development" amount={e.rnd} negative explanation={EXPENSE_EXPLANATIONS.rnd} />
                    <Row label="Fixed Costs" amount={e.fixed} negative explanation={EXPENSE_EXPLANATIONS.fixed} />

                    <Row label="Operating Income (EBIT)" amount={report.ebit} subtotal />
                    <Row label="Interest" amount={e.interest} negative explanation={EXPENSE_EXPLANATIONS.interest} />
                    <Row label="Net Income" amount={report.netProfit} emphasis />

                    <Text style={styles.footnote}>
                        Employee wages are not charged by the simulation yet, so they do not appear here.
                    </Text>
                </CollapsibleSection>

                {/* Operasyon */}
                <CollapsibleSection
                    title="OPERATIONS"
                    note="How much you built and how much of it moved"
                    info="Sell-through is the share of available goods that actually sold. Below 100% means you built more than the market wanted."
                    summary={`${formatPercent(report.sellThrough)} sold`}
                    summaryColor={report.sellThrough >= 60 ? theme.colors.success : '#E57373'}
                >
                    <View style={styles.opsGrid}>
                        <View style={styles.opsCell}>
                            <Text style={styles.opsLabel}>Produced</Text>
                            <Text style={styles.opsValue}>{formatNumber(report.unitsProduced)}</Text>
                        </View>
                        <View style={styles.opsCell}>
                            <Text style={styles.opsLabel}>Sold</Text>
                            <Text style={[styles.opsValue, { color: theme.colors.success }]}>
                                {formatNumber(report.unitsSold)}
                            </Text>
                        </View>
                        <View style={styles.opsCell}>
                            <Text style={styles.opsLabel}>Sell-through</Text>
                            <Text
                                style={[
                                    styles.opsValue,
                                    { color: report.sellThrough >= 60 ? theme.colors.success : '#E57373' },
                                ]}
                            >
                                {formatPercent(report.sellThrough)}
                            </Text>
                        </View>
                        <View style={styles.opsCell}>
                            <Text style={styles.opsLabel}>In Stock</Text>
                            <Text style={[styles.opsValue, { color: '#FFB74D' }]}>
                                {formatNumber(report.endingInventory)}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.explain}>
                        Sell-through is the share of available goods (opening stock + production) that actually sold.
                        Anything below 100% became inventory you now pay to store.
                    </Text>
                </CollapsibleSection>

                {/* Urun tablosu */}
                <CollapsibleSection
                    title="PRODUCT PERFORMANCE"
                    note="Per-product demand, sales and margin"
                    info="Products in the same category compete for the same fixed market — including against your own other products."
                    summary={`${report.products.length}`}
                    summaryColor="#9E9E9E"
                >

                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeadText, { flex: 2 }]}>Product</Text>
                        <Text style={[styles.tableHeadText, styles.center]}>Prod.</Text>
                        <Text style={[styles.tableHeadText, styles.center]}>Sold</Text>
                        <Text style={[styles.tableHeadText, styles.center]}>Stock</Text>
                        <Text style={[styles.tableHeadText, { flex: 1.5, textAlign: 'right' }]}>Profit</Text>
                    </View>

                    {report.products.length === 0 ? (
                        <Text style={styles.emptyText}>No active products.</Text>
                    ) : (
                        report.products.map(p => (
                            <View key={p.id}>
                                <View style={styles.tableRow}>
                                    <Text style={[styles.cellText, { flex: 2 }]} numberOfLines={1}>
                                        {p.name}
                                    </Text>
                                    <Text style={[styles.cellText, styles.center]}>{formatNumber(p.produced)}</Text>
                                    <Text style={[styles.cellText, styles.center, { color: theme.colors.success }]}>
                                        {formatNumber(p.sold)}
                                    </Text>
                                    <Text style={[styles.cellText, styles.center, { color: '#FFB74D' }]}>
                                        {formatNumber(p.stock)}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cellText,
                                            { flex: 1.5, textAlign: 'right' },
                                            { color: p.profit >= 0 ? theme.colors.success : theme.colors.error },
                                        ]}
                                    >
                                        {formatSignedMoney(p.profit)}
                                    </Text>
                                </View>
                                <Text style={styles.productEcon}>
                                    {formatPercent(p.sellThrough)} sold · Price {formatMoney(p.unitPrice)} · Cost{' '}
                                    {formatMoney(p.unitCost)} · Margin {formatMoney(p.unitPrice - p.unitCost)}/unit
                                </Text>
                            </View>
                        ))
                    )}
                </CollapsibleSection>

                {/* Bakiyeler */}
                <CollapsibleSection
                    title="BALANCES"
                    note="Where you stand at the end of the quarter"
                    info="Company Capital funds the business. Personal Cash is yours. The two are separate on purpose."
                    summary={formatMoney(report.endingCapital)}
                    summaryColor="#FFFFFF"
                    defaultOpen
                >
                    <Row label="Company Capital" amount={report.endingCapital} />
                    <Row label="Personal Cash" amount={report.endingCash} />
                    <View style={styles.rowTop}>
                        <Text style={styles.label}>Research Points</Text>
                        <Text style={[styles.value, { color: '#BA68C8' }]}>
                            {formatNumber(report.researchPoints)}
                        </Text>
                    </View>
                </CollapsibleSection>

                <View style={{ height: 120 }} />
            </ScrollView>

            <CrystalNavBar activeTab="Company" variant="dark" hideDots />
        </SafeAreaView>
    );
};

export default FinancialReportScreen;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },

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
    backTxt: { color: theme.colors.textPrimary, fontSize: 20 },
    headerTitle: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700' },
    headerSub: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 2 },

    heroCard: {
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 20,
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        marginBottom: theme.spacing.md,
    },
    heroLabel: { color: theme.colors.textSecondary, fontSize: 10, letterSpacing: 2, fontWeight: '700' },
    heroValue: { fontSize: 30, fontWeight: '800', marginTop: 6 },
    heroSub: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 6 },

    card: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardTitle: {
        color: '#FFD700',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 10,
    },
    groupLabel: {
        color: theme.colors.textSecondary,
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginTop: 12,
        marginBottom: 2,
    },

    row: { paddingVertical: 8 },
    rowSubtotal: { borderTopWidth: 1, borderTopColor: 'rgba(255,215,0,0.25)', marginTop: 4 },
    rowEmphasis: {
        borderTopWidth: 2,
        borderTopColor: 'rgba(255,215,0,0.5)',
        marginTop: 6,
        paddingTop: 12,
    },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
    label: { color: theme.colors.textSecondary, fontSize: 13 },
    labelStrong: { color: theme.colors.textPrimary, fontWeight: '700' },
    value: { fontSize: 14, fontWeight: '700', marginLeft: 10 },
    valueBig: { fontSize: 19, fontWeight: '800' },
    explain: { color: '#6E6E6E', fontSize: 10.5, lineHeight: 15, marginTop: 4, paddingRight: 30 },
    footnote: { color: '#5C5C5C', fontSize: 10, marginTop: 10, fontStyle: 'italic' },

    opsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    opsCell: {
        flexGrow: 1,
        flexBasis: '46%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    opsLabel: { color: theme.colors.textSecondary, fontSize: 10, letterSpacing: 0.8 },
    opsValue: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 3 },

    tableHeader: {
        flexDirection: 'row',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        marginBottom: 4,
    },
    tableHeadText: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: '700', flex: 1 },
    center: { flex: 1, textAlign: 'center' },
    tableRow: { flexDirection: 'row', paddingVertical: 9, alignItems: 'center' },
    cellText: { color: theme.colors.textPrimary, fontSize: 12.5, flex: 1 },
    productEcon: {
        color: '#6E6E6E',
        fontSize: 10,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },

    emptyText: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        textAlign: 'center',
        paddingVertical: 16,
        lineHeight: 18,
    },
});
