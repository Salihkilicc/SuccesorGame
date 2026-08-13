import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { theme, avatarTintFor } from '../../../core/theme';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { useMailStore, type Mail } from '../../../core/store/useMailStore';
import ConversationRunner from '../../../components/story/ConversationRunner';
import { conversationById } from '../../../data/story';
import { useNegotiationStore } from '../../../core/store/useNegotiationStore';
import { useStoryStore } from '../../../core/store/useStoryStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { HOSTILE_MULTIPLE } from '../../../core/market/mergers';
import { useSponsorshipStore } from '../../../core/store/useSponsorshipStore';
import { offerById } from '../../../core/market/sponsorship';
import { formatMoney } from '../../../core/utils';

const formatMonth = (m: number) => `M${m}`;

const getInitials = (name: string): string =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

// The tints and the hash live in core/theme.ts. This file used to carry its
// own copy of both, so a sender drawn one colour in the list could be drawn
// another the moment you opened the mail.

const MailDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const mailId = route.params?.mailId;

    const inbox = useMailStore(s => s.inbox);
    const deleteMail = useMailStore(s => s.deleteMail);
    const mail = inbox.find(m => m.id === mailId);

    const insets = useSafeAreaInsets();

    // ------------------------------------------------------------------
    //  HOOKS BEFORE THE EARLY RETURN
    // ------------------------------------------------------------------
    //  `if (!mail) return null` sits below, and the audit has a check named
    //  "Hooks called after an early return" for exactly this. Everything
    //  stateful has to be declared above it, even though the values are only
    //  used further down.
    // ------------------------------------------------------------------
    const [stage, setStage] = React.useState<'first' | 'second'>('first');
    const offers = useNegotiationStore(s => s.offers);
    const answerOffer = useNegotiationStore(s => s.answer);
    const withdrawOffer = useNegotiationStore(s => s.withdraw);
    const negotiation = offers.find(
        o => o.id === mail?.negotiationId && o.status === 'open',
    );
    const signSponsor = useSponsorshipStore(s => s.sign);
    const activeSponsor = useSponsorshipStore(s => s.active);
    // Only live while nothing is signed: a company sponsors one thing, and an
    // old letter in the inbox must not become a second one.
    const sponsorOffer = !activeSponsor && mail?.sponsorOfferId
        ? offerById(mail.sponsorOfferId)
        : undefined;

    if (!mail) return null;

    const demand = negotiation?.reply?.kind === 'demand'
        ? negotiation.reply.demand
        : undefined;

    // The button says what it costs. "Accept" would be a word; this is a
    // number the player can weigh against the one in the letter.
    const meetLabel =
        !demand ? 'Agree.'
            : demand.kind === 'price'
                ? `Pay it — ${Math.round(demand.extraPremium * 100)}% over the usual premium.`
                : demand.kind === 'seat' ? 'Give them the seat.'
                    : demand.kind === 'reputation' ? 'Accept the condition.'
                        : 'Agree.';

    // Flat, and the same figure the acquisition screen prints and the engine
    // charges. The resistance curve is shelved - see HOSTILE_MULTIPLE in
    // core/market/mergers.ts for why a price nobody can see is not a mechanic.
    const hostileLabel = `${HOSTILE_MULTIPLE}x market`;

    const onMeet = () => {
        if (!negotiation) return;
        const result = answerOffer(negotiation.id, true, {
            publicReputation: useStoryStore.getState().dials.publicReputation,
            capital: useStatsStore.getState().companyCapital ?? 0,
            price: 0,
        });
        if (!result.ok) {
            // The reputation floor, almost always. They have not gone away -
            // the letter stays open and the player can come back once their
            // standing is where the board asked for it.
            Alert.alert('Not yet', result.reason ?? 'You cannot meet that today.');
            return;
        }
        if (result.counter) {
            // Their one comeback. Okonjo raising the number because you said
            // yes too fast, or Køhl splitting the difference because you said
            // no. Back to the first pair of buttons, once.
            setStage('first');
            Alert.alert('They have come back to you', 'The terms have changed. Read it again.');
            return;
        }

        // ------------------------------------------------------------------
        //  AND NOW YOU ACTUALLY BUY IT
        // ------------------------------------------------------------------
        //  This was `navigation.goBack()` and nothing else. A player wrote a
        //  letter, waited a quarter, read the reply, met the condition - and
        //  was returned to their inbox owning exactly what they owned before.
        //  Every exit from this screen was a navigation call.
        //
        //  The acquisition screen owns financing, the cash check and the board
        //  vote, and it is the only door into executeAcquisition. So the
        //  agreed terms are handed to it rather than a second door being cut -
        //  which is how the shelved NegotiationModal ended up moving money the
        //  engine never saw.
        // ------------------------------------------------------------------
        if (result.agreed) {
            navigation.navigate('HostileTakeover', {
                acquire: {
                    targetId: result.agreed.targetId,
                    premiumRatio: result.agreed.premiumRatio,
                    seat: result.agreed.seat,
                    hostile: false,
                },
            });
            return;
        }
        navigation.goBack();
    };

    const onWithdraw = () => {
        if (!negotiation) return;
        answerOffer(negotiation.id, false, {
            publicReputation: useStoryStore.getState().dials.publicReputation,
            capital: useStatsStore.getState().companyCapital ?? 0,
            price: 0,
        });
        withdrawOffer(negotiation.id);
        navigation.goBack();
    };

    const onHostile = () => {
        if (!negotiation) return;
        Alert.alert(
            'Tender to their shareholders',
            `You would go over the board's head at ${hostileLabel} — no negotiation, and you pay for that. Their people stay, and they will remember which of you they work for.`,
            [
                { text: 'Not yet', style: 'cancel' },
                {
                    text: 'Do it',
                    onPress: () => {
                        withdrawOffer(negotiation.id);
                        // The bid itself is placed on the acquisition screen,
                        // which owns financing, the cash check and the board
                        // vote. Two doors into executeAcquisition is how the
                        // last negotiation screen ended up moving money the
                        // engine never saw - see the note in NegotiationModal.
                        //
                        // IT USED TO NAVIGATE TO 'Assets' WITH `hostileFor`,
                        // and nothing anywhere read that param - Assets is the
                        // tab, and the acquisition screen is 'HostileTakeover'
                        // on the root stack. So the rudest, most expensive
                        // decision in the game dropped the player on a list.
                        navigation.navigate('HostileTakeover', {
                            acquire: {
                                targetId: negotiation.targetId,
                                hostile: true,
                            },
                        });
                    },
                },
            ],
        );
    };

    // A letter that branches plays in the same runner as a message; only the
    // presentation differs. See components/story/ConversationRunner.
    const conversation = mail.conversationId
        ? conversationById(mail.conversationId)
        : undefined;

    if (conversation) {
        return (
            <View style={styles.root}>
                <ScreenHeader title={mail.fromName} subtitle={mail.subject} onBack={() => navigation.goBack()} />
                <ConversationRunner
                    conversation={conversation}
                    variant="mail"
                    onFinished={() => navigation.goBack()}
                />
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <ScreenHeader
                title={mail.fromName}
                subtitle="Mail"
                onBack={() => navigation.goBack()}
            />

            <ScrollView contentContainerStyle={[styles.detailContent, { paddingBottom: NAV_BAR_CLEARANCE }]}>
                {/* Subject */}
                <View style={styles.subjectRow}>
                    <Text style={styles.detailSubject}>{mail.subject}</Text>
                    <View style={styles.inboxBadge}>
                        <Text style={styles.inboxBadgeText}>Inbox</Text>
                    </View>
                </View>

                {/* Sender Info */}
                <View style={styles.senderSection}>
                    <View style={[styles.avatar, { backgroundColor: avatarTintFor(mail.fromName) }]}>
                        <Text style={styles.avatarText}>{getInitials(mail.fromName)}</Text>
                    </View>
                    <View style={styles.senderInfo}>
                        <View style={styles.senderNameRow}>
                            <Text style={styles.detailFromName}>{mail.fromName}</Text>
                            <Text style={styles.detailTime}>{formatMonth(mail.atMonth)}</Text>
                        </View>
                        <Text style={styles.detailToMe}>to me ▾</Text>
                    </View>
                </View>

                {/* Body */}
                <View style={styles.bodySection}>
                    <Text style={styles.bodyText}>{mail.body}</Text>
                </View>
                
                {/* ==========================================================
                    THE TWO OPTIONS
                    ==========================================================
                    Exactly two, and the second one always leads to a second
                    pair rather than doing anything - the same discipline the
                    story graph enforces on every card in the game (see the
                    two-choice limit in core/story/graph.ts). A negotiation
                    screen with five buttons is a menu; two is a decision.

                    They appear only on a letter that is genuinely waiting on
                    an answer. A refusal arrives closed, so it has no buttons -
                    which is how the player learns that "no" was not an opening
                    position. */}
                {negotiation && (
                    <View style={styles.negotiationBox}>
                        <Text style={styles.negotiationLabel}>THEY ARE WAITING ON YOU</Text>
                        {stage === 'first' ? (
                            <>
                                <Pressable style={styles.optionPrimary} onPress={onMeet}>
                                    <Text style={styles.optionPrimaryText}>{meetLabel}</Text>
                                </Pressable>
                                <Pressable style={styles.option} onPress={() => setStage('second')}>
                                    <Text style={styles.optionText}>No.</Text>
                                </Pressable>
                            </>
                        ) : (
                            <>
                                <Pressable style={styles.option} onPress={onWithdraw}>
                                    <Text style={styles.optionText}>Withdraw the offer.</Text>
                                </Pressable>
                                <Pressable style={styles.optionDanger} onPress={onHostile}>
                                    <Text style={styles.optionDangerText}>
                                        Go to their shareholders — {hostileLabel}
                                    </Text>
                                </Pressable>
                            </>
                        )}
                    </View>
                )}

                {/* The sponsorship letter's two answers. Signing replaces
                    nothing, because there is nothing signed - the offer is
                    only live while the company's name is on nothing. */}
                {sponsorOffer && (
                    <View style={styles.negotiationBox}>
                        <Text style={styles.negotiationLabel}>THEY ARE WAITING ON YOU</Text>
                        <Pressable
                            style={styles.optionPrimary}
                            onPress={() => {
                                signSponsor(sponsorOffer.id);
                                navigation.goBack();
                            }}>
                            <Text style={styles.optionPrimaryText}>
                                Sign it — {formatMoney(sponsorOffer.quarterlyCost)} a quarter
                            </Text>
                        </Pressable>
                        <Pressable style={styles.option} onPress={() => navigation.goBack()}>
                            <Text style={styles.optionText}>Not this one.</Text>
                        </Pressable>
                    </View>
                )}

                {/* Reply Actions */}
                <View style={styles.replyActionRow}>
                    <View style={styles.replyBtn}>
                        <MaterialCommunityIcons name="reply" size={20} color={theme.colors.textSecondary} />
                        <Text style={styles.replyBtnText}>Reply</Text>
                    </View>
                    <View style={styles.replyBtn}>
                        <MaterialCommunityIcons name="reply-all" size={20} color={theme.colors.textSecondary} />
                        <Text style={styles.replyBtnText}>Reply all</Text>
                    </View>
                    <View style={styles.replyBtn}>
                        <MaterialCommunityIcons name="share" size={20} color={theme.colors.textSecondary} />
                        <Text style={styles.replyBtnText}>Forward</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default MailDetailScreen;

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    
    detailContent: { padding: theme.spacing.lg },
    
    subjectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    detailSubject: { color: theme.colors.textPrimary, fontSize: 22, flex: 1, marginRight: 16, lineHeight: 28 },
    inboxBadge: { backgroundColor: theme.colors.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    inboxBadgeText: { color: theme.colors.textMuted, fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold' },
    
    senderSection: { flexDirection: 'row', marginBottom: 24 },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Black - every tint is a light fill. See MailScreen for the numbers.
    avatarText: { color: theme.colors.onLight, fontWeight: '600', fontSize: 16 },
    senderInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    senderNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    detailFromName: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '700' },
    detailTime: { color: theme.colors.textMuted, fontSize: 12 },
    detailToMe: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
    
    bodySection: { marginBottom: 32 },
    bodyText: { color: theme.colors.textPrimary, fontSize: 15, lineHeight: 24 },
    
    replyActionRow: { flexDirection: 'row', gap: 12 },
    replyBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: theme.colors.surfaceRaised, 
        paddingHorizontal: 16, 
        paddingVertical: 10, 
        borderRadius: 20, 
        gap: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    replyBtnText: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '600' },

    negotiationBox: {
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 10,
    },
    negotiationLabel: {
        color: theme.colors.textMuted,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
    option: {
        backgroundColor: theme.colors.surfaceRaised,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    optionText: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '600' },
    optionPrimary: {
        // `primary`, not `brand`. See the note in ComposeOfferScreen: brand is
        // a text-only signal token meaning "this figure is brand value".
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    // Dark text on the light primary fill, never the reverse.
    optionPrimaryText: { color: theme.colors.onLight, fontSize: 14, fontWeight: '700' },
    optionDanger: {
        backgroundColor: theme.colors.surfaceRaised,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    // TEXT-ONLY signal. Danger is a colour on the words here and never a red
    // fill: red and green are reserved for profit and loss, and a red button
    // would read as a number going the wrong way.
    optionDangerText: { color: theme.colors.danger, fontSize: 14, fontWeight: '700' },
});
