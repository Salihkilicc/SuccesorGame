// src/features/assets/screens/AssetsScreen.tsx
//
// ============================================================================
//  THE PERSONAL SCREEN, WHICH DID NOT KNOW IT WAS ONE
// ============================================================================
//
//  Every figure here comes from `personalQuarter`: the player's salary, their
//  rent, their tax, their tuition, their partner, their portfolio. Not one
//  number on this screen belongs to the company.
//
//  It was captioned ASSETS / Wealth Management and every label was a
//  `company.*` key - `company.netWorth`, `company.cash`,
//  `company.quarterlyReport2`, `company.incomeSources`. So the screen that
//  answers "what am I worth" was dressed as a corporate filing, and the two
//  things this game keeps separate on purpose - the company's money and the
//  player's - read as one thing here.
//
//  ---------------------------------------------------------------------------
//  WHAT CHANGED BESIDES THE WORDS
//  ---------------------------------------------------------------------------
//  1. THE SIGN. `BreakdownSection` prefixed a minus unless told otherwise, and
//     the assets section had no way to say it was neither a flow in nor out,
//     so the player's savings rendered as "Cash (Liquid) -$450,000".
//
//  2. THE NET WORTH. It read cash + bank + investments, where `bank` was a
//     hardcoded zero and the player's SHAREHOLDING was missing entirely -
//     usually the largest thing they own. The home card that leads here
//     included it, so pressing the card made the number drop. See
//     core/market/personalEconomy.personalNetWorth.
//
//  3. THE STAKE IS NOW THE POINT. A founder is rich on paper and short of
//     cash, and that tension is the whole shape of this game: it is why the
//     buyout needs financing and why the casino is tempting. So the screen
//     says out loud what share of the fortune cannot be spent.
//
//  4. THE PAY ROW. The salary arrived labelled "Job Salary" with no route to
//     where it is decided. It is a CEO's pay, the board can cap it, and it is
//     set two screens away under Equity. Now it is a row you can press.
//
//  ---------------------------------------------------------------------------
//  AND THE CARDS ARE THE GAME'S CARDS, NOT THE HOME SCREEN'S
//  ---------------------------------------------------------------------------
//  SHELVED: the lit rim and the diagonal rake.
//
//      <LinearGradient
//          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)',
//                   theme.colors.background, theme.colors.background]}
//          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
//          locations={[0, 0.3, 0.68, 1]}
//          style={styles.card} />
//      // borderColor: 'rgba(255,255,255,0.22)'
//
//  That effect took eight rounds to land and it belongs to the home screen,
//  which is a wallpaper with two widgets floating on it. This is a page inside
//  the app, and inside the app a card is `theme.colors.card` at 16 radius with
//  a hairline border. Reusing the widget treatment here made a destination
//  look like a home screen tile.
//
//  Same reasoning for the header: this had a hand-rolled one with its own
//  centring and its own back button, and there is exactly one header in this
//  app for exactly that reason - see components/common/ScreenHeader.tsx, which
//  also draws the section rule that says which part of the game you are in.
//
//  The nav bar is rendered once by RootNavigator and floats over every route,
//  so what a screen owes it is clearance rather than a copy of it. See the
//  note on `content` below.
//
//  The symbols, the wording and the sections are untouched.
// ============================================================================

import React, { useMemo } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { ScrollView, View, StyleSheet, Pressable, Text } from 'react-native';
// Shelved with the hand-rolled back button below. ScreenHeader pops the
// stack itself, and the pay decision is raised in place rather than navigated
// to, so this screen no longer sends the player anywhere.
// import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { theme, palette } from '../../../core/theme';
import { useAssetsLogic } from '../hooks/useAssetsLogic';
import { BreakdownSection } from '../components/AssetsUI';
import { formatMoney } from '../../../core/utils';
import { useStatsStore } from '../../../core/store/useStatsStore';
import {
    CEO_BASE_SALARY_QUARTERLY,
} from '../../../core/market/personalEconomy';
import {
    payCeiling,
    PAY_CHANGE_COOLDOWN,
} from '../../../core/market/ceoPay';
import { trailingTotal } from '../../../core/market/equity';
import { currentQuarter } from '../../../core/story/world';
import { useShareholderStore } from '../../shareholders/stores/useShareholderStore';
import { useLuxoNetStore } from '../../../core/store/useLuxoNetStore';
import CeoPayPanel from '../../../components/MyCompany/Shares/CeoPayPanel';
import { formatNumber } from '../../../core/utils';

