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
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
// Shelved with the pay panel below. Every one of these was imported for it
// and nothing else on this screen; they live in CeoPayPanel.tsx now.
// import {
//     decidePay,
//     payCeiling,
//     payAsShareOfRevenue,
//     CEO_BASE_SALARY_QUARTERLY,
//     PAY_VOTE_MULTIPLE,
//     PAY_CHANGE_COOLDOWN,
// } from '../../../core/market/ceoPay';
// import { currentQuarter } from '../../../core/story/world';
// import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import ScreenHost from '../../common/ScreenHost';
import ScreenHeader from '../../common/ScreenHeader';

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
        <Text style={[styles.breakValue, bold && styles.breakBold, negative && { color: theme.colors.textPrimary }]}>
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
        /**
         * A decision with more than two answers. ConfirmPanel has supported
         * these all along; this state did not carry them, so every decision
         * raised from this screen had to be squeezed into one confirm button.
         * See openPayPanel.
         */
        choices?: {
            label: string;
            description?: string;
            onPress: () => void;
            disabled?: boolean;
        }[];
    }>(null);

    // ======================================================================
    //  YOUR OWN PAY MOVED OUT OF THIS SCREEN
    // ======================================================================
    //  It is a PERSONAL salary and it was decided here, under Equity, beside
    //  the IPO and the buyback - two taps from the page the money actually
    //  lands on, and only findable by a player who already knew to look on a
    //  company screen for their own wages.
    //
    //  It now lives on the personal screen, whole. Not copied: this codebase
    //  has paid for duplication four times - the casino's 700 in four places,
    //  three salaries, four buyout deciders, two net worths - so there is one
    //  implementation, in components/MyCompany/Shares/CeoPayPanel.tsx, and one
    //  door to it.
    //
    //  Kept here rather than deleted because the panel's shape is the record
    //  of what it is for: three answers instead of a number field, each one
    //  priced before it is picked.
    // ======================================================================

