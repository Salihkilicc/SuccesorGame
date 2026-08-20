// src/components/MyCompany/Shares/IpoModal.tsx
//
// ============================================================================
//  THE LISTING, ON THE SCREEN THE BUTTON IS ON
// ============================================================================
//
//  THE BUG. `Launch IPO` sits on the Stock Market screen and did nothing when
//  pressed. The confirmation appeared later, on My Company, once the player had
//  navigated back.
//
//  Why: the handler was `handleLaunchIPO` in MyCompanyScreen, handed down as a
//  ROUTE PARAM, and all it did was `setPanel(...)` on MyCompanyScreen's own
//  state. That screen is not the one in front of you, so the panel rendered
//  into a screen nobody was looking at and waited there. The comment on the
//  param said "the IPO confirmation lives on My Company, which owns the panel
//  that shows it", which is an accurate description of the bug.
//
//  A screen cannot raise a dialog on a different screen. The fix is not to
//  move the state, it is to stop the state travelling: this modal owns the
//  quote, the confirmation, the failure and the result, and the Stock Market
//  screen renders it exactly as it already renders the buyback, the dilution
//  and the dividend. Four siblings, one pattern, no route params.
//
//  ---------------------------------------------------------------------------
//  AND IT IS THREE SCREENS, NOT A DIALOG
//  ---------------------------------------------------------------------------
//  Listing is the largest single thing that happens to this company and it read
//  as a system confirmation with a table in it. So:
//
//    NOT READY   what the underwriters need, and how far off you are.
//    THE OFFER   the real terms, including the two costs an IPO screen
//                usually hides: the discount and the fee.
//    DONE        what you raised and what it cost you in ownership.
//
//  The DONE step is a separate step rather than a toast, because the number
//  that matters is not the money. It is the ownership line, and the player
//  should have to look at it.
// ============================================================================

import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';

import { theme } from '../../../core/theme';
import { t, useLocale } from '../../../core/i18n';
import { formatMoney, formatPrice } from '../../../core/utils';
import { IPO_MIN_VALUATION, quoteIpo, IPO_DISCOUNT } from '../../../core/market/equity';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useShareholderStore } from '../../../features/shareholders/stores/useShareholderStore';
import { useEquityStore } from '../../../features/finance/stores/useEquityStore';

type Props = {
    visible: boolean;
    onClose: () => void;
};

/** The float sold at listing. Twenty per cent, and not the player's to choose. */
const FLOAT = 0.20;

type Row = { label: string; value: string; strong?: boolean; negative?: boolean };

const Figures = ({ rows }: { rows: Row[] }) => (
    <View style={styles.table}>
        {rows.map(row => (
            <View key={row.label} style={[styles.row, row.strong && styles.rowStrong]}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={[
                    styles.rowValue,
                    row.strong && styles.rowValueStrong,
                    // The one place a signal colour is allowed: a cost is a
                    // loss. TEXT only, never a fill. See core/theme.ts rule 3.
                    row.negative && styles.rowValueNegative,
                ]}>{row.value}</Text>
            </View>
        ))}
    </View>
);