const AssetsScreen = () => {
    useLocale();
    // const navigation = useNavigation<any>();
    const { cash, equityValue, investmentsValue, netWorth, report } = useAssetsLogic();
    const stats = useStatsStore((s) => s);
    const { playerShareCount } = useShareholderStore();

    // ------------------------------------------------------------------
    //  LUXONET, READ FOR THE FIRST TIME
    // ------------------------------------------------------------------
    //  `getTotalPortfolioValue`, `getTotalAnnualMaintenance`, `quarterlyTick`
    //  and `getTotalPrestige` all had ZERO callers. Four query helpers, a
    //  quarterly tick that returns maintenance and value change, and an owned
    //  assets array - and nothing anywhere consulted any of it. A player could
    //  buy a hypercar and their wealth would not move by a dollar.
    //
    //  Read here, and INFORMATION ONLY on purpose: it is not added to the net
    //  worth above and the row does not lead into LuxoNet. Adding it to the
    //  total would change the balance of the game in a commit that was asked
    //  to display a number; that is a decision on its own and it has not been
    //  made yet. What this fixes is that the number was invisible.
    // ------------------------------------------------------------------
    const luxuryValue = useLuxoNetStore((s) => s.ownedAssets)
        .reduce((sum, a) => sum + (a.currentMarketValue || 0), 0);
    const luxuryCount = useLuxoNetStore((s) => s.ownedAssets).length;
    const luxuryUpkeep = useLuxoNetStore((s) => s.ownedAssets)
        .reduce((sum, a) => sum + (a.annualMaintenanceCost || 0), 0);

    const [payOpen, setPayOpen] = React.useState(false);

    // ------------------------------------------------------------------
    //  THE PART YOU CANNOT SPEND
    // ------------------------------------------------------------------
    //  Guarded against a zero net worth AND against a negative one: a player
    //  underwater on cash would otherwise be told that minus four hundred per
    //  cent of their wealth is locked up.
    // ------------------------------------------------------------------
    const lockedShare = useMemo(() => {
        if (!Number.isFinite(netWorth) || netWorth <= 0) return 0;
        return Math.max(0, Math.min(1, equityValue / netWorth));
    }, [equityValue, netWorth]);

    const ceoPay = stats.ceoPayQuarterly ?? CEO_BASE_SALARY_QUARTERLY;
    const payMax = payCeiling(trailingTotal(stats.revenueHistory ?? []));
    const payLockedFor = Math.max(
        0,
        PAY_CHANGE_COOLDOWN - (currentQuarter() - (stats.ceoPaySetQuarter ?? -PAY_CHANGE_COOLDOWN)),
    );

    // SHELVED: a hand-rolled back button and a hand-rolled centred title.
    // There is one header in this app on purpose - a player should never have
    // to look for the way out. See components/common/ScreenHeader.tsx.
    //
    //  const backButton = (
    //      <Pressable
    //          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
    //          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
    //          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.textPrimary} />
    //      </Pressable>
    //  );

    /**
     * The card everything on this screen is made of.
     *
     * One component rather than three copies of the same style, because the
     * home screen learned that lesson the expensive way: two identical
     * gradients forty lines apart, and fixing one and reading the other as
     * done is how the casino's 700 survived a whole commit.
     */
    const Card = ({ children }: { children: React.ReactNode }) => (
        <View style={styles.card}>{children}</View>
    );

    const HoldingRow = ({
        icon, label, sub, value, tint,
    }: { icon: string; label: string; sub?: string; value: number; tint: string }) => (
        <View style={styles.holdingRow}>
            <View style={styles.holdingIcon}>
                <MaterialCommunityIcons name={icon} size={18} color={tint} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.holdingLabel}>{label}</Text>
                {!!sub && <Text style={styles.holdingSub} numberOfLines={1}>{sub}</Text>}
            </View>
            <Text style={styles.holdingValue} numberOfLines={1} adjustsFontSizeToFit>
                {formatMoney(value)}
            </Text>
        </View>
    );

    return (
        <View style={styles.root}>
            <ScreenHeader title={t('personal.title')} subtitle={t('personal.subtitle')} />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* ============================================================
                        WHAT YOU ARE WORTH, AND HOW MUCH OF IT IS REAL
                       ============================================================ */}
                    <Card>
                        <Text style={styles.heroLabel}>{t('personal.netWorth')}</Text>
                        <Text style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
                            {formatMoney(netWorth)}
                        </Text>

                        <View style={styles.divider} />

                        <Text style={styles.sectionTitle}>{t('personal.whatYouHold')}</Text>

                        <HoldingRow
                            icon="cash"
                            label={t('personal.cash')}
                            value={cash}
                            tint={palette.greyLight}
                        />
                        {/* ------------------------------------------------
                            THE STAKE, SPELLED OUT

                            This showed a money figure and, when the company
                            happened to have a name, the words "in Nexus".
                            Neither the PERCENTAGE nor the share count appeared
                            anywhere on the screen - and the percentage is the
                            number the whole game turns on. Below fifty and
                            every decision goes to a vote; that threshold was
                            invisible on the page that reports the holding.

                            The no-name case gets its own string rather than
                            dropping the line, because a run before the company
                            is named is exactly when a player is least sure
                            what they own.
                           ------------------------------------------------ */}
                        <HoldingRow
                            icon="chart-pie"
                            label={t('personal.stake')}
                            sub={t(
                                stats.companyName ? 'personal.stakeDetail' : 'personal.stakeNoName',
                                {
                                    percent: (stats.companyOwnership ?? 0).toFixed(1),
                                    company: stats.companyName,
                                    shares: formatNumber(playerShareCount || 0),
                                },
                            )}
                            value={equityValue}
                            tint={palette.orange}
                        />
                        <HoldingRow
                            icon="chart-line"
                            label={t('personal.investments')}
                            value={investmentsValue}
                            tint={palette.blueLight}
                        />

                        {/* ----------------------------------------------------
                            The line that makes this a founder's screen rather
                            than a bank statement. It is not decoration: it is
                            the reason the buyout needs financing.
                           ---------------------------------------------------- */}
                        <View style={styles.lockedBox}>
                            <MaterialCommunityIcons
                                name={lockedShare > 0 ? 'lock-outline' : 'lock-open-variant-outline'}
                                size={14}
                                color={theme.colors.textMuted}
                            />
                            <Text style={styles.lockedText}>
                                {lockedShare > 0
                                    ? t('personal.lockedUp', { percent: String(Math.round(lockedShare * 100)) })
                                    : t('personal.allCash')}
                            </Text>
                        </View>
                    </Card>

                    {/* ============================================================
                        THE QUARTER
                       ============================================================ */}
                    <Card>
                        <View style={styles.cardHeader}>
                            <Text style={styles.sectionTitle}>{t('personal.thisQuarter')}</Text>
                            <MaterialCommunityIcons name="calendar-blank-outline" size={18} color={theme.colors.textMuted} />
                        </View>

                        <View style={styles.flowRow}>
                            <View style={styles.flowCol}>
                                <Text style={styles.flowLabel}>{t('personal.comesIn')}</Text>
                                <Text style={[styles.flowValue, { color: theme.colors.success }]} numberOfLines={1} adjustsFontSizeToFit>
                                    {formatMoney(report.totalIncome)}
                                </Text>
                            </View>
                            <View style={styles.flowCol}>
                                <Text style={styles.flowLabel}>{t('personal.goesOut')}</Text>
                                <Text style={[styles.flowValue, { color: theme.colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
                                    {formatMoney(report.totalExpenses)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.netFlowContainer}>
                            <Text style={styles.netFlowLabel}>{t('personal.leftOver')}</Text>
                            <Text style={[
                                styles.netFlowValue,
                                { color: report.netFlow >= 0 ? theme.colors.success : theme.colors.danger },
                            ]}>
                                {report.netFlow >= 0 ? '+' : ''}{formatMoney(report.netFlow)}
                            </Text>
                        </View>

                        {/* ----------------------------------------------------
                            YOUR PAY, DECIDED WHERE IT LANDS

                            First this said "Job Salary" and led nowhere. Then
                            it navigated to Equity, where the panel lived. Now
                            the panel lives here: a personal salary settled on
                            a company share screen was only findable by a
                            player who already knew to look there.

                            The panel moved WHOLE rather than being copied -
                            see components/MyCompany/Shares/CeoPayPanel.tsx and
                            the shelved block in ShareControlHub.
                           ---------------------------------------------------- */}
                        <Pressable
                            onPress={() => setPayOpen(true)}
                            style={({ pressed }) => [styles.payRow, pressed && styles.payRowPressed]}
                        >
                            <View style={styles.payIcon}>
                                <MaterialCommunityIcons name="account-tie" size={18} color={theme.colors.textPrimary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.holdingLabel}>{t('personal.yourPay')}</Text>
                                <Text style={styles.holdingSub}>
                                    {payLockedFor > 0
                                        ? t('personal.payLocked', {
                                            n: `${payLockedFor} ${payLockedFor === 1 ? 'quarter' : 'quarters'}`,
                                        })
                                        : t('personal.payTap')}
                                </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.holdingValue}>{formatMoney(ceoPay)}</Text>
                                <Text style={styles.payCeilingText}>{formatMoney(payMax)} max</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
                        </Pressable>
                    </Card>

                    {/* ============================================================
                        WHERE IT COMES FROM AND WHERE IT GOES
                       ============================================================ */}
                    <Card>
                        <BreakdownSection title={t('personal.incomeSources')} items={report.incomeBreakdown} />
                        <BreakdownSection title={t('personal.expenses')} items={report.expenseBreakdown} />
                    </Card>

                    {/* ============================================================
                        WHAT LUXONET SAYS YOU OWN

                        Information only, and deliberately so. The row does not
                        open LuxoNet and the figure is not in the net worth
                        above - see the note on the store read at the top of
                        this file. Before this it was not shown anywhere at
                        all: the store's four query helpers had no callers.

                        It renders only when there is something to report,
                        because an empty luxury row on a founder's first
                        quarter is an advertisement rather than a fact.
                       ============================================================ */}
                    {luxuryCount > 0 && (
                        <Card>
                            <View style={styles.holdingRow}>
                                <View style={styles.holdingIcon}>
                                    <MaterialCommunityIcons name="diamond-stone" size={18} color={palette.violet} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.holdingLabel}>{t('personal.luxury')}</Text>
                                    <Text style={styles.holdingSub} numberOfLines={1}>
                                        {t('personal.luxuryCount', {
                                            n: String(luxuryCount),
                                            cost: formatMoney(luxuryUpkeep),
                                        })}
                                    </Text>
                                </View>
                                <Text style={styles.holdingValue} numberOfLines={1} adjustsFontSizeToFit>
                                    {formatMoney(luxuryValue)}
                                </Text>
                            </View>
                            <Text style={styles.luxuryNote}>{t('personal.luxuryNote')}</Text>
                        </Card>
                    )}

            </ScrollView>

            <CeoPayPanel open={payOpen} onClose={() => setPayOpen(false)} />
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        // ------------------------------------------------------------------
        //  SHELVED: a LinearGradient of three identical `#1C242C` stops laid
        //  over `absoluteFill`. A gradient that does not gradate, drawn by the
        //  most expensive component in the tree, over a view that was already
        //  the same colour. See the note on GRADIENTS in HomeScreen.
        // ------------------------------------------------------------------
        backgroundColor: theme.colors.background,
    },

    // ----------------------------------------------------------------------
    //  SHELVED WITH THE HAND-ROLLED HEADER
    // ----------------------------------------------------------------------
    //  `safeArea`, `header`, `titleContainer`, `headerTitle`,
    //  `headerSubtitle`, `sideNode`, `backButton` and `backButtonPressed` -
    //  eight style keys reimplementing what ScreenHeader already does, down to
    //  its own status bar inset and its own bottom rule. ScreenHeader draws
    //  the rule in the SECTION's colour, resolved from the route, which is a
    //  thing a hand-rolled header cannot do by construction.
    //
    //  safeArea:        { flex: 1 },
    //  header:          { flexDirection: 'row', alignItems: 'center',
    //                     justifyContent: 'space-between',
    //                     paddingHorizontal: theme.spacing.xl,
    //                     paddingVertical: theme.spacing.lg,
    //                     borderBottomWidth: 1,
    //                     borderBottomColor: theme.colors.border },
    //  titleContainer:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
    //  headerTitle:     { fontSize: theme.typography.subtitle + 4,
    //                     fontWeight: '900', color: theme.colors.textPrimary,
    //                     letterSpacing: 2 },
    //  headerSubtitle:  { fontSize: theme.typography.micro,
    //                     color: theme.colors.textMuted, fontWeight: '600',
    //                     letterSpacing: 0.8, marginTop: 2 },
    //  sideNode:        { width: 44 },
    //  backButton:      { width: 40, height: 40, borderRadius: theme.radius.md,
    //                     alignItems: 'center', justifyContent: 'center',
    //                     backgroundColor: theme.colors.surface,
    //                     borderWidth: 1, borderColor: theme.colors.border },
    //  backButtonPressed: { backgroundColor: theme.colors.surfaceRaised,
    //                     transform: [{ scale: 0.95 }] },
    // ----------------------------------------------------------------------

    content: {
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.lg,
        // CrystalNavBar is absolute against the WINDOW and rendered once by
        // RootNavigator, so it floats over the end of this list. What a screen
        // owes it is clearance; the rest of the app uses 120 to 140.
        paddingBottom: 130,
        gap: theme.spacing.lg,
    },

    // ----------------------------------------------------------------------
    //  THE CARD, WHICH IS THE APP'S CARD
    // ----------------------------------------------------------------------
    //  `theme.colors.card` at 16 with a hairline border, the same as the
    //  product cards and everything else inside the app. The home screen's
    //  lit rim is for widgets floating on a wallpaper and it made this page
    //  read as a home screen tile.
    // ----------------------------------------------------------------------
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.typography.caption,
        fontWeight: '700',
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: theme.spacing.sm,
    },

    heroLabel: {
        fontSize: theme.typography.caption,
        fontWeight: '700',
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    heroValue: {
        fontSize: theme.typography.display,
        fontWeight: '900',
        color: theme.colors.textPrimary,
        letterSpacing: 0.5,
        marginTop: theme.spacing.xs,
    },

    holdingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    holdingIcon: {
        width: 34,
        height: 34,
        borderRadius: theme.radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        // ------------------------------------------------------------------
        //  A RUNG ABOVE THE CARD, NOT THE SAME AS IT
        // ------------------------------------------------------------------
        //  This was `surface`, which is #323A40 - and the card is now
        //  `card`, which is ALSO #323A40. Same value, two token names, so
        //  every icon box would have dissolved into the card the moment the
        //  ground changed and only the hairline border would have been left.
        //
        //  It read fine before this commit purely because the card behind it
        //  was the darker `background`. A token that happens to contrast is
        //  not a token that contrasts.
        // ------------------------------------------------------------------
        backgroundColor: theme.colors.surfaceRaised,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    holdingLabel: {
        fontSize: theme.typography.body,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    holdingSub: {
        fontSize: theme.typography.micro + 1,
        color: theme.colors.textMuted,
        marginTop: 1,
    },
    holdingValue: {
        fontSize: theme.typography.subtitle,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },

    lockedBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.sm,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    lockedText: {
        flex: 1,
        fontSize: theme.typography.micro + 1,
        color: theme.colors.textSecondary,
        lineHeight: 15,
    },

    flowRow: {
        flexDirection: 'row',
        gap: theme.spacing.xl,
    },
    flowCol: {
        flex: 1,
    },
    flowLabel: {
        color: theme.colors.textMuted,
        fontSize: theme.typography.caption,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    flowValue: {
        fontSize: theme.typography.subtitle + 4,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    netFlowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        padding: theme.spacing.md,
        borderRadius: theme.radius.sm,
        marginTop: theme.spacing.lg,
    },
    netFlowLabel: {
        color: theme.colors.textMuted,
        fontSize: theme.typography.caption,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    netFlowValue: {
        fontSize: theme.typography.subtitle,
        fontWeight: '800',
    },

    payRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginTop: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    payRowPressed: {
        opacity: 0.7,
    },
    payIcon: {
        width: 34,
        height: 34,
        borderRadius: theme.radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceRaised,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    luxuryNote: {
        fontSize: theme.typography.micro,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.sm,
        lineHeight: 14,
    },
    payCeilingText: {
        fontSize: theme.typography.micro,
        color: theme.colors.textMuted,
        marginTop: 1,
    },

    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.lg,
    },
});

export default AssetsScreen;
