// src/features/os/screens/ComposeOfferScreen.tsx
//
// ============================================================================
//  THE COMPOSE BUTTON THAT WAS ALREADY THERE
// ============================================================================
//
//  MailScreen has shipped a Compose button since before any of this, wired to
//  `onPress={() => {}}`. A control drawn, styled, given an icon and a label,
//  and connected to nothing - the player presses it and the app does not even
//  flicker. This screen is what it was always pointing at.
//
//  ---------------------------------------------------------------------------
//  TWO CHOICES AND NO TEXT BOX
//  ---------------------------------------------------------------------------
//  The shelved NegotiationModal asked the player to type a number into a
//  TextInput ("e.g. 52.5", in billions) and then judged it against a hidden
//  asking price. That is a guessing game wearing a spreadsheet's clothes.
//
//  Here the two decisions are WHO and HOW, both of them lists, both of them
//  legible. The price is not something the player invents - it comes back in
//  the reply, from a person, which is the entire point of making them wait a
//  quarter for it.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../../core/theme';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { useNegotiationStore } from '../../../core/store/useNegotiationStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useStoryStore } from '../../../core/store/useStoryStore';
import { currentQuarter } from '../../../core/story/world';
import { SUBJECTS, type Subject } from '../../../core/market/negotiation';
import { INITIAL_MARKET_ITEMS } from '../../assets/data/marketData';
import { formatMoney } from '../../../core/utils';
import { FRIENDLY_LOCK_MARKET_CAP } from '../../../core/market/reach';

const SUBJECT_LABEL: Record<Subject, string> = {
    purchase: 'Offer to acquire',
    merger: 'Proposal, merger of equals',
    partnership: 'Commercial partnership',
    notice: 'Notice of intent',
};

// Stated plainly, because the subject is a real mechanic and a player who
// cannot see what it does will pick the first one forever.
const SUBJECT_NOTE: Record<Subject, string> = {
    purchase: 'Says what it is. Some boards prefer that.',
    merger: 'Flattery. It works on some people and insults the ones who can do arithmetic.',
    partnership: 'The slow route. Softens the hardest boards, and never gets you a plain yes.',
    notice: 'You tell them you are coming. The only letter a board that already refused you will read.',
};

/**
 * The bands the market is folded into, largest first.
 *
 * The top boundary is FRIENDLY_LOCK_MARKET_CAP rather than a round number
 * chosen for this screen: it is the same line the acquisition screen locks its
 * Friendly button on, so "the ones you have to write to" is one fact stated in
 * two places rather than two facts that will drift apart.
 */
const BANDS = [
    {
        id: 'locked',
        title: 'Letters only',
        note: 'Too big to buy over the counter. This is the only way in.',
        min: FRIENDLY_LOCK_MARKET_CAP,
        max: Infinity,
    },
    { id: 'large', title: 'Large', note: 'Serious companies. They will want something.', min: 10_000_000_000, max: FRIENDLY_LOCK_MARKET_CAP },
    { id: 'mid', title: 'Mid-market', note: 'Big enough to have a board with opinions.', min: 1_000_000_000, max: 10_000_000_000 },
    { id: 'small', title: 'Small', note: 'Most of these can simply be bought.', min: 0, max: 1_000_000_000 },
];

