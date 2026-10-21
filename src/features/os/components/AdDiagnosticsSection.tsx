// src/features/os/components/AdDiagnosticsSection.tsx
//
// ============================================================================
//  THE ANSWER TO "I PAID AND THE ADVERTISEMENTS ARE STILL THERE"
// ============================================================================
//
//  Behind the admin section, which is seven taps on the version line. A player
//  will not reach this by accident and nothing below is rendered until they do.
//
//  ---------------------------------------------------------------------------
//  WHY IT IS A SCREEN AND NOT A LOG
//  ---------------------------------------------------------------------------
//  Google Play Billing only works in an app installed from Play, which is a
//  release build, which has no console anybody can read. Every `console.log`
//  in core/ads is tied to __DEV__ and therefore silent in the one build where
//  a purchase can actually happen. The first time this mattered, the diagnosis
//  took the RevenueCat dashboard, an `adb dumpsys` and a guess.
//
//  This is the same information on the device, in the build that has it.
//
//  ---------------------------------------------------------------------------
//  WHAT EACH LINE ANSWERS
//  ---------------------------------------------------------------------------
//  Asked for / Held / Defined
//      Three lists side by side. If Asked for is missing from Defined, the
//      identifier in config.ts is wrong. If it is in Defined but not in Held,
//      the customer does not own it: either they have not bought it, or the
//      product is not attached to the entitlement in the dashboard.
//
//  Ad free
//      What the game itself believes, read from the store the gate reads. If
//      this is on and advertisements still appear, the fault is past the
//      purchase and everything above is a red herring.
//
//  Unit
//      Which advertising unit is being requested, and whether it is Google's
//      test one. A release build asking for the test unit earns nothing; a
//      development build asking for the live one risks the account.
// ============================================================================

import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { initBilling, isBillingAvailable } from '../../../core/ads/billing';
import { noteAdEvent, readDiagnostics } from '../../../core/ads/diagnostics';
import { adPacingSnapshot, hasAdPresenter } from '../../../core/ads/gate';
import { t } from '../../../core/i18n';
import { useIdentityStore } from '../../../core/store/useIdentityStore';
import { theme } from '../../../core/theme';

/**
 * The platform's monospaced face.
 *
 * Every value on this screen is an identifier or a list of them, and a
 * proportional font makes `ad_free` and `ad free` look the same at eleven
 * points. There is no font in the theme for this because nothing else in the
 * game needs one.
 */
const MONO = Platform.OS === 'android' ? 'monospace' : 'Menlo';

/** A label and its value on one line. Value is monospaced, so lists line up. */
const Line: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <View style={styles.line}>
        <Text style={styles.lineLabel}>{label}</Text>
        <Text style={styles.lineValue} selectable>{value}</Text>
    </View>
);

/** An empty list reads as nothing at all. This says so in words. */
const list = (names: string[]): string => (names.length ? names.join(', ') : t('ads.diagNone'));

/** Three states, not two: null means nobody has looked yet. */
const yesNo = (v: boolean | null): string =>
    v === null ? t('ads.diagUnknown') : v ? t('ads.diagYes') : t('ads.diagNo');

