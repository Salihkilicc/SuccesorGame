// src/features/os/components/RemoveAdsSheet.tsx
//
// ============================================================================
//  THE ONE PLACE REAL MONEY IS ASKED FOR, GIVEN A PAGE OF ITS OWN
// ============================================================================
//
//  Before this, the whole transaction was a button in a settings list. Pressing
//  it opened the store's payment sheet, which meant the first time anybody saw
//  the price was on the screen that takes it.
//
//  ---------------------------------------------------------------------------
//  WHY A SHEET AND NOT A FULL SCREEN PAYWALL
//  ---------------------------------------------------------------------------
//  This is one cheap non-consumable with one feature. A three page pitch would
//  make it feel larger than it is, and a purchase that feels oversold is one
//  people back out of. Subscriptions earn that treatment; this does not.
//
//  So: what you get in three lines, the price at the size of the decision, one
//  primary button, and the restore underneath where it belongs.
//
//  ---------------------------------------------------------------------------
//  ONE SHEET, EVERY DOOR
//  ---------------------------------------------------------------------------
//  Settings opens it today and the offer after an advertisement will open the
//  same component. Two pages saying the same thing is two pages to keep in
//  agreement, and the one that falls behind is always the one nobody opened
//  while testing.
//
//  ---------------------------------------------------------------------------
//  WHAT THIS IS NOT ALLOWED TO DECIDE
//  ---------------------------------------------------------------------------
//  Whether the player owns it. That is read from the store written by
//  billing.ts, which is written by RevenueCat. No second opinion lives here.
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import GameModal from '../../../components/common/GameModal';
import { adFreePrice, isBillingAvailable, purchaseAdFree, restorePurchases } from '../../../core/ads/billing';
import { t } from '../../../core/i18n';
import { useIdentityStore } from '../../../core/store/useIdentityStore';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../../../core/legal';
import { theme } from '../../../core/theme';

// ===========================================================================
//  THE TWO LINKS APP REVIEW LOOKS FOR
// ===========================================================================
//  Read from core/legal.ts rather than declared here. They are also shown in
//  Settings and carried in both store listings, and a URL written in four
//  places is three of them going stale when the hosting moves.
//
//  Still hidden while empty: a link that goes nowhere is worse than no link,
//  because it passes review and 404s for every real player.
// ===========================================================================

type Note = { key: string } | null;

/** What the money buys, in the order somebody cares about it. */
const BENEFIT_KEYS = ['ads.sheetBenefitOne', 'ads.sheetBenefitTwo', 'ads.sheetBenefitThree'] as const;

type Props = {
    visible: boolean;
    onClose: () => void;
};