const ComposeOfferScreen = () => {
    const navigation = useNavigation<any>();
    const send = useNegotiationStore(s => s.send);
    const offers = useNegotiationStore(s => s.offers);
    const closedForever = useNegotiationStore(s => s.closedForever);
    const valuation = useStatsStore(s => s.companyValue ?? 0);

    const [targetId, setTargetId] = useState<string | undefined>();
    const [subject, setSubject] = useState<Subject>('purchase');

    // The list is the MARKET, not a hand-written roster. data/AcquisitionData
    // has its own list of companies that the acquisition screen has never
    // read - see the note in marketData.ts - and a second one here would be
    // the third.
    const targets = useMemo(
        () => (INITIAL_MARKET_ITEMS as any[])
            .filter(i => i.marketCap > 0 && !i.isAcquired)
            .sort((a, b) => a.marketCap - b.marketCap),
        [],
    );

    const target = targets.find(t => t.id === targetId);
    const waiting = offers.filter(o => o.status === 'sent');

    // ------------------------------------------------------------------
    //  FIFTY-NINE COMPANIES IN ONE FLAT LIST
    // ------------------------------------------------------------------
    //  Every one of them was a card, in one column, sorted by size - so
    //  choosing the subject line meant scrolling past the entire stock market
    //  first, and choosing a big company meant scrolling past it twice.
    //
    //  Bands, collapsed, one open at a time. The top band is the one the
    //  whole screen exists for: the companies that cannot be bought over the
    //  counter at all, which is where a player who came here from a locked
    //  button is heading. See core/market/reach.ts.
    //
    //  And once somebody is chosen the list folds away entirely, because the
    //  question has been answered and the rest of the market is no longer a
    //  decision - it is scenery between the player and the send button.
    // ------------------------------------------------------------------
    const [openBand, setOpenBand] = useState<string | undefined>(BANDS[0].id);

    const banded = useMemo(() => BANDS.map(band => ({
        band,
        items: targets.filter(t =>
            t.marketCap >= band.min && t.marketCap < band.max),
    })).filter(g => g.items.length > 0), [targets]);

    const onSend = () => {
        if (!target) return;
        const result = send({
            targetId: target.id,
            targetName: target.name,
            subject,
            marketCap: target.marketCap,
            risk: target.risk ?? 'Medium',
            acquirerValuation: valuation,
            quarter: currentQuarter(),
            // A board with a fiduciary duty does not recommend a sale to a
            // chief executive who has been found guilty. See
            // CONVICTION_RESISTANCE in core/market/negotiation.ts.
            convicted: !!useStoryStore.getState().flags.fbiGuilty,
        });
        if (!result.ok) {
            Alert.alert('Not sent', result.reason);
            return;
        }
        Alert.alert(
            'Sent',
            `Your letter has gone to ${target.name}. A board does not answer the same week — expect a reply next quarter.`,
            [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
    };

    return (
        <View style={styles.root}>
            <ScreenHeader title="New offer" subtitle="Compose" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: NAV_BAR_CLEARANCE }}>
                {waiting.length > 0 && (
                    <View style={styles.waitingCard}>
                        <Text style={styles.waitingText}>
                            Waiting on {waiting.map(o => o.targetName).join(', ')}.
                        </Text>
                    </View>
                )}

                <Text style={styles.label}>TO</Text>

                {target ? (
                    // Chosen. One row and a way to change your mind.
                    <Pressable
                        onPress={() => setTargetId(undefined)}
                        style={[styles.row, styles.rowSelected]}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowTitle}>{target.name}</Text>
                            <Text style={styles.rowNote}>
                                {formatMoney(target.marketCap)} · {target.risk ?? 'Medium'} risk
                            </Text>
                        </View>
                        <Text style={styles.change}>Change</Text>
                    </Pressable>
                ) : banded.map(({ band, items }) => {
                    const open = openBand === band.id;
                    return (
                        <View key={band.id}>
                            <Pressable
                                onPress={() => setOpenBand(open ? undefined : band.id)}
                                style={[styles.band, open && styles.bandOpen]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.bandTitle}>{band.title}</Text>
                                    <Text style={styles.bandNote}>{band.note}</Text>
                                </View>
                                <Text style={styles.bandCount}>
                                    {items.length}  {open ? '\u2303' : '\u2304'}
                                </Text>
                            </Pressable>

                            {open && items.map(t => {
                                const shut = !!closedForever[t.id];
                                const pending = offers.some(
                                    o => o.targetId === t.id && o.status !== 'closed');
                                return (
                                    <Pressable
                                        key={t.id}
                                        disabled={shut || pending}
                                        onPress={() => setTargetId(t.id)}
                                        style={[
                                            styles.row,
                                            styles.rowInBand,
                                            (shut || pending) && styles.rowDisabled,
                                        ]}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.rowTitle}>{t.name}</Text>
                                            <Text style={styles.rowNote}>
                                                {formatMoney(t.marketCap)} · {t.risk ?? 'Medium'} risk
                                                {shut ? ' · they asked you not to write again' : ''}
                                                {pending && !shut ? ' · awaiting their reply' : ''}
                                            </Text>
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </View>
                    );
                })}

                <Text style={[styles.label, { marginTop: 24 }]}>SUBJECT</Text>
                {SUBJECTS.map(s => {
                    const selected = s === subject;
                    return (
                        <Pressable
                            key={s}
                            onPress={() => setSubject(s)}
                            style={[styles.row, selected && styles.rowSelected]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.rowTitle, selected && styles.rowTitleSelected]}>
                                    {SUBJECT_LABEL[s]}
                                </Text>
                                <Text style={styles.rowNote}>{SUBJECT_NOTE[s]}</Text>
                            </View>
                        </Pressable>
                    );
                })}

                <Pressable
                    disabled={!target}
                    onPress={onSend}
                    style={[styles.send, !target && styles.sendDisabled]}>
                    <Text style={[styles.sendText, !target && styles.sendTextDisabled]}>
                        {target ? `Send to ${target.name}` : 'Choose a company'}
                    </Text>
                </Pressable>

                <Text style={styles.footnote}>
                    No price goes in this letter. You are asking whether they will talk, and
                    what they want is theirs to say.
                </Text>
            </ScrollView>
        </View>
    );
};

export default ComposeOfferScreen;

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    label: {
        color: theme.colors.textMuted,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 8,
    },
    waitingCard: {
        backgroundColor: theme.colors.surfaceRaised,
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    waitingText: { color: theme.colors.textSecondary, fontSize: 13 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    // Selection is a BORDER and a raised fill, never a coloured background
    // with pale text on it. `primary` and not `brand`: brand is a SIGNAL
    // token, text-only, and it means "this figure is brand value" - the audit
    // reports it as a fill because a colour that says one thing stops saying
    // it the moment a card is filled with it.
    rowSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.surfaceRaised,
    },
    rowDisabled: { opacity: 0.45 },
    /** Indented under its band, so the grouping is visible without a rule. */
    rowInBand: { marginLeft: theme.spacing.md },
    change: { color: theme.colors.guidance, fontSize: 13, fontWeight: '700' },
    band: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceRaised,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    bandOpen: { marginBottom: 8 },
    bandTitle: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '700' },
    bandNote: { color: theme.colors.textMuted, fontSize: 12, marginTop: 3 },
    bandCount: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '700' },
    rowTitle: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '600' },
    rowTitleSelected: { color: theme.colors.textPrimary },
    rowNote: { color: theme.colors.textMuted, fontSize: 12, marginTop: 3, lineHeight: 17 },
    send: {
        marginTop: 24,
        backgroundColor: theme.colors.primary,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    sendDisabled: { backgroundColor: theme.colors.surfaceRaised },
    // Dark text on the light primary fill.
    sendText: { color: theme.colors.onLight, fontSize: 15, fontWeight: '700' },
    // AND THE DISABLED CASE NEEDS ITS OWN. The audit measured the pair the
    // screen actually renders - `onLight` (black) on `surfaceRaised` (a dark
    // grey) - at 2.36, because the disabled style only replaced the fill and
    // left the text colour behind. A disabled control still has to be read.
    sendTextDisabled: { color: theme.colors.textMuted },
    footnote: {
        color: theme.colors.textMuted,
        fontSize: 12,
        lineHeight: 18,
        marginTop: 16,
        textAlign: 'center',
    },
});
