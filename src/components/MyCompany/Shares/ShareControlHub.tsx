import React, { useState, useEffect } from 'react';
import { t, useLocale } from '../../../core/i18n';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    ScrollView,
    Alert,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import { useGameStore } from '../../../core/store/useGameStore';
import {
    CONTROL_NOTES,
    EQUITY_EXPLANATIONS,
    companyValuation,
    controlStatus,
    quoteSecondarySale,
    trailingTotal,
    volatilityDamping,
} from '../../../core/market/equity';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useEquityStore } from '../../../features/finance/stores/useEquityStore';
import InfoTooltipModal from './InfoTooltipModal';
import { StatRow, DetailLine, DetailRule, DetailNote, RowGroup } from '../../common/Disclosure';
import ConfirmPanel, { type ConfirmLine } from '../../common/ConfirmPanel';
import { formatMoney, formatNumber, formatPrice } from '../../../core/utils';
import ScreenHost from '../../common/ScreenHost';

interface Props {
    /** Render as a route rather than a popup - see components/common/ScreenHost. */
    asScreen?: boolean;
    visible: boolean;
    onClose: () => void;
    onOpenIPO: () => void;
    onOpenDilution: () => void;
    onOpenDividend: () => void;
    onOpenBuyback: () => void;
}

const BreakLine = ({ label, value, bold, negative }: { label: string; value: string; bold?: boolean; negative?: boolean }) => (
    <View style={styles.breakRow}>
        <Text style={[styles.breakLabel, bold && styles.breakBold]}>{label}</Text>
        <Text style={[styles.breakValue, bold && styles.breakBold, negative && { color: '#FF8A8A' }]}>
            {value}
        </Text>
    </View>
);