const AdDiagnosticsSection: React.FC = () => {
    const adFree = useIdentityStore(s => s.adFree);

    // Read on mount and on demand rather than subscribed. None of this is
    // reactive state; it is a snapshot of what already happened, and a live
    // subscription would re-render the settings screen on every ad event.
    const [snapshot, setSnapshot] = useState(() => readDiagnostics());
    const [pacing, setPacing] = useState(() => adPacingSnapshot());
    const [asking, setAsking] = useState(false);

    const refresh = useCallback(() => {
        setSnapshot(readDiagnostics());
        setPacing(adPacingSnapshot());
    }, []);

    /**
     * Ask RevenueCat again, right now.
     *
     * This is the button for the case that has already happened once: the
     * dashboard was wrong, it was fixed, and the app is still holding the old
     * answer. Entitlements are computed on RevenueCat's servers, so a fresh
     * `getCustomerInfo` picks up a product that was attached a minute ago
     * without the player having to buy anything a second time.
     */
    const askAgain = useCallback(async () => {
        if (asking) return;
        setAsking(true);
        try {
            await initBilling();
        } finally {
            setAsking(false);
            refresh();
        }
    }, [asking, refresh]);

    // ======================================================================
    //  TEMPORARY: TURN ADVERTISEMENTS BACK ON FOR TESTING
    // ======================================================================
    //  Asked for because there was no way to watch a live advertisement
    //  without a second Google account: the only device that can buy is the
    //  one that already has, and owning the product silences every trigger.
    //
    //  ONE WAY, AND THAT IS THE POINT. It can only set `adFree` to false.
    //  A button that could set it to TRUE would be the paid product, given
    //  away, behind seven taps that anybody can find by reading a forum post.
    //  So this one takes the purchase away locally and cannot hand it back.
    //
    //  NOT A REFUND AND NOT A CANCELLATION. RevenueCat and Google Play are
    //  untouched; only this device's mirror of the flag moves. The next cold
    //  start calls initBilling, the store answers truthfully, and the
    //  entitlement returns. Restore does the same thing immediately.
    //
    //  TO REMOVE: delete this callback, the button that calls it, and the two
    //  `ads.diagDropEntitlement*` strings. Nothing else references it.
    // ======================================================================
    const dropEntitlementForTesting = useCallback(() => {
        useIdentityStore.getState().applyEntitlement(false);
        noteAdEvent('entitlement dropped locally for testing');
        refresh();
    }, [refresh]);

    const seen = snapshot.lastSeenAt
        ? new Date(snapshot.lastSeenAt).toLocaleTimeString()
        : t('ads.diagNever');

    return (
        <>
            <Text style={styles.sectionTitle}>{t('ads.diagTitle')}</Text>
            <View style={styles.group}>

                {/* Only rendered when it has something to say. A warning that
                    is always there is furniture and stops being read. */}
                {snapshot.configMismatch !== null && (
                    <View style={styles.warning}>
                        <Text style={styles.warningTitle}>{t('ads.diagMismatchTitle')}</Text>
                        <Text style={styles.warningBody} selectable>{snapshot.configMismatch}</Text>
                    </View>
                )}

                <Line label={t('ads.diagLookingFor')} value={snapshot.lookingFor || t('ads.diagNever')} />
                <Line label={t('ads.diagHeld')} value={list(snapshot.activeEntitlements)} />
                <Line label={t('ads.diagDefined')} value={list(snapshot.knownEntitlements)} />
                <Line label={t('ads.diagLastAnswer')} value={`${snapshot.lastSource}  ${seen}`} />

                <View style={styles.divider} />

                <Line label={t('ads.diagAdFree')} value={yesNo(adFree)} />
                <Line label={t('ads.diagBillingSdk')} value={yesNo(snapshot.billingSdk)} />
                <Line label={t('ads.diagAdsSdk')} value={yesNo(snapshot.adsSdk)} />
                <Line label={t('ads.diagPresenter')} value={yesNo(hasAdPresenter())} />
                <Line label={t('ads.diagStoreReady')} value={yesNo(isBillingAvailable())} />

                <View style={styles.divider} />

                <Line
                    label={t('ads.diagUnit')}
                    value={snapshot.adUnit
                        ? `${snapshot.adUnit}  ${snapshot.usingTestUnit ? t('ads.diagTestUnit') : t('ads.diagLiveUnit')}`
                        : t('ads.diagNever')}
                />
                {/* Two fields, because `not-determined` alone is ambiguous:
                    it means either nobody has been asked yet, or the app asked
                    while iOS refused to present the alert and spent the only
                    chance. See tracking.ts. */}
                <Line
                    label={t('ads.diagTracking')}
                    value={snapshot.trackingStatus
                        ? `${snapshot.trackingStatus}  (${snapshot.trackingHow})`
                        : t('ads.diagNever')}
                />
                <Line label={t('ads.diagLastAdEvent')} value={snapshot.lastAdEvent} />
                {/* Quarters, date presses, casino taps and casino seconds
                    since the last ad from each trigger. Abbreviated because
                    the four together are what say whether the pacing is the
                    reason nothing appeared. */}
                <Line
                    label={t('ads.diagPacing')}
                    value={
                        `Q${pacing.quartersSinceAd}  ` +
                        `D${pacing.datePressesSinceAd}  ` +
                        `C${pacing.casinoTapsSinceAd}  ` +
                        `${Math.round(pacing.casinoMsSinceAd / 1000)}s`
                    }
                />
            </View>

            {/* The history, newest first. Selectable so it can be copied out
                rather than photographed and retyped. */}
            <View style={styles.logBox}>
                {snapshot.log.length === 0
                    ? <Text style={styles.logEmpty}>{t('ads.diagNoEvents')}</Text>
                    : snapshot.log.map((entry, i) => (
                        <Text key={`${i}-${entry}`} style={styles.logLine} selectable>{entry}</Text>
                    ))}
            </View>

            <View style={styles.buttons}>
                <TouchableOpacity style={styles.button} onPress={refresh} activeOpacity={0.8}>
                    <Text style={styles.buttonLabel}>{t('ads.diagRefresh')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, asking && styles.buttonDim]}
                    onPress={() => { void askAgain(); }}
                    disabled={asking}
                    activeOpacity={0.8}
                >
                    {asking
                        ? <ActivityIndicator size="small" color={theme.colors.primaryText} />
                        : <Text style={styles.buttonLabel}>{t('ads.diagAskStore')}</Text>}
                </TouchableOpacity>
            </View>

            {/* Only offered when there is something to drop. Shown as a note
                rather than a plain button, because pressing it makes the game
                behave as though the purchase is gone and that should not look
                like an ordinary control. */}
            {adFree && (
                <>
                    <TouchableOpacity
                        style={styles.dropButton}
                        onPress={dropEntitlementForTesting}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.dropLabel}>{t('ads.diagDropEntitlement')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.footNote}>{t('ads.diagDropEntitlementNote')}</Text>
                </>
            )}
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
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
    },
    line: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 5,
    },
    lineLabel: {
        fontSize: 12,
        color: theme.colors.textMuted,
        width: 116,
        paddingRight: theme.spacing.xs,
    },
    lineValue: {
        flex: 1,
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textPrimary,
        fontFamily: MONO,
    },
    // A light fill with dark text on it, using the palette's own token for
    // exactly that pairing rather than a hand-picked hex. Not red: red in this
    // game means a loss of money and nothing else, and this is a note about a
    // configuration file.
    warning: {
        backgroundColor: theme.colors.warning,
        borderRadius: theme.radius.md,
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    warningTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: theme.colors.primaryText,
        marginBottom: 2,
    },
    warningBody: {
        fontSize: 11,
        lineHeight: 15,
        color: theme.colors.primaryText,
        fontFamily: MONO,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.sm,
    },
    logBox: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginTop: theme.spacing.sm,
    },
    logLine: {
        fontSize: 11,
        lineHeight: 16,
        color: theme.colors.textSecondary,
        fontFamily: MONO,
    },
    logEmpty: {
        fontSize: 12,
        color: theme.colors.textMuted,
    },
    buttons: {
        flexDirection: 'row',
        marginTop: theme.spacing.sm,
    },
    // A light fill, so the label on it is black. See theme.colors.primaryText.
    button: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.md,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.sm,
    },
    buttonDim: { opacity: 0.45 },
    // A light fill with black text, like every other affirmative control in
    // the game. Not red: red here means a loss of money and nothing else.
    dropButton: {
        backgroundColor: theme.colors.warning,
        borderRadius: theme.radius.md,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.sm,
    },
    dropLabel: {
        fontSize: 13,
        fontWeight: '800',
        color: theme.colors.primaryText,
    },
    footNote: {
        fontSize: 11,
        lineHeight: 15,
        color: theme.colors.textMuted,
        marginTop: 6,
        marginLeft: theme.spacing.xs,
    },
    buttonLabel: {
        fontSize: 13,
        fontWeight: '800',
        color: theme.colors.primaryText,
    },
});

export default AdDiagnosticsSection;
