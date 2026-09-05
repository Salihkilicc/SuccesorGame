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
import Portrait from '../../../components/common/Portrait';
import { portraitFor } from '../../../core/portraits';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { useMailStore, type Mail } from '../../../core/store/useMailStore';
import ConversationRunner from '../../../components/story/ConversationRunner';
import { conversationById } from '../../../data/story';
import { useNegotiationStore } from '../../../core/store/useNegotiationStore';
import { useStoryStore } from '../../../core/store/useStoryStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { readStanding } from '../../../core/story/world';
import { HOSTILE_MULTIPLE } from '../../../core/market/mergers';
import { canAccept, priceFor } from '../../../core/market/negotiation';
import { useSponsorshipStore } from '../../../core/store/useSponsorshipStore';
import { offerById, sponsorPeak } from '../../../core/market/sponsorship';
import { formatMoney } from '../../../core/utils';
import AnimatedBubble from '../../../components/story/AnimatedBubble';
import { t, useLocale } from '../../../core/i18n';
import {
    translateSenderName,
    translateMailSubject,
    translateMailBody,
} from '../../../data/i18n/mailMessagesText';

const formatMonth = (m: number) => `M${m}`;

const getInitials = (name: string): string =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

// The tints and the hash live in core/theme.ts. This file used to carry its
// own copy of both, so a sender drawn one colour in the list could be drawn
// another the moment you opened the mail.