const ShareControlHub = ({ visible, onClose, onOpenIPO, onOpenDilution, onOpenDividend, onOpenBuyback, asScreen }: Props) => {
    // Dil degisince yeniden ciz.
    useLocale();
    const navigation = useNavigation<any>();
    const {
        companyValue,
        companyDailyChange,
        performStockSplit,
    } = useStatsStore();

    // Equity Store Integration
    const stockPrice = useEquityStore((state) => state.stockPrice);
    const playerShares = useEquityStore((state) => state.playerShares);
    const totalShares = useEquityStore((state) => state.totalShares);
    const publicShares = useEquityStore((state) => state.publicShares);
    const getPlayerOwnership = useEquityStore((state) => state.getPlayerOwnership);
    const syncStockPrice = useEquityStore((state) => state.syncStockPrice);
    const isPublic = useEquityStore((state) => state.isPublic);

    const [tooltipTerm, setTooltipTerm] = useState<string | null>(null);

    // Sahiplik artik TEK kap tablosundan geliyor. Eskiden bu ekran
    // useEquityStore'un kendi 1M/1M tablosunu okuyordu ve hep %100 yaziyordu.
    const ownership = getPlayerOwnership();
    const control = controlStatus(ownership);

    // Degerleme kirilimi — motorun kullandigi AYNI fonksiyon.
    const stats = useStatsStore();
    const lastReport = useGameStore(st => st.lastQuarterReport);
    // Buyuk sirket daha az oynar — oyuncuya bunu goster.
    const damping = volatilityDamping(stats.companyValue || 0);

    const vb = companyValuation({
        cash: stats.companyCapital || 0,
        // Motorun kullandigi AYNI TTM penceresi
        ttmRevenue: trailingTotal(stats.revenueHistory ?? []),
        // Motorun fiyatladigi AYNI kazanc gucu
        ttmEbit: stats.earningsPower || trailingTotal(stats.ebitHistory ?? []),
        debt: stats.companyDebtTotal || 0,
        isPublic: !!stats.isPublic,
        brandValue: stats.brandValue ?? 0,
    });

    // Sync stock price when valuation changes
    useEffect(() => {
        if (companyValue > 0) {
            syncStockPrice(companyValue);
        }
    }, [companyValue, syncStockPrice]);

    // ------------------------------------------------------------------
    //  Confirmations happen in place now, not in a system Alert.
    //
    //  One piece of state drives all of them. Each decision is a small
    //  descriptor rather than a string built with \n, so the figures render
    //  as real rows and the panel inherits the theme - a system Alert is a
    //  white iOS sheet no matter what the rest of the app looks like.
    // ------------------------------------------------------------------
    const [panel, setPanel] = useState<null | {
        title: string;
        summary?: string;
        lines?: ConfirmLine[];
        note?: string;
        confirmLabel: string;
        onConfirm?: () => void;
        tone?: 'default' | 'danger';
    }>(null);

    const handleStockSplit = () => {
        if (stockPrice <= 1000) {
            setPanel({
                title: t('alert.notAvailable'),
                summary: t('alert.stockSplitIsOnlyAvailable'),
                confirmLabel: 'OK',
            });
            return;
        }

        setPanel({
            title: t('alert.stockSplit'),
            summary: t('alert.thisWillDivideYourShare'),
            lines: [
                { label: t('equity.currentStockPrice'), value: formatPrice(stockPrice) },
                { label: 'After the split', value: formatPrice(stockPrice / 2) },
                { label: t('equity.totalShares'), value: formatNumber(totalShares) },
                { label: 'After the split', value: formatNumber(totalShares * 2), strong: true },
            ],
            note: 'Your ownership percentage does not change. Twice as many shares at half the price is the same company.',
            confirmLabel: t('equity.split'),
            onConfirm: () => {
                performStockSplit();
                setPanel({
                    title: t('alert.success'),
                    summary: t('alert.stockSplitCompletedSuccessfully'),
                    confirmLabel: 'OK',
                });
            },
        });
    };

    const handleHomePress = () => {
        onClose();
        navigation.navigate('Home');
    };

    const marketCap = stockPrice * totalShares;
    const playerOwnership = getPlayerOwnership();

    return (
        <>
            <ScreenHost asScreen={asScreen} visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
                <SafeAreaView style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.backButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 20 }}
                        >
                            <Text style={styles.backButtonText}>← Close</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{t('equity.equityManagement')}</Text>
                        <View style={styles.headerSpacer} />
                    </View>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
                        {/* Kontrol uyarisi — %50 esigi oyunun en onemli sayisi */}
                        <View style={[
                            styles.controlBanner,
                            {
                                backgroundColor:
                                    control === 'lost' ? 'rgba(5,168,246,0.12)'
                                        : control === 'contested' ? 'rgba(5,168,246,0.12)'
                                            : 'rgba(207,208,210,0.10)',
                                borderColor:
                                    control === 'lost' ? 'rgba(5,168,246,0.35)'
                                        : control === 'contested' ? 'rgba(5,168,246,0.35)'
                                            : 'rgba(207,208,210,0.30)',
                            },
                        ]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.controlPct}>{ownership.toFixed(1)}%</Text>
                                <Text style={styles.controlLabel}>{t('equity.youOwn')}</Text>
                                <View style={{ flex: 1 }} />
                                <Text style={styles.controlShares}>
                                    {formatNumber(playerShares)} sh
                                </Text>
                            </View>
                            <Text style={styles.controlNote}>{CONTROL_NOTES[control]}</Text>
                        </View>

                        {/* ------------------------------------------------------
                            LAYERED ROWS
                            ------------------------------------------------------
                            This was a hero card, a seven-line valuation table, a
                            note under the table, a damping badge and a four-card
                            stat grid - all permanently open, all at once. The
                            figures are unchanged; what changed is that the
                            working is now behind the number that needed it,
                            instead of beside it.
                           ------------------------------------------------------ */}
                        <RowGroup title={t('equity.marketCap')}>
                            <StatRow
                                label={t('equity.currentStockPrice')}
                                value={formatPrice(stockPrice)}
                                why={`${companyDailyChange >= 0 ? '↑' : '↓'} ${Math.abs(companyDailyChange).toFixed(2)}% since last quarter`}
                                valueColor={companyDailyChange >= 0 ? theme.colors.positive : theme.colors.negative}
                                detail={
                                    <>
                                        <DetailNote>{EQUITY_EXPLANATIONS.change}</DetailNote>
                                        {damping < 0.95 && (
                                            <DetailLine
                                                label="Size damping"
                                                value={`${Math.round((1 - damping) * 100)}%`}
                                            />
                                        )}
                                        {damping < 0.95 && (
                                            <DetailNote>
                                                A company this large absorbs shocks a small one cannot.
                                            </DetailNote>
                                        )}
                                    </>
                                }
                            />
                            <StatRow
                                label={t('equity.valuation')}
                                value={formatMoney(vb.total)}
                                why={`Cash + profit × ${vb.earningsMultiple.toFixed(1)} + revenue × ${vb.revenueMultiple.toFixed(2)}${vb.debt > 0 ? ' − debt' : ''}`}
                                detail={
                                    <>
                                        <DetailLine label={t('equity.cashOnHand')} value={formatMoney(vb.cash)} />
                                        <DetailLine
                                            label={`Annual profit × ${vb.earningsMultiple.toFixed(1)}`}
                                            value={formatMoney(vb.earnings)}
                                        />
                                        <DetailLine
                                            label={`Annual revenue × ${vb.revenueMultiple.toFixed(2)}`}
                                            value={formatMoney(vb.revenue)}
                                        />
                                        {vb.debt > 0 && (
                                            <DetailLine
                                                label={t('equity.lessDebt')}
                                                value={`−${formatMoney(vb.debt)}`}
                                                tone="negative"
                                            />
                                        )}
                                        <DetailRule />
                                        <DetailLine label={t('equity.valuation')} value={formatMoney(vb.total)} strong />
                                        <DetailLine
                                            label={`÷ ${formatNumber(totalShares)} shares`}
                                            value={formatPrice(vb.total / Math.max(1, totalShares))}
                                        />
                                        <DetailNote>{EQUITY_EXPLANATIONS.valuation}</DetailNote>
                                    </>
                                }
                            />
                            <StatRow
                                label={t('equity.marketCap')}
                                value={formatMoney(marketCap)}
                                why={`${formatNumber(totalShares)} shares × ${formatPrice(stockPrice)}`}
                            />
                        </RowGroup>

                        <RowGroup title={t('equity.myOwnership')}>
                            <StatRow
                                label={t('equity.myOwnership')}
                                value={`${playerOwnership.toFixed(1)}%`}
                                why={`${formatNumber(playerShares)} of ${formatNumber(totalShares)} shares`}
                            />
                            <StatRow
                                label={t('equity.publicFloat')}
                                value={`${((publicShares / totalShares) * 100).toFixed(1)}%`}
                                why={`${formatNumber(publicShares)} shares held by the market`}
                            />
                        </RowGroup>

                        {/* Actions Section */}
                        <Text style={styles.sectionTitle}>{t('equity.marketActions')}</Text>

                        {/* IPO / Stock Split */}
                        {!isPublic ? (
                            <TouchableOpacity
                                style={styles.actionRow}
                                onPress={onOpenIPO}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.actionIconBox, { backgroundColor: '#05A8F620' }]}>
                                    <Text style={styles.actionIcon}>🔔</Text>
                                </View>
                                <View style={styles.actionContent}>
                                    <Text style={styles.actionTitle}>{t('equity.launchIpo')}</Text>
                                    <Text style={styles.actionDescription}>{t('equity.goPublicToMaximizeValuation')}</Text>
                                </View>
                                <Text style={styles.actionArrow}>›</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.actionRow, stockPrice <= 1000 && styles.actionRowDisabled]}
                                onPress={handleStockSplit}
                                disabled={stockPrice <= 1000}
                                activeOpacity={0.7}
                            >
                                <View style={styles.actionIconBox}>
                                    <Text style={styles.actionIcon}>✂️</Text>
                                </View>
                                <View style={styles.actionContent}>
                                    <Text style={[styles.actionTitle, stockPrice <= 1000 && styles.textDisabled]}>{t('equity.stockSplit')}</Text>
                                    <Text style={[styles.actionDescription, stockPrice <= 1000 && styles.textDisabled]}>{t('equity.requires1000SharePrice')}</Text>
                                </View>
                                <Text style={[styles.actionArrow, stockPrice <= 1000 && styles.textDisabled]}>›</Text>
                            </TouchableOpacity>
                        )}

                        {/* Buyback */}
                        <TouchableOpacity
                            style={[styles.actionRow, !isPublic && styles.actionRowDisabled]}
                            onPress={onOpenBuyback}
                            disabled={!isPublic}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: '#05A8F620' }]}>
                                <Text style={styles.actionIcon}>📈</Text>
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={[styles.actionTitle, !isPublic && styles.textDisabled]}>{t('equity.stockBuyback')}</Text>
                                <Text style={[styles.actionDescription, !isPublic && styles.textDisabled]}>
                                    {isPublic ? 'Buy back shares using company cash' : t('equity.requiresIpo')}
                                </Text>
                            </View>
                            <Text style={[styles.actionArrow, !isPublic && styles.textDisabled]}>›</Text>
                        </TouchableOpacity>

                        {/* Dilution */}
                        <TouchableOpacity
                            style={[styles.actionRow, !isPublic && styles.actionRowDisabled]}
                            onPress={onOpenDilution}
                            disabled={!isPublic}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: '#FF8A8A20' }]}>
                                <Text style={styles.actionIcon}>📉</Text>
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={[styles.actionTitle, !isPublic && styles.textDisabled]}>
                                    {t('equity.issueNew')}
                                </Text>
                                {/* ISIMLENDIRME: "Issue Shares" belirsizdi ve oyuncu
                                    hakli olarak sordu — "para sirkete gidiyor ama benim
                                    hissem azaliyor". Ikisi de dogru cunku bu YENI HISSE
                                    IHRACI: pasta buyur, para SIRKETE girer, senin dilimin
                                    kucululur. Kendi hisseni satmak AYRI bir islem ve
                                    asagida ayri duruyor. */}
                                <Text style={[styles.actionDescription, !isPublic && styles.textDisabled]}>
                                    {isPublic
                                        ? t('equity.issueNewDesc')
                                        : t('equity.requiresIpo')}
                                </Text>
                            </View>
                            <Text style={[styles.actionArrow, !isPublic && styles.textDisabled]}>›</Text>
                        </TouchableOpacity>

                        {/* ---- KENDI HISSENI SAT — para SANA gelir ---- */}
                        <TouchableOpacity
                            style={[styles.actionRow, !isPublic && styles.actionRowDisabled]}
                            onPress={() => {
                                const eq = useEquityStore.getState();
                                const cap = eq.totalShares || 0;
                                const chunk = Math.round(cap * 0.05);
                                const price = useStatsStore.getState().companySharePrice || 0;
                                const q = quoteSecondarySale(chunk, price, eq.playerShares, cap);
                                setPanel({
                                    title: t('equity.sellOwnConfirm'),
                                    summary: `Selling ${formatNumber(chunk)} of your own shares — the company gets nothing, these are yours, not new ones.`,
                                    lines: [
                                        { label: 'Gross', value: formatMoney(q.grossProceeds) },
                                        { label: 'Capital gains tax', value: `−${formatMoney(q.tax)}`, tone: 'negative' },
                                        { label: 'Block discount', value: `−${q.discountPercent.toFixed(1)}%`, tone: 'negative' },
                                        { label: 'You receive', value: formatMoney(q.netToFounder), strong: true },
                                        { label: 'Your stake after', value: `${q.newOwnershipPercent.toFixed(1)}%` },
                                    ],
                                    note: 'The market reads insider selling as a warning.',
                                    confirmLabel: t('equity.sell'),
                                    tone: 'danger',
                                    onConfirm: () => {
                                        const r = eq.sellOwnShares(chunk, (n) => {
                                            const st = useStatsStore.getState();
                                            st.update({ money: (st.money || 0) + n });
                                        });
                                        setPanel({
                                            title: r.error ? 'Blocked' : 'Sold',
                                            summary: r.error
                                                || `${formatMoney(r.netToFounder)} is in your personal account after ${formatMoney(r.tax)} of tax.`,
                                            confirmLabel: 'OK',
                                        });
                                    },
                                });
                            }}
                            disabled={!isPublic}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: '#CFD0D220' }]}>
                                <Text style={styles.actionIcon}>💼</Text>
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={[styles.actionTitle, !isPublic && styles.textDisabled]}>
                                    {t('equity.sellOwn')}
                                </Text>
                                <Text style={[styles.actionDescription, !isPublic && styles.textDisabled]}>
                                    {isPublic
                                        ? t('equity.sellOwnDesc')
                                        : t('equity.requiresIpo')}
                                </Text>
                            </View>
                            <Text style={[styles.actionArrow, !isPublic && styles.textDisabled]}>›</Text>
                        </TouchableOpacity>

                        {/* Dividend */}
                        <TouchableOpacity
                            style={[styles.actionRow, !isPublic && styles.actionRowDisabled]}
                            onPress={onOpenDividend}
                            disabled={!isPublic}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: '#CFD0D220' }]}>
                                <Text style={styles.actionIcon}>💰</Text>
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={[styles.actionTitle, !isPublic && styles.textDisabled]}>{t('equity.distributeDividends')}</Text>
                                <Text style={[styles.actionDescription, !isPublic && styles.textDisabled]}>
                                    {isPublic ? 'Pay cash to shareholders' : t('equity.requiresIpo')}
                                </Text>
                            </View>
                            <Text style={[styles.actionArrow, !isPublic && styles.textDisabled]}>›</Text>
                        </TouchableOpacity>

                        <View style={{ height: 40 }} />
                    </ScrollView>

                    {/* Persistent Bottom Bar */}                    {/* Draws INSIDE this screen, over the content it refers to,
                        rather than as a system dialog that replaces it. */}
                    <ConfirmPanel
                        visible={!!panel}
                        title={panel?.title || ''}
                        summary={panel?.summary}
                        lines={panel?.lines}
                        note={panel?.note}
                        tone={panel?.tone}
                        confirmLabel={panel?.confirmLabel || 'OK'}
                        cancelLabel={t('equity.cancel')}
                        onConfirm={panel?.onConfirm}
                        onCancel={() => setPanel(null)}
                    />
                </SafeAreaView>
            </ScreenHost>

            <InfoTooltipModal
                visible={!!tooltipTerm}
                term={tooltipTerm || ''}
                onClose={() => setTooltipTerm(null)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    controlBanner: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
    controlPct: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
    controlLabel: { color: 'rgba(255,255,255,0.48)', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 3 },
    controlShares: { color: 'rgba(255,255,255,0.48)', fontSize: 12, fontWeight: '700' },
    controlNote: { color: 'rgba(255,255,255,0.48)', fontSize: 11.5, lineHeight: 16, marginTop: 8 },

    heroNote: { color: '#FFFFFF', fontSize: 10.5, lineHeight: 15, marginTop: 8 },
    dampBadge: {
        backgroundColor: 'rgba(207,208,210,0.10)', borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 7, marginTop: 8,
    },
    dampText: { color: '#FFFFFF', fontSize: 10, lineHeight: 14, fontWeight: '600' },

    breakdownCard: {
        backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        padding: 14, marginBottom: 12,
    },
    breakdownTitle: { color: 'rgba(255,255,255,0.48)', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 10 },
    breakRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    breakLabel: { color: 'rgba(255,255,255,0.48)', fontSize: 12 },
    breakValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
    breakBold: { fontWeight: '800', fontSize: 13 },
    breakDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 8 },
    breakdownNote: { color: '#FFFFFF', fontSize: 10.5, lineHeight: 15, marginTop: 10 },

    container: {
        flex: 1,
        backgroundColor: '#1C242C',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1C242C',
    },
    backButton: {
        paddingVertical: 8,
        zIndex: 10, // Ensure it sits above the absolute title
    },
    backButtonText: {
        fontSize: 17,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 60,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    heroCard: {
        backgroundColor: '#434B50',
        borderRadius: 16,
        padding: 24,
        marginTop: 20,
    },
    heroLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.48)',
        fontWeight: '500',
        marginBottom: 8,
    },
    heroRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    heroPrice: {
        fontSize: 48,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: -1,
    },
    changeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    changeBadgeText: {
        fontSize: 16,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 16,
    },
    statCard: {
        backgroundColor: '#434B50',
        borderRadius: 12,
        padding: 16,
        width: '48%',
    },
    statIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.48)',
        fontWeight: '500',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 32,
        marginBottom: 16,
    },
    actionRow: {
        backgroundColor: '#434B50',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionRowDisabled: {
        opacity: 0.4,
    },
    actionIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#434B50',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    actionIcon: {
        fontSize: 24,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    actionDescription: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.48)',
    },
    actionArrow: {
        fontSize: 28,
        color: '#FFFFFF',
        fontWeight: '300',
    },
    textDisabled: {
        color: '#FFFFFF',
    },
});

export default ShareControlHub;