const RemoveAdsSheet: React.FC<Props> = ({ visible, onClose }) => {
    const adFree = useIdentityStore(s => s.adFree);

    const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);
    const [note, setNote] = useState<Note>(null);
    const [price, setPrice] = useState<string | null>(null);

    // Asked when the sheet opens rather than on mount, because the sheet is
    // mounted by whatever screen owns it and may sit closed for a whole
    // session. billing.ts caches the answer, so opening it twice is one call.
    useEffect(() => {
        if (!visible) return;
        let alive = true;
        void adFreePrice().then(p => { if (alive) setPrice(p); });
        return () => { alive = false; };
    }, [visible]);

    const run = useCallback(async (which: 'buy' | 'restore') => {
        // A payment sheet takes a second to appear, which is long enough for
        // somebody to press again. Two purchase flows at once is the one bug
        // here that costs the player money rather than time.
        if (busy) return;

        setBusy(which);
        setNote(null);
        try {
            const result = which === 'buy' ? await purchaseAdFree() : await restorePurchases();

            if (result.ok) {
                setNote({ key: which === 'buy' ? 'ads.ownedNote' : 'ads.restored' });
                return;
            }
            // Backing out of the payment sheet says nothing at all. Telling
            // somebody their payment did not work when they decided not to pay
            // is both false and alarming, and it is the most common way this
            // button ends.
            if (result.reason === 'cancelled') return;

            setNote({
                key: result.reason === 'nothingToRestore' ? 'ads.nothingToRestore'
                    : result.reason === 'unavailable' ? 'ads.unavailable'
                        : 'ads.failed',
            });
        } finally {
            setBusy(null);
        }
    }, [busy]);

    const storeReady = isBillingAvailable();

    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title={adFree ? t('ads.owned') : t('ads.removeTitle')}
        >
            <View style={styles.body}>

                {!adFree && <Text style={styles.headline}>{t('ads.sheetHeadline')}</Text>}

                {adFree ? (
                    // Nothing is for sale here any more. The sheet still opens,
                    // because the restore control has to stay reachable: this
                    // device's copy of the flag can be wrong after a reinstall
                    // or a different store account, and this is the way back.
                    <Text style={styles.ownedNote}>{t('ads.ownedNote')}</Text>
                ) : (
                    <>
                        {BENEFIT_KEYS.map(key => (
                            <View key={key} style={styles.benefit}>
                                <MaterialCommunityIcons
                                    name="check"
                                    size={18}
                                    color={theme.colors.premium}
                                    style={styles.benefitIcon}
                                />
                                <Text style={styles.benefitText}>{t(key)}</Text>
                            </View>
                        ))}

                        {/* The price at the size of the decision. Absent until
                            the store answers, and absent stays absent: a zero
                            or a dash is a number somebody believes. */}
                        {!!price && (
                            <View style={styles.priceBlock}>
                                <Text style={styles.price}>{price}</Text>
                                {/* The word that does most of the selling. A
                                    one-off is the thing people are relieved to
                                    hear, because the default assumption in
                                    2026 is that everything renews. */}
                                <Text style={styles.priceNote}>{t('ads.sheetPriceNote')}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.buyButton, (!storeReady || !!busy) && styles.dim]}
                            onPress={() => { void run('buy'); }}
                            disabled={!storeReady || !!busy}
                            activeOpacity={0.85}
                        >
                            {busy === 'buy'
                                ? <ActivityIndicator size="small" color={theme.colors.premiumText} />
                                : (
                                    <>
                                        {/* The crown does the work the label
                                            cannot: it says "this is the paid
                                            one" before anybody reads a word. */}
                                        <MaterialCommunityIcons
                                            name="crown"
                                            size={20}
                                            color={theme.colors.premiumText}
                                            style={styles.buyIcon}
                                        />
                                        <Text style={styles.buyLabel}>{t('ads.buy')}</Text>
                                    </>
                                )}
                        </TouchableOpacity>
                    </>
                )}

                {/* ------------------------------------------------------------
                    A LINE OF TEXT, NOT A SECOND BUTTON
                    ------------------------------------------------------------
                    Apple rejects an app that sells a non-consumable without a
                    visible way to restore it, and quite rightly: without one, a
                    new phone means paying twice for the same thing. So it has
                    to be here.

                    But it is not the decision. Two buttons of similar weight
                    ask the reader to choose between them, and almost nobody
                    opening this sheet is here to restore: they are here to buy,
                    or they are here because they lost a purchase and know
                    exactly what they are looking for. A quiet line under the
                    button serves the second group without taxing the first.

                    `onPress` on the Text itself rather than a wrapper, so the
                    tap target is the words and nothing around them.
                   ------------------------------------------------------------ */}
                <Text
                    style={[styles.restoreLink, (!storeReady || !!busy) && styles.labelDim]}
                    onPress={() => { if (storeReady && !busy) void run('restore'); }}
                    suppressHighlighting
                >
                    {busy === 'restore' ? t('ads.restoring') : t('ads.restoreLine')}
                </Text>

                <Text style={styles.footNote}>
                    {note ? t(note.key) : !storeReady ? t('ads.unavailable') : t('ads.newGameSafe')}
                </Text>

                {/* Hidden until the URLs exist, rather than linking nowhere.
                    See the note at the top of this file. */}
                {(!!PRIVACY_POLICY_URL || !!TERMS_OF_USE_URL) && (
                    <View style={styles.legalRow}>
                        {!!PRIVACY_POLICY_URL && (
                            <Text
                                style={styles.legalLink}
                                onPress={() => { void Linking.openURL(PRIVACY_POLICY_URL); }}
                            >
                                {t('ads.sheetLegal')}
                            </Text>
                        )}
                        {!!PRIVACY_POLICY_URL && !!TERMS_OF_USE_URL && (
                            <Text style={styles.legalSeparator}>·</Text>
                        )}
                        {!!TERMS_OF_USE_URL && (
                            <Text
                                style={styles.legalLink}
                                onPress={() => { void Linking.openURL(TERMS_OF_USE_URL); }}
                            >
                                {t('ads.sheetTerms')}
                            </Text>
                        )}
                    </View>
                )}
            </View>
        </GameModal>
    );
};

