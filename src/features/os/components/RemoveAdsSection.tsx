// src/features/os/components/RemoveAdsSection.tsx
//
// ============================================================================
//  THE ONLY PLACE IN THE GAME WHERE REAL MONEY IS ASKED FOR
// ============================================================================
//
//  Two buttons. Both of them have to be here: Apple rejects an app that sells
//  a non-consumable without a visible way to restore it, and quite rightly -
//  without one, a new phone means paying twice for the same thing.
//
//  ---------------------------------------------------------------------------
//  WHAT THIS COMPONENT IS NOT ALLOWED TO DECIDE
//  ---------------------------------------------------------------------------
//  Whether the player owns it. It reads `adFree` from the store and nothing
//  else; the store is written by billing.ts, which is written by RevenueCat.
//  A screen that kept its own idea of the purchase would be a second answer to
//  a question that already has one, and the two would disagree on exactly the
//  paths nobody tests: a refund, a restore on a second device, an expiry.
//
//  ---------------------------------------------------------------------------
//  ON THE COLOURS
//  ---------------------------------------------------------------------------
//  The owned state is NOT green. Green and red in this game mean profit and
//  loss and nothing else, and a green tick here would be the third meaning of
//  a colour that is supposed to have one. It uses the primary blue, on a light
//  fill with black text, like every other affirmative control.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { adFreePrice, isBillingAvailable } from '../../../core/ads/billing';
import RemoveAdsSheet from './RemoveAdsSheet';
import { t } from '../../../core/i18n';
import { useIdentityStore } from '../../../core/store/useIdentityStore';
import { theme } from '../../../core/theme';

const RemoveAdsSection: React.FC = () => {
    // Subscribed rather than read once, so the row turns over the moment the
    // purchase lands without the screen needing to be left and reopened.
    const adFree = useIdentityStore(s => s.adFree);


    // ----------------------------------------------------------------------
    //  THE BUTTON SAID "BUY" AND NOT WHAT IT COST
    // ----------------------------------------------------------------------
    //  Until now the only way to find out the price was to press a button that
    //  takes money and read the sheet that appeared. That is a thing people do
    //  not do, and the ones who do it arrive at the payment sheet surprised,
    //  which is the worst possible moment to be surprised.
    //
    //  Null until the store answers, and null is left alone: the button keeps
    //  its plain label rather than showing a zero, a dash or a skeleton. A
    //  wrong price is worse than no price because somebody will believe it.
    // ----------------------------------------------------------------------
    const [price, setPrice] = useState<string | null>(null);

    // ----------------------------------------------------------------------
    //  THE ROW IS A DOOR NOW, NOT THE TRANSACTION
    // ----------------------------------------------------------------------
    //  It used to call purchaseAdFree directly, which meant the payment sheet
    //  was the first thing that mentioned a price. The row still shows the
    //  price so the decision can be made from the list, and the sheet is where
    //  it is explained and carried out.
    //
    //  One sheet, every door: the offer after an advertisement opens the same
    //  component, so there is never a second page to keep in agreement.
    // ----------------------------------------------------------------------
    const [sheetOpen, setSheetOpen] = useState(false);

    useEffect(() => {
        let alive = true;
        void adFreePrice().then(p => { if (alive) setPrice(p); });
        // The screen can be left while the store is still thinking.
        return () => { alive = false; };
    }, []);

    // ======================================================================
    //  THE TRANSACTION MOVED TO RemoveAdsSheet.tsx
    // ======================================================================
    //  `run`, `busy` and `note` used to live here and called purchaseAdFree
    //  and restorePurchases directly. They are not shelved in a comment block
    //  because they were not removed: they are in RemoveAdsSheet, in full,
    //  under the same names, and a commented copy here would be a second
    //  version of the purchase flow that nobody runs and nobody updates.
    //
    //  That is the exact failure this codebase keeps meeting - two lists, one
    //  truth - so the pointer is the record rather than the duplicate.
    // ======================================================================

    const storeReady = isBillingAvailable();

    return (
        <>
            <RemoveAdsSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />

            <Text style={styles.sectionTitle}>{t('ads.sectionTitle')}</Text>
            <View style={styles.group}>

                <View style={[styles.row, styles.rowFirst]}>
                    <View style={styles.rowLeft}>
                        <View style={styles.iconContainer}>
                            <MaterialCommunityIcons
                                // The crown, the same one on the button inside
                                // the sheet. One symbol for the paid thing,
                                // wherever it appears, so it is recognised
                                // before it is read.
                                name={adFree ? 'crown' : 'crown-outline'}
                                size={20}
                                color={theme.colors.premium}
                            />
                        </View>
                        <View style={styles.labelWrapper}>
                            <Text style={styles.rowLabel}>
                                {adFree ? t('ads.owned') : t('ads.removeTitle')}
                            </Text>
                            <Text style={styles.rowNote}>
                                {adFree ? t('ads.ownedNote') : t('ads.removeNote')}
                            </Text>
                        </View>
                    </View>

                    {!adFree && (
                        <TouchableOpacity
                            style={[styles.buyButton, !storeReady && styles.buttonDim]}
                            onPress={() => setSheetOpen(true)}
                            disabled={!storeReady}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buyLabel}>{price ?? t('ads.openSheet')}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* ------------------------------------------------------------
                    RESTORE STAYS VISIBLE AFTER THE PURCHASE

                    It looks redundant once somebody owns it, and it is not:
                    this device's copy of the flag can be wrong - a reinstall,
                    a cleared cache, a sign-in as a different store account -
                    and this button is the only way back from that.
                   ------------------------------------------------------------ */}
                <TouchableOpacity
                    style={[styles.row, styles.rowLast]}
                    onPress={() => setSheetOpen(true)}
                    disabled={!storeReady}
                    activeOpacity={0.7}
                >
                    <View style={styles.rowLeft}>
                        <View style={styles.iconContainer}>
                            <MaterialCommunityIcons
                                name="restore"
                                size={20}
                                color={theme.colors.primary}
                            />
                        </View>
                        <View style={styles.labelWrapper}>
                            <Text style={[styles.rowLabel, !storeReady && styles.labelDim]}>
                                {t('ads.restore')}
                            </Text>
                            <Text style={styles.rowNote}>{t('ads.restoreNote')}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            {/* The outcome of the last attempt, and the promise underneath. */}
            <Text style={styles.footNote}>
                {!storeReady ? t('ads.unavailable') : t('ads.newGameSafe')}
            </Text>
        </>
    );
};

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.textMuted,
        letterSpacing: 0.8,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
        marginLeft: theme.spacing.xs,
    },
    group: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        minHeight: 64,
    },
    rowFirst: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
    },
    rowLast: {},
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: theme.spacing.sm,
    },
    iconContainer: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5,168,246,0.12)',
        marginRight: theme.spacing.sm,
    },
    labelWrapper: { flex: 1 },
    rowLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    rowNote: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginTop: 2,
        lineHeight: 16,
    },
    labelDim: { color: theme.colors.textMuted },
    // A light fill, so the label on it is black. See theme.colors.primaryText.
    buyButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 9,
        minWidth: 104,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDim: { opacity: 0.45 },
    buyLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.colors.primaryText,
    },
    footNote: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.sm,
        marginLeft: theme.spacing.xs,
        lineHeight: 16,
    },
});

export default RemoveAdsSection;