const MailDetailScreen = () => {
    useLocale();
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

    const displayFromName = translateSenderName(mail.fromName);
    const displaySubject = translateMailSubject(mail.subject, mail.conversationId);
    const displayBody = translateMailBody(mail.body, mail.conversationId);

    const demand = negotiation?.reply?.kind === 'demand'
        ? negotiation.reply.demand
        : undefined;

    // ------------------------------------------------------------------
    //  THE BUTTON SAYS WHAT IT COSTS, AND WHAT IT IS
    // ------------------------------------------------------------------
    //  "Accept" would be a word; a price demand shows the money. And a
    //  PARTNERSHIP is not a purchase - `canAccept` has said so since it was
    //  written, but the button said "Agree." for all four subjects, so a
    //  player who wrote about a commercial partnership and pressed it had no
    //  way to know they were not buying the company. (They were, until this
    //  commit. See the note in useNegotiationStore.answer.)
    // ------------------------------------------------------------------
    const owning = negotiation ? canAccept(negotiation.subject) : true;
    const price = negotiation && demand?.kind === 'price'
        ? priceFor(negotiation, demand.extraPremium) : undefined;

    const meetLabel =
        !demand ? t('mail.agree')
            : demand.kind === 'price'
                ? (price
                    ? t('mail.payPrice', { price: formatMoney(price) })
                    : t('mail.payPremium', { pct: String(Math.round(demand.extraPremium * 100)) }))
                : demand.kind === 'seat' ? t('mail.giveSeat')
                    : demand.kind === 'reputation' ? t('mail.improveStanding', { floor: String(demand.floor) })
                        : owning ? t('mail.agree') : t('mail.signPartnership');

    // Flat, and the same figure the acquisition screen prints and the engine
    // charges. The resistance curve is shelved - see HOSTILE_MULTIPLE in
    // core/market/mergers.ts for why a price nobody can see is not a mechanic.
    const hostileLabel = `${HOSTILE_MULTIPLE}x market`;

    const onMeet = () => {
        if (!negotiation) return;
        const result = answerOffer(negotiation.id, true, {
            // The dial plus what the player is worth, capped at 100. A board
            // asking for a reputable buyer counts the money too, and this is
            // the same figure the courtship reads - see core/story/standing.ts.
            publicReputation: readStanding(),
            capital: useStatsStore.getState().companyCapital ?? 0,
            price: 0,
        });
        if (!result.ok) {
            // The reputation floor or the money. They have not gone away -
            // the letter stays open and the player can come back once the
            // thing they are short of has changed.
            Alert.alert(
                negotiation.targetName,
                result.reason ?? 'You cannot meet that today.',
            );
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
        // A partnership or a notice of intent buys standing rather than a
        // company - `refusalsByTarget` goes down by one, which is what makes
        // the purchase letter easier next time. Said out loud, because an
        // unexplained return to the inbox reads as nothing having happened.
        if (!result.agreed && result.closed) {
            Alert.alert(
                negotiation.targetName,
                owning
                    ? t('mail.closed')
                    : t('mail.partnershipSignedAlert'),
                [{ text: 'OK', onPress: () => navigation.goBack() }],
            );
            return;
        }

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
            publicReputation: readStanding(),
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
                    text: t('mail.doIt'),
                    onPress: () => {
                        withdrawOffer(negotiation.id);
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
                <ScreenHeader title={displayFromName} subtitle={displaySubject} onBack={() => navigation.goBack()} />
                <ConversationRunner
                    conversation={conversation}
                    variant="mail"
                    // ------------------------------------------------------
                    //  CLOSE IT PROPERLY, THE WAY A THREAD IS CLOSED
                    // ------------------------------------------------------
                    //  This was `() => navigation.goBack()`, which left the
                    //  row playable and the scene's progress saved at its own
                    //  ending. Re-opening the letter then showed the last
                    //  exchange and a Close button, and so did the next copy
                    //  when a repeatable event delivered the scene again.
                    //  See useMailStore.closeConversation.
                    // ------------------------------------------------------
                    onFinished={(history) => {
                        useMailStore.getState().closeConversation(
                            mail.id,
                            history.map(h => ({ from: h.from, text: h.text })),
                        );
                        useStoryStore.getState().clearScene(conversation.id);
                        navigation.goBack();
                    }}
                />
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <ScreenHeader
                title={displayFromName}
                subtitle={t('mail.title')}
                onBack={() => navigation.goBack()}
            />

            <ScrollView contentContainerStyle={[styles.detailContent, { paddingBottom: NAV_BAR_CLEARANCE }]}>
                {/* Subject */}
                <AnimatedBubble delay={0}>
                    <View style={styles.subjectRow}>
                        <Text style={styles.detailSubject}>{displaySubject}</Text>
                        <View style={styles.inboxBadge}>
                            <Text style={styles.inboxBadgeText}>{t('mail.inbox')}</Text>
                        </View>
                    </View>
                </AnimatedBubble>

                {/* Sender Info */}
                <AnimatedBubble delay={50}>
                    <View style={styles.senderSection}>
                        {/* The sender, the same as in the list. A letter
                            from Facilities or a bank keeps its tinted
                            circle: fromId is absent for those on purpose.
                            The letters are BLACK on these light fills -
                            see MailScreen for the contrast numbers. */}
                        <Portrait
                            id={mail.fromId || mail.fromName}
                            name={mail.fromName}
                            size={44}
                            borderWidth={0}
                            fill={avatarTintFor(mail.fromName)}
                            initialsColour={theme.colors.onLight}
                            source={mail.fromId ? portraitFor(mail.fromId) as number | null : null}
                            style={styles.avatar}
                        />
                        <View style={styles.senderInfo}>
                            <View style={styles.senderNameRow}>
                                <Text style={styles.detailFromName}>{displayFromName}</Text>
                                <Text style={styles.detailTime}>{formatMonth(mail.atMonth)}</Text>
                            </View>
                            <Text style={styles.detailToMe}>{t('mail.toMe')}</Text>
                        </View>
                    </View>
                </AnimatedBubble>

                {/* Body */}
                <AnimatedBubble delay={100}>
                    <View style={styles.bodySection}>
                        <Text style={styles.bodyText}>{displayBody}</Text>
                    </View>
                </AnimatedBubble>
                
                {/* ==========================================================
                    THE TWO OPTIONS
                    ========================================================== */}
                {negotiation && (
                    <View style={styles.negotiationBox}>
                        <Text style={styles.negotiationLabel}>{t('mail.waitingOnYou')}</Text>
                        {stage === 'first' ? (
                            <>
                                <Pressable style={styles.optionPrimary} onPress={onMeet}>
                                    <Text style={styles.optionPrimaryText}>{meetLabel}</Text>
                                </Pressable>
                                <Pressable style={styles.option} onPress={() => setStage('second')}>
                                    <Text style={styles.optionText}>{t('mail.no')}</Text>
                                </Pressable>
                            </>
                        ) : (
                            <>
                                <Pressable style={styles.option} onPress={onWithdraw}>
                                    <Text style={styles.optionText}>{t('mail.withdrawTheOffer')}</Text>
                                </Pressable>
                                <Pressable style={styles.optionDanger} onPress={onHostile}>
                                    <Text style={styles.optionDangerText}>
                                        {t('mail.goToShareholders', { hostileLabel })}
                                    </Text>
                                </Pressable>
                            </>
                        )}
                    </View>
                )}

                {/* The sponsorship letter's two answers. */}
                {sponsorOffer && (
                    <View style={styles.negotiationBox}>
                        <Text style={styles.negotiationLabel}>{t('mail.waitingOnYou')}</Text>
                        <Pressable
                            style={styles.optionPrimary}
                            onPress={() => {
                                signSponsor(sponsorOffer.id);
                                navigation.goBack();
                            }}>
                            <Text style={styles.optionPrimaryText}>
                                {t('mail.signSponsor', { cost: formatMoney(sponsorOffer.quarterlyCost) })}
                            </Text>
                        </Pressable>
                        <Text style={styles.sponsorTerms}>
                            {t('mail.sponsorCostSummary', {
                                quarters: String(sponsorOffer.quarters),
                                total: formatMoney(sponsorOffer.quarterlyCost * sponsorOffer.quarters),
                            })}
                        </Text>
                        <Text style={styles.sponsorTerms}>
                            {t('mail.sponsorBrandSummary', {
                                pts: String(Math.round(sponsorPeak(sponsorOffer))),
                            })}
                        </Text>
                        <Pressable style={styles.option} onPress={() => navigation.goBack()}>
                            <Text style={styles.optionText}>{t('mail.notThisOne')}</Text>
                        </Pressable>
                    </View>
                )}

                {/* Reply Actions */}
                <View style={styles.replyActionRow}>
                    <View style={styles.replyBtn}>
                        <MaterialCommunityIcons name="reply" size={20} color={theme.colors.textSecondary} />
                        <Text style={styles.replyBtnText}>{t('mail.reply')}</Text>
                    </View>
                    <View style={styles.replyBtn}>
                        <MaterialCommunityIcons name="reply-all" size={20} color={theme.colors.textSecondary} />
                        <Text style={styles.replyBtnText}>{t('mail.replyAll')}</Text>
                    </View>
                    <View style={styles.replyBtn}>
                        <MaterialCommunityIcons name="share" size={20} color={theme.colors.textSecondary} />
                        <Text style={styles.replyBtnText}>{t('mail.forward')}</Text>
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
    // The two lines under the sign button. Muted, because they are the terms
    // rather than the offer, and the offer is the letter above.
    sponsorTerms: {
        color: theme.colors.textMuted,
        fontSize: 12,
        lineHeight: 17,
        marginTop: 6,
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
