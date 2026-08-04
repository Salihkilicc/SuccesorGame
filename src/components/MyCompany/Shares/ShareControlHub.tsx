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
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';
import { formatMoney, formatNumber, formatPrice } from '../../../core/utils';

interface Props {
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
        <Text style={[styles.breakValue, bold && styles.breakBold, negative && { color: '#FF453A' }]}>
            {value}
        </Text>
    </View>
);

const ShareControlHub = ({ visible, onClose, onOpenIPO, onOpenDilution, onOpenDividend, onOpenBuyback }: Props) => {
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

    const handleStockSplit = () => {
        if (stockPrice <= 1000) {
            Alert.alert(t('alert.notAvailable'), t('alert.stockSplitIsOnlyAvailable'));
            return;
        }

        Alert.alert(
            t('alert.stockSplit'),
            t('alert.thisWillDivideYourShare'),
            [
                { text: t('equity.cancel'), style: 'cancel' },
                {
                    text: t('equity.split'),
                    onPress: () => {
                        performStockSplit();
                        Alert.alert(t('alert.success'), t('alert.stockSplitCompletedSuccessfully'));
                    },
                },
            ]
        );
    };

    const handleHomePress = () => {
        onClose();
        navigation.navigate('Home');
    };

    const marketCap = stockPrice * totalShares;
    const playerOwnership = getPlayerOwnership();

    return (
        <>
            <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
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
                                    control === 'lost' ? 'rgba(255,69,58,0.12)'
                                        : control === 'contested' ? 'rgba(255,183,77,0.12)'
                                            : 'rgba(48,209,88,0.10)',
                                borderColor:
                                    control === 'lost' ? 'rgba(255,69,58,0.35)'
                                        : control === 'contested' ? 'rgba(255,183,77,0.35)'
                                            : 'rgba(48,209,88,0.30)',
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

                        {/* Stock Price Hero Card */}
                        <View style={styles.heroCard}>
                            <Text style={styles.heroLabel}>{t('equity.currentStockPrice')}</Text>
                            <View style={styles.heroRow}>
                                <Text style={styles.heroPrice}>{formatPrice(stockPrice)}</Text>
                                <View style={[
                                    styles.changeBadge,
                                    { backgroundColor: companyDailyChange >= 0 ? '#30D15820' : '#FF453A20' }
                                ]}>
                                    <Text style={[
                                        styles.changeBadgeText,
                                        { color: companyDailyChange >= 0 ? '#30D158' : '#FF453A' }
                                    ]}>
                                        {companyDailyChange >= 0 ? '↑' : '↓'} {Math.abs(companyDailyChange).toFixed(2)}%
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.heroNote}>
                                Since last quarter · {EQUITY_EXPLANATIONS.change}
                            </Text>
                            {damping < 0.95 && (
                                <View style={styles.dampBadge}>
                                    <Text style={styles.dampText}>
                                        SIZE DAMPING {Math.round((1 - damping) * 100)}% — a company
                                        this large absorbs shocks a small one cannot
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Degerleme kirilimi — fiyatin NEDEN o rakam oldugunu goster */}
                        <View style={styles.breakdownCard}>
                            <Text style={styles.breakdownTitle}>{t('equity.whatTheCompanyIsWorth')}</Text>
                            <BreakLine label={t('equity.cashOnHand')} value={formatMoney(vb.cash)} />
                            <BreakLine
                                label={`Annual profit × ${vb.earningsMultiple.toFixed(1)}`}
                                value={formatMoney(vb.earnings)}
                            />
                            <BreakLine
                                label={`Annual revenue × ${vb.revenueMultiple.toFixed(2)}`}
                                value={formatMoney(vb.revenue)}
                            />
                            {vb.debt > 0 && (
                                <BreakLine label={t('equity.lessDebt')} value={`−${formatMoney(vb.debt)}`} negative />
                            )}
                            <View style={styles.breakDivider} />
                            <BreakLine label={t('equity.valuation')} value={formatMoney(vb.total)} bold />
                            <BreakLine
                                label={`÷ ${formatNumber(totalShares)} shares`}
                                value={formatPrice(vb.total / Math.max(1, totalShares))}
                            />
                            <Text style={styles.breakdownNote}>{EQUITY_EXPLANATIONS.valuation}</Text>
                        </View>

                        {/* Stats Grid */}
                        <View style={styles.statsGrid}>
                            <View style={styles.statCard}>
                                <Text style={styles.statIcon}>📊</Text>
                                <Text style={styles.statLabel}>{t('equity.totalShares')}</Text>
                                <Text style={styles.statValue}>{formatNumber(totalShares)}</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statIcon}>💎</Text>
                                <Text style={styles.statLabel}>{t('equity.marketCap')}</Text>
                                <Text style={styles.statValue}>{formatMoney(marketCap)}</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statIcon}>🌐</Text>
                                <Text style={styles.statLabel}>{t('equity.publicFloat')}</Text>
                                <Text style={styles.statValue}>{((publicShares / totalShares) * 100).toFixed(1)}%</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statIcon}>👤</Text>
                                <Text style={styles.statLabel}>{t('equity.myOwnership')}</Text>
                                <Text style={styles.statValue}>{playerOwnership.toFixed(1)}%</Text>
                            </View>
                        </View>

                        {/* Actions Section */}
                        <Text style={styles.sectionTitle}>{t('equity.marketActions')}</Text>

                        {/* IPO / Stock Split */}
                        {!isPublic ? (
                            <TouchableOpacity
                                style={styles.actionRow}
                                onPress={onOpenIPO}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.actionIconBox, { backgroundColor: '#0A84FF20' }]}>
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
                            <View style={[styles.actionIconBox, { backgroundColor: '#0A84FF20' }]}>
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
                            <View style={[styles.actionIconBox, { backgroundColor: '#FF9F0A20' }]}>
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
                                Alert.alert(
                                    t('equity.sellOwnConfirm'),
                                    `Gross: ${formatMoney(q.grossProceeds)}\n` +
                                    `Capital gains tax: −${formatMoney(q.tax)}\n` +
                                    `Block discount: −${q.discountPercent.toFixed(1)}%\n\n` +
                                    `You receive ${formatMoney(q.netToFounder)} personally. ` +
                                    `The company gets nothing — these are your shares, not new ones.\n\n` +
                                    `Your stake falls to ${q.newOwnershipPercent.toFixed(1)}%. ` +
                                    `The market reads insider selling as a warning.`,
                                    [
                                        { text: t('equity.cancel'), style: 'cancel' },
                                        {
                                            text: t('equity.sell'),
                                            style: 'destructive',
                                            onPress: () => {
                                                const r = eq.sellOwnShares(chunk, (n) => {
                                                    const st = useStatsStore.getState();
                                                    st.update({ money: (st.money || 0) + n });
                                                });
                                                Alert.alert(
                                                    r.error ? 'Blocked' : 'Sold',
                                                    r.error ||
                                                    `${formatMoney(r.netToFounder)} is in your personal account ` +
                                                    `after ${formatMoney(r.tax)} of tax.`,
                                                );
                                            },
                                        },
                                    ],
                                );
                            }}
                            disabled={!isPublic}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: '#34C75920' }]}>
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
                            <View style={[styles.actionIconBox, { backgroundColor: '#30D15820' }]}>
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

                    {/* Persistent Bottom Bar */}
                    <CrystalNavBar activeTab="Company" variant="dark" />
                </SafeAreaView>
            </Modal>

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
    controlLabel: { color: '#8A8A8A', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 3 },
    controlShares: { color: '#8A8A8A', fontSize: 12, fontWeight: '700' },
    controlNote: { color: '#B0B0B0', fontSize: 11.5, lineHeight: 16, marginTop: 8 },

    heroNote: { color: '#6E6E6E', fontSize: 10.5, lineHeight: 15, marginTop: 8 },
    dampBadge: {
        backgroundColor: 'rgba(127,179,255,0.10)', borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 7, marginTop: 8,
    },
    dampText: { color: '#7FB3FF', fontSize: 10, lineHeight: 14, fontWeight: '600' },

    breakdownCard: {
        backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        padding: 14, marginBottom: 12,
    },
    breakdownTitle: { color: '#8A8A8A', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 10 },
    breakRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    breakLabel: { color: '#B0B0B0', fontSize: 12 },
    breakValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
    breakBold: { fontWeight: '800', fontSize: 13 },
    breakDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 8 },
    breakdownNote: { color: '#6E6E6E', fontSize: 10.5, lineHeight: 15, marginTop: 10 },

    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    backButton: {
        paddingVertical: 8,
        zIndex: 10, // Ensure it sits above the absolute title
    },
    backButtonText: {
        fontSize: 17,
        color: '#0A84FF',
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
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 24,
        marginTop: 20,
    },
    heroLabel: {
        fontSize: 14,
        color: '#8E8E93',
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
        backgroundColor: '#1C1C1E',
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
        color: '#8E8E93',
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
        backgroundColor: '#1C1C1E',
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
        backgroundColor: '#2C2C2E',
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
        color: '#8E8E93',
    },
    actionArrow: {
        fontSize: 28,
        color: '#3A3A3C',
        fontWeight: '300',
    },
    textDisabled: {
        color: '#3A3A3C',
    },
});

export default ShareControlHub;