const styles = StyleSheet.create({
    body: {
        // ------------------------------------------------------------------
        //  A RUNG UP THE LADDER, NOT A WHITE SHEET
        // ------------------------------------------------------------------
        //  Asked for as "lighter". Taken literally that means black text
        //  everywhere and a paywall that looks like a different application,
        //  so instead this is the palette's own next step above `surface`.
        //
        //  The first version of this line was a hand-picked #3E474E and the
        //  colour audit in scripts/reachability.js reported it immediately:
        //  an off-palette hex is how a theme becomes eighty seven shades, and
        //  this project has already cleaned that up once.
        //
        //  `surfaceRaised` is lighter than the invented tone anyway, so the
        //  request is better served by the thing that was already there.
        // ------------------------------------------------------------------
        backgroundColor: theme.colors.surfaceRaised,
        borderRadius: theme.radius.lg,
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.md,
    },
    headline: {
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 24,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.md,
    },
    benefit: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.sm,
    },
    benefitIcon: {
        marginRight: theme.spacing.sm,
        marginTop: 1,
    },
    benefitText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.textSecondary,
    },
    priceBlock: {
        alignItems: 'center',
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    price: {
        fontSize: 34,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    priceNote: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.6,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    // A light fill, so the label on it is black. See theme.colors.primaryText.
    buyButton: {
        flexDirection: 'row',
        backgroundColor: theme.colors.premium,
        borderRadius: theme.radius.md,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.xs,
    },
    buyLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.premiumText,
    },
    buyIcon: {
        marginRight: theme.spacing.sm,
    },
    dim: { opacity: 0.45 },
    ownedNote: {
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    restoreLink: {
        // ------------------------------------------------------------------
        //  THE SHAPE EVERY GAME USES, AND IT IS THE RIGHT ONE
        // ------------------------------------------------------------------
        //  Small, one sentence, pressed against the button. It is there for
        //  the person on a new phone who already knows what they are looking
        //  for, and it should cost the person who is buying nothing at all -
        //  not a second of attention, not a line of visual weight.
        //
        //  A SENTENCE RATHER THAN A LABEL. "Restore purchases" is a command
        //  aimed at somebody who already understands the concept; "Already
        //  bought it? Restore" explains itself to somebody who does not, in
        //  the same space.
        // ------------------------------------------------------------------
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
        color: theme.colors.textMuted,
        textDecorationLine: 'underline',
        paddingTop: 6,
        paddingBottom: 2,
    },
    labelDim: { color: theme.colors.textMuted },
    footNote: {
        fontSize: 12,
        lineHeight: 16,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginTop: theme.spacing.md,
    },
    legalRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
    },
    legalLink: {
        fontSize: 11,
        color: theme.colors.textMuted,
        textDecorationLine: 'underline',
    },
    legalSeparator: {
        fontSize: 11,
        color: theme.colors.textMuted,
        marginHorizontal: 6,
    },
});

export default RemoveAdsSheet;