//     // ======================================================================
//     //  YOUR OWN PAY
//     // ======================================================================
//     //  Three choices rather than a number field, and each one shows what it
//     //  costs before it is picked. A free entry box invites the player to type
//     //  the treasury and be told no; these are the three answers that exist.
//     //
//     //  The ceiling is a share of TRAILING revenue, so it is a number the
//     //  player has already earned rather than one they can conjure. Every rule
//     //  behind it is in core/market/ceoPay.ts, written one per loophole.
//     // ======================================================================
//     const ceoPay = stats.ceoPayQuarterly ?? CEO_BASE_SALARY_QUARTERLY;
//     const ttmRevenueForPay = trailingTotal(stats.revenueHistory ?? []);
//     const payMax = payCeiling(ttmRevenueForPay);
//     // When they may next change it. Shown rather than only enforced: "no" with
//     // no date on it reads as broken, which is how the old contract presets and
//     // the old friendly-acquisition lock both went wrong.
//     const quartersSincePayChange =
//         currentQuarter() - (stats.ceoPaySetQuarter ?? -PAY_CHANGE_COOLDOWN);
//     const payLockedFor = Math.max(0, PAY_CHANGE_COOLDOWN - quartersSincePayChange);
//
//     /** Ask for a number, then say what came of it. Shared by all three rows. */
//     const askForPay = (amount: number) => {
//         const r = useCorporateFinanceStore.getState().requestCeoPay(amount);
//         setPanel({
//             title: r.ok ? 'Set' : 'Not this year',
//             summary: r.message,
//             confirmLabel: 'OK',
//             tone: r.ok ? 'default' : 'danger',
//         });
//     };
//
//     const openPayPanel = () => {
//         // ------------------------------------------------------------------
//         //  THREE ANSWERS, AND ALL THREE CAN BE GIVEN
//         // ------------------------------------------------------------------
//         //  This panel listed the three as `lines` - read only - under a single
//         //  button labelled "Ask for the maximum", so a player could see the
//         //  founder's wage and the middle step and take neither. The only move
//         //  available was the greediest one, which is the opposite of what a
//         //  panel built around a choice is for, and it made a pay CUT
//         //  unreachable from the screen although `decidePay` allows one at any
//         //  time and charges nothing for it.
//         //
//         //  `choices` already existed for exactly this - the acquisition panel
//         //  pays in cash, debt or stock the same way - so this is the shape the
//         //  screen should have had, not a new mechanism.
//         //
//         //  Nothing is filtered out. A row that cannot be taken is shown greyed
//         //  with the reason underneath, which is the rule the acquisition panel
//         //  learned the hard way: a missing button teaches nothing.
//         // ------------------------------------------------------------------
//         const options: { label: string; amount: number }[] = [
//             { label: 'The founder\'s wage', amount: CEO_BASE_SALARY_QUARTERLY },
//             { label: 'A real rise', amount: Math.min(payMax, CEO_BASE_SALARY_QUARTERLY * PAY_VOTE_MULTIPLE * 2) },
//             { label: 'Everything the company can carry', amount: payMax },
//         ];
//
//         setPanel({
//             title: 'Your pay',
//             summary: `You take ${formatMoney(ceoPay)} a quarter, and the company pays it. `
//                 + `The most it can carry is ${formatMoney(payMax)}, which is two per cent of what it sells.`,
//             choices: options.map(o => {
//                 const d = decidePay({
//                     amount: o.amount,
//                     current: ceoPay,
//                     trailingAnnualRevenue: ttmRevenueForPay,
//                     quartersSinceChange: quartersSincePayChange,
//                 });
//                 const share = payAsShareOfRevenue(d.granted, ttmRevenueForPay);
//                 const isCut = d.granted < ceoPay;
//                 const unchanged = d.granted === ceoPay;
//
//                 // The description carries the WHY, because it is also what a
//                 // greyed row has to explain.
//                 const detail = d.blocked
//                     ? d.blocked
//                     : unchanged
//                         ? 'What you already take.'
//                         : [
//                             `${formatMoney(d.granted)} a quarter`,
//                             share > 0 ? `${(share * 100).toFixed(1)}% of sales` : '',
//                             d.needsVote ? 'the board votes on this' : 'no vote needed',
//                             isCut
//                                 ? 'a cut costs nothing and takes effect at once'
//                                 : d.trustCost > 0
//                                     ? `costs every director ${d.trustCost} trust`
//                                     : 'costs no trust',
//                         ].filter(Boolean).join(' · ');
//
//                 return {
//                     label: o.label,
//                     description: detail,
//                     disabled: !!d.blocked || unchanged,
//                     onPress: () => askForPay(o.amount),
//                 };
//             }),
//             note: payLockedFor > 0
//                 ? `Pay is set once a year. ${payLockedFor} more ${payLockedFor === 1 ? 'quarter' : 'quarters'} before it can rise again. A cut still takes effect at once.`
//                 : 'A rise is set once a year and costs trust with every director, '
//                     + 'whether or not they approve it. A cut takes effect at once and costs nothing.',
//             // Unused while `choices` is present - the choices ARE the answer -
//             // but ConfirmPanel takes it as required, and the cancel row is
//             // what closes this one.
//             confirmLabel: 'Close',
//         });
//     };

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
                { label: t('hub.afterTheSplit'), value: formatPrice(stockPrice / 2) },
                { label: t('equity.totalShares'), value: formatNumber(totalShares) },
                { label: t('hub.afterTheSplit'), value: formatNumber(totalShares * 2), strong: true },
            ],
            note: t('hub.splitNote'),
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
                <View style={styles.container}>
                    {/* Header */}
                    <ScreenHeader title={t('equity.equityManagement')} onBack={onClose} />

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
                                                label={t('fin.sizeDamping')}
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
                                            label={t('hub.annualProfitTimes', { multiple: vb.earningsMultiple.toFixed(1) })}
                                            value={formatMoney(vb.earnings)}
                                        />
                                        <DetailLine
                                            label={t('hub.annualRevenueTimes', { multiple: vb.revenueMultiple.toFixed(2) })}
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
                                            label={t('hub.dividedByShares', { count: formatNumber(totalShares) })}
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
                                <View style={[styles.actionIconBox, { backgroundColor: 'rgba(96, 165, 250, 0.15)', borderWidth: 1, borderColor: 'rgba(96, 165, 250, 0.3)' }]}>
                                    <MaterialCommunityIcons name="bell-ring-outline" size={24} color="#60A5FA" />
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
                                <View style={[styles.actionIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                                    <MaterialCommunityIcons name="content-cut" size={24} color="#38BDF8" />
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
                            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(52, 211, 153, 0.15)', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.3)' }]}>
                                <MaterialCommunityIcons name="chart-box-plus-outline" size={24} color="#34D399" />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={[styles.actionTitle, !isPublic && styles.textDisabled]}>{t('equity.stockBuyback')}</Text>
                                <Text style={[styles.actionDescription, !isPublic && styles.textDisabled]}>
                                    {isPublic ? t('hub.buybackDesc') : t('equity.requiresIpo')}
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
                            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(248, 113, 113, 0.15)', borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.3)' }]}>
                                <MaterialCommunityIcons name="chart-box-outline" size={24} color="#F87171" />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={[styles.actionTitle, !isPublic && styles.textDisabled]}>
                                    {t('equity.issueNew')}
                                </Text>
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
                                    summary: t('hub.sellOwnSummary', { count: formatNumber(chunk) }),
                                    lines: [
                                        { label: t('hub.gross'), value: formatMoney(q.grossProceeds) },
                                        { label: t('hub.capitalGainsTax'), value: `−${formatMoney(q.tax)}`, tone: 'negative' },
                                        { label: t('hub.blockDiscount'), value: `−${q.discountPercent.toFixed(1)}%`, tone: 'negative' },
                                        { label: t('hub.youReceive'), value: formatMoney(q.netToFounder), strong: true },
                                        { label: t('hub.stakeAfter'), value: `${q.newOwnershipPercent.toFixed(1)}%` },
                                    ],
                                    note: t('hub.insiderSellingNote'),
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
                            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(251, 191, 36, 0.15)', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)' }]}>
                                <MaterialCommunityIcons name="briefcase-upload-outline" size={24} color="#FBBF24" />
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
                            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(74, 222, 128, 0.15)', borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.3)' }]}>
                                <MaterialCommunityIcons name="cash-multiple" size={24} color="#4ADE80" />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={[styles.actionTitle, !isPublic && styles.textDisabled]}>{t('equity.distributeDividends')}</Text>
                                <Text style={[styles.actionDescription, !isPublic && styles.textDisabled]}>
                                    {isPublic ? t('hub.dividendDesc') : t('equity.requiresIpo')}
                                </Text>
                            </View>
                            <Text style={[styles.actionArrow, !isPublic && styles.textDisabled]}>›</Text>
                        </TouchableOpacity>

                        {/* ------------------------------------------------
                            WHAT YOU PAY YOURSELF - MOVED, NOT COPIED

                            The old reasoning was that it belongs with the
                            other four because every row on this page moves
                            money between the company and its owners, and this
                            is the one that moves it to you.

                            True, and it lost to a simpler fact: it is the
                            player's OWN wages, and a player looking for their
                            wages does not open a share control screen. It is
                            on the personal page now, on the row that shows the
                            money arriving. There is one door, because two
                            doors to one decision is the same fault as two
                            places holding one fact.

                            <TouchableOpacity
                                style={styles.actionRow}
                                onPress={openPayPanel}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.actionIconBox, ...]}>
                                    <MaterialCommunityIcons name="account-tie" size={24} ... />
                                </View>
                                <View style={styles.actionContent}>
                                    <Text style={styles.actionTitle}>{t('fin.yourPay')}</Text>
                                    <Text style={styles.actionDescription}>
                                        {`${formatMoney(ceoPay)} a quarter · the board may cap it at ${formatMoney(payMax)}`}
                                    </Text>
                                </View>
                                <Text style={styles.actionArrow}>›</Text>
                            </TouchableOpacity>
                           ------------------------------------------------ */}

                        <View style={{ height: 40 }} />
                    </ScrollView>

                    {/* Persistent Bottom Bar */}
                    {/* Draws INSIDE this screen, over the content it refers to,
                        rather than as a system dialog that replaces it. */}
                    <ConfirmPanel
                        visible={!!panel}
                        title={panel?.title || ''}
                        summary={panel?.summary}
                        lines={panel?.lines}
                        choices={panel?.choices}
                        note={panel?.note}
                        tone={panel?.tone}
                        confirmLabel={panel?.confirmLabel || 'OK'}
                        cancelLabel={t('equity.cancel')}
                        onConfirm={panel?.onConfirm}
                        onCancel={() => setPanel(null)}
                    />
                </View>
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
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionRowDisabled: {
        opacity: 0.4,
    },
    actionIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
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
