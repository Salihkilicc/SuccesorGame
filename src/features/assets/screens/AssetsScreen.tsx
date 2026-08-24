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
//  THE CARDS ARE THE HOME SCREEN'S CARDS
// ---------------------------------------------------------------------------
//  Dark ground, a lit RIM, and a faint diagonal rake from the top left. That
//  technique was settled over eight rounds on the home screen and the two
//  screens are one tap apart, so this one does not get a second look of its
//  own. What was here - `#434B50` at 24 radius with a 20pt light shadow - was
//  from before that work.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { ScrollView, View, StyleSheet, Pressable, Text, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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

const AssetsScreen = () => {
    useLocale();
    const navigation = useNavigation<any>();
    const { cash, equityValue, investmentsValue, netWorth, report } = useAssetsLogic();
    const stats = useStatsStore((s) => s);

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

    const backButton = (
        <Pressable
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
            <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.textPrimary} />
        </Pressable>
    );

    /**
     * The card everything on this screen is made of.
     *
     * One component rather than three copies of the same gradient, because the
     * home screen learned that lesson the expensive way: two identical
     * gradients forty lines apart, and fixing one and reading the other as
     * done is how the casino's 700 survived a whole commit.
     */
    const Card = ({ children }: { children: React.ReactNode }) => (
        <LinearGradient
            colors={[
                'rgba(255,255,255,0.08)',
                'rgba(255,255,255,0.03)',
                theme.colors.background,
                theme.colors.background,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0, 0.3, 0.68, 1]}
            style={styles.card}
        >
            {children}
        </LinearGradient>
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
            <StatusBar barStyle="light-content" />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <View style={styles.sideNode}>{backButton}</View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>{t('personal.title')}</Text>
                        <Text style={styles.headerSubtitle}>{t('personal.subtitle')}</Text>
                    </View>
                    <View style={styles.sideNode} />
                </View>

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
                        <HoldingRow
                            icon="chart-pie"
                            label={t('personal.stake')}
                            sub={stats.companyName
                                ? t('personal.stakeIn', { company: stats.companyName })
                                : undefined}
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
                            YOUR PAY, ON THE SCREEN THE MONEY LANDS ON

                            It is set under Equity, two taps away, and nothing
                            here said so. A player who wanted a raise had to
                            already know that a personal salary is decided on a
                            company screen. Now the row that shows the money
                            leads to the room where it is argued about.
                           ---------------------------------------------------- */}
                        <Pressable
                            onPress={() => navigation.navigate('StockMarket')}
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

                </ScrollView>
            </SafeAreaView>
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
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: theme.typography.subtitle + 4,
        fontWeight: '900',
        color: theme.colors.textPrimary,
        letterSpacing: 2,
    },
    headerSubtitle: {
        fontSize: theme.typography.micro,
        color: theme.colors.textMuted,
        fontWeight: '600',
        letterSpacing: 0.8,
        marginTop: 2,
    },
    sideNode: {
        width: 44,
    },
    content: {
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.xl,
        paddingBottom: 120,
        gap: theme.spacing.lg,
    },

    // ----------------------------------------------------------------------
    //  THE CARD. The rim is the effect; see HomeScreen.modernCard.
    // ----------------------------------------------------------------------
    card: {
        backgroundColor: theme.colors.background,
        borderRadius: 24,
        padding: theme.spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        shadowColor: theme.colors.background,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 4,
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
        backgroundColor: theme.colors.surface,
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
    backButton: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    backButtonPressed: {
        backgroundColor: theme.colors.surfaceRaised,
        transform: [{ scale: 0.95 }],
    },
});

export default AssetsScreen;