const IpoModal = ({ visible, onClose }: Props) => {
    useLocale();

    const companyValue = useStatsStore(s => s.companyValue);
    const ownership = useStatsStore(s => s.companyOwnership);
    const goPublic = useEquityStore(s => s.goPublic);

    const [done, setDone] = useState<null | {
        raised: number; fee: number; ownershipAfter: number;
    }>(null);
    const [failure, setFailure] = useState<string | null>(null);

    // ------------------------------------------------------------------
    //  QUOTED ON EVERY RENDER, DELIBERATELY NOT MEMOISED
    // ------------------------------------------------------------------
    //  The first version wrapped this in a `useMemo` keyed on the valuation
    //  and on `visible`, and lint was right to object: `visible` is not read
    //  by the calculation, it was in the list to force a re-quote on reopen.
    //
    //  Which is the tell. The cap table moves between visits - an
    //  acquisition seats a director and issues him stock - so a memo would
    //  have to list a dependency it does not use in order to be correct.
    //  `quoteIpo` is arithmetic on three numbers; memoising it buys nothing
    //  and costs the one thing that matters here, which is being right.
    // ------------------------------------------------------------------
    const cap = useShareholderStore();
    const quote = quoteIpo(companyValue, cap.totalShares, cap.playerShareCount, FLOAT);

    const ready = companyValue >= IPO_MIN_VALUATION;

    const close = () => {
        // Reset, so reopening does not show the last run's receipt.
        setDone(null);
        setFailure(null);
        onClose();
    };

    const confirm = () => {
        const result = goPublic(
            companyValue,
            amount => {
                const capital = useStatsStore.getState().companyCapital;
                useStatsStore.getState().update({ companyCapital: capital + amount });
            },
            FLOAT,
        );

        if (result.error) { setFailure(result.error); return; }

        useStatsStore.getState().update({
            companyOwnership: result.newOwnershipPercent,
            isPublic: true,
        });
        setDone({
            raised: result.cashRaised,
            fee: result.fee,
            ownershipAfter: result.newOwnershipPercent,
        });
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
            <View style={styles.overlay}>
                <View style={styles.centred}>
                    <View style={styles.card}>
                        {/* ------------------------------------------------
                            1. NOT READY
                           ------------------------------------------------ */}
                        {!ready && !done && (
                            <>
                                <Text style={styles.title}>{t('alert.notReadyToList')}</Text>
                                <Text style={styles.subtitle}>
                                    Underwriters will not take a company public at this valuation.
                                </Text>
                                <Figures rows={[
                                    { label: 'They need', value: formatMoney(IPO_MIN_VALUATION) },
                                    { label: 'You are at', value: formatMoney(companyValue), strong: true },
                                ]} />
                                <Text style={styles.note}>
                                    Grow revenue and profit first. The multiple follows.
                                </Text>
                                <Pressable style={styles.primary} onPress={close}>
                                    <Text style={styles.primaryText}>UNDERSTOOD</Text>
                                </Pressable>
                            </>
                        )}

                        {/* ------------------------------------------------
                            2. THE OFFER
                           ------------------------------------------------ */}
                        {ready && !done && (
                            <>
                                <Text style={styles.title}>{t('alert.launchIpo')}</Text>
                                <Text style={styles.subtitle}>
                                    {`Selling ${Math.round(FLOAT * 100)}% of the company to public investors.`}
                                </Text>

                                <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                                    <Figures rows={[
                                        { label: 'Fair value per share', value: formatPrice(quote.fairPrice) },
                                        {
                                            label: `Offer price (${Math.round(IPO_DISCOUNT * 100)}% under)`,
                                            value: formatPrice(quote.offerPrice),
                                        },
                                        { label: 'Gross proceeds', value: formatMoney(quote.grossProceeds) },
                                        {
                                            label: 'Underwriting fee',
                                            value: `-${formatMoney(quote.underwritingFee)}`,
                                            negative: true,
                                        },
                                        {
                                            label: 'Net to the company',
                                            value: formatMoney(quote.netProceeds),
                                            strong: true,
                                        },
                                        {
                                            label: 'Your ownership',
                                            value: `${(ownership ?? 0).toFixed(1)}% to ${quote.playerOwnershipAfter.toFixed(1)}%`,
                                        },
                                    ]} />

                                    <Text style={styles.note}>
                                        {`Shares are priced below fair value on purpose so the book fills. That ${formatMoney(quote.moneyLeftOnTable)} is the cost of listing.\n\nOnce public your multiples rise, and the market reprices you every quarter.`}
                                    </Text>

                                    {!!failure && (
                                        <View style={styles.failure}>
                                            <Text style={styles.failureText}>{failure}</Text>
                                        </View>
                                    )}
                                </ScrollView>

                                <View style={styles.buttons}>
                                    <Pressable style={styles.secondary} onPress={close}>
                                        <Text style={styles.secondaryText}>{t('company.notYet')}</Text>
                                    </Pressable>
                                    <Pressable style={styles.primaryWide} onPress={confirm}>
                                        <Text style={styles.primaryText}>{t('company.launchIpo')}</Text>
                                    </Pressable>
                                </View>
                            </>
                        )}

                        {/* ------------------------------------------------
                            3. DONE
                           ------------------------------------------------
                            A step rather than a toast, because the number
                            that matters is not the money. It is the
                            ownership line, and the player should have to
                            look at it.
                           ------------------------------------------------ */}
                        {!!done && (
                            <>
                                <Text style={styles.title}>{t('alert.ipoComplete')}</Text>
                                <Text style={styles.subtitle}>
                                    You are a public company. Every quarter is a scorecard now.
                                </Text>
                                <Figures rows={[
                                    { label: 'Raised', value: formatMoney(done.raised) },
                                    { label: 'Fees', value: `-${formatMoney(done.fee)}`, negative: true },
                                    {
                                        label: 'Your ownership',
                                        value: `${done.ownershipAfter.toFixed(1)}%`,
                                        strong: true,
                                    },
                                ]} />
                                <Text style={styles.note}>
                                    The register is public from today. So is every figure you
                                    were previously the only person to see.
                                </Text>
                                <Pressable style={styles.primary} onPress={close}>
                                    <Text style={styles.primaryText}>DONE</Text>
                                </Pressable>
                            </>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(28,36,44,0.88)',
    },
    centred: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: theme.colors.surfaceRaised,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 420,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
    },
    title: {
        fontSize: 21,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        lineHeight: 19,
        color: theme.colors.textMuted,
        marginBottom: 16,
    },
    body: {
        maxHeight: 340,
    },
    table: {
        marginBottom: 14,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingVertical: 9,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
    },
    rowStrong: {
        borderBottomWidth: 0,
        marginTop: 2,
    },
    rowLabel: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        flexShrink: 1,
        paddingRight: 12,
    },
    rowValue: {
        fontSize: 14,
        color: theme.colors.textPrimary,
        textAlign: 'right',
    },
    rowValueStrong: {
        fontSize: 16,
        fontWeight: '800',
    },
    rowValueNegative: {
        color: theme.colors.danger,
    },
    note: {
        fontSize: 12,
        lineHeight: 18,
        color: theme.colors.textMuted,
        marginBottom: 18,
    },
    failure: {
        backgroundColor: theme.colors.surface,
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },
    failureText: {
        // TEXT, on the dark surface. The loss colour is never a fill.
        color: theme.colors.danger,
        fontSize: 12,
        lineHeight: 18,
    },
    buttons: {
        flexDirection: 'row',
        gap: 10,
    },
    primary: {
        backgroundColor: theme.colors.primary,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
    },
    primaryWide: {
        backgroundColor: theme.colors.primary,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        flex: 2,
    },
    primaryText: {
        // Black on the bright blue, which is what the theme says that fill
        // takes. Never white.
        color: theme.colors.primaryText,
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: 1,
    },
    secondary: {
        backgroundColor: theme.colors.surface,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        flex: 1,
    },
    secondaryText: {
        color: theme.colors.textSecondary,
        fontWeight: '700',
        fontSize: 14,
    },
});

export default IpoModal;
