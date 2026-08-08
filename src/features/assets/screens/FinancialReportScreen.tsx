import { useNavigation } from '@react-navigation/native';
import { t, useLocale } from '../../../core/i18n';
import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../core/theme';
import { useGameStore } from '../../../core/store/useGameStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { formatMoney, formatNumber, formatPercent, formatSignedMoney } from '../../../core/utils';
import { EXPENSE_EXPLANATIONS, normalizeQuarterReport } from '../../../core/reportTypes';
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
    // Same rule as the quarterly report: green and red mean profit and loss,
    // so only the emphasised result line gets them. Expenses and subtotals
    // were red here too, which made every statement look like a bad one.
    const color = emphasis
        ? (amount >= 0 ? theme.colors.positive : theme.colors.negative)
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
    useLocale();
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
                <Text style={styles.headerTitle}>{t('company.financialReport')}</Text>
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
                        <Text style={styles.cardTitle}>{t('company.currentBalances')}</Text>
                        <Row label={t('company.companyCapital')} amount={companyCapital || 0} />
                        <Row label={t('company.personalCash')} amount={money || 0} />
                    </View>
                </ScrollView>            </SafeAreaView>
        );
    }

    const e = report.expenses;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                {header}

                {/* Ozet */}
                <View style={[styles.heroCard, { borderColor: report.netProfit >= 0 ? theme.colors.positive : theme.colors.negative }]}>
                    <Text style={styles.heroLabel}>{t('company.netIncome')}</Text>
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
                    title={t('company.incomeStatement')}
                    note={t('company.whereEveryDollarWentLine')}
                    info={t('company.revenueMinusTheCostOf')}
                    summary={formatSignedMoney(report.netProfit)}
                    summaryColor={report.netProfit >= 0 ? theme.colors.success : theme.colors.error}
                >

                    <Row
                        label={t('company.revenue')}
                        amount={report.revenue}
                        explanation={`${formatNumber(report.unitsSold)} units sold this quarter.`}
                    />
                    <Row
                        label={t('company.costOfGoodsSold')}
                        amount={e.cogs}
                        negative
                        explanation={EXPENSE_EXPLANATIONS.cogs}
                    />
                    <Row label={t('company.grossProfit')} amount={report.grossProfit} subtotal />

                    <Text style={styles.groupLabel}>{t('company.operatingExpenses')}</Text>
                    <Row label={t('company.marketing')} amount={e.marketing} negative explanation={EXPENSE_EXPLANATIONS.marketing} />
                    <Row label={t('company.storage')} amount={e.storage} negative explanation={EXPENSE_EXPLANATIONS.storage} />
                    <Row
                        label={t('company.factoryOverhead')}
                        amount={e.factoryOverhead}
                        negative
                        explanation={EXPENSE_EXPLANATIONS.factoryOverhead}
                    />
                    <Row label={t('company.researchDevelopment')} amount={e.rnd} negative explanation={EXPENSE_EXPLANATIONS.rnd} />
                    <Row label={t('company.fixedCosts')} amount={e.fixed} negative explanation={EXPENSE_EXPLANATIONS.fixed} />

                    <Row label={t('company.operatingIncomeEbit')} amount={report.ebit} subtotal />
                    <Row label={t('company.interest')} amount={e.interest} negative explanation={EXPENSE_EXPLANATIONS.interest} />
                    <Row label={t('company.netIncome2')} amount={report.netProfit} emphasis />

                    {/* NAKIT MUTABAKATI — ceyrek raporuyla AYNI mantik.
                        Anapara odemesi gider degildir (kari dusurmez) ama
                        nakit goturur. Ikisini ayirmadan "karliyim ama param
                        yok" durumu oyuncuya hic aciklanamiyordu. */}
                    {(report.principalRepaid ?? 0) > 0 && (
                        <>
                            <Row
                                label={t('company.loanPrincipalRepaid')}
                                amount={report.principalRepaid ?? 0}
                                negative
                                explanation={
                                    'Not an expense — it does not reduce profit. It pays down what you ' +
                                    'owe, so your debt falls by the same amount. But the cash leaves ' +
                                    'the account all the same.'
                                }
                            />
                            <Row
                                label={t('company.changeInCompanyCash')}
                                amount={report.netProfit - (report.principalRepaid ?? 0)}
                                emphasis
                                explanation={'Net income minus principal repaid.'}
                            />
                        </>
                    )}

                    <Text style={styles.footnote}>{t('company.employeeWagesAreNotCharged')}</Text>
                </CollapsibleSection>

                {/* Operasyon */}
                <CollapsibleSection
                    title={t('company.operations')}
                    note={t('company.howMuchYouBuiltAnd')}
                    info={t('company.sellThroughIsTheShare2')}
                    summary={`${formatPercent(report.sellThrough)} sold`}
                    summaryColor={report.sellThrough >= 60 ? theme.colors.textPrimary : theme.colors.warning}
                >
                    <View style={styles.opsGrid}>
                        <View style={styles.opsCell}>
                            <Text style={styles.opsLabel}>{t('company.produced')}</Text>
                            <Text style={styles.opsValue}>{formatNumber(report.unitsProduced)}</Text>
                        </View>
                        <View style={styles.opsCell}>
                            <Text style={styles.opsLabel}>{t('company.sold')}</Text>
                            <Text style={[styles.opsValue, { color: theme.colors.success }]}>
                                {formatNumber(report.unitsSold)}
                            </Text>
                        </View>
                        <View style={styles.opsCell}>
                            <Text style={styles.opsLabel}>{t('company.sellThrough')}</Text>
                            <Text
                                style={[
                                    styles.opsValue,
                                    { color: report.sellThrough >= 60 ? theme.colors.textPrimary : theme.colors.warning },
                                ]}
                            >
                                {formatPercent(report.sellThrough)}
                            </Text>
                        </View>
                        <View style={styles.opsCell}>
                            <Text style={styles.opsLabel}>{t('company.inStock')}</Text>
                            <Text style={styles.opsValue}>
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
                    title={t('company.productPerformance')}
                    note={t('company.perProductDemandSalesAnd')}
                    info={t('company.productsInTheSameCategory')}
                    summary={`${report.products.length}`}
                    summaryColor="rgba(255,255,255,0.48)"
                >

                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeadText, { flex: 2 }]}>{t('company.product')}</Text>
                        <Text style={[styles.tableHeadText, styles.center]}>{t('company.prod')}</Text>
                        <Text style={[styles.tableHeadText, styles.center]}>{t('company.sold')}</Text>
                        <Text style={[styles.tableHeadText, styles.center]}>{t('company.stock')}</Text>
                        <Text style={[styles.tableHeadText, { flex: 1.5, textAlign: 'right' }]}>{t('company.profit')}</Text>
                    </View>

                    {report.products.length === 0 ? (
                        <Text style={styles.emptyText}>{t('company.noActiveProducts')}</Text>
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
                                    <Text style={[styles.cellText, styles.center, { color: theme.colors.warning }]}>
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
                    title={t('company.balances')}
                    note={t('company.whereYouStandAtThe')}
                    info={t('company.companyCapitalFundsTheBusiness2')}
                    summary={formatMoney(report.endingCapital)}
                    summaryColor="#FFFFFF"
                    defaultOpen
                >
                    <Row label={t('company.companyCapital')} amount={report.endingCapital} />
                    <Row label={t('company.personalCash')} amount={report.endingCash} />
                    <View style={styles.rowTop}>
                        <Text style={styles.label}>{t('company.researchPoints')}</Text>
                        <Text style={[styles.value, { color: '#FFFFFF' }]}>
                            {formatNumber(report.researchPoints)}
                        </Text>
                    </View>
                </CollapsibleSection>

                <View style={{ height: 120 }} />
            </ScrollView>        </SafeAreaView>
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
        color: theme.colors.textMuted,
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
    rowSubtotal: { borderTopWidth: 1, borderTopColor: 'rgba(5,168,246,0.25)', marginTop: 4 },
    rowEmphasis: {
        borderTopWidth: 2,
        borderTopColor: 'rgba(5,168,246,0.5)',
        marginTop: 6,
        paddingTop: 12,
    },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
    label: { color: theme.colors.textSecondary, fontSize: 13 },
    labelStrong: { color: theme.colors.textPrimary, fontWeight: '700' },
    value: { fontSize: 14, fontWeight: '700', marginLeft: 10 },
    valueBig: { fontSize: 19, fontWeight: '800' },
    explain: { color: '#FFFFFF', fontSize: 10.5, lineHeight: 15, marginTop: 4, paddingRight: 30 },
    footnote: { color: '#FFFFFF', fontSize: 10, marginTop: 10, fontStyle: 'italic' },

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
        color: '#FFFFFF',
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
